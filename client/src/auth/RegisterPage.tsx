import { Container } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import RegisterForm from './RegisterForm'
import { useAuthModal } from './AuthModalContext'
import usePageTitle from '../shared/usePageTitle'

interface RegisterLocationState {
  from?: string
}

const RegisterPage = () => {
  usePageTitle('Register')
  const navigate = useNavigate()
  const { openLoginAfterRegistration } = useAuthModal()
  const location = useLocation()
  const state = location.state as RegisterLocationState | null

  const handleSuccess = (username: string) => {
    const from = state?.from
    if (from?.startsWith('/') && !from.startsWith('//') && !from.includes('\\')) {
      navigate('/login', {
        replace: true,
        state: {
          from,
          username,
          message: 'Registration successful! Your account has been created. You can now log in.',
        },
      })
      return
    }

    navigate('/', { replace: true })
    openLoginAfterRegistration(username)
  }

  return (
    <Container className="auth-page management-page">
      <h1 className="h2 my-4">Register</h1>

      <RegisterForm onSuccess={handleSuccess} />

      <p className="mt-3">
        Already have an account?{' '}
        <Link to="/login" state={{ from: state?.from }}>
          Login here
        </Link>
      </p>
    </Container>
  )
}

export default RegisterPage
