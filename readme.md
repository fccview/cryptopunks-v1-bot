# How to:

## Requirements

- Node v18.20.5 (tested)

## Support the Project ❤️

If you find this bot helpful, consider supporting me, every donation helps me continue creating useful tools for the community:

```
SOL: 3VpNWv517ccnshXFCKYgf3GeAxk4DzhrowhQEa3rrUrn
ETH: 0xfe89834C92C399E720F457bB73fEa1EFe1D0e17D
```

## Steps

1. Create a config.json file
2. Fill it with the following (Change "enable_twitter_sales" to `false` to disable the twitter sales functionality). `etherscan_api_key` is optional.

```json
{
  "token": "DISCORD_BOT_TOKEN_HERE",
  "contract_address": "0x282BDD42f4eb70e7A9D9F40c8fEA0825B7f68C5D",
  "collection_slug": "official-v1-punks",
  "clientId": "DISCORD_BOT_CLIENT_ID_HERE",
  "guildId": "DISCORD_SERVER_GUILD_ID_HERE",
  "os_api_key": "OS_API_KEY_HERE",
  "etherscan_api_key": "ETHERSCAN_API_KEY_HERE",
  "discord_general_chat": "DISCORD_GENERAL_CHAT_CHANNEL_ID_HERE",
  "alchemy_api_key": "ALCHEMY_API_KEY_HERE",
}
```

3. Initialize the project (`npm install`)
4. Install forever (`npm i -g forever`)
5. Initialize slash commands (`node bot/deploy-commands.js`)
6. Start application (`forever start index.js`)

## Contributors

- [fccview](https://twitter.com/fccview)
- [DeMemeTree](https://twitter.com/dmt_eth)
