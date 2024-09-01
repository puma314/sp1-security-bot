# An experimental Github bot for security review

This is a proof of concept for a Github bot that uses OpenAI's GPT-4 to review pull requests for security vulnerabilities.

## Setup

Get an OpenAI API key and a Github personal access token to use for authentication.

### Testing locally

1. Clone the repository
2. Install dependencies with `yarn install`
3. Copy `.env.example` to `.env` and fill in the values
4. Run `yarn start` to start the server. This will start a local server on port 3000 & automatically restart on file changes.

Check that the server is properly running with

```bash
curl http://localhost:3000/
```

You can now test the bot like this with some sample data from a real Github webhook:

```bash
curl -X POST \
 -H "Content-Type: application/json" \
 -d "$(cat test.json)" \
 http://localhost:3000/
```

### Testing on Github

To test on Github, follow these steps:

1. Use Tailscale funnel to expose the server to the internet (alternatively you can use ngrok).
2. On your Github repo, go to Settings > Webhooks > Add webhook and configure the URL to your Tailscale IP address.
3. Configure the webhook to be trigged on pull request events.
4. Make a pull request to your repo (or edit an existing one), which should trigger the webhook.
5. Go to the "Recent Deliveries" tab on your Github repo to see the recent deliveries to your webhook for troubleshooting or debugging.

## Deploy as Github Application

To deploy the bot as a Github application, follow these steps:

1. Create a new Vercel project and link it to your Github repo. The `vercel.json` file will take care of the deployment. Make sure to set the environment variables in the Vercel project dashboard.
2. Create a new Github Application by logging into your account and going to `https://github.com/settings/apps` and clicking on "New GitHub App".
3. Configure the application by setting the homepage URL to your Vercel deployment URL and the callback URL to the same URL.
4. Generate a private key, which will download the private key file to your computer. Copy the contents (including the `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines) and paste it into the `GITHUB_PRIVATE_KEY` environment variable alongside the other required environment variables.
5. Test the bot locally by adding it as a Webook in your Github repo and making it use the Github Application authentication method.
6. Add environment variables to Vercel and add the bot to any repositories you want to use it on.
