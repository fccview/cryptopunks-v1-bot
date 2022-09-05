const { SlashCommandBuilder } = require('@discordjs/builders');
const core = require("../core/core");
const util = require("../core/util");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gm')
        .setDescription(`Sends a special punk gm message`)
        .addStringOption(option =>
            option.setName('punk_id')
                .setDescription('Enter your Punk ID')
                .setRequired(false)
        ),

    randomIntFromInterval: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    },

    async execute(interaction) {
        let punk = (interaction.options.getString('punk_id')) ? interaction.options.getString('punk_id') : this.randomIntFromInterval(0, 9999);

        if (core.limitSpam(interaction, 'holders')) {
            util.changeBG(interaction, [punk], 'gm', 'gm');
        } else {
            interaction.reply('<a:gm:938071286331080714>');
        }
    },
};