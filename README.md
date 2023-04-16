A hastily implemented Slack chat bot for https://tryleap.ai/.

Copy .env.sample to .env and configure your slack app credentials and tryleap.ai api token.

This bot _only_ works on channels (not dms) and _must_ be invited to such channels.

To avoid exhausting your API credits, by default, it will use a dummy response.

Uncomment const result = await leap.generate.generateImage({ and comment the debug request for real API calls.