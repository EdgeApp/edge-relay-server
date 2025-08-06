import crypto from 'crypto'

import { config } from '../config'
import { asRelayRequest, asWebhookHeaders } from './webhookCleaners'

interface RelayResponse {
  success: boolean
  statusCode?: number
  error?: string
  jenkinsResponse?: any
}

/**
 * Validates GitHub webhook signature if secret is configured
 */
const validateSignature = (payload: string, signature?: string): boolean => {
  const webhookSecret = config.githubWebhookSecret

  if (
    webhookSecret === undefined ||
    webhookSecret === '' ||
    signature === undefined ||
    signature === ''
  ) {
    // If no secret is configured, skip validation
    return webhookSecret === undefined || webhookSecret === ''
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload, 'utf8')
    .digest('hex')

  const expected = `sha256=${expectedSignature}`

  // Use timing-safe comparison
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

/**
 * Validates and cleans the incoming webhook headers
 */
const validateHeaders = (headers: Record<string, string>): any => {
  try {
    return asWebhookHeaders(headers)
  } catch (error) {
    throw new Error(
      `Invalid webhook headers: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validates the outgoing relay request
 */
const validateRelayRequest = (request: any): any => {
  try {
    return asRelayRequest(request)
  } catch (error) {
    throw new Error(
      `Invalid relay request: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Makes the actual HTTP request to Jenkins
 */
const makeRequest = async (request: any): Promise<any> => {
  // Using fetch for the HTTP request (Node 18+ built-in)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, request.timeout)

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body:
        request.body !== undefined ? JSON.stringify(request.body) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    let responseData
    try {
      responseData = await response.text()
      // Try to parse as JSON, fallback to text
      try {
        responseData = JSON.parse(responseData)
      } catch {
        // Keep as text if not valid JSON
      }
    } catch {
      responseData = null
    }

    return {
      status: response.status,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

/**
 * Forwards the webhook to Jenkins
 */
export const relayWebhook = async (
  payload: any,
  headers: Record<string, string>,
  rawPayload: string
): Promise<RelayResponse> => {
  try {
    // Validate headers
    const validatedHeaders = validateHeaders(headers)

    // Validate GitHub signature if secret is configured
    const signature = validatedHeaders['x-hub-signature-256']
    if (!validateSignature(rawPayload, signature)) {
      return {
        success: false,
        statusCode: 401,
        error: 'Invalid GitHub webhook signature'
      }
    }

    // Prepare the relay request
    const relayRequest = {
      method: 'POST',
      url: config.targetJenkinsUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': validatedHeaders['x-github-event'] ?? 'unknown',
        'X-GitHub-Delivery': validatedHeaders['x-github-delivery'] ?? '',
        'User-Agent': 'GitHub-Webhook-Relay/1.0'
      },
      body: payload,
      timeout: 30000 // 30 second timeout
    }

    // Validate the relay request
    const validatedRequest = validateRelayRequest(relayRequest)

    // Make the request to Jenkins
    const response = await makeRequest(validatedRequest)

    return {
      success: true,
      statusCode: response.status,
      jenkinsResponse: response.data
    }
  } catch (error) {
    console.error('Webhook relay error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Health check for the target Jenkins server
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const targetUrl = config.targetJenkinsUrl
    const baseUrl = targetUrl.replace('/github-webhook/', '/ping')
    const healthRequest = {
      method: 'GET',
      url: baseUrl !== '' ? baseUrl : targetUrl,
      headers: {},
      timeout: 5000
    }

    const response = await makeRequest(healthRequest)
    return response.status >= 200 && response.status < 400
  } catch {
    return false
  }
}
