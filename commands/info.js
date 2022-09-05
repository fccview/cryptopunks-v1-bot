const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription(`Learn about CryptoPunks V1`)
        .addStringOption(option =>
            option.setName('info')
                .setDescription('What would you like to know')
                .setRequired(true)
                .addChoices({
                    name: 'Wiki',
                    value: 'wiki'
                },{
                    name: 'tl;dr',
                    value: 'tldr'
                },{
                    name: 'How to Wrap',
                    value: 'wrap'
                },{
                    name: 'How to Unwrap',
                    value: 'unwrap'
                })
        ),

    async execute(interaction) {
        let type = interaction.options.getString('info');
        let infoEmbed;

        if (type === 'wiki') {
            infoEmbed = new Discord.MessageEmbed()
                .setTitle('wiki')
                .setColor('RANDOM')
                .setDescription("You can find all the info about Cryptopunks V1 [here](https://v1punks.gitbook.io/cryptopunks-v1-wiki/)")
                .setThumbnail(interaction.user.avatarURL())
        } else if (type === 'tldr') {
            infoEmbed = new Discord.MessageEmbed()
                .setTitle('tl;dr')
                .setColor('RANDOM')
                .setDescription("In 2017 Larvalabs created Cryptopunks and offered them free to claim. All 10k were claimed and a bug was discovered. A second smart contract was published in the days later identical in art and content to the first, with the bug patched and new bid features. That second contract is what we now know as Cryptopunks with a floor of 60 ETH. That original contract? That is what we call v1s and you can learn more [here](https://v1punks.gitbook.io)")
                .setThumbnail("https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/v1397185188/85fcd4cad95fa79a0c5f7f26082dab3d.png")
        } else if (type === 'wrap') {
            infoEmbed = new Discord.MessageEmbed()
                .setTitle('How to wrap your v1Punk')
                .setColor('RANDOM')
                .setThumbnail(interaction.user.avatarURL())
                .addFields(
                    {name: 'Step 1', value: "First go to the [punks contract](https://etherscan.io/address/0x6Ba6f2207e343923BA692e5Cae646Fb0F566DB8D#writeContract)" +
                            "\nYou will see a button connect web3 with the red dot, that will connect MetaMask" +
                            "\nMake a PRIVATE sale to the wrapper contract address" +
                            "\n - Top field is the punk you want to wrap (e.g. 4684)" +
                            "\n - Middle field is the price: set it to **0**" +
                            "\n - Bottom field is the WRAPPER contract address. Insert this: `0x282BDD42f4eb70e7A9D9F40c8fEA0825B7f68C5D`" +
                            "\nNow hit the \"write\" button to complete and WAIT for the transaction to succeed." +
                            "\n[CHECK THIS IMAGE FOR MORE INFO](https://media.discordapp.net/attachments/932645847223644220/932647328916074507/unknown.png)"},
                    {name: 'Step 2', value: "Go to the [wrapper contract](https://etherscan.io/address/0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d#writeContract)" +
                            "\nConnect your metamask again" +
                            "\nScroll down to the wrap method" +
                            "\n - Top field is the ETH to send, as we did put 0 in the private sale, we will put 0 here too." +
                            "\n - Bottom field is the punk index again" +
                            "\nNow hit the \"write\" button to complete and WAIT for the transaction to succeed" +
                            "\n[CHECK THIS IMAGE FOR MORE INFO](https://media.discordapp.net/attachments/932645847223644220/932648276900073502/unknown.png)"},
                );
        } else if (type === 'unwrap') {
            infoEmbed = new Discord.MessageEmbed()
                .setTitle('How to UNWRAP your v1Punk ')
                .setColor('RANDOM')
                .setThumbnail(interaction.user.avatarURL())
                .addFields(
                    {name: 'Unwrap from the FOOBAR Wrapper', value: "- Go to the [foobar wrapper contract](https://etherscan.io/address/0xF4a4644E818c2843Ba0AAbEa93af6c80B5984114#writeContract)" +
                            "\n- Connect your MetaMask (button \"connect web3\" with the red dot)" +
                            "\n- Now go to the unwrap method" +
                            "\n- Enter your Punk index and hit the write putton to complete" +
                            "\n- WAIT for the transaction to be completed and then head to <#932645847223644220> or type `!wrap`" +
                            "\n[CHECK THIS IMAGE FOR MORE INFO](https://cdn.discordapp.com/attachments/932666944606326804/933060402613477486/unknown.png)"},
                );
        }

        return interaction.reply({embeds: [infoEmbed], ephemeral: true});
    },
};