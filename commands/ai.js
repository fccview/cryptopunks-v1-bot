const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const { gptKey } = require('../config.json');

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: gptKey,
});
const openai = new OpenAIApi(configuration);

const ask = async (prompt) => {
  const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      temperature: 1,
      max_tokens: 700,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
  });
  const answer = response.data.choices[0].text;
  return answer;
}

const chunkString = (str, length) => {
    return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription(`Let the Animetaverse Bot AI answer your questions. Powered by ChatGPT`)
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Ask something')
                .setRequired(true)
        ),

    chunkString(str, length) {
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    },

    async execute(interaction) {
        await interaction.deferReply({ephemeral: false});
        const prompt = interaction.options.getString('input');
        const answer = await ask(prompt);

        console.log(answer.length);

        if (answer.length > 1999) {
            if (answer.length > 4095) {
                const chunks = chunkString(answer, 4095);
                const embeds = chunks.map((str) => {
                    return new Discord.MessageEmbed()
                        .setColor("RANDOM")
                        .setDescription(str)
                    });

                await interaction.editReply({embeds: embeds});         
            } else {
                const embed = new Discord.MessageEmbed()
                    .setColor("RANDOM")
                    .setDescription(answer);
                await interaction.editReply({embeds: [embed]})
            }
        } else {
            await interaction.editReply({content: answer});
        }        
    },
};