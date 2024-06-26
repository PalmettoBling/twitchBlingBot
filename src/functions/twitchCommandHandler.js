const { app } = require('@azure/functions');
const crypto = require('node:crypto');

app.http('twitchCommandHandler', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // Getting Headers and body from request
        // Body is also parsed into an object for reference
        const signature = request.headers.get('Twitch-Eventsub-Message-Signature').toLowerCase();
        const timestamp = request.headers.get('Twitch-Eventsub-Message-Timestamp').toLowerCase();
        const messageId = request.headers.get('Twitch-Eventsub-Message-Id').toLowerCase();
        const messageType = request.headers.get('Twitch-Eventsub-Message-Type').toLowerCase();
        const body = await request.text();

        const bodyObject = JSON.parse(body);

        // Getting message and secret
        context.info("Message ID: " + messageId);
        context.info("Timestamp: " + timestamp);
        context.info("Request body: " + body);
        context.info("Message Type: " + messageType);
        
        const message = messageId + timestamp + body;
        const hmac = 'sha256=' + (crypto.createHmac('sha256', process.env.TWITCH_WEBHOOK_SECRET).update(message).digest('hex'));
        context.log("HMAC: " + hmac);
        context.log("Signature: " + signature);
        context.log("Message: " + message);

        const verifyHmac = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
        context.log("Verify HMAC: " + verifyHmac);
        
        if (verifyHmac) {
            context.info("Message verified");

            if (messageType === 'webhook_callback_verification') {
                context.info("Webhook verification requested");
                return { status: 200, body: bodyObject.challenge, headers: { 'Content-Type': 'text/plain' } };
            }
            if (messageType === 'notification') {
                context.info("Notification received");
                // Process notification, sending to other functions?
            }
            if (messageType === 'revocation') {
                context.info("Subscription revoked");
                context.info(bodyObject.subscritpion.type + " notificaiton revoked.");
                context.info("Reason: " + bodyObject.subscritption.status);
                context.info("Condition: " + JSON.stringify(bodyObject.subscription.condition));
                // Handle subscription revocation
            }
        } else {
            context.error("Message could not be verified");
            return { status: 403, body: `Message could not be verified` };
        }  
        
        return { body: `Function successfully ran` };
    }
});
