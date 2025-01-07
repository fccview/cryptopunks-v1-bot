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

```json
{
  "token": "DISCORD_BOT_TOKEN_HERE",
  "clientId": "DISCORD_BOT_CLIENT_ID_HERE",
  "guildId": "DISCORD_SERVER_GUILD_ID_HERE",
  "contract_address": "CONTRACT_ADDRESS_HERE",
  "collection_slug": "COLLECTION_SLUG_HERE",
  "alchemy_api_key": "ALCHEMY_API_KEY_HERE",
  "opensea_api_key": "OPENSEA_API_KEY_HERE",
  "etherscan_api_key": "ETHERSCAN_API_KEY_HERE",
  "rarible_api_key": "RARIBLE_API_KEY_HERE",
  "discord_general_chat": "DISCORD_GENERAL_CHAT_CHANNEL_ID_HERE",
  "discord_wraps_channel": "DISCORD_WRAPS_CHANNEL_ID_HERE",
  "discord_sales_channel": "DISCORD_SALES_CHANNEL_ID_HERE"
}
```

2. Initialize the project (`yarn`)
3. Install forever (`yarn add forever`)
4. Initialize slash commands (`node deploy-commands.js`)
5. Start application (`forever start index.js`)

## This is a community project

If you have any suggestions or improvements, please open a PR or issue.
I will try to review and merge as soon as possible.

_No matter how small or big the contribution is, your name/twitter handle will be added to the contributors list below._

## Contributors

- [fccview](https://x.com/fccview)
- [DeMemeTree](https://x.com/dmt_eth)
