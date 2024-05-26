const { app } = require('@azure/functions');
const crypto = require('crypto');

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
        const body = request.text();
        const bodyObject = JSON.parse(body);

        // Getting message and secret
        context.info("Message ID: " + messageId);
        context.info("Timestamp: " + timestamp);
        context.info("Request body: " + body);
        const message = `${messageId}${timestamp}${body}`;
        context.info("Message: " + message);
        let hmac = 'sha256=' + (crypto.createHmac('sha256', process.env.TWITCH_WEBHOOK_SECRET).update(message).digest('hex'));

        // Verifying signature
        const verify = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
        context.info("Verify: " + verify);

        // If not verified, returning 4xx error
        if (!verify) {
            context.error("Signature verification failed.");
            return { status: 403, body: "Signature verification failed." };
        }

        // Challenge and response (ping pong)
        context.info("Signature verified. Responding processing");
        if (messageType === 'webhook_callback_verification') {
            context.info("Challenge: " + bodyObject.challenge);
            return { body: bodyObject.challenge };
        } else if (messageType === 'revocation') {
            context.log("Subscription revoked: " + JSON.stringify(bodyObject.subscription.status));
            return { status: 204 };
        }

        // Check if notificaiton, if not, raise WTF flag
        if (messageType !== 'notification') {
            context.error("Unknown message type: " + messageType);
            return { status: 204, body: "Unknown message type." };
        }

        // Process notification, sending to other functions?
        
        return { body: `Function successfully ran` };
    }
});
