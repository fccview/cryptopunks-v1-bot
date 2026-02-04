const Discord = require('discord.js');
const axios = require('axios');
const ethers = require('ethers');

const OPENSEA_API_URL = 'https://api.opensea.io/api/v2/events/collection/official-v1-punks';
const { opensea_api_key, discord_general_chat, discord_wrap_channel, alchemy_api_key } = require('../config.json');

const fetchWrapLogs = async () => {
    let seconds = 100000 ? parseInt(100000) / 1000 : 3600;
    let afterTimestamp = Math.round(new Date('Jan-02-2026 09:44:59 PM UTC').getTime() / 1000) - seconds;

    const response = await axios.get(OPENSEA_API_URL, {
        headers: {
            'X-API-KEY': opensea_api_key
        },
        params: {
            after: afterTimestamp,
            event_type: 'mint'
        }
    });
    return response.data.asset_events || [];
};

const processWrapLog = async (event, client) => {
    const channel = await client.channels.fetch(discord_general_chat);
    const wrapChannel = await client.channels.fetch(discord_wrap_channel);
    /** 
     * @todo enable this when you need to test
     */
    // const testChannel = await client.channels.fetch(`932316690816073729`);

    if (!channel) {
        console.error('Channel not found.');
        return;
    }

    const {
        nft: {
            name,
            display_image_url
        },
        event_timestamp,
        to_address,
        transaction
    } = event;


    const transactionHash = transaction;
    const to = to_address;

    const buyerEns = await getEnsName(to_address);
    const buyerDisplay = buyerEns || `${to.slice(0, 4)}...${to.slice(-4)}`;

    const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`${name} was just wrapped`)
        .addFields(
            { name: 'Owner', value: buyerDisplay, inline: true },
            { name: 'Transaction', value: `[View on Etherscan](https://etherscan.io/tx/${transactionHash})` },
        )
        .setThumbnail(display_image_url)
        .setFooter({ text: `Wrap Date: ${new Date(event_timestamp * 1000).toLocaleString()}` });

    try {
        await channel.send({ embeds: [embed] });
        await wrapChannel.send({ embeds: [embed] });
        /** 
         * @todo enable this when you need to test
         */
        // await testChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(error.stack);
    }
};

const getEnsName = async (address) => {
    try {
        const rpcUrl = alchemy_api_key
            ? `https://eth-mainnet.g.alchemy.com/v2/${alchemy_api_key}`
            : 'https://eth.llamarpc.com';
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl, { chainId: 1, name: 'mainnet' });
        const ensName = await provider.lookupAddress(address);
        return ensName || null;
    } catch (error) {
        console.error('Error fetching ENS name:', error);
        return null;
    }
};

module.exports = { fetchWrapLogs, processWrapLog };