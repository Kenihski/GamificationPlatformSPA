import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AuthModalContextType {
  showLogin: boolean
  showRegister: boolean
  registration: { username: string; from?: string } | null
  openLoginAfterRegistration: (username: string, from?: string) => void
  openLogin: () => void
  openRegister: () => void
  closeLogin: () => void
  closeRegister: () => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registration, setRegistration] = useState<{ username: string; from?: string } | null>(null)

  const openLogin = () => {
    setRegistration(null)
    setShowRegister(false)
    setShowLogin(true)
  }

  const openLoginAfterRegistration = (username: string, from?: string) => {
    setRegistration({ username, from })
    setShowRegister(false)
    setShowLogin(true)
  }

  const openRegister = () => {
    setRegistration(null)
    setShowLogin(false)
    setShowRegister(true)
  }

  const closeLogin = () => {
    setShowLogin(false)
    setRegistration(null)
  }
  const closeRegister = () => setShowRegister(false)

  return (
    <AuthModalContext.Provider
      value={{
        showLogin,
        showRegister,
        registration,
        openLoginAfterRegistration,
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
