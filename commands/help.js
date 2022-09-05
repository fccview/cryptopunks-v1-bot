const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(`Learn how to use the V1 Bot`),

    async execute(interaction) {
        let help = new Discord.MessageEmbed()
            .setTitle('How To')
            .setDescription("List of commands")
            .setColor('RANDOM')
            .setThumbnail(interaction.member.avatarURL())
            .addFields(
                {name: 'Information Commands', value:
                        "`/help` - Shows this help message" +
                        "\n`/ogminter` - Shows the original v1 Punk minter" +
                        "\n`/gas` - Shows current gas price" +
                        "\n`/info` - Shows CryptoPunks V1 infos"+
                        "\n`/stats` - Shows v1 stats on OS/LR" +
                        "\n`/ethprice` - Shows current ETH price against USD/GBP/EUR"
                },
                {name: 'Fun Commands', value: "" +
                        "`/gm` - Sends a special punk GM message" +
                        "\n`/punk` - Sends a V1 Punk image"
                },
            );

        return interaction.reply({embeds: [help], ephemeral: true});
    },
};