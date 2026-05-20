const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { getMergedFloor, tokenLinks } = require('../core/floorMerge');

const FLOOR_LIMIT = 10;
const IPFS_BASE = 'https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV';

const buildEmbed = (listings, page) => {
    const listing = listings[page - 1];
    const { tokenId, priceEth, marketplace } = listing;
    const links = tokenLinks(tokenId, marketplace);
    const priceStr = priceEth.toFixed(3);

    return new MessageEmbed()
        .setTitle(`Floor Listing #${page}`)
        .setDescription(`V1 Punk #${tokenId}`)
        .addFields(
            { name: 'Price', value: `${priceStr} ETH`, inline: true },
            { name: 'Marketplace', value: marketplace, inline: true },
            {
                name: 'Links',
                value: `[OpenSea](${links.opensea}) | [Punks Market](${links.punksMarket})`,
                inline: false,
            },
        )
        .setThumbnail(`${IPFS_BASE}/${tokenId}.png`)
        .setFooter({ text: `Listing ${page} of ${listings.length}` })
        .setTimestamp();
};

const buildButtons = (page, maxPage) => new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId('prev')
        .setLabel('Previous')
        .setStyle('PRIMARY')
        .setDisabled(page === 1),
    new MessageButton()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle('PRIMARY')
        .setDisabled(page === maxPage),
);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('floor')
        .setDescription('Shows the 10 cheapest V1 Punks across OpenSea and Punks Market'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const listings = await getMergedFloor(FLOOR_LIMIT);
            if (!listings.length) {
                await interaction.editReply('No floor listings found.');
                return;
            }

            let page = 1;
            const maxPage = listings.length;
            const response = await interaction.editReply({
                embeds: [buildEmbed(listings, page)],
                components: [buildButtons(page, maxPage)],
            });

            const collector = response.createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id,
                time: 60000,
            });

            collector.on('collect', async (i) => {
                page = i.customId === 'next' ? page + 1 : page - 1;
                await i.update({
                    embeds: [buildEmbed(listings, page)],
                    components: [buildButtons(page, maxPage)],
                });
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch((err) => console.error('Floor cleanup failed:', err));
            });
        } catch (error) {
            console.error('Error fetching floor listings:', error);
            await interaction.editReply('Error fetching floor listings. Please try again later.');
        }
    },
};
