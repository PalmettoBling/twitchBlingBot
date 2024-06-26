const { app } = require('@azure/functions');
const axios = require('axios');

app.http('twitchOAuth', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}" to oAuth twitch account`);

        return { status: 302, headers: { location: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${process.env.TWITCH_CLIENT_ID}&redirect_uri=${process.env.TWITCH_OAUTH_REDIRECT}&scope=clips%3Aedit+user%3Awrite%3Achat+channel%3Amanage%3Aschedule+user%3Awrite%3Achat+user%3Abot+channel%3Amanage%3Abroadcast` }};
    }
});
