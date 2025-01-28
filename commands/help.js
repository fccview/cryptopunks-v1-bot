const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(`Learn how to use the V1 Bot`),

    async execute(interaction) {
        let help = new Discord.MessageEmbed()
            .setTitle('V1 Punk Bot Commands & Features')
            .setDescription("Complete list of commands and automated features")
            .setColor('RANDOM')
            .setThumbnail(interaction.member.avatarURL())
            .addFields(
                {name: 'Market Commands', value:
                    "`/floor` - Shows the 10 lowest priced V1 Punks\n" +
                    "`/sniper` - Shows the top 100 floor listings\n" +
                    "`/stats` - Shows V1 collection stats on OpenSea\n" +
                    "`/gas` - Shows current gas price\n" +
                    "`/ethprice` - Shows ETH price in USD/GBP/EUR"
                },
                {name: 'Punk Commands', value:
                    "`/punk` - Shows a V1 Punk with custom background\n" +
                    "`/gm` - Sends a special punk GM message\n" +
                    "`/love` - Shows two punks in love"
                },
                {name: 'Information Commands', value:
                    "`/help` - Shows this help message\n" +
                    "`/info` - Learn about V1 Punks (Wiki, How to Wrap/Unwrap)\n" +
                    "`/ogminter` - Shows the original V1 Punk minter"
                },
                {name: '🤖 Automated Features', value:
                    "• Real-time sales tracking from OpenSea\n" +
                    "• Periodic security alerts (every 8 hours)"
                }
            );

        return interaction.reply({embeds: [help], ephemeral: true});
    },
};