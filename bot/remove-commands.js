const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('../config.json');

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationCommands(clientId, guildId), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);