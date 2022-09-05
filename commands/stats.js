const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const Discord = require("discord.js");
const ethers = require('ethers');
const { contract_address, collection_slug, os_api_key } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription(`Shows v1 Punks Stats on OS/LR`),

    getOSStats: async function(url) {
        let options = {
            method: 'GET',
            headers: {Accept: 'application/json', 'X-API-KEY': os_api_key}
        };

        let osStats = await fetch(url, options)
            .then(res => res.json())
            .then(
                json => {
                    return json.stats;
                }
            ).catch(err => {
                console.error('error:' + err);
            });

        return osStats;
    },

    getLRStats: async function(url) {
        let LRoptions = {
            method: 'GET'
        };
        let LRStats = await fetch(url, LRoptions)
            .then(res => res.json())
            .then(
                json => {
                    return json.data;
                }
            ).catch(err => {
                console.error('error:' +err);
            });

        return LRStats;
    },

    async execute(interaction) {
        let collection = interaction.options.getString('collection');
        let osUrl = ``;
        let lrUrl = ``;

        osUrl = `https://api.opensea.io/api/v1/collection/${collection_slug}/stats`;
        lrUrl = `https://api.looksrare.org/api/v1/collections/stats?address=${contract_address}`

        let OSStats = await this.getOSStats(osUrl);
        let LRStats = await this.getLRStats(lrUrl);

        let OSfloor = OSStats.floor_price;
        let OSholders = OSStats.num_owners;
        let OSaverage = parseFloat(OSStats.average_price).toFixed(2);

        let usercard = new Discord.MessageEmbed()
            .setTitle(`${collection} stats`)
            .setColor('RANDOM')
            .addFields({
                    name: `Opensea`,
                    value: `**Floor:** ${OSfloor}${ethers.constants.EtherSymbol}                           
                            **Average Price:** ${OSaverage}${ethers.constants.EtherSymbol}`,
                    inline: true
                }, {
                    name: `LooksRare`,
                    value: `**Floor:** ${parseFloat(parseInt(LRStats.floorPrice)/1000000000000000000).toFixed(2)}${ethers.constants.EtherSymbol}                            
                            **Average Price:** ${parseFloat(parseInt(LRStats.averageAll)/1000000000000000000).toFixed(2)}${ethers.constants.EtherSymbol}`,
                    inline: true
                },
                {
                    name: `Unique Holders`,
                    value: `${OSholders} \n`,
                });

        return interaction.reply({embeds: [usercard]});
    },
};