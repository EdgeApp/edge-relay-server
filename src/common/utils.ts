const REFRESH_RATE = 5000

export const snooze = async (ms: number): Promise<void> => {
  await new Promise((resolve: Function) => setTimeout(resolve, ms))
}

export const retryFetch = async (
  request: RequestInfo,
  init?: RequestInit,
  maxRetries: number = 5
): Promise<Response> => {
  let retries = 0
  let err: any

  while (retries++ < maxRetries) {
    try {
      const response = await fetch(request, init)
      return response
    } catch (e) {
      await snooze(REFRESH_RATE * retries)
    }
  }
  throw err
}
