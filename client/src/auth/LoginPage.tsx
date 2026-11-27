import { Alert, Container } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import LoginForm from './LoginForm'
import usePageTitle from '../shared/usePageTitle'

interface LoginLocationState {
  message?: string
  username?: string
  from?: string
}

const LoginPage = () => {
  usePageTitle('Login')
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as LoginLocationState | null

  const handleLoginSuccess = () => {
    const from = state?.from
    const destination = from?.startsWith('/') && !from.startsWith('//') && !from.includes('\\')
      ? from
      : '/challenges'
    navigate(destination, { replace: true })
  }

  return (
    <Container className="auth-page management-page">
      <h1 className="h2 my-4">Login</h1>

      {state?.message && (
        <Alert variant="success" role="status">
          {state.message}
        </Alert>
      )}

      {state?.from && (
        <Alert variant="info">
          You must be logged in to access this page.
        </Alert>
      )}

      <LoginForm onSuccess={handleLoginSuccess} initialUsername={state?.username ?? ''} />

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
