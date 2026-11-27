
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import AccessDeniedPage from '../shared/AccessDeniedPage'

interface ProtectedRouteProps {
  requiredRole?: string
}

const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  }

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return <AccessDeniedPage />
  }

  return <Outlet />
}

export default ProtectedRoute
