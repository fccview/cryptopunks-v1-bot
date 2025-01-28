const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const axios = require('axios');
const { opensea_api_key } = require('../config.json');

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
    const itemsPerPage = 5;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageListings = listings.slice(start, end);

    const embed = new MessageEmbed()
        .setTitle('V1 Punks Floor Listings')
        .setDescription(`Showing listings ${start + 1}-${end} of ${listings.length}`)
        .setTimestamp();

    pageListings.forEach((listing, index) => {
        const { price: { current: { value, currency } }, nft } = listing;
        const priceInEth = (parseInt(value) / 1e18).toFixed(3);
        
        embed.addField(
            `${index + start + 1}. V1 Punk #${nft.identifier}`,
            `💰 ${priceInEth} ${currency}\n` +
            `[View on OpenSea](${nft.opensea_url})`,
            false
        );
    });

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
            const maxPage = Math.ceil(listings.length / 5);
            const embed = createEmbed(listings, page);
            const row = createButtons(page, maxPage);

            const response = await interaction.editReply({
                embeds: [embed],
                components: [row]
            });

            // Create collector for button interactions
            const collector = response.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000 // 1 minute timeout
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
                // Remove buttons after timeout
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