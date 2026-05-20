const Discord = require('discord.js');
const axios = require('axios');
const ethers = require('ethers');

const OPENSEA_API_URL = 'https://api.opensea.io/api/v2/events/collection/official-v1-punks';
const {
    opensea_api_key,
    discord_general_chat,
    discord_sales_channel,
    alchemy_api_key,
    is_test,
    test_channel,
} = require('../config.json');

const OS_TEST_LOOKBACK_SEC = 3 * 3600;

const fetchSalesLogs = async () => {
    let seconds = is_test ? OS_TEST_LOOKBACK_SEC : (100000 ? parseInt(100000) / 1000 : 3600);
    let afterTimestamp = Math.round(new Date().getTime() / 1000) - seconds;

    const response = await axios.get(OPENSEA_API_URL, {
        headers: {
            'X-API-KEY': opensea_api_key
        },
        params: {
            after: afterTimestamp,
            event_type: 'sale'
        }
    });
    return response.data.asset_events || [];
};

const processSaleLog = async (event, client) => {
    const channel = is_test
        ? await client.channels.fetch(test_channel)
        : await client.channels.fetch(discord_general_chat);
    const salesChannel = is_test
        ? null
        : await client.channels.fetch(discord_sales_channel);

    if (!channel) {
        console.error('Channel not found.');
        return;
    }

    const {
        nft: {
            identifier,
            name,
            opensea_url,
            display_image_url
        },
        closing_date,
        buyer,
        seller,
        payment: { quantity, symbol },
        transaction
    } = event;

    const price = (parseInt(quantity, 10) / 10 ** 18).toFixed(4);
    const tokenId = identifier;
    const transactionHash = transaction;
    const to = buyer;
    const url = opensea_url;

    const buyerEns = await getEnsName(buyer);
    const buyerDisplay = buyerEns || `${to.slice(0, 4)}...${to.slice(-4)}`;
    const sellerEns = await getEnsName(seller);
    const sellerDisplay = sellerEns || `${seller.slice(0, 4)}...${seller.slice(-4)}`;

    const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`${name} was just sold for ${price}${symbol}`)
        .addFields(
            { name: 'Buyer', value: buyerDisplay, inline: true },
            { name: 'Seller', value: sellerDisplay, inline: true },
            { name: 'Sale', value: `[Check on OpenSea](${url})` },
            { name: 'Transaction', value: `[View on Etherscan](https://etherscan.io/tx/${transactionHash})` },
        )
        .setThumbnail(display_image_url)
        .setFooter({ text: `Sale Date: ${new Date(closing_date * 1000).toLocaleString()}` });

    const tweetText = encodeURIComponent(`${name} was just sold for ${price} ${symbol}! ${url}`);
    const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setLabel('Tweet this sale 🐦')
                .setStyle('LINK')
                .setURL(`https://twitter.com/intent/tweet?text=${tweetText}`)
        );

    try {
        await channel.send({ embeds: [embed], components: [row] });
        if (salesChannel) {
            await salesChannel.send({ embeds: [embed], components: [row] });
        }
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

module.exports = { fetchSalesLogs, processSaleLog };