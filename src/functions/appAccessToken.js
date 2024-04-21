const { app } = require('@azure/functions');
const axios = require('axios');

app.http('appAccessToken', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const appToken = await axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        }, {
            headers: {
                'Content-Type': 'application/x-www.form-urlencoded'
            }
        });
        
        // authorization is returned access token is reerenced: data.data.access_token

        return {  };
    }
});
