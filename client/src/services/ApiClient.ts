
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

    // API validation errors are structured ProblemDetails objects.
    // Show meaningful validation messages without exposing server exception details.
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('json')) {
      const payload: unknown = await response.json().catch(() => null)
      if (payload && typeof payload === 'object') {
        const problem = payload as {
          title?: string
          detail?: string
          message?: string
          errors?: Record<string, string[]> | string[]
        }
        const fieldErrors = problem.errors
          ? Array.isArray(problem.errors)
            ? problem.errors
            : Object.values(problem.errors).flat()
          : []
        const message = fieldErrors.join(' ') ||
          problem.message || problem.detail || problem.title
        if (message) throw new Error(message)
      }
    }

    throw new Error(
      response.status >= 500
        ? 'Something went wrong on the server. Please try again later.'
        : `API request failed: ${response.status}`
    )
  }

  return response
}

export default apiFetch
