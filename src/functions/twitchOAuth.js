const { app } = require('@azure/functions');
const axios = require('axios');

app.http('twitchOAuth', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        context.info("Requesting Authorization from user...");
        const data = axios.post(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCH_CLIENT_ID}&redirect_uri=${TWITCH_OAUTH_REDIRECT}&scope=clips%3edit+user%3write%3chat+channel%3manage%3schedule+user%3write%3chat+user%3bot+channel%3manage%3broadcast`, {})
        context.log("Data: " + data);

        return { body: `Hello.  The function is done executing.` };
    }
});
