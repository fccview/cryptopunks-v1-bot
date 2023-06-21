let fs = require("fs");
let http = require("axios");
let currency = require("currency.js");
let Discord = require("discord.js");
let Jimp = require("jimp");
let { Network, Alchemy } = require("alchemy-sdk");
let ethers = require("ethers");
let twit = require("twit");

let {
  Observable,
  catchError,
  firstValueFrom,
  map,
  of,
  switchMap,
  timer,
} = require("rxjs");

let config = require("../../config.json");
let fiatSymbols = require("./fiat-symobols.json");

const settings = {
  apiKey: config.alchemy_api_key, // Replace with your Alchemy API Key.
  network: Network.ETH_MAINNET, // Replace with your network.
};

const alchemy = new Alchemy(settings);
const alchemyAPIUrl = "https://eth-mainnet.g.alchemy.com/v2/";
const alchemyAPIKey = config.alchemy_api_key;
const provider = new ethers.providers.JsonRpcProvider(
  alchemyAPIUrl + alchemyAPIKey
);

const twitterConfig = {
  consumer_key: config.twitter_api_key,
  consumer_secret: config.twitter_api_secret,
  access_token: config.twitter_access_token,
  access_token_secret: config.twitter_access_token_secret,
};

const twitterClient = new twit(twitterConfig);

let fiatValues;

module.exports = {
  init() {
    getEthToFiat().subscribe((fiat) => {
      if (fiat.error) {
        return;
      }
      fiatValues = fiat.ethereum;
    });
  },

  getWeb3Provider() {
    return provider;
  },

  getAlchemy() {
    return alchemy;
  },

  shortenAddress(address) {
    const shortAddress = `${address.slice(0, 5)}...${address.slice(
      address.length - 5,
      address.length
    )}`;
    if (address.startsWith("0x")) return shortAddress;
    return address;
  },

  async getTokenMetadata(tokenId) {
    return internalGetTokenMetadata(tokenId)
  },

  async tweet(data, client) {
        sendSaleToDiscord(client, data);
      } catch (err) {
        console.error(err);
      }
    }
  },

  async wrapEvent(punkID, client) {
    const imageUrl = await internalGetTokenMetadata(punkID)
    
    let item = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setTitle(`V1 PUNK #${punkID}`)
      .setDescription("Has been wrapped, check it out [here](https://v1punks.io/token/ETHEREUM:0x282bdd42f4eb70e7a9d9f40c8fea0825b7f68c5d:" + punkID + ")")
      .setThumbnail(transformImage(imageUrl))
      .setFooter({ text: `Wrap Event` });

    /**
     * Send to General Chat
     */
    client.channels.cache
      .get(config.discord_wraps_channel)
      .send({ embeds: [item] });

    /**
     * Send to General Chat
     */
    client.channels.cache
      .get(config.discord_general_chat)
      .send({ embeds: [item] });
  },
};

async function internalGetTokenMetadata(tokenId) {
  let response = await alchemy.nft.getNftMetadata(
    config.contract_address,
    tokenId
  );

  return response.rawMetadata.image;
}

function sendSaleToDiscord(client, sale) {
  let ethValue = sale.alternateValue ? sale.alternateValue : sale.ether;
  let tweetText = createTweetText(sale, ethValue, true);
  let tweetID = tweetData.id_str;

  let fields = [
    {
      name: "Buyer ⥂ Seller",
      value: `[${sale.to}](https://etherscan.io/address/${sale.longBuyer}) 🤝 [${sale.from}](https://etherscan.io/address/${sale.longSeller})`,
      inline: false,
    }
  ];
  let item = new Discord.MessageEmbed()
    .setColor("RANDOM")
    .setTitle(`V1 PUNK #${sale.tokenId}`)
    .setDescription(tweetText)
    .setThumbnail(transformImage(sale.imageUrl))
    .addFields(fields)
    .setFooter({ text: `${sale.marketplace} Sale` });

  client.channels.cache
    .get(config.discord_sales_channel)
    .send({ embeds: [item] });
  /**
   * Send to General Chat
   */
  client.channels.cache
    .get(config.discord_general_chat)
    .send({ embeds: [item] });
}

function transformRequest(url, parms) {
  return new Observable(function (observer) {
    http
      .get(url, parms)
      .then(function (response) {
        observer.next(response);
        observer.complete();
      })
      .catch(function (error) {
        observer.error(error);
      });
  });
}

async function getBase64(url) {
  if (url.startsWith("http")) {
    return await firstValueFrom(
      transformRequest(url, { responseType: "arraybuffer" }).pipe(
        map((res) => Buffer.from(res.data, "binary").toString("base64")),
        catchError(() => of(null))
      )
    );
  } else {
    return fs.readFileSync(url, { encoding: "base64" });
  }
}

function getEthToFiat() {
  const endpoint = `https://min-api.cryptocompare.com/data/price`;
  const params = {
    fsym: "ETH",
    tsyms: "USD,EUR,CNY,JPY,GBP",
  };
  return timer(0, 300000).pipe(
    switchMap(() => transformRequest(endpoint, { params })),
    map((res) => {
      return { ethereum: toLowerKeys(res.data) };
    }),
    // tap((res) => console.log(res)),
    catchError((err) => {
      return of({ error: true });
    })
  );
}

function transformImage(value) {
  let val = value;
  if (value?.includes("gateway.pinata.cloud")) {
    val = value.replace("gateway.pinata.cloud", "cloudflare-ipfs.com");
  } else if (value?.startsWith("ipfs://")) {
    val = value.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
  }
  return val ? val : null;
}

function toLowerKeys(obj) {
  return Object.keys(obj).reduce((accumulator, key) => {
    accumulator[key.toLowerCase()] = obj[key];
    return accumulator;
  }, {});
}

function createTweetText(data, ethValue, isDiscord) {
  isDiscord = !!isDiscord;
  let tweetText = isDiscord
    ? config.discordSaleMessage
    : data.type === "SALE"
    ? config.saleMessage
    : config.bidMessage; // Right now this is useless as bids arent a thing...

  // Cash value
  let fiatValue = data.usdcValue
    ? data.usdcValue
    : fiatValues[config.currency] *
      (data.alternateValue ? data.alternateValue : data.ether);
  let fiat = currency(fiatValue, {
    symbol: fiatSymbols[config.currency].symbol,
    precision: 0,
  });

  let eth = currency(ethValue, { symbol: "Ξ", precision: 3 });

  if (ethValue <= 0.01 && data.usdcValue === 0) {
    // this kills the tweet process
    return;
  }

  tweetText = tweetText.replace(new RegExp("<tokenId>", "g"), data.tokenId);
  if (ethValue) {
    tweetText = tweetText.replace(
      new RegExp("<ethPrice>", "g"),
      eth.format() + " "
    );
  } else {
    tweetText = tweetText.replace(new RegExp("<ethPrice>", "g"), "");
  }
  tweetText = tweetText.replace(
    new RegExp("<txHash>", "g"),
    data.transactionHash
  );
  tweetText = tweetText.replace(new RegExp("<from>", "g"), data.from);
  tweetText = tweetText.replace(new RegExp("<to>", "g"), data.to);
  tweetText = tweetText.replace(new RegExp("<fiatPrice>", "g"), fiat.format());
  tweetText = tweetText.replace(
    new RegExp("<marketplace>", "g"),
    data.marketplace
  );
  return tweetText;
}
