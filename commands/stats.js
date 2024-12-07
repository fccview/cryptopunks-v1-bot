const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const fetch = require('node-fetch');
const { rarible_api_key, contract_address } = require('../config.json');

async function getStats() {
    const collection = encodeURIComponent(`ETHEREUM:${contract_address.toLowerCase()}`);
    const url = `https://api.rarible.org/v0.1/data/collections/${collection}/stats?currency=ETH`;

    const res = await fetch(url, {
        headers: {
            'x-api-key': rarible_api_key
        }
    });

    const data = await res.json();
    return data;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Shows the cheapest V1 Punk listing using the Rarible aggregator API'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const stats = await getStats();

            if (!stats) {
                await interaction.editReply('No stats found for V1 Punks.');
                return;
            }

            const {
                highestSale,
                floorPrice,
                marketCap,
                listed,
                items,
                owners,
                volume
            } = stats;

            const embed = new Discord.MessageEmbed()
                .setTitle('V1 Punk Stats')
                .addFields(
                    { name: 'Floor Price', value: floorPrice ? `${floorPrice.toFixed(2)}ETH` : 'N/A', inline: true },
                    { name: 'Market Cap', value: marketCap ? `${marketCap.toFixed(2)}ETH` : 'N/A', inline: true },
                    { name: 'Highest Sale', value: highestSale ? `${highestSale.toFixed(2)}ETH` : 'N/A', inline: true },
                    { name: 'Listed', value: listed?.toString() || '0', inline: true },
                    { name: 'Wrapped', value: items?.toString() || '0', inline: true },
                    { name: 'Owners', value: owners?.toString() || '0', inline: true },
                    { name: 'Volume', value: volume ? `${volume.toFixed(2)} ETH` : 'N/A', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply('Error fetching cheapest listing. Please try again later.');
        }
    }
};
