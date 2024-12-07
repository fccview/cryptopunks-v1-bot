const { SlashCommandBuilder } = require('@discordjs/builders');
const ethers = require('ethers');
const Discord = require('discord.js');
const NodeCache = require('node-cache');
const mintCache = new NodeCache({ stdTTL: 86400 });

async function getEnsName(address, publicProvider) {
    try {
        const ensName = await publicProvider.lookupAddress(address);
        return ensName || null;
    } catch (error) {
        console.error('Error fetching ENS name:', error);
        return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ogminter')
        .setDescription(`Tracks the original minter of a specific v1 punk`)
        .addStringOption(option =>
            option.setName('punk_id')
                .setDescription('Enter your Punk ID')
                .setRequired(true)),

    isNumeric: function (value) {
        return /^\d+$/.test(value);
    },

    async execute(interaction) {
        let punk = interaction.options.getString('punk_id');
        let self = this;
        let iterations = 0;
        if (self.isNumeric(punk) && parseInt(punk) <= 9999) {
            const cacheKey = `punk-${punk}`;
            const cachedResult = mintCache.get(cacheKey);
            if (cachedResult) {
                await interaction.reply({ content: "Found it! (cached)", embeds: [cachedResult], ephemeral: false });
                return;
            }

            await interaction.reply({ content: "Calculating.. Blockchain is slow AF, gimme a second..", ephemeral: false });

            async function getPastLogs(contract, fromBlock, toBlock, stop = false) {
                if (fromBlock <= toBlock || fromBlock === 0) {
                    try {
                        if (stop) {
                            return "stop";
                        } else {
                            return await contract.queryFilter("Assign", filterAll.fromBlock, filterAll.toBlock).then((event) => { return event });
                        }
                    }
                    catch (error) {
                        console.log(error);
                        if (iterations >= 50) {
                            await interaction.editReply("Reached iteration's limit of #50, sorry, I couldn't find a record :(");
                            return await getPastLogs(contract, fromBlock, 'latest', true);
                        }
                        iterations++;
                        await interaction.editReply({ content: "Iterating through the Blockchain, 10'000 blocks at the time.. This will take some time.. Calculating iteration #" + iterations + "..", ephemeral: false });
                        const midBlock = (fromBlock + toBlock) >> 1;
                        const arr1 = await getPastLogs(contract, fromBlock, midBlock);
                        const arr2 = await getPastLogs(contract, midBlock + 1, toBlock);
                        return [...arr1, ...arr2];
                    }
                }
                return [];
            }

            const abi = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "maxForThisRun", "type": "uint256" }], "name": "reservePunksForOwner", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "uint256" }], "name": "punksOfferedForSale", "outputs": [{ "name": "isForSale", "type": "bool" }, { "name": "punkIndex", "type": "uint256" }, { "name": "seller", "type": "address" }, { "name": "minValue", "type": "uint256" }, { "name": "onlySellTo", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [], "name": "withdraw", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "imageHash", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "nextPunkIndexToAssign", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "uint256" }], "name": "punkIndexToAddress", "outputs": [{ "name": "", "type": "address" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "standard", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "punkIndex", "type": "uint256" }], "name": "buyPunk", "outputs": [], "payable": true, "type": "function" }, { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "punkIndex", "type": "uint256" }], "name": "transferPunk", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "numberOfPunksToReserve", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "numberOfPunksReserved", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "punkIndex", "type": "uint256" }, { "name": "minSalePriceInWei", "type": "uint256" }, { "name": "toAddress", "type": "address" }], "name": "offerPunkForSaleToAddress", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "punksRemainingToAssign", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "punkIndex", "type": "uint256" }, { "name": "minSalePriceInWei", "type": "uint256" }], "name": "offerPunkForSale", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "punkIndex", "type": "uint256" }], "name": "getPunk", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "pendingWithdrawals", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "type": "function" }, { "constant": false, "inputs": [{ "name": "punkIndex", "type": "uint256" }], "name": "punkNoLongerForSale", "outputs": [], "payable": false, "type": "function" }, { "inputs": [], "payable": true, "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "punkIndex", "type": "uint256" }], "name": "Assign", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "punkIndex", "type": "uint256" }], "name": "PunkTransfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "punkIndex", "type": "uint256" }, { "indexed": false, "name": "minValue", "type": "uint256" }, { "indexed": true, "name": "toAddress", "type": "address" }], "name": "PunkOffered", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "punkIndex", "type": "uint256" }, { "indexed": false, "name": "value", "type": "uint256" }, { "indexed": true, "name": "fromAddress", "type": "address" }, { "indexed": true, "name": "toAddress", "type": "address" }], "name": "PunkBought", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "punkIndex", "type": "uint256" }], "name": "PunkNoLongerForSale", "type": "event" }];

            let provider = new ethers.providers.JsonRpcProvider(
                `https://eth.public-rpc.com`
            );
            const contract = new ethers.Contract("0x6Ba6f2207e343923BA692e5Cae646Fb0F566DB8D", abi, provider);

            let filterAll = {
                address: "0x6Ba6f2207e343923BA692e5Cae646Fb0F566DB8D",
                fromBlock: 0,
                toBlock: 'latest'
            };

            let event = await getPastLogs(contract, filterAll.fromBlock, filterAll.toBlock);
            if (event === "stop") {
                console.log('broken');
                return;
            }
            let usercard;

            for (let i = 0; i < event.length; i++) {
                if (event[i].hasOwnProperty('args')) {
                    if (parseInt(event[i].args['punkIndex']) === parseInt(punk)) {
                        let toAddress = event[i].args['to'];
                        let ensName = await getEnsName(toAddress, provider);
                        let txHash = "https://etherscan.io/tx/" + event[i].transactionHash;
                        const block = await provider.getBlock(event[i].blockNumber);
                        const mintDate = new Date(block.timestamp * 1000).toLocaleDateString();

                        usercard = new Discord.MessageEmbed()
                            .setTitle(`Punk #${event[i].args['punkIndex']}`)
                            .setColor('RANDOM')
                            .addFields({
                                name: `OG Minter`,
                                value: ensName || toAddress,
                                inline: true
                            }, {
                                name: `Mint Date`,
                                value: mintDate,
                                inline: true
                            }, {
                                name: `Tx Hash`,
                                value: txHash,
                                inline: false
                            })
                            .setThumbnail("https://ipfs.io/ipfs/QmbuBFTZe5ygELZhRtQkpM3NW8nVXxRUNK9W2XFbAXtPLV/" + event[i].args['punkIndex'] + ".png");

                        mintCache.set(cacheKey, usercard);

                        await interaction.editReply({ content: "Found it!", ephemeral: false });
                        await interaction.editReply({ embeds: [usercard], ephemeral: false });
                    }
                }
            }
        } else {
            await interaction.reply("I am just a bot, however I am pretty sure this v1 Punk doesn't exist.")
        }
    },
};