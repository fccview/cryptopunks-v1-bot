const { SlashCommandBuilder } = require('@discordjs/builders');
const util = require("../core/util");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punk')
        .setDescription(`Sends a V1 Punk image with the original purple background or a custom user defined one`)
        .addStringOption(option =>
            option.setName('punk_id')
                .setDescription('Enter your Punk ID')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('colour')
                .setDescription(`Enter a hex code colour (e.g. #000000), "transparent" or leave blank to get the original purple`)
                .setRequired(false)
        ),

    randomIntFromInterval: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    },

    async execute(interaction) {
        let punk = (interaction.options.getString('punk_id')) ? interaction.options.getString('punk_id') : this.randomIntFromInterval(0, 9999);
        let colour = interaction.options.getString('colour');

        util.changeBG(interaction, [punk, colour], 'colour');
    },
};