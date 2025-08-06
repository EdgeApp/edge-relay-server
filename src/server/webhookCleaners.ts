import {
  asArray,
  asBoolean,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown
} from 'cleaners'

// GitHub webhook common fields
export const asGitHubUser = asObject({
  id: asNumber,
  login: asString,
  avatar_url: asString,
  html_url: asString
})

export const asGitHubRepository = asObject({
  id: asNumber,
  name: asString,
  full_name: asString,
  private: asBoolean,
  html_url: asString,
  clone_url: asString,
  ssh_url: asString,
  default_branch: asOptional(asString)
})

export const asGitHubCommit = asObject({
  id: asString,
  message: asString,
  timestamp: asString,
  url: asString,
  author: asObject({
    name: asString,
    email: asString,
    username: asOptional(asString)
  }),
  committer: asObject({
    name: asString,
    email: asString,
    username: asOptional(asString)
  })
})

// GitHub push webhook payload
export const asGitHubPushPayload = asObject({
  ref: asString,
  before: asString,
  after: asString,
  repository: asGitHubRepository,
  pusher: asGitHubUser,
  sender: asGitHubUser,
  commits: asArray(asGitHubCommit),
  head_commit: asOptional(asGitHubCommit),
  compare: asString,
  forced: asOptional(asBoolean),
  deleted: asOptional(asBoolean),
  created: asOptional(asBoolean)
})

// GitHub pull request webhook payload
export const asGitHubPullRequestPayload = asObject({
  action: asString, // opened, closed, synchronize, etc.
  number: asNumber,
  pull_request: asObject({
    id: asNumber,
    number: asNumber,
    state: asString,
    title: asString,
    body: asOptional(asString),
    html_url: asString,
    head: asObject({
      ref: asString,
      sha: asString,
      repo: asOptional(asGitHubRepository)
    }),
    base: asObject({
      ref: asString,
      sha: asString,
      repo: asGitHubRepository
    }),
    user: asGitHubUser,
    merged: asOptional(asBoolean)
  }),
  repository: asGitHubRepository,
  sender: asGitHubUser
})

// Generic GitHub webhook payload
export const asGitHubWebhookPayload = asObject({
  // Allow any payload structure but validate common headers separately
  repository: asOptional(asGitHubRepository),
  sender: asOptional(asGitHubUser),
  // Keep the rest as unknown for flexibility
  payload: asOptional(asUnknown)
})

// Webhook headers validation
export const asWebhookHeaders = asObject({
  'x-github-event': asOptional(asString),
  'x-github-delivery': asOptional(asString),
  'x-hub-signature-256': asOptional(asString),
  'user-agent': asOptional(asString),
  'content-type': asOptional(asString)
})

// Network request validation for outgoing calls
export const asRelayRequest = asObject({
  method: asString,
  url: asString,
  headers: asObject({}), // Allow any headers
  body: asOptional(asUnknown),
  timeout: asOptional(asNumber)
})
