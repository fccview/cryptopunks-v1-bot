const { SlashCommandBuilder } = require('@discordjs/builders');
const { openaiKey } = require('../config.json');

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: openaiKey,
});
const openai = new OpenAIApi(configuration);

const ask = async (prompt) => {
  const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
  });
  const answer = response.data.choices[0].text;
  return answer;
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

    async execute(interaction) {
        if (openaiKey) {
            await interaction.deferReply({ephemeral: false});
            const prompt = interaction.options.getString('input');
            const answer = await ask(prompt);

            interaction.editReply({content: answer});
        } else {
            interaction.reply({content: 'The author has not set an openai api key.', ephemeral: true});
        }
    },
};