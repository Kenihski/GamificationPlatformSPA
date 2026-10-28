import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { useAuth } from './AuthContext'

interface LoginFormProps {
  onSuccess: () => void
  modal?: boolean
}

const LoginForm = ({ onSuccess, modal = false }: LoginFormProps) => {
  const { login } = useAuth()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({ usernameOrEmail, password })
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3" controlId="loginUsername">
        <Form.Label>Username or email</Form.Label>
        <Form.Control
          type="text"
          value={usernameOrEmail}
          onChange={(event) => setUsernameOrEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="loginPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </Form.Group>

      <Button
        type="submit"
        variant="primary"
        className={modal ? 'w-100' : ''}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
    </Form>
  )
}

export default LoginForm
