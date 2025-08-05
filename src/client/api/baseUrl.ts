// Get the base URL for API calls
import { appPort } from '../../common/values'

export const getApiBaseUrl = (): string => {
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${appPort}`
  }
  // In production, use relative URLs
  return ''
}
