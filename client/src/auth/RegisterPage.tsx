import { Link, useLocation, useNavigate } from 'react-router-dom'
import RegisterForm from './RegisterForm'

interface RegisterLocationState {
  from?: string
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as RegisterLocationState | null

  const handleSuccess = () => {
    navigate('/login', {
      replace: true,
      state: {
        from: state?.from,
        message: 'Registration successful. Please log in.',
      },
    })
  }

  return (
    <main className="container auth-page">
      <h2>Register</h2>

      <RegisterForm onSuccess={handleSuccess} />

      <p className="mt-3">
        Already have an account?{' '}
        <Link to="/login" state={{ from: state?.from }}>
          Login here
        </Link>
      </p>
    </main>
  )
}

export default RegisterPage
