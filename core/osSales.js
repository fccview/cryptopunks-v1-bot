const Discord = require('discord.js');
const axios = require('axios');
const ethers = require('ethers');

const OPENSEA_API_URL = 'https://api.opensea.io/api/v2/events/collection/official-v1-punks';
const { opensea_api_key, discord_general_chat, discord_sales_channel } = require('../config.json');

const fetchSalesLogs = async (lastTimestamp) => {
    const response = await axios.get(OPENSEA_API_URL, {
        headers: {
            'X-API-KEY': opensea_api_key
        },
        params: {
            after: 1736155655000,
            event_type: 'sale'
        }
    });
    return response.data.asset_events || [];
};

const processSaleLog = async (event, client) => {
    const channel = await client.channels.fetch(discord_general_chat);
    const salesChannel = await client.channels.fetch(discord_sales_channel);
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
            identifier,
            name,
            opensea_url,
            display_image_url
        },
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
            { name: 'Transaction', value: `[View on Etherscan](https://etherscan.io/tx/${transactionHash})` }
        )
        .setThumbnail(display_image_url)
        .setTimestamp();

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
        await salesChannel.send({ embeds: [embed], components: [row] });
        /** 
         * @todo enable this when you need to test
         */
        // await testChannel.send({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error(error.stack);
    }
};

const getEnsName = async (address) => {
    try {
        const provider = new ethers.providers.JsonRpcProvider('https://eth.public-rpc.com');
        const ensName = await provider.lookupAddress(address);
        return ensName || null;
    } catch (error) {
        console.error('Error fetching ENS name:', error);
        return null;
    }
};

module.exports = { fetchSalesLogs, processSaleLog };