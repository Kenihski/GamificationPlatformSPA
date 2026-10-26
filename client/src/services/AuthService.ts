
import { jwtDecode } from 'jwt-decode'
import type { AuthResponse, AuthUser, LoginRequest } from '../types/Auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const TOKEN_KEY = 'authToken'

interface JwtPayload {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[]
  exp?: number
}

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

const getCurrentUser = (): AuthUser | null => {
  const token = getToken()

  if (!token) return null

  try {
    const payload = jwtDecode<JwtPayload>(token)

    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }

    const roleClaim =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']

    const roles = roleClaim
      ? Array.isArray(roleClaim) ? roleClaim : [roleClaim]
      : []

    const userId = Number(
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
    )

    const username =
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? ''

    if (!Number.isInteger(userId) || userId <= 0) {
      return null
    }

    return { userId, username, roles }
  } catch {
    return null
  }
}

const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Invalid username/email or password.'
        : 'Login failed. Please try again.'
    )
  }

  return response.json() as Promise<AuthResponse>
}

const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
}

const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
}

const AuthService = {
  login,
  logout,
  getToken,
  saveToken,
  getCurrentUser,
}

export default AuthService
