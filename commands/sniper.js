const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { getMergedFloor, tokenLinks } = require('../core/floorMerge');

const ITEMS_PER_PAGE = 5;
const SNIPER_LIMIT = 100;

const buildEmbed = (listings, page) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, listings.length);
    const slice = listings.slice(start, end);

    const embed = new MessageEmbed()
        .setTitle('V1 Punks Floor Listings')
        .setDescription(`Showing listings ${start + 1}-${end} of ${listings.length} (OpenSea + Punks Market)`)
        .setTimestamp();

    slice.forEach((listing, index) => {
        const { tokenId, priceEth, marketplace } = listing;
        const links = tokenLinks(tokenId, marketplace);
        const priceStr = priceEth.toFixed(3);
        embed.addFields({
            name: `${start + index + 1}. V1 Punk #${tokenId} - ${marketplace}`,
            value: `${priceStr} ETH\n[OpenSea](${links.opensea}) | [Punks Market](${links.punksMarket})`,
            inline: false,
        });
    });

    return embed;
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
        .setName('sniper')
        .setDescription('Top 100 cheapest V1 Punks across OpenSea and Punks Market'),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            const listings = await getMergedFloor(SNIPER_LIMIT);
            if (!listings.length) {
                await interaction.editReply('No floor listings found.');
                return;
            }

            let page = 1;
            const maxPage = Math.max(1, Math.ceil(listings.length / ITEMS_PER_PAGE));
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
                interaction.editReply({ components: [] }).catch((err) => console.error('Sniper cleanup failed:', err));
            });
        } catch (error) {
            console.error('Error fetching sniper listings:', error);
            await interaction.editReply('Error fetching floor listings. Please try again later.');
        }
    },
};
