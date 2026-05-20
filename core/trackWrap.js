const Discord = require('discord.js');
const ethers = require('ethers');
const { fetchWraps } = require('./indexerClient');
const {
    discord_general_chat,
    discord_wraps_channel,
    alchemy_api_key,
    is_test,
    test_channel,
    test_lookback_hours,
} = require('../config.json');

const IPFS_BASE = 'https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV';
const ETHERSCAN_TX_BASE = 'https://etherscan.io/tx';
const TEST_LOOKBACK_SEC = (test_lookback_hours || 5) * 3600;
const PROD_LOOKBACK_SEC = 100;
const SEEN_MAX = 500;

const seenWrap = new Set();
let cursorTs = Math.floor(Date.now() / 1000) - (is_test ? TEST_LOOKBACK_SEC : PROD_LOOKBACK_SEC);

const rememberWrap = (key) => {
    seenWrap.add(key);
    if (seenWrap.size > SEEN_MAX) {
        const first = seenWrap.values().next().value;
        seenWrap.delete(first);
    }
};

const lookupEns = async (address) => {
    if (!address) return null;
    try {
        const rpcUrl = alchemy_api_key
            ? `https://eth-mainnet.g.alchemy.com/v2/${alchemy_api_key}`
            : 'https://eth.llamarpc.com';
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl, { chainId: 1, name: 'mainnet' });
        const name = await provider.lookupAddress(address);
        return name || null;
    } catch (error) {
        console.error('ENS lookup failed:', error.message || error);
        return null;
    }
};

const shortAddr = (addr) => (addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '0x0000');

const fetchWrapLogs = async () => {
    const events = await fetchWraps(cursorTs, 50);
    if (events.length > 0) {
        const lastTs = events[events.length - 1].timestamp;
        if (lastTs > cursorTs) cursorTs = lastTs;
    }
    return events.filter((e) => !seenWrap.has(`${e.txHash}-${e.id}`));
};

const buildEmbed = async (event) => {
    const tokenId = event.tokenId;
    const verb = event.kind === 'wrap' ? 'wrapped' : 'unwrapped';
    const owner = event.kind === 'wrap' ? event.to : event.from;
    const ownerEns = await lookupEns(owner);
    const ownerDisplay = ownerEns || shortAddr(owner);

    return new Discord.MessageEmbed()
        .setColor(event.kind === 'wrap' ? '#00cc88' : '#cc6600')
        .setTitle(`V1 Punk #${tokenId} was just ${verb}`)
        .addFields(
            { name: 'Owner', value: ownerDisplay, inline: true },
            { name: 'Transaction', value: `[View on Etherscan](${ETHERSCAN_TX_BASE}/${event.txHash})` },
        )
        .setThumbnail(`${IPFS_BASE}/${tokenId}.png`)
        .setFooter({ text: `${event.kind === 'wrap' ? 'Wrap' : 'Unwrap'} Date: ${new Date(event.timestamp * 1000).toLocaleString()}` });
};

const processWrapLog = async (event, client) => {
    const dedupeKey = `${event.txHash}-${event.id}`;
    if (seenWrap.has(dedupeKey)) return;
    rememberWrap(dedupeKey);

    try {
        const embed = await buildEmbed(event);
        if (is_test) {
            const testCh = await client.channels.fetch(test_channel);
            if (!testCh) {
                console.error('Test channel not found.');
                return;
            }
            await testCh.send({ embeds: [embed] });
            return;
        }
        const channel = await client.channels.fetch(discord_general_chat);
        const wrapChannel = await client.channels.fetch(discord_wraps_channel);
        if (!channel || !wrapChannel) {
            console.error('Wrap channels not found.');
            return;
        }
        await channel.send({ embeds: [embed] });
        await wrapChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to post wrap event:', error.stack || error);
    }
};

module.exports = { fetchWrapLogs, processWrapLog };
