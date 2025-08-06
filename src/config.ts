import { makeConfig } from 'cleaner-config'
import { asNumber, asObject, asOptional, asString } from 'cleaners'

export const asConfig = asObject({
  // Legacy config (keeping for compatibility)
  couchDbFullpath: asOptional(asString, 'http://admin:admin@127.0.0.1:5984'),

  // Webhook relay configuration
  incomingPort: asOptional(asNumber, 8008),
  targetJenkinsUrl: asString,
  webhookPath: asOptional(asString, '/webhook'),

  // GitHub webhook validation (optional)
  githubWebhookSecret: asOptional(asString)
})

export const config = makeConfig(asConfig, 'serverConfig.json')
