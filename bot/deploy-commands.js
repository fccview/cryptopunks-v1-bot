const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('../config.json');
const { Client, Collection, Intents } = require('discord.js');

const commands = [];

const commandDIR = "./commands"
const commandFiles = fs.readdirSync(commandDIR).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require("." + commandDIR + `/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);


rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);