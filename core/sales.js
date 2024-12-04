const axios = require('axios');
const Discord = require('discord.js');
const ethers = require('ethers');
const { contract_address, alchemy_api_key, discord_general_chat } = require('../config.json');

const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${alchemy_api_key}`;
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const MARKETPLACES = {
    '0x7f268357a8c2552623316e2562d90e642bb538e5': 'OpenSea',
    '0x59728544b08ab483533076417fbbb2fd0b17ce3a': 'LooksRare',
    '0x00000000006c3852cbef3e08e8df289169ede581': 'OpenSea (Seaport)',
    '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b': 'OpenSea (Legacy)',
    '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3': 'X2Y2',
    '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': 'Blur',
    '0x0000000000000068f116a894984e2db1123eb395': 'Seaport 1.6'
};

async function startSalesTracking(client) {
    console.log('Starting sales tracking...');
    console.log('Contract address:', contract_address);
    
    // @todo Uncomment the following block for testing purposes
    /*
    try {
        console.log('Fetching recent sales...');
        const recentLogs = await fetchRecentSales();
        console.log(`Processing ${recentLogs.length} recent transfer events...`);
        
        for (const log of recentLogs) {
            await processSaleLog(log, client);
        }
    } catch (error) {
        console.error('Error fetching recent sales:', error);
    }
    */

    let lastCheckedBlock = await getCurrentBlockNumber();
    console.log(`Starting regular polling from block ${lastCheckedBlock}`);

    setInterval(async () => {
        try {
            const logs = await fetchSalesLogs(lastCheckedBlock);
            for (const log of logs) {
                await processSaleLog(log, client);
            }
            lastCheckedBlock = await getCurrentBlockNumber();
        } catch (error) {
            console.error('Error in polling interval:', error);
        }
    }, 60000);
}

async function processSaleLog(log, client) {
    const { topics, transactionHash } = log;

    if (topics.length === 4) {
        const from = ethers.utils.getAddress(`0x${topics[1].slice(26)}`);
        const to = ethers.utils.getAddress(`0x${topics[2].slice(26)}`);
        const tokenId = ethers.BigNumber.from(topics[3]).toString();
        const marketplace = await getMarketplace(transactionHash);
        
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Punk #${tokenId} was just sold!`)
            .addFields(
                { name: 'Token ID', value: tokenId, inline: true },
                { name: 'Buyer', value: `${to.slice(0, 4)}...${to.slice(-4)}`, inline: true },
                { name: 'Transaction', value: `[View on Etherscan](https://etherscan.io/tx/${transactionHash})` }
            )
            .setThumbnail(`https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV/${tokenId}.png`)
            .setTimestamp();

        try {
            const channel = await client.channels.fetch(discord_general_chat);
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error sending Discord notification:', error);
        }
    }
}

async function fetchSalesLogs(fromBlock) {
    const response = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [{
            fromBlock: ethers.utils.hexValue(fromBlock),
            toBlock: 'latest',
            address: contract_address.toLowerCase(),
            topics: [TRANSFER_EVENT_TOPIC]
        }]
    });

    return response.data.result;
}

async function getCurrentBlockNumber() {
    const response = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
    });

    return parseInt(response.data.result, 16);
}

async function getMarketplace(txHash) {
    try {
        const response = await axios.post(ALCHEMY_API_URL, {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionByHash',
            params: [txHash]
        });

        const tx = response.data.result;
        if (!tx) {
            console.error('Transaction not found:', txHash);
            return 'Unknown';
        }

        // Check if the transaction interacted with a known marketplace contract
        const marketplace = MARKETPLACES[tx.to.toLowerCase()];
        return marketplace || 'Unknown';
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return 'Unknown';
    }
}

module.exports = { startSalesTracking };