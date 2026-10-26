
export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  userId: number
  username: string
}

export interface AuthUser {
  userId: number
  username: string
  roles: string[]
}
