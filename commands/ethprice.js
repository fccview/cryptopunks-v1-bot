const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ethprice')
        .setDescription(`Shows current ETH price against USD/GBP/EUR`)
        .addStringOption(option =>
            option.setName('currency')
                .setDescription('Choose what currency to convert to')
                .setRequired(true)
                .addChoices({
                    name: 'USD',
                    value: 'usd'
                },{
                    name: 'GBP',
                    value: 'gbp'
                },{
                    name: 'EUR',
                    value: 'eur'
                })
        )
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Enter the amount to convert')
                .setRequired(false)),

    async execute(interaction) {
        let currency = interaction.options.getString('currency');
        let amount = interaction.options.getString('amount');
        let url = `https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=ETH,${currency.toUpperCase()}`;
        let value;

        if (amount) {
            value = amount;
        } else {
            value = '1';
        }

        let res = await fetch(url)
            .then(res => res.json())
            .then(
                json => {
                    return json;
                }
            ).catch(err => {
                console.error('error:' + err);
            });

        let usdValue = parseFloat(res[currency.toUpperCase()]) * parseInt(value);
        let finalValue = usdValue.toFixed(2);

        interaction.reply(value+"ETH = "+finalValue+""+currency.toUpperCase());
    },
};