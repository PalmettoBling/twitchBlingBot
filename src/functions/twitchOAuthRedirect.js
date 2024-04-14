const { app } = require('@azure/functions');
const axios = require('axios');

app.http('twitchOAuthRedirect', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        context.log("Checking for errors...")
        if (request.query.get('error') || request.query.get('error_description')) {
            context.error(`Error: ${request.query.get('error')}, ${request.query.get('error_description')}`);
            return { body: "Authorization denied. :("}
        }
        
        const code = request.query.get('code');
        const state = request.query.get('state');
        const scope = request.query.get('scope');
        
        context.log("Requesting Access Token from Twitch...")
        const data = await axios.post(`https://id.twitch.tv/oauth2/token`, {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.TWITCH_OAUTH_REDIRECT
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        //SEND INFORMATION TO STORE IN COSMOSDB

        return { body: `Hello, the script has finished executing!` };
    }
});
