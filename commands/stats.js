const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const axios = require('axios');
const { opensea_api_key } = require('../config.json');

async function getStats() {
    const url = 'https://api.opensea.io/api/v2/collections/official-v1-punks/stats';
    
    const response = await axios.get(url, {
        headers: {
            'X-API-KEY': opensea_api_key
        }
    });
    
    return response.data;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Shows V1 Punk collection stats from OpenSea'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const stats = await getStats();

            if (!stats) {
                await interaction.editReply('No stats found for V1 Punks.');
                return;
            }

            const { total, intervals } = stats;
            const dailyStats = intervals.find(i => i.interval === 'one_day');
            const weeklyStats = intervals.find(i => i.interval === 'seven_day');

            const embed = new Discord.MessageEmbed()
                .setTitle('V1 Punk Stats')
                .addFields(
                    { name: 'Floor Price', value: `${total.floor_price.toFixed(2)} ${total.floor_price_symbol}`, inline: true },
                    { name: 'Market Cap', value: `${total.market_cap.toFixed(2)} ETH`, inline: true },
                    { name: 'Owners', value: total.num_owners.toString(), inline: true },
                    { name: 'Total Volume', value: `${total.volume.toFixed(2)} ETH`, inline: true },
                    { name: 'Total Sales', value: total.sales.toString(), inline: true },
                    { name: 'Avg Price', value: `${total.average_price.toFixed(2)} ETH`, inline: true },
                    { name: '\u200B', value: '**24h Stats**', inline: false },
                    { name: 'Volume (24h)', value: `${dailyStats.volume.toFixed(2)} ETH`, inline: true },
                    { name: 'Sales (24h)', value: dailyStats.sales.toString(), inline: true },
                    { name: 'Avg Price (24h)', value: `${dailyStats.average_price.toFixed(2)} ETH`, inline: true },
                    { name: '\u200B', value: '**7d Stats**', inline: false },
                    { name: 'Volume (7d)', value: `${weeklyStats.volume.toFixed(2)} ETH`, inline: true },
                    { name: 'Sales (7d)', value: weeklyStats.sales.toString(), inline: true },
                    { name: 'Avg Price (7d)', value: `${weeklyStats.average_price.toFixed(2)} ETH`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching stats:', error);
            await interaction.editReply('Error fetching stats. Please try again later.');
        }
    }
};
