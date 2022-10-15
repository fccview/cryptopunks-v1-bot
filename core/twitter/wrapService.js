let { BigNumber, ethers } = require('ethers')
let { hexToNumberString } = require('web3-utils')

let config = require('../../config.json')

let erc20abi = require('./abi/cryptoPunkERC20abi.json')
let erc721abi = require('./abi/erc721.json')
let looksRareABI = require('./abi/looksRareABI.json')
let nftxABI = require('./abi/nftxABI.json')
let openseaSeaportABI = require('./abi/seaportABI.json')

const base = require('./base.js');

const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const wrapTopic = "0x58e5d5a525e3b40bc15abaa38b5882678db1ee68befd2f60bafe3a7fd06db9e3"

let provider = base.getWeb3Provider()

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
    watchForWraps(client) {
        // listen to wrap events..
        base.getAlchemy().ws.on({
          address: "0x6Ba6f2207e343923BA692e5Cae646Fb0F566DB8D",
          topics: [wrapTopic]
        }, async (event) => {
          await processWrapEvent(event, client)
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