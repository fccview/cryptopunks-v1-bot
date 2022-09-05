const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fccview')
        .setDescription(`My master.`),

    async execute(interaction) {
        let responses = ['Careful mentioning my father, dare I say the father of all bots, in vain.',
            'He created me and all my bot brothers and sisters.',
            'I couldn\'t have asked for a better creator.',
            'I summon thee, oh father <@408255473821679617>.'];

        interaction.reply({content: responses[Math.floor(Math.random() * responses.length)]});
    },
};