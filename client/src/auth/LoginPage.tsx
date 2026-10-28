import { Alert, Container } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import LoginForm from './LoginForm'

interface LoginLocationState {
  message?: string
  from?: string
}

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as LoginLocationState | null

  const handleLoginSuccess = () => {
    navigate(state?.from ?? '/challenges', { replace: true })
  }

  return (
    <Container className="auth-page">
      <h2>Login</h2>

      {state?.from && (
        <Alert variant="info">
          You must be logged in to access this page.
        </Alert>
      )}

      {state?.message && (
        <Alert variant="success">
          {state.message}
        </Alert>
      )}

      <LoginForm onSuccess={handleLoginSuccess} />

      <p className="mt-3">
        Don't have an account?{' '}
        <Link
          to="/register"
          state={{ from: state?.from }}
        >
          Register here
        </Link>
      </p>
    </Container>
  )
}

export default LoginPage
