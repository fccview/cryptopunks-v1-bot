# How to:
## Requirements

- Node v17.3.0 (tested)

## Steps

1. Create a config.json file
2. Fill it with the following (Change "enable_twitter_sales" to `false` to disable the twitter sales functionality)

etherscan_api_key is optional 
```json
{
  "token": "DISCORD_BOT_TOKEN_HERE",
  "contract_address": "0x282BDD42f4eb70e7A9D9F40c8fEA0825B7f68C5D",
  "collection_slug": "official-v1-punks",
  "clientId": "DISCORD_BOT_CLIENT_ID_HERE",
  "guildId": "DISCORD_SERVER_GUILD_ID_HERE",
  "os_api_key": "OS_API_KEY_HERE",
  "etherscan_api_key": "ETHERSCAN_API_KEY_HERE",
  "discord_sales_channel": "SALES_DISCORD_CHANNEL_ID_HERE",
  "discord_general_chat": "DISCORD_GENERAL_CHAT_CHANNEL_ID_HERE",
  "alchemy_api_key": "ALCHEMY_API_KEY_HERE",
  "enable_twitter_sales": true,
  "twitter_api_key": "TWITTER_API_KEY_HERE",
  "twitter_api_secret": "TWITTER_API_SECRET_HERE",
  "twitter_access_token": "TWITTER_ACCESS_TOKEN_HERE",
  "twitter_access_token_secret": "TWITTER_ACCESS_TOKEN_SECRET_HERE",
  "currency": "usd",
  "saleMessage": "CryptoPunk V1 #<tokenId> was bought for <ethPrice>💵 (<fiatPrice>)\n\nBUYER: <to>\n🤝\nSELLER: <from>\n\n🛒 MARKETPLACE: <marketplace>\n\n➡️  https://v1punks.io/token/ETHEREUM:0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d:<tokenId>\n\n➡️  https://etherscan.io/tx/<txHash>\n\n",
  "discordSaleMessage": "Has been bought for <ethPrice> (<fiatPrice>)\n\n[v1punks.io](https://v1punks.io/token/ETHEREUM:0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d:<tokenId>)\n\n[Etherscan](https://etherscan.io/tx/<txHash>)\n\n\n",
  "ens": true
}
```
3. Initialize the project (`npm install`)
4. Install forever (`npm i -g forever`)
5. Initialize slash commands (`node bot/deploy-commands.js`)
6. Start application (`forever start index.js`)