let { BigNumber, ethers } = require('ethers')
let { hexToNumberString } = require('web3-utils')

let config = require('../../config.json')

let erc20abi = require('./abi/cryptoPunkERC20abi.json')
let erc721abi = require('./abi/erc721.json')
let looksRareABI = require('./abi/looksRareABI.json')
let nftxABI = require('./abi/nftxABI.json')
let openseaSeaportABI = require('./abi/seaportABI.json')

const base = require('./base.js');

const looksRareContractAddress = '0x59728544b08ab483533076417fbbb2fd0b17ce3a'; // Don't change unless deprecated
const looksInterface = new ethers.utils.Interface(looksRareABI);
const nftxInterface = new ethers.utils.Interface(nftxABI);
const seaportInterface = new ethers.utils.Interface(openseaSeaportABI);
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const wrapTopic = "0x58e5d5a525e3b40bc15abaa38b5882678db1ee68befd2f60bafe3a7fd06db9e3"

let provider = base.getWeb3Provider()

let x2y2SalesQueue = []
function addToSalesQueue(sale, client) {
  let x2y2Weirdaddress = "0x2C45Af926d5f62C5935278106800a03eB565778E".toLowerCase()
  let weirdTo = sale.longTo === x2y2Weirdaddress
  if(weirdTo || sale.longFrom === x2y2Weirdaddress) { // fix x2y2 single purchase weirdness...
    if(x2y2SalesQueue.length === 1) {
      if(weirdTo) {
        sale.to = x2y2SalesQueue[0].to
      } else {
        sale.from = x2y2SalesQueue[0].from
      }
      // we need to reset since we are allowing the sale to go through.
      x2y2SalesQueue = []
    } else {
      // we need to wait since this shit takes the NFT then gives it away so we use a buffer to fix.
      x2y2SalesQueue.push(sale)
      return
    }
  }

  //console.log(sale)
  base.tweet(sale, client)
}

async function processWrapEvent(event, client) {
  try {
    let from = ethers.utils.defaultAbiCoder.decode(['address'], event?.topics[2])[0];
    let to = ethers.utils.defaultAbiCoder.decode(['address'], event?.topics[3])[0];
    let punkID = ethers.utils.defaultAbiCoder.decode(['uint'], event?.topics[1])[0].toString();

    if(from.toLowerCase() === "0x282BDD42f4eb70e7A9D9F40c8fEA0825B7f68C5D".toLowerCase() && from === to) {
      await base.wrapEvent(punkID, client)
    }
  } catch(error) {
    // console.log(error)
  }
}

module.exports = {
    watchForSales(client) {
        base.init();

        // listen to wrap events..
        base.getAlchemy().ws.on({
          address: "0x6Ba6f2207e343923BA692e5Cae646Fb0F566DB8D",
          topics: [wrapTopic]
        }, async (event) => {
          await processWrapEvent(event, client)
        });

        base.getAlchemy().ws.on({ address: config.contract_address, topics: [transferTopic] },
            (event) => {
              getTransactionDetails(event).then((res) => {
                if (!res) return
                if (res?.ether || res?.alternateValue || res?.usdcValue) {
                    addToSalesQueue(res, client)
                }
              })
            }
        )

        // this code snippet can be useful to test a specific transaction
        // Just comment out the return statement and comment out line 42
        return
        const tokenContract = new ethers.Contract(config.contract_address, erc721abi, provider);
        let filter = tokenContract.filters.Transfer();
        const startingBlock = 15740811 
        const endingBlock = startingBlock + 1
        tokenContract.queryFilter(filter,
        startingBlock,
        endingBlock
        ).then(events => {
        // console.log("Processing events...")
        for (const event of events) {
            getTransactionDetails(event).then((res) => {
              if (!res) return
              if (res?.ether || res?.alternateValue || res?.usdcValue) {
                addToSalesQueue(res, client)
              }
            });
        }
        });


        // this will test a wrap transaction
        return
        const tokenContractW = new ethers.Contract("0x6Ba6f2207e343923BA692e5Cae646Fb0F566DB8D", erc20abi, provider);
        let filterW = tokenContractW.filters.PunkBought();
        const startingBlockW = 14557905  
        const endingBlockW = startingBlockW + 1
        tokenContractW.queryFilter(filterW,
        startingBlockW,
        endingBlockW
        ).then(async (events) => {
          for (const event of events) {
            await processWrapEvent(event, client)
          }
        });
    }
}

function isSudoSwap(address) {
  if(address.toLowerCase() === "0x2b2e8cda09bba9660dca5cb6233787738ad68329".toLowerCase()) {
    return true
  } else if(address.toLowerCase() === "0x5f7dcff503c0e92e92dd1d967bd569565bf90f01".toLowerCase()) {
    return true
  }
  return false
}

async function getTransactionDetails(tx) {
  let foundMarketPlace = "Couldnt find it.. BUG THE BOT DEV TO FIX!"
  let tokenId;

  try {
    // Get addresses of seller / buyer from topics
    let from = ethers.utils.defaultAbiCoder.decode(['address'], tx?.topics[1])[0];
    let to = ethers.utils.defaultAbiCoder.decode(['address'], tx?.topics[2])[0];

    // ignore internal transfers to contract, another transfer event will handle this 
    // transaction afterward (the one that'll go to the buyer wallet)
    const code = await provider.getCode(to)

    if (code !== '0x' && tx.address.toLowerCase() !== "0x282BDD42f4eb70e7A9D9F40c8fEA0825B7f68C5D".toLowerCase()) {
      //console.log(`contract detected for ${tx.transactionHash} event index ${tx.logIndex}`)
      return
    }

    // not an erc721 transfer
    if (!tx?.topics[3]) return

    // Get tokenId from topics
    tokenId = hexToNumberString(tx?.topics[3]);

    // Get transaction hash
    const { transactionHash } = tx;
    //console.log(`handling ${transactionHash}`)
    const isMint = BigNumber.from(from).isZero();

    // Get transaction
    const transaction = await provider.getTransaction(transactionHash);
    const { value } = transaction;
    const ether = ethers.utils.formatEther(value.toString());

    let isX2Y2Exchange = transaction.to.toLowerCase() === "0x74312363e45dcaba76c59ec49a7aa8a65a67eed3".toLowerCase()

    if (transaction.to.toLowerCase() === "0x9757F2d2b135150BBeb65308D4a91804107cd8D6".toLowerCase()) {
      foundMarketPlace = "Rarible"
    } else if (transaction.to.toLowerCase() === "0xDef1C0ded9bec7F1a1670819833240f027b25EfF".toLowerCase()) {
      foundMarketPlace = "atomic0"
    } else if (isSudoSwap(transaction.to)) {
      foundMarketPlace = "SudoSwap"
    }else if(isX2Y2Exchange) {
      foundMarketPlace = "X2Y2"
    }
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);

    // Get token image
    const imageUrl = await base.getTokenMetadata(tokenId);

    // Check if LooksRare & parse the event & get the value
    let alternateValue = 0;
    const LR = receipt.logs.map((log) => {
      if (log.address.toLowerCase() === looksRareContractAddress.toLowerCase()) {
        return looksInterface.parseLog(log);
      }
    }).filter((log) => (log?.name === 'TakerAsk' || log?.name === 'TakerBid') &&
      log?.args.tokenId === tokenId);

    const NFTX = receipt.logs.map((log) => {
      // direct buy from vault
      if (log.topics[0].toLowerCase() === '0x1cdb5ee3c47e1a706ac452b89698e5e3f2ff4f835ca72dde8936d0f4fcf37d81') {
        const relevantData = log.data.substring(2);
        const relevantDataSlice = relevantData.match(/.{1,64}/g);
        return BigInt(`0x${relevantDataSlice[1]}`) / BigInt('1000000000000000');
      } else if (log.topics[0].toLowerCase() === '0x63b13f6307f284441e029836b0c22eb91eb62a7ad555670061157930ce884f4e') {
        const parsedLog = nftxInterface.parseLog(log)

        // check that the current transfer is NFTX related
        if (!parsedLog.args.nftIds.filter(n => BigInt(n).toString() === tokenId).length) {
          return
        }

        // redeem, find corresponding token bought
        const buys = receipt.logs.filter((log2) => log2.topics[0].toLowerCase() === '0xf7735c8cb2a65788ca663fc8415b7c6a66cd6847d58346d8334e8d52a599d3df')
          .map(b => {
            const relevantData = b.data.substring(2);
            const relevantDataSlice = relevantData.match(/.{1,64}/g);
            return BigInt(`0x${relevantDataSlice[1]}`)
          })
        if (buys.length) {
          return buys.reduce((previous, current) => previous + current, BigInt(0)) / BigInt('1000000000000000')
        } else {
          // we're still missing the funds, check swap of weth
          const swaps = receipt.logs.filter((log2) => log2.topics[0].toLowerCase() === '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822')
            .map(b => {
              const relevantData = b.data.substring(2);
              const relevantDataSlice = relevantData.match(/.{1,64}/g);
              const moneyIn = BigInt(`0x${relevantDataSlice[1]}`)
              if (moneyIn > BigInt(0))
                return moneyIn / BigInt('1000000000000000');
            })
          if (swaps.length) return swaps[0]
        }
      }
    }).filter(n => n !== undefined)

    // Check all marketplaces specific events to find an alternate price
    // in case of sweep, multiple buy, or bid

    const sudoswap = receipt.logs.map((log) => {
      if (log.topics[0].toLowerCase() === '0xf06180fdbe95e5193df4dcd1352726b1f04cb58599ce58552cc952447af2ffbb'.toLowerCase()) {
        const relevantData = log.data.substring(2);
        return BigInt(`0x${relevantData}`) / BigInt('10000000000000000')
      }
    }).filter(n => n !== undefined)

    let rarible = receipt.logs.map((log) => {
      if (log.address.toLowerCase() === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'.toLowerCase()) {
        const data = log.data.substring(2);
        const dataSlices = data.match(/.{1,64}/g);
        let totalAmount = []
        dataSlices.forEach(slice => {
          const moneyIn = BigInt(`0x${slice}`)
          totalAmount.push(moneyIn)
        })
        return totalAmount.reduce((previous, current) => previous + current, BigInt(0))
      }
    }).filter(n => n !== undefined)

    const NLL = receipt.logs.map((log) => {
      if (log.topics[0].toLowerCase() === '0x975c7be5322a86cddffed1e3e0e55471a764ac2764d25176ceb8e17feef9392c') {
        const relevantData = log.data.substring(2);
        if (tokenId !== parseInt(log.topics[1], 16).toString()) {
          return
        }
        return BigInt(`0x${relevantData}`) / BigInt('1000000000000000')
      }
    }).filter(n => n !== undefined)

    const X2Y2 = receipt.logs.map((log, index) => {
      if (log.topics[0].toLowerCase() === '0x3cbb63f144840e5b1b0a38a7c19211d2e89de4d7c5faf8b2d3c1776c302d1d33') {
        const data = log.data.substring(2);
        const dataSlices = data.match(/.{1,64}/g);
        // find the right token
        if (BigInt(`0x${dataSlices[18]}`).toString() !== tokenId) return;
        let amount = BigInt(`0x${dataSlices[12]}`) / BigInt('1000000000000000');
        if (amount === BigInt(0)) {
          amount = BigInt(`0x${dataSlices[26]}`) / BigInt('1000000000000000');
        }
        return amount
      }
    }).filter(n => n !== undefined)

    let usdcValue = 0;
    const OPENSEA_SEAPORT = receipt.logs.map((log) => {
      if (log.topics[0].toLowerCase() === '0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31') {
        const logDescription = seaportInterface.parseLog(log);
        const matchingOffers = logDescription.args.offer.filter(
          o => o.identifier.toString() === tokenId ||
            o.identifier.toString() === '0');
        const tokenCount = logDescription.args.offer.length;
        if (matchingOffers.length === 0) {
          return
        }
        let amounts = logDescription.args.consideration.map(c => BigInt(c.amount))

        let usdc = logDescription.args.offer.filter(offer => {
          return offer.token.toLowerCase() === "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".toLowerCase()
        })

        if (usdc.length === 0) {
          logDescription.args.offer.forEach(offer => {
            if (offer.token.toLowerCase() === "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".toLowerCase()) {
              let foundAmounts = []
              logDescription.args.consideration.forEach(item => {
                foundAmounts.push(BigInt(item.amount))
              })
              usdcValue = parseFloat((foundAmounts.reduce((previous, current) => previous + current, BigInt(0))).toString()) / 1000000
            }
          })
        }

        if (usdc.length >= 1) {
          usdcValue = parseFloat(BigInt(usdc[0].amount).toString()) / 1000000
          foundMarketPlace = "Opensea"
          return
        }
        // add weth
        const wethOffers = matchingOffers.map(o => o.token === '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' && o.amount > 0 ? BigInt(o.amount) : BigInt(0));
        if (wethOffers.length > 0 && wethOffers[0] != BigInt(0)) {
          //console.log('found weth offer, using it as amount')
          amounts = wethOffers
        }
        //console.log(amounts)
        const amount = amounts.reduce((previous, current) => previous + current, BigInt(0))
        return amount / BigInt('1000000000000000') / BigInt(tokenCount)
      }
    }).filter(n => n !== undefined)

    if (LR.length) {
      const weiValue = (LR[0]?.args?.price)?.toString();
      const value = ethers.utils.formatEther(weiValue);
      alternateValue = parseFloat(value);
      foundMarketPlace = "LooksRare"
    } else if (NFTX.length) {
      // find the number of token transferred to adjust amount per token
      const redeemLog = receipt.logs.filter((log) => log.topics[0].toLowerCase() === '0x63b13f6307f284441e029836b0c22eb91eb62a7ad555670061157930ce884f4e')[0]
      const parsedLog = nftxInterface.parseLog(redeemLog)
      const tokenCount = Math.max(parsedLog.args.nftIds.length, 1)
      alternateValue = parseFloat(NFTX[0].toString()) / tokenCount / 1000;
      foundMarketPlace = "NFTx"
    } else if (NLL.length) {
      alternateValue = parseFloat(NLL[0].toString()) / 1000;
      foundMarketPlace = "Not Larva Labs"
    } else if (X2Y2.length) {
      alternateValue = parseFloat(X2Y2[0].toString()) / 1000;
      foundMarketPlace = "X2Y2"
    } else if (OPENSEA_SEAPORT.length) {
      alternateValue = parseFloat(OPENSEA_SEAPORT[0].toString()) / 1000;
      foundMarketPlace = "Opensea"
    } else if (rarible.length) {
      if(isX2Y2Exchange) {
        const amount = BigInt(rarible[0])
        alternateValue = parseFloat((amount / BigInt('1000000000000000')).toString()) / 1000
      } else {
        const amount = rarible.reduce((previous, current) => previous + current, BigInt(0))
      alternateValue = parseFloat((amount / BigInt('1000000000000000')).toString()) / 1000
      }
    } else if (sudoswap.length) {
      alternateValue = parseFloat(sudoswap[0].toString()) / 100
    }


    // if there is an NFTX swap involved, ignore this transfer
    const swaps = receipt.logs.filter((log2) => log2.topics[0].toLowerCase() === '0x7af2bc3f8ec800c569b6555feaf16589d96a9d04a49d1645fd456d75fa0b372b')
    if (swaps.length) {
      //console.log('nftx swap involved in this transaction, ignoring it')
      return
    }

    // If ens is configured, get ens addresses
    let ensTo;
    let ensFrom;
    if (config.ens) {
      ensTo = await provider.lookupAddress(`${to}`);
      ensFrom = await provider.lookupAddress(`${from}`);
    }
    var longSeller = from
    var longBuyer = to

    // Set the values for address to & from -- Shorten non ens
    to = config.ens ? (ensTo ? ensTo : base.shortenAddress(to)) : base.shortenAddress(to);
    from = (isMint && config.includeFreeMint) ? 'Mint' : config.ens ? (ensFrom ? ensFrom : base.shortenAddress(from)) : base.shortenAddress(from);

    if (parseFloat(ether) > 0 || alternateValue > 0) {
      usdcValue = 0
    }

    // Create response object
    const tweetRequest = {
      from,
      to,
      tokenId,
      marketplace: foundMarketPlace,
      ether: parseFloat(ether),
      transactionHash,
      alternateValue,
      usdcValue,
      type: "SALE",
      longTo: transaction.to.toLowerCase(),
      longFrom: transaction.from.toLowerCase(),
      longSeller: longSeller,
      longBuyer: longBuyer
    };

    // If the image was successfully obtained
    if (imageUrl) tweetRequest.imageUrl = imageUrl;

    return tweetRequest;

  } catch (err) {
    console.log(err)
    return null
  }
}