const {TwitterClient} = require('twitter-api-client');
const { twitter_api_key, twitter_api_secret, twitter_access_token, twitter_access_token_secret } = require('../config.json');

module.exports = {
    /**
     *
     * @param tweet
     * @returns {Promise<string>}
     */
    tweetSale: async function (tweet) {
        const twitterClient = new TwitterClient({
            apiKey: twitter_api_key,
            apiSecret: twitter_api_secret,
            accessToken: twitter_access_token,
            accessTokenSecret: twitter_access_token_secret
        });

        return await twitterClient.tweets.statusesUpdate({
            status: tweet
        }).then(response => {
            console.log("Tweeted!", response);
            return `https://twitter.com/v1salesbot/status/${response.id_str}`;
        }).catch(err => {
            console.error(err);
        });
    },
};