
import AuthService from './AuthService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = AuthService.getToken()

  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please log in again.')
    }

    if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.')
    }

    throw new Error(`API request failed: ${response.status}`)
  }

  return response
}

export default apiFetch
