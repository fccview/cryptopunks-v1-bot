const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const Discord = require("discord.js");
const { etherscan_api_key } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gas')
        .setDescription(`Get gas cost estimation`),

    async execute(interaction) {
        let url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscan_api_key}`;

        fetch(url)
            .then(res => res.json())
            .then(
                json => {
                    let fast = json.result.FastGasPrice;
                    let average = json.result.ProposeGasPrice;
                    let safe = json.result.suggestBaseFee;

                    let gasItem = new Discord.MessageEmbed()
                        .setColor('RANDOM')
                        .setTitle('Current Gas')
                        .addFields(
                            {name: 'Suggested', value: parseFloat(safe).toFixed(2)},
                            {name: 'Average', value: average},
                            {name: 'Fast', value: fast}
                        )

                    return interaction.reply({embeds: [gasItem], ephemeral: true});
                }

            ).catch(err => {
            console.error('error:' + err);
        });
    },
};