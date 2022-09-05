const Discord = require('discord.js');
const fetch = require('node-fetch');
const ethers = require('ethers');
const { sales_cooldown, discord_sales_channel, discord_general_chat, contract_address, os_api_key } = require('../config.json');
const twitter = require("./twitter");

module.exports = {
    /**
     *
     * @param s
     * @returns {string}
     */
    capitalize: function(s) {
        return s[0].toUpperCase() + s.slice(1);
    },

    /**
     *
     * @param client
     */
    allSales: function (client) {
        let seconds = sales_cooldown ? parseInt(sales_cooldown) / 1000 : 3600;
        let hoursAgo = (Math.round(new Date(`2022-09-05T04:14:54Z`).getTime() / 1000) - (seconds));
        let self = this;

        let options = {
            method: 'GET'
        };
        let url = `https://api.rarible.org/v0.1/activities/byCollection?collection=ETHEREUM:${contract_address}&type=SELL`;

        fetch(url, options)
            .then(res => res.json())
            .then(
                async json => {
                    for (let i = json.activities.length - 1; i >= 0; --i) {
                        let sale = json.activities[i];
                        let alert = '';
                        let tweetAlert = '';
                        let wen = Math.round(new Date(sale['date']).getTime() / 1000);

                        if (wen >= hoursAgo) {
                            let tokenID = sale.nft.type.tokenId;
                            let tokenName = `V1 PUNK #${tokenID}`;
                            let price = parseFloat(sale.payment.value).toFixed(2);
                            let currency = sale.payment.type['@type'];
                            let usdPrice = sale.priceUsd;
                            let marketplace = sale.source;
                            let winner = (sale.buyer) ? sale.buyer.replace('ETHEREUM:', '').substring(0, 6) : sale.buyer;
                            let seller = (sale.seller) ? sale.seller.replace('ETHEREUM:', '').substring(0, 6) : sale.seller;
                            let etherscanURL = `https://etherscan.io/tx/${sale.transactionHash}`;
                            let saleURL = `https://v1punks.io/token/ETHEREUM:0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d:${tokenID}`;

                            let imageApiUrl = `https://api.opensea.io/api/v1/asset/${contract_address}/${tokenID}/?include_orders=false`;
                            let imageOptions = {
                                method: 'GET',
                                headers: {Accept: 'application/json', 'X-API-KEY': os_api_key}
                            };
                            let image = await fetch(imageApiUrl, imageOptions)
                                .then(res => res.json())
                                .then(
                                    json => {
                                        return json['image_url'];
                                    }
                                ).catch(err => {
                                    console.error('error:' + err);
                                });


                            if (marketplace !== undefined) {
                                marketplace = marketplace.replace('_', '').toLowerCase();
                                marketplace = self.capitalize(marketplace);
                            }

                            if (currency === 'ETH' || sale.payment.type.contract === 'ETHEREUM:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
                                currency = `${ethers.constants.EtherSymbol}`;
                                alert = `Has been sold for ${price}${currency} (${parseFloat(usdPrice).toFixed(2)}). \n Check it out [here](${saleURL})`;
                                tweetAlert = `${tokenName} has been sold for ${price}${currency} (${parseFloat(usdPrice).toFixed(2)}).\n\nBuyer: ${winner}\nSeller: ${seller} \n\n${saleURL}`;
                            } else {
                                currency = '$';
                                price = usdPrice;
                                alert = `Has been sold for ${parseFloat(usdPrice).toFixed(2)}$. \n Check it out [here](${saleURL})`;
                                tweetAlert = `${tokenName} has been sold for ${parseFloat(usdPrice).toFixed(2)}$.\n\nBuyer: ${winner}\nSeller: ${seller} \n\n${saleURL}`;
                            }

                            let tweet = await twitter.tweetSale(tweetAlert);

                            let item = new Discord.MessageEmbed()
                                .setColor('RANDOM')
                                .setTitle(tokenName)
                                .setDescription(alert)
                                .setThumbnail(image)
                                .addFields(
                                    {
                                        name: 'Buyer',
                                        value: '[' + winner + '](https://etherscan.io/address/' + sale.to + ')',
                                        inline: true
                                    },
                                    {
                                        name: 'Seller',
                                        value: '[' + seller + '](https://etherscan.io/address/' + sale.from + ')',
                                        inline: true
                                    },
                                    {
                                        name: `Raid the tweet`,
                                        value: `Click [here](${tweet})`,
                                        inline: false
                                    }
                                )
                                .setFooter({text: `${marketplace} Sale`})

                            client.channels.cache.get(discord_sales_channel).send({embeds: [item]});
                            /**
                             * Send to General Chat
                             */
                            client.channels.cache.get(discord_general_chat).send({embeds: [item]});
                        }
                    }
                }
            ).catch(err => {
            console.error('error:' + err);
        });

    },
};