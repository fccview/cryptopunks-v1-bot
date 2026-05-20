const Discord = require('discord.js');
const ethers = require('ethers');
const { fetchSales, EVENT_SOURCE } = require('./indexerClient');
const {
    discord_general_chat,
    discord_sales_channel,
    alchemy_api_key,
    sales_cooldown,
    is_test,
    test_channel,
    test_lookback_hours,
} = require('../config.json');

const TEST_LOOKBACK_SEC = (test_lookback_hours || 5) * 3600;

const IPFS_BASE = 'https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV';
const V1PUNKS_TOKEN_BASE = 'https://v1punks.io/token/ETHEREUM:0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d';
const ETHERSCAN_TX_BASE = 'https://etherscan.io/tx';
const PUNKS_MARKET_BASE = 'https://punksmarket.app/punk';
const COOLDOWN_MS = parseInt(sales_cooldown || '100000', 10);
const seenTx = new Set();
const SEEN_MAX = 500;

let cursorTs = Math.floor(Date.now() / 1000) - (is_test ? TEST_LOOKBACK_SEC : Math.floor(COOLDOWN_MS / 1000));

const rememberTx = (txHash) => {
    seenTx.add(txHash);
    if (seenTx.size > SEEN_MAX) {
        const first = seenTx.values().next().value;
        seenTx.delete(first);
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

const shortAddr = (addr) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

const fetchNewSales = async () => {
    const sales = await fetchSales(cursorTs, 50);
    if (sales.length > 0) {
        const lastTs = sales[sales.length - 1].timestamp;
        if (lastTs > cursorTs) cursorTs = lastTs;
    }
    return sales.filter((s) => !seenTx.has(`${s.txHash}-${s.id}`));
};

const buildEmbed = async (sale) => {
    const usd = sale.usdCents !== null
        ? `$${(sale.usdCents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
        : 'n/a';
    const ethStr = sale.priceEth.toFixed(4);
    const tokenId = sale.tokenId;
    const tokenUrl = sale.source === EVENT_SOURCE.PUNKS_MARKET
        ? `${PUNKS_MARKET_BASE}/${tokenId}`
        : `${V1PUNKS_TOKEN_BASE}:${tokenId}`;

    const [buyerEns, sellerEns] = await Promise.all([
        lookupEns(sale.buyer),
        lookupEns(sale.seller),
    ]);

    const buyerDisplay = buyerEns || shortAddr(sale.buyer || '0x0000');
    const sellerDisplay = sellerEns || shortAddr(sale.seller || '0x0000');

    const embed = new Discord.MessageEmbed()
        .setColor('#ff7700')
        .setTitle(`V1 Punk #${tokenId} was just sold for ${ethStr} ETH`)
        .setDescription(`Marketplace: **${sale.marketplace}**`)
        .addFields(
            { name: 'Price', value: `${ethStr} ETH (${usd})`, inline: true },
            { name: 'Buyer', value: buyerDisplay, inline: true },
            { name: 'Seller', value: sellerDisplay, inline: true },
            { name: 'Sale', value: `[View token](${tokenUrl})` },
            { name: 'Transaction', value: `[Etherscan](${ETHERSCAN_TX_BASE}/${sale.txHash})` },
        )
        .setThumbnail(`${IPFS_BASE}/${tokenId}.png`)
        .setFooter({ text: `Sale Date: ${new Date(sale.timestamp * 1000).toLocaleString()}` });

    return embed;
};

const postSale = async (sale, client) => {
    const dedupeKey = `${sale.txHash}-${sale.id}`;
    if (seenTx.has(dedupeKey)) return;
    rememberTx(dedupeKey);

    if (!sale.priceWei || sale.priceWei === '0') {
        console.log(`Skipping zero-value sale for punk #${sale.tokenId}`);
        return;
    }

    try {
        const embed = await buildEmbed(sale);
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
        const salesChannel = await client.channels.fetch(discord_sales_channel);
        if (!channel || !salesChannel) {
            console.error('Sales channels not found.');
            return;
        }
        await channel.send({ embeds: [embed] });
        await salesChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to post indexer sale:', error.stack || error);
    }
};

module.exports = { fetchNewSales, postSale };
