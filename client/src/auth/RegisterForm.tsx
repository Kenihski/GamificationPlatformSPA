import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import AuthService from '../services/AuthService'
import type { RegisterRequest } from '../types/Auth'

interface RegisterFormProps {
  onSuccess: () => void
  modal?: boolean
}

const RegisterForm = ({ onSuccess, modal = false }: RegisterFormProps) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (
      formData.username.trim().toLowerCase() ===
      formData.password.toLowerCase()
    ) {
      setError('Username and password cannot be the same.')
      return
    }

    setIsSubmitting(true)

    try {
      await AuthService.register({
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
      })

      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
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

      <Form.Group className="mb-3" controlId="registerUsername">
        <Form.Label>Username</Form.Label>
        <Form.Control
          type="text"
          value={formData.username}
          onChange={(event) =>
            setFormData({ ...formData, username: event.target.value })
          }
          autoComplete="username"
          minLength={3}
          maxLength={50}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="registerEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          value={formData.email}
          onChange={(event) =>
            setFormData({ ...formData, email: event.target.value })
          }
          autoComplete="email"
          maxLength={100}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="registerPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={formData.password}
          onChange={(event) =>
            setFormData({ ...formData, password: event.target.value })
          }
          autoComplete="new-password"
          minLength={6}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="registerConfirmPassword">
        <Form.Label>Confirm Password</Form.Label>
        <Form.Control
          type="password"
          value={formData.confirmPassword}
          onChange={(event) =>
            setFormData({
              ...formData,
              confirmPassword: event.target.value,
            })
          }
          autoComplete="new-password"
          required
        />
      </Form.Group>

    <Button
        type="submit"
        variant="primary"
        className={modal ? 'w-100' : ''}
        disabled={isSubmitting}
    >
        {isSubmitting ? 'Registering...' : 'Register'}
    </Button>
    </Form>
  )
}

export default RegisterForm
