const { SlashCommandBuilder } = require('@discordjs/builders');
const core = require("../core/core");
const util = require("../core/util");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('love')
        .setDescription('Shows two punks in love')
        .addStringOption(option =>
            option.setName('punk_id_1')
                .setDescription('Enter the first Punk ID (random if not specified)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('punk_id_2')
                .setDescription('Enter the second Punk ID (random if not specified)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const punk1 = interaction.options.getString('punk_id_1') || Math.floor(Math.random() * 10000).toString();
        const punk2 = interaction.options.getString('punk_id_2') || Math.floor(Math.random() * 10000).toString();

        if (core.limitSpam(interaction, 'holders')) {
            util.mergePunks(interaction, [punk1, punk2], 'love');
        } else {
            interaction.reply('❤️');
        }
    },
}; 