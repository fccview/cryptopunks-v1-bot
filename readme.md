# How to:
## Requirements

- Node v17.3.0 (tested)

## Steps

1. Create a config.json file
2. Fill it with the following (Change "enable_twitter_sales" to `false` to disable the twitter sales functionality)
```json
{
  "token": "DISCORD_BOT_TOKEN_HERE",
  "contract_address": "0x282BDD42f4eb70e7A9D9F40c8fEA0825B7f68C5D",
  "collection_slug": "official-v1-punks",
  "clientId": "DISCORD_BOT_CLIENT_ID_HERE",
  "guildId": "DISCORD_SERVER_GUILD_ID_HERE",
  "os_api_key": "OS_API_KEY_HERE",
  "etherscan_api_key": "ETHERSCAN_API_KEY_HERE",
  "sales_cooldown": "100000",
  "discord_sales_channel": "SALES_DISCORD_CHANNEL_ID_HERE",
  "discord_general_chat": "DISCORD_GENERAL_CHAT_CHANNEL_ID_HERE",
  "enable_twitter_sales": true,
  "twitter_api_key": "TWITTER_API_KEY_HERE",
  "twitter_api_secret": "TWITTER_API_SECRET_HERE",
  "twitter_access_token": "TWITTER_ACCESS_TOKEN_HERE",
  "twitter_access_token_secret": "TWITTER_ACCESS_TOKEN_SECRET_HERE"
}
```
3. Initialize the project (`npm install`)
4. Install forever (`npm i -g forever`)
5. Initialize slash commands (`node deploy-commands.js`)
6. Start application (`forever start index.js`)