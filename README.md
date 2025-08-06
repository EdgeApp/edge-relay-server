# GitHub Webhook Relay Server

A TypeScript Express server that relays GitHub webhooks to Jenkins servers. This server acts as a secure intermediary that validates incoming GitHub webhooks and forwards them to your internal Jenkins instance for triggering builds.

## Features

- 🔐 **Secure webhook validation** using GitHub webhook secrets
- 🚀 **High-performance relay** to Jenkins servers
- 📊 **Health monitoring** with status endpoints
- 🧹 **Input validation** using cleaners for network and file traffic
- 🔧 **Configurable** ports and target servers
- 📝 **Comprehensive logging** for debugging and monitoring

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure the Server

Update `serverConfig.json` with your settings:

```json
{
  "couchDbFullpath": "http://admin:admin@127.0.0.1:5984",
  "incomingPort": 8008,
  "targetJenkinsUrl": "http://your-jenkins-server:8080/github-webhook/",
  "webhookPath": "/webhook",
  "githubWebhookSecret": "your-github-webhook-secret-here"
}
```

#### Configuration Options

- `incomingPort`: Port for the relay server to listen on
- `targetJenkinsUrl`: Full URL to your Jenkins GitHub webhook endpoint
- `webhookPath`: Path where GitHub will send webhooks (default: `/webhook`)
- `githubWebhookSecret`: (Optional) Secret for validating GitHub webhook signatures
- `couchDbFullpath`: Legacy configuration (can be ignored for webhook relay)

### 3. Build and Start

```bash
# Build the TypeScript code
npm run build.server

# Start the server
npm start

# Or for development with auto-reload
npm run start.dev
```

## Usage

### Setting Up GitHub Webhooks

1. Go to your GitHub repository settings
2. Navigate to "Webhooks"
3. Click "Add webhook"
4. Set the payload URL to: `http://your-relay-server:8008/webhook`
5. Set content type to `application/json`
6. Add your webhook secret (if configured)
7. Select the events you want to trigger builds (typically "Push" and "Pull requests")

### Jenkins Configuration

Make sure your Jenkins server is configured to accept GitHub webhooks:

1. Install the "GitHub Plugin" in Jenkins
2. Configure your Jenkins job to trigger on GitHub webhook
3. Set the webhook URL in your job configuration

### Health Monitoring

The server provides several endpoints for monitoring:

- `GET /health` - Overall health status including Jenkins connectivity
- `GET /api/config` - Current configuration (sensitive data hidden)
- `GET /api/template` - Legacy endpoint for compatibility

Example health check response:
```json
{
  "status": "healthy",
  "relay": {
    "targetUrl": "http://your-jenkins-server:8080/github-webhook/",
    "webhookPath": "/webhook",
    "jenkins": "reachable"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Security Features

### Webhook Signature Validation

When a `githubWebhookSecret` is configured, the server validates incoming webhooks using HMAC-SHA256 signatures to ensure they're from GitHub.

### Input Validation

All incoming data is validated using the `cleaners` library:
- Webhook headers are validated for required GitHub fields
- Payload structure is verified
- Outgoing requests to Jenkins are validated
- Network traffic is sanitized

### Error Handling

- Invalid payloads are rejected with appropriate HTTP status codes
- Network errors are caught and logged
- Timeouts prevent hanging requests
- Sensitive information is masked in logs

## Development

### Available Scripts

- `npm run build.server` - Build server TypeScript code
- `npm run start` - Start production server
- `npm run start.dev` - Start development server with auto-reload
- `npm run lint` - Run ESLint
- `npm run fix` - Auto-fix ESLint issues
- `npm run clean` - Clean build artifacts

### Project Structure

```
src/
├── server/
│   ├── index.ts              # Main server application
│   ├── webhook-relay.ts      # Webhook relay service
│   └── webhook-cleaners.ts   # Input validation cleaners
├── config.ts                 # Configuration schema and loading
├── common/                   # Shared utilities
└── client/                   # React client (untouched)
```

### Linting

This project uses `eslint-config-standard-kit` for consistent code style:

```bash
npm run lint      # Check for issues
npm run fix       # Auto-fix issues
```

## Troubleshooting

### Common Issues

1. **"Invalid GitHub webhook signature"**
   - Check that your `githubWebhookSecret` matches the secret configured in GitHub
   - Ensure the webhook is sending the `X-Hub-Signature-256` header

2. **"Failed to relay webhook to Jenkins"**
   - Verify your `targetJenkinsUrl` is correct and accessible
   - Check Jenkins logs for any errors processing the webhook
   - Use the `/health` endpoint to test connectivity

3. **"Request timeout"**
   - Check network connectivity to Jenkins
   - Verify Jenkins is responding to requests
   - Consider increasing timeout in the webhook relay service

### Debugging

Enable verbose logging by checking the console output when running with `npm run start.dev`. The server logs:
- Incoming webhook events
- Relay attempts and responses
- Errors and warnings

## License

MIT License
