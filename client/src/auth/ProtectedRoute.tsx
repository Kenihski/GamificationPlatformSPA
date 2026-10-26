
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Alert, Container } from 'react-bootstrap'
import { useAuth } from './AuthContext'

interface ProtectedRouteProps {
  requiredRole?: string
}

const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          You must be logged in to access this page.
        </Alert>
        <Navigate
          to="/"
          replace
          state={{ from: location }}
        />
      </Container>
    )
  }

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          You do not have permission to access this page.
        </Alert>
      </Container>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
