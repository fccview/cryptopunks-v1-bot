const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const Discord = require("discord.js");
const { etherscan_api_key } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gas')
        .setDescription(`Get gas cost estimation`),

    async execute(interaction) {
        let usedEtherscan = false
        let url = "https://ethgasstation.info/api/ethgasAPI.json"
        if(etherscan_api_key && etherscan_api_key.length > 0) {
            url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscan_api_key}`
            usedEtherscan = true
        }

        fetch(url)
            .then(res => res.json())
            .then(
                json => {
                    let fast = usedEtherscan ? json.result.FastGasPrice : Math.round((json.fast / 10).toFixed(2)).toString()
                    let average = usedEtherscan ? json.result.ProposeGasPrice : Math.round((json.average / 10).toFixed(2)).toString()
                    let safe = usedEtherscan ? json.result.suggestBaseFee : Math.round((json.safeLow / 10).toFixed(2)).toString()

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