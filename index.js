const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const core = require('./core/core');
const sales = require("./core/all-sales");
const { sales_cooldown, discord_general_chat } = require('./config.json');

const client = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILDS']
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({ activities: [{ name: `Type /help`, type: `PLAYING` }] });
    const timer = 28800000;

    setInterval(function () {
        sales.allSales(client);
    }, sales_cooldown);

    setInterval(function () {
        core.safetyProtocol(client, discord_general_chat);
    }, timer);
});

client.on("messageCreate", async message => {
    "use strict";

    let allowed = false,
        commandPrefix = '';

    if (message.content.toLowerCase().includes('!')) {
        commandPrefix = '!';
        allowed = true;
    } else if (message.content.toLowerCase().includes('-')) {
        commandPrefix = '-';
        allowed = true;
    }

    let args = message.content.slice(commandPrefix.length).trim().split(/ +/g);

    //Declares Command variables
    let command = message.content.toLowerCase();
    const commandWithArgs = args.shift().toLowerCase();

    command = command.slice(commandPrefix.length).toLowerCase();

    if (allowed === true && message.content.toLowerCase().startsWith(commandPrefix)) {
        /**
         * TEXT COMMANDS WILL GO HERE
         */
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

process.on("unhandledRejection", async (err) => {
    console.error("Unhandled Promise Rejection:\n", err);
});
process.on("uncaughtException", async (err) => {
    console.error("Uncaught Promise Exception:\n", err);
});
process.on("uncaughtExceptionMonitor", async (err) => {
    console.error("Uncaught Promise Exception (Monitor):\n", err);
});
process.on("multipleResolves", async (type, promise, reason) => {
    console.error("Multiple Resolves:\n", type, promise, reason);
});

client.login(token);