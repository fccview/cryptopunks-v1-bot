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
         * ADMIN ONLY COMMANDS
         */
        let channelsList = [
            '868224818988859452',//bot-testing
            '973943797719380041' //my server
        ];
        // if (commandWithArgs === 'weeklyboard') {
        //     if (channelsList.includes(message.channel.id)) {
        //         await hoverblast.fetchAllResults(message, args);
        //     }
        // }
    }

    /**
     * No prefix needed
     */

    let messageNoCommands = message.content.toLowerCase();
    let urlRE = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?([^ ])+");

    if (messageNoCommands.includes('alexa play despacito')) {
        if(message.author.bot) return;
        await message.reply({
            content: "Officer Bezos just banned Alexa from this server.\n",
            files: [
                __dirname + '/img/accessories/bezos.png'
            ]
        });
    }

    if (messageNoCommands.includes('animetas police')) {
        if(message.author.bot) return;
        await message.reply('Last seen on the 25th of May 2022. May he rest in peace. https://cdn.discordapp.com/attachments/868224818988859452/979057464316162118/unknown.png');
    }

    if (messageNoCommands.includes('zombie bot')) {
        if(message.author.bot) return;
        await message.reply('Last seen on the 25th of May 2022. May she rest in peace. https://cdn.discordapp.com/attachments/868224818988859452/979057510151491655/unknown.png');
    }

    if (messageNoCommands.includes('in the silence of the night')) {
        if(message.author.bot) return;
        await message.reply('https://open.spotify.com/track/4ZhJI6H4fwP7G02WloOKin?si=17cb3eabce8045e9');
    }

    if (messageNoCommands.includes('ready to fight')) {
        if(message.author.bot) return;
        await message.reply('https://open.spotify.com/album/3tp2Dnma3xvN56l7dHpRy8?si=Qdp-vsDARhmFEuJ_LbhguQ');
    }

    if (messageNoCommands.match(urlRE)) {
        if (message.author.bot) return;

        let channelsList = [
            '870603497710710804', //marketplace
            '871501327748976661', //share
            '856581559629119488', //shill
            '868801638146637854', //monkey
            '868569437886886028', //share monkey
            '873059758326829077', //trading
            '856823211873009664'
        ];

        if (!channelsList.includes(message.channel.id)) {
            if (message.member.roles.cache.some(r => r.name === "Animod")) {
                return;
            } else {
                if (message.content.includes('discord.gg') || message.content.includes('opensea.io') || message.content.includes('porn')) {
                    message.reply('These links are not allowed outside of <#856581559629119488>. For Animetas marketplace check <#870603497710710804>.');
                    message.channel.messages.fetch(message.id)
                        .then(m => {
                            m.delete();
                        });
                } else {
                    return;
                }
            }
        } else {
            return;
        }
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