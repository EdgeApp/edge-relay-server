import cors from 'cors'
import express from 'express'
import path from 'path'

import { config } from '../config'
import { healthCheck, relayWebhook } from './webhookRelay'

const app = express()

// Enable CORS
app.use(cors())

// GitHub webhook relay endpoint with raw body parser
app.post(
  config.webhookPath,
  express.raw({ type: 'application/json', limit: '10mb' }),
  async (req, res): Promise<void> => {
    try {
      // Get the raw payload for signature verification
      const rawPayload = req.body.toString()

      // Parse the JSON payload
      let payload
      try {
        payload = JSON.parse(rawPayload)
      } catch (error) {
        console.error('Invalid JSON payload:', error)
        res.status(400).json({ error: 'Invalid JSON payload' })
        return
      }

      // Extract headers
      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          headers[key] = value
        } else if (Array.isArray(value)) {
          headers[key] = value[0] ?? ''
        }
      }

      // Log the incoming webhook
      console.log(
        `Received webhook: ${headers['x-github-event'] ?? 'unknown'} from ${headers['x-github-delivery'] ?? 'unknown'}`
      )

      // Relay the webhook to Jenkins
      const result = await relayWebhook(payload, headers, rawPayload)

      if (result.success) {
        console.log(
          `Successfully relayed webhook to Jenkins (status: ${result.statusCode ?? 'unknown'})`
        )
        res.status(200).json({
          message: 'Webhook successfully relayed to Jenkins',
          jenkinsStatus: result.statusCode,
          jenkinsResponse: result.jenkinsResponse
        })
      } else {
        console.error(
          `Failed to relay webhook: ${result.error ?? 'Unknown error'}`
        )
        res.status(result.statusCode ?? 500).json({
          error: 'Failed to relay webhook to Jenkins',
          details: result.error
        })
      }
    } catch (error) {
      console.error('Webhook processing error:', error)
      res.status(500).json({
        error: 'Internal server error while processing webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Parse JSON bodies for other endpoints
app.use(express.json({ limit: '10mb' }))

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const jenkinsHealthy = await healthCheck()

    res.status(jenkinsHealthy ? 200 : 503).json({
      status: jenkinsHealthy ? 'healthy' : 'unhealthy',
      relay: {
        targetUrl: config.targetJenkinsUrl,
        webhookPath: config.webhookPath,
        jenkins: jenkinsHealthy ? 'reachable' : 'unreachable'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

// Configuration info endpoint (without sensitive data)
app.get('/api/config', (req, res) => {
  res.json({
    webhookPath: config.webhookPath,
    targetJenkinsUrl: config.targetJenkinsUrl.replace(
      /\/\/[^@]*@/,
      '//***:***@'
    ), // Hide credentials
    hasWebhookSecret:
      config.githubWebhookSecret !== undefined &&
      config.githubWebhookSecret !== '',
    port: config.incomingPort
  })
})

// Legacy API endpoint (keeping for compatibility)
app.get('/api/template', async (req, res) => {
  try {
    res.json({ message: 'GitHub Webhook Relay Server is running' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch template data' })
  }
})

// Serve static files (if client is built)
app.use(express.static(path.join(__dirname, '../../dist')))

// Handle client-side routing for React app (if client exists)
app.get('*catchAll', (req, res) => {
  const indexPath = path.join(__dirname, '../../dist/index.html')
  res.sendFile(indexPath, err => {
    if (err !== null) {
      res.status(404).json({ error: 'Client app not found' })
    }
  })
})

const port = config.incomingPort

app.listen(port, () => {
  console.log(`GitHub Webhook Relay Server running at http://localhost:${port}`)
  console.log(`Webhook endpoint: http://localhost:${port}${config.webhookPath}`)
  console.log(`Target Jenkins URL: ${config.targetJenkinsUrl}`)
  console.log(`Health check: http://localhost:${port}/health`)
})
