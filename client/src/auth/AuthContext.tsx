
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import AuthService from '../services/AuthService'
import type { AuthUser, LoginRequest } from '../types/Auth'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(
    AuthService.getCurrentUser
  )

  const login = async (credentials: LoginRequest) => {
    const response = await AuthService.login(credentials)

    AuthService.saveToken(response.token)
    setUser(AuthService.getCurrentUser())
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
