const { app } = require('@azure/functions');
const axios = require('axios');
const CosmosClient = require('@azure/cosmos').CosmosClient;

app.http('twitchOAuthRedirect', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    return: cosmosOutput,
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}" to valiadte oAuth tokens...`);

        context.log("Checking for errors...")
        if (request.query.get('error') || request.query.get('error_description')) {
            context.error(`Error: ${request.query.get('error')}, ${request.query.get('error_description')}`);
            //return { body: "Authorization denied. :("}
            return;
        }
        
        const code = request.query.get('code');
        const scope = request.query.get('scope');
        
        context.log("Requesting Access Token from Twitch using granted code...")
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
        context.log("Data of tokens: " + JSON.stringify(data.data));

        context.log("Validating token...");
        const tokenValidation = await axios.get(`https://id.twitch.tv/oauth2/validate`, {
            headers: {
                'Authorization': `OAuth ${data.data.access_token}`
            }
        });
        context.log("Token Validation: " + JSON.stringify(tokenValidation.data));
        
        if (tokenValidation.status !== 200) {
            context.error("Token validation failed.");
            return;
        }

        context.log('Token is valid. Adding account data to CosmosDB...')
        const accountData = {
            twitchUserId: tokenValidation.data.user_id,
            login: tokenValidation.data.login,
            access_token: data.data.access_token,
            refresh_token: data.data.refresh_token,
            scope: scope, 
            token_type: data.data.token_type
        };
        context.log("Account Data: " + JSON.stringify(accountData));

        
        // Connecting to DB client
        context.info("Connecting to Cosmos DB...")
        const client = await new CosmosClient(process.env.CosmosDbConnectionSetting);
        const database = await client.database('playdatesBot');
        const container = await database.container('twitchAuthorization');
        const dbResponse = await container.items.upsert(accountData);
        context.log("DB Response: " + JSON.stringify(dbResponse));

        return { status: 200, body: `Thank you for authorizing the BlingBot for the Twitch account: ${accountData.login}!`};
    }
});
