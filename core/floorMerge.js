const axios = require('axios');
const { fetchListings, MARKETPLACE } = require('./indexerClient');
const { opensea_api_key, contract_address } = require('../config.json');

const OS_LISTINGS_URL = 'https://api.opensea.io/api/v2/listings/collection/official-v1-punks/best';
const OS_LIMIT = 100;

const fetchOsBest = async () => {
    try {
        const { data } = await axios.get(OS_LISTINGS_URL, {
            headers: { 'X-API-KEY': opensea_api_key },
            params: { include_private_listings: false, limit: OS_LIMIT },
            timeout: 15000,
        });
        return (data.listings || []).map((listing) => {
            const tokenId = listing.protocol_data.parameters.offer[0].identifierOrCriteria;
            const value = listing.price.current.value;
            const currency = listing.price.current.currency;
            const priceEth = parseInt(value, 10) / 1e18;
            return {
                tokenId: String(tokenId),
                priceEth,
                currency,
                marketplace: MARKETPLACE.OPENSEA,
            };
        });
    } catch (error) {
        console.error('OpenSea floor fetch failed:', error.message || error);
        return [];
    }
};

const mergeCheapest = (osItems, pmItems) => {
    const byToken = new Map();
    const push = (item) => {
        const existing = byToken.get(item.tokenId);
        if (!existing || item.priceEth < existing.priceEth) {
            byToken.set(item.tokenId, item);
        }
    };
    osItems.forEach(push);
    pmItems.forEach((row) => push({
        tokenId: row.tokenId,
        priceEth: row.priceEth,
        currency: 'ETH',
        marketplace: MARKETPLACE.PUNKS_MARKET,
    }));
    return Array.from(byToken.values()).sort((a, b) => a.priceEth - b.priceEth);
};

const getMergedFloor = async (limit) => {
    const [osItems, pmItems] = await Promise.all([fetchOsBest(), fetchListings(200)]);
    const merged = mergeCheapest(osItems, pmItems);
    return typeof limit === 'number' ? merged.slice(0, limit) : merged;
};

const tokenLinks = (tokenId, marketplace) => {
    const opensea = `https://opensea.io/assets/ethereum/${contract_address}/${tokenId}`;
    const punksMarket = `https://punksmarket.app/punk/${tokenId}`;
    const primary = marketplace === MARKETPLACE.PUNKS_MARKET ? punksMarket : opensea;
    return { opensea, punksMarket, primary };
};

module.exports = { getMergedFloor, tokenLinks, MARKETPLACE };
