const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const axios = require('axios');
const { opensea_api_key, contract_address } = require('../config.json');

async function getFloorListings() {
    const url = 'https://api.opensea.io/api/v2/listings/collection/official-v1-punks/best';
    
    const response = await axios.get(url, {
        headers: {
            'X-API-KEY': opensea_api_key
        },
        params: {
            include_private_listings: false,
            limit: 10
        }
    });
    
    return response.data.listings;
}

function createEmbed(listings, page) {
    const listing = listings[page - 1];
    const { 
        price: { current: { value, currency } },
        protocol_data: { parameters: { offer } }
    } = listing;
    
    const tokenId = offer[0].identifierOrCriteria;
    const priceInEth = (parseInt(value) / 1e18).toFixed(3);
    const osUrl = `https://opensea.io/assets/ethereum/${contract_address}/${tokenId}`;
    const imageUrl = `https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV/${tokenId}.png`;

    const embed = new MessageEmbed()
        .setTitle(`Floor Listing #${page}`)
        .setDescription(`V1 Punk #${tokenId}`)
        .addFields({
            name: 'Price',
            value: `${priceInEth} ${currency}`,
            inline: true
        }, {
            name: 'Links',
            value: `[View on OpenSea](${osUrl})`,
            inline: true
        })
        .setThumbnail(imageUrl)
        .setFooter({ text: `Listing ${page} of ${listings.length}` })
        .setTimestamp();

    return embed;
}

function createButtons(page, maxPage) {
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('prev')
                .setLabel('Previous')
                .setStyle('PRIMARY')
                .setDisabled(page === 1),
            new MessageButton()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle('PRIMARY')
                .setDisabled(page === maxPage)
        );
    return row;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('floor')
        .setDescription('Shows the 10 lowest priced V1 Punks on OpenSea'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const listings = await getFloorListings();
            
            if (!listings || listings.length === 0) {
                await interaction.editReply('No floor listings found.');
                return;
            }

            const page = 1;
            const maxPage = listings.length;
            const embed = createEmbed(listings, page);
            const row = createButtons(page, maxPage);

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000
            });

            let currentPage = page;

            collector.on('collect', async i => {
                if (i.customId === 'prev') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }

                const newEmbed = createEmbed(listings, currentPage);
                const newRow = createButtons(currentPage, maxPage);

                await i.update({
                    embeds: [newEmbed],
                    components: [newRow]
                });
            });

            collector.on('end', () => {
                interaction.editReply({
                    embeds: [embed],
                    components: []
                }).catch(console.error);
            });

        } catch (error) {
            console.error('Error fetching floor listings:', error);
            await interaction.editReply('Error fetching floor listings. Please try again later.');
        }
    }
}; 