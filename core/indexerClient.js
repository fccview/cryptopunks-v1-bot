const axios = require('axios');
const { contract_address, indexer_url } = require('../config.json');

const INDEXER_URL = indexer_url || 'https://indexer.punksmarket.app';
const WRAPPER_ADDRESS = (contract_address || '').toLowerCase();
const PUNKS_MARKET_CONTRACT = '0x64e507febf26521b73fbdfa533106b2042533218';
const WEI_PER_ETH = 1000000000000000000n;
const SANE_MAX_ETH = 10000;

const MARKETPLACE = Object.freeze({
    OPENSEA: 'OpenSea',
    PUNKS_MARKET: 'Punks Market',
});

const EVENT_SOURCE = Object.freeze({
    V1: 'cryptopunks_v1',
    PUNKS_MARKET: 'punks_market',
});

const EVENT_TYPE = Object.freeze({
    SALE: 'sale',
});

const weiToEth = (wei) => {
    const big = BigInt(wei);
    const whole = big / WEI_PER_ETH;
    const frac = big % WEI_PER_ETH;
    return Number(whole) + Number(frac) / 1e18;
};

const askPonder = async (query, variables = {}) => {
    try {
        const { data } = await axios.post(INDEXER_URL, { query, variables }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        });
        if (data.errors && data.errors.length > 0) {
            console.error('Indexer GraphQL errors:', JSON.stringify(data.errors));
            throw new Error('indexer_graphql_error');
        }
        return data.data;
    } catch (error) {
        console.error('Indexer request failed:', error.message || error);
        throw error;
    }
};

const LISTINGS_QUERY = `
  query FloorListings($limit: Int!) {
    v1Listings(
      limit: $limit,
      where: { active: true, min_value_wei_gt: "0" },
      orderBy: "min_value_wei",
      orderDirection: "asc"
    ) {
      items {
        punk_id
        min_value_wei
        seller
        only_sell_to
        active
      }
    }
  }
`;

const OWNERS_QUERY = `
  query Owners($ids: [BigInt!]) {
    v1Punks(limit: 1000, where: { punk_id_in: $ids }) {
      items { punk_id owner }
    }
  }
`;

const fetchOwners = async (tokenIds) => {
    if (!tokenIds.length) return new Map();
    try {
        const data = await askPonder(OWNERS_QUERY, { ids: tokenIds });
        const items = (data && data.v1Punks && data.v1Punks.items) || [];
        return new Map(items.map((row) => [String(row.punk_id), (row.owner || '').toLowerCase()]));
    } catch (error) {
        console.error('fetchOwners failed:', error.message || error);
        return new Map();
    }
};

const fetchListings = async (limit = 200) => {
    try {
        const data = await askPonder(LISTINGS_QUERY, { limit });
        const items = (data && data.v1Listings && data.v1Listings.items) || [];
        const candidates = items
            .filter((row) => {
                const ost = (row.only_sell_to || '').toLowerCase();
                return !ost || ost === PUNKS_MARKET_CONTRACT;
            })
            .filter((row) => row.min_value_wei && row.min_value_wei !== '0');

        const owners = await fetchOwners(candidates.map((r) => String(r.punk_id)));

        return candidates
            .filter((row) => owners.get(String(row.punk_id)) === (row.seller || '').toLowerCase())
            .map((row) => ({
                tokenId: String(row.punk_id),
                priceWei: String(row.min_value_wei),
                priceEth: weiToEth(row.min_value_wei),
                seller: row.seller,
                marketplace: MARKETPLACE.PUNKS_MARKET,
            }))
            .filter((row) => row.priceEth <= SANE_MAX_ETH);
    } catch (error) {
        console.error('fetchListings failed:', error.message || error);
        return [];
    }
};

const SALES_QUERY = `
  query RecentSales($after: BigInt!, $limit: Int!) {
    events(
      limit: $limit,
      where: {
        type: "sale",
        source_in: ["cryptopunks_v1", "punks_market"],
        timestamp_gt: $after
      },
      orderBy: "timestamp",
      orderDirection: "asc"
    ) {
      items {
        id
        source
        source_event
        type
        punk_id
        buyer
        seller
        wei_amount
        usd_value_cents
        tx_hash
        timestamp
      }
    }
  }
`;

const fetchSales = async (afterTimestamp, limit = 50) => {
    try {
        const data = await askPonder(SALES_QUERY, {
            after: String(afterTimestamp),
            limit,
        });
        const items = (data && data.events && data.events.items) || [];
        return items.map((row) => ({
            id: row.id,
            source: row.source,
            sourceEvent: row.source_event,
            tokenId: String(row.punk_id),
            buyer: row.buyer,
            seller: row.seller,
            priceWei: String(row.wei_amount || '0'),
            priceEth: weiToEth(row.wei_amount || '0'),
            usdCents: row.usd_value_cents ? Number(row.usd_value_cents) : null,
            txHash: row.tx_hash,
            timestamp: Number(row.timestamp),
            marketplace: row.source === EVENT_SOURCE.PUNKS_MARKET
                ? MARKETPLACE.PUNKS_MARKET
                : 'CryptoPunks V1',
        }));
    } catch (error) {
        console.error('fetchSales failed:', error.message || error);
        return [];
    }
};

const WRAPS_QUERY = `
  query Wraps($after: BigInt!, $limit: Int!) {
    events(
      limit: $limit,
      where: {
        type_in: ["wrap", "unwrap"],
        source: "v1_wrapper",
        timestamp_gt: $after
      },
      orderBy: "timestamp",
      orderDirection: "asc"
    ) {
      items { id type punk_id to from tx_hash timestamp }
    }
  }
`;

const fetchWraps = async (afterTimestamp, limit = 50) => {
    try {
        const data = await askPonder(WRAPS_QUERY, {
            after: String(afterTimestamp),
            limit,
        });
        const items = (data && data.events && data.events.items) || [];
        return items.map((row) => ({
            id: row.id,
            kind: row.type,
            tokenId: String(row.punk_id),
            to: row.to,
            from: row.from,
            txHash: row.tx_hash,
            timestamp: Number(row.timestamp),
        }));
    } catch (error) {
        console.error('fetchWraps failed:', error.message || error);
        return [];
    }
};

module.exports = {
    INDEXER_URL,
    WRAPPER_ADDRESS,
    MARKETPLACE,
    EVENT_SOURCE,
    EVENT_TYPE,
    askPonder,
    fetchListings,
    fetchSales,
    fetchWraps,
    weiToEth,
};
