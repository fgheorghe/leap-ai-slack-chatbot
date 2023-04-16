const {App} = require("@slack/bolt");
const axios = require('axios');
const {Leap} = require('@leap-ai/sdk');
require("dotenv").config();

// Create Slack app.
// Copy .env.sample to .env and configure your slack app credentials and tryleap.ai api token.
// NOTE: This bot _only_ works on channels (not dms) and _must_ be invited to such channels.
// To avoid exhausting your API credits by default it will use a dummy response.
// Uncomment const result = await leap.generate.generateImage({ and comment the debug request for real API calls.
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

// Create Leap api client.
const leap = new Leap(process.env.LEAP_API_TOKEN);
leap.usePublicModel("sd-1.5");

// Start slack app.
(async () => {
    const port = 8000;
    // TODO: Use ngrok http 8000 for callback URLs to avoid these types of error messages:
    // /prompt failed with the error "dispatch_failed".
    await app.start(port);
    console.log(`Bot running.`);
})();

// Serves /prompt "prompt string" commands.
app.command("/prompt", async ({command, ack, say}) => {
    try {
        // Get prompt string.
        const prompt = command.text;

        // Send an ack response.
        console.log(`Prompt in: ${prompt}`);
        await say(`Your input prompt: ${prompt}`);

        // Issue request to leap. Uncomment the following lines to issue a real request.
        // const result = await leap.generate.generateImage({
        //     prompt
        // });

        // A debug response. Comment the following lines to issue a real request.
        const result = {
            data: {
                id: 'cf960ba7-6ed1-4773-908f-c3b3c61ac7ba',
                state: 'finished',
                prompt: 'a cat',
                negativePrompt: '',
                seed: 3340821524,
                width: 512,
                height: 512,
                numberOfImages: 1,
                steps: 30,
                weightsId: '8b1b897c-d66d-45a6-b8d7-8e32421d02cf',
                workspaceId: 'f56597bf-5b95-4cac-bc91-dc6d72e4e041',
                createdAt: '2023-04-16T00:34:31.176768+00:00',
                promptStrength: 7,
                images: [
                    {
                        id: '291ae064-adb5-464a-b8dc-4589e0d26be3',
                        uri: 'https://static.tryleap.ai/image-gen-cf960ba7-6ed1-4773-908f-c3b3c61ac7ba/generated_images/0.png',
                        createdAt: '2023-04-16 00:34:49.368062+00'
                    }
                ],
                modelId: '8b1b897c-d66d-45a6-b8d7-8e32421d02cf',
                upscalingOption: 'x1',
                sampler: 'euler_a',
                isDeleted: false
            }
        };

        // Only output text when we have results.
        if (result && result.data && result.data.images) {
            const imageCount = result.data.images.length;

            console.log(`Prompt returned: ${imageCount} image(s).`);
            say(`Results in for: ${imageCount} image(s).`);

            // Download each image and post it to slack.
            for (let i = 0; i < result.data.images.length; i++) {
                const url = result.data.images[i].uri;
                console.log(`Downloading: ${url}`);

                say(`Image ${i} url: ${url}`);

                // Generate a random 'filename'.
                const filename = Math.floor(Math.random() * 10000000) + ".png";

                // Issue a leap get request.
                const { data: file } = await axios({
                    url,
                    method: 'GET',
                    responseType: 'arraybuffer'
                });

                // Post to slack.
                await app.client.files.uploadV2({
                    filename,
                    file,
                    initial_comment: prompt,
                    channel_id: command.channel_id
                });
            }

            console.log('Done.');
            say("Done.");
        }
    } catch (error) {
        console.log("[-] Error: ");
        console.error(error);
    }

});
