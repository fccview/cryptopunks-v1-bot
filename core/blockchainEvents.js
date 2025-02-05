const axios = require('axios');
const Discord = require('discord.js');
const ethers = require('ethers');
const { contract_address, alchemy_api_key, discord_general_chat, discord_wraps_channel, discord_sales_channel } = require('../config.json');
/** Set the Discord channel ID here for debugging. */
// const discord_general_chat = `932316690816073729`;
// const discord_wraps_channel = `932316690816073729`;
// const discord_sales_channel = `932316690816073729`;

const ALCHEMY_API_URL = `https://eth-mainnet.g.alchemy.com/v2/${alchemy_api_key}`;
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const MARKETPLACES = {
    '0x7f268357a8c2552623316e2562d90e642bb538e5': 'OpenSea',
    '0x59728544b08ab483533076417fbbb2fd0b17ce3a': 'LooksRare',
    '0x00000000006c3852cbef3e08e8df289169ede581': 'OpenSea (Seaport)',
    '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b': 'OpenSea (Legacy)',
    '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3': 'X2Y2',
    '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': 'Blur',
    '0x0000000000000068f116a894984e2db1123eb395': 'OpenSea (Seaport 1.6)'
};

const MARKETPLACE_URLS = {
    OpenSea: `https://opensea.io/assets/ethereum/${contract_address}/`,
    LooksRare: `https://looksrare.org/collections/${contract_address}/`,
    X2Y2: `https://x2y2.io/collections/${contract_address}/`,
    Blur: `https://blur.io/eth/asset/${contract_address}/`,
    'OpenSea (Seaport)': `https://opensea.io/assets/ethereum/${contract_address}/`,
    'OpenSea (Seaport 1.6)': `https://opensea.io/assets/ethereum/${contract_address}/`,
    'OpenSea (Legacy)': `https://opensea.io/assets/ethereum/${contract_address}/`
}

const processedTxs = new Set();

const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
const publicProvider = new ethers.providers.JsonRpcProvider('https://eth.public-rpc.com');

async function startSalesTracking(client) {
    /**
     * Debug block for processing recent transactions. Uncomment for testing.
     */
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

/**
 * Debug function for processing recent transactions. Uncomment for testing.
 */
/*
async function fetchRecentSales() {
    const currentBlock = await getCurrentBlockNumber();
    const blockRange = 50000;

    const response = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [{
            fromBlock: ethers.utils.hexValue(currentBlock - blockRange),
            toBlock: 'latest',
            address: contract_address,
            topics: [TRANSFER_EVENT_TOPIC]
        }]
    });

    const logs = response.data.result;
    console.log(`Found ${logs.length} total events`);

    // Get the last 10 events
    const recentLogs = logs.slice(-50);
    console.log(`Processing last ${recentLogs.length} events:`);
    recentLogs.forEach(log => {
        console.log(`- Transaction hash: ${log.transactionHash}`);
    });

    return recentLogs;
}
*/

async function processSaleLog(log, client) {
    const { topics, transactionHash, address } = log;

    if (topics.length === 4) {
        const from = ethers.utils.getAddress(`0x${topics[1].slice(26)}`);
        const to = ethers.utils.getAddress(`0x${topics[2].slice(26)}`);
        const tokenId = ethers.BigNumber.from(topics[3]).toString();

        if (processedTxs.has(transactionHash)) {
            return;
        }

        processedTxs.add(transactionHash);
        try {
            const channel = await client.channels.fetch(discord_general_chat);
            const wrapsChannel = await client.channels.fetch(discord_wraps_channel);
            const salesChannel = await client.channels.fetch(discord_sales_channel);

            if (from === '0x0000000000000000000000000000000000000000') {
                const embed = new Discord.MessageEmbed()
                    .setColor('#00ff00')
                    .setTitle(`Punk #${tokenId} was just wrapped!!`)
                    .addFields(
                        { name: 'Token ID', value: tokenId, inline: true },
                        { name: 'Owner', value: `${to.slice(0, 4)}...${to.slice(-4)}`, inline: true },
                        { name: 'Transaction', value: `[View on Etherscan](https://etherscan.io/tx/${transactionHash})` }
                    )
                    .setThumbnail(`https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV/${tokenId}.png`)
                    .setTimestamp();

                try {
                    await channel.send({ embeds: [embed] });
                    await wrapsChannel.send({ embeds: [embed] });
                } catch (error) {
                    console.error(error.stack);
                }
                return;
            }

            const txDetails = await getTransactionDetails(transactionHash);
            const isMarketplaceTx = Object.keys(MARKETPLACES).includes(txDetails.to.toLowerCase());

            if (isMarketplaceTx) {
                const transfers = await getNFTTransfers(transactionHash);

                const relevantTransfers = transfers.filter(t =>
                    t.from.toLowerCase() !== '0x0000000000000000000000000000000000000000' &&
                    t.to.toLowerCase() !== '0x0000000000000000000000000000000000000000'
                );

                if (relevantTransfers.length > 1) {
                    const swapDetails = relevantTransfers.map(t => `#${t.tokenId}`).join(' ⇄ ');
                    const marketplace = MARKETPLACES[txDetails.to.toLowerCase()] || 'Unknown';

                    const embed = new Discord.MessageEmbed()
                        .setColor('#FFA500')
                        .setTitle(`A Punk trade happened!! ${swapDetails}`)
                        .addFields(
                            {
                                name: 'Participants', value: relevantTransfers.map(t =>
                                    `${t.from.slice(0, 4)}...${t.from.slice(-4)} ⇄ ${t.to.slice(0, 4)}...${t.to.slice(-4)}`
                                ).join('\n'), inline: true
                            },
                            { name: 'Marketplace', value: marketplace, inline: true },
                            { name: 'Transaction', value: `[View on Etherscan](https://etherscan.io/tx/${transactionHash})` }
                        )
                        .setThumbnail(`https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV/${tokenId}.png`)
                        .setTimestamp();

                    try {
                        await channel.send({ embeds: [embed] });
                        await salesChannel.send({ embeds: [embed] });
                    } catch (error) {
                        console.error(error.stack);
                    }
                    return;
                }
            }
        } catch (error) {
            console.error('Error in processSaleLog:', error);
            console.error('Failed transaction hash:', transactionHash);
            console.error('Failed token ID:', tokenId);
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

async function getTransactionDetails(txHash) {
    const response = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [txHash]
    });
    return response.data.result;
}

async function getNFTTransfers(txHash) {
    try {
        const txDetails = await getTransactionDetails(txHash);
        const blockNumber = txDetails.blockNumber;

        const response = await axios.post(ALCHEMY_API_URL, {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getLogs',
            params: [{
                fromBlock: blockNumber,
                toBlock: blockNumber,
                transactionHash: txHash,
                address: contract_address.toLowerCase(),
                topics: [TRANSFER_EVENT_TOPIC]
            }]
        });

        const transfers = response.data.result
            .filter(log => log.topics.length === 4)
            .map(log => ({
                tokenId: ethers.BigNumber.from(log.topics[3]).toString(),
                from: ethers.utils.getAddress(`0x${log.topics[1].slice(26)}`),
                to: ethers.utils.getAddress(`0x${log.topics[2].slice(26)}`)
            }));

        // Remove duplicate transfers (same tokenId, from, to)
        const uniqueTransfers = transfers.filter((transfer, index, self) =>
            index === self.findIndex(t => (
                t.tokenId === transfer.tokenId &&
                t.from === transfer.from &&
                t.to === transfer.to
            ))
        );

        return uniqueTransfers;
    } catch (error) {
        console.error('Error fetching NFT transfers:', error);
        return [];
    }
}

async function getTransactionValue(txHash) {
    try {
        const response = await axios.post(ALCHEMY_API_URL, {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionReceipt',
            params: [txHash]
        });

        const receipt = response.data.result;
        const txDetails = await getTransactionDetails(txHash);
        let nftTransfer;

        for (const log of receipt.logs) {
            if (log.address.toLowerCase() === contract_address.toLowerCase()) {
                if (log.topics[0].toLowerCase() === TRANSFER_EVENT_TOPIC.toLowerCase() && log.topics.length === 4) {
                    const from = '0x' + log.topics[1].slice(26);
                    const to = '0x' + log.topics[2].slice(26);
                    const tokenId = ethers.BigNumber.from(log.topics[3]).toString();
                    nftTransfer = { from: from.toLowerCase(), to: to.toLowerCase(), tokenId };
                    break;
                }
            }
        }

        if (!nftTransfer) {
            return { value: '0', currency: 'ETH' };
        }

        let paymentValue = ethers.BigNumber.from(0);
        let currency = 'ETH';
        let decimals = 18;

        for (const log of receipt.logs) {
            const tokenAddress = log.address.toLowerCase();
            if (log.topics[0].toLowerCase() === TRANSFER_EVENT_TOPIC.toLowerCase() && log.topics.length === 3) {
                const from = '0x' + log.topics[1].slice(26);
                const to = '0x' + log.topics[2].slice(26);
                const value = ethers.BigNumber.from(log.data);

                if (from.toLowerCase() === nftTransfer.to && to.toLowerCase() === nftTransfer.from) {
                    const tokenSymbol = await getTokenSymbol(tokenAddress);
                    decimals = await getTokenDecimals(tokenAddress);

                    paymentValue = value;
                    currency = tokenSymbol;
                    break;
                }
            }
        }

        const ethValue = ethers.BigNumber.from(txDetails.value || '0');
        if (ethValue.gt(0)) {
            paymentValue = ethValue;
            currency = 'ETH';
            decimals = 18;
        }

        if (paymentValue.gt(0)) {
            const formattedValue = ethers.utils.formatUnits(paymentValue, decimals);
            return { value: Number(formattedValue).toFixed(2), currency };
        } else {
            return { value: '0', currency: 'ETH' };
        }

    } catch (error) {
        console.error('Error fetching transaction value:', error);
        return { value: 'Unknown', currency: 'Unknown' };
    }
}

async function getTokenSymbol(tokenAddress) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, ['function symbol() view returns (string)'], provider);
        return await tokenContract.symbol();
    } catch (error) {
        console.error(`Error fetching token symbol for ${tokenAddress}:`, error);
        return 'Unknown';
    }
}

async function getTokenDecimals(tokenAddress) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, ['function decimals() view returns (uint8)'], provider);
        return await tokenContract.decimals();
    } catch (error) {
        console.error(`Error fetching token decimals for ${tokenAddress}:`, error);
        return 18;
    }
}

setInterval(() => {
    processedTxs.clear();
}, 3600000);

module.exports = { startSalesTracking };
