import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AuthModalContextType {
  showLogin: boolean
  showRegister: boolean
  openLogin: () => void
  openRegister: () => void
  closeLogin: () => void
  closeRegister: () => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const openLogin = () => {
    setShowRegister(false)
    setShowLogin(true)
  }

  const openRegister = () => {
    setShowLogin(false)
    setShowRegister(true)
  }

  const closeLogin = () => setShowLogin(false)
  const closeRegister = () => setShowRegister(false)

  return (
    <AuthModalContext.Provider
      value={{
        showLogin,
        showRegister,
        openLogin,
        openRegister,
        closeLogin,
        closeRegister,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  )
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext)

  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }

  return context
}
