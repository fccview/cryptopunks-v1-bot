const fs = require('node:fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');
const core = require('./core/core');
const { discord_general_chat, is_test } = require('./config.json');
const { fetchSalesLogs, processSaleLog } = require('./core/osSales');
const { fetchNewSales, postSale } = require('./core/indexerSales');
const { fetchWrapLogs, processWrapLog } = require('./core/trackWrap');
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


client.once('ready', async () => {
    console.log('Ready!');
    client.user.setPresence({ activities: [{ name: `Type /help`, type: `PLAYING` }] });

    /**
     * Security protocol alert for users, every 8 hours
     */
    setInterval(function () {
        core.safetyProtocol(client, discord_general_chat);
    }, 28800000);

    const pollAll = async () => {
        try {
            const logs = await fetchSalesLogs();
            for (const log of logs) {
                await processSaleLog(log, client);
            }
        } catch (error) {
            console.error('Error in polling sales:', error);
        }

        try {
            const indexerSales = await fetchNewSales();
            for (const sale of indexerSales) {
                await postSale(sale, client);
            }
        } catch (error) {
            console.error('Error in polling indexer sales:', error);
        }

        try {
            const logs = await fetchWrapLogs();
            for (const log of logs) {
                await processWrapLog(log, client);
            }
        } catch (error) {
            console.error('Error in polling wraps:', error);
        }
    };

    if (is_test) {
        pollAll();
    }
    setInterval(pollAll, 100000);
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
    if (type === "reject" && await promise === '1') { return } // timeout from alchemy sdk just ignore
    console.error("Multiple Resolves:\n", type, promise, reason);
});

client.login(token);