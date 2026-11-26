import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import AuthService from '../services/AuthService'
import type { RegisterRequest } from '../types/Auth'

interface RegisterFormProps {
  onSuccess: (username: string) => void
  modal?: boolean
}

type FieldErrors = Partial<Record<keyof RegisterRequest, string[]>>

const validate = (data: RegisterRequest): FieldErrors => {
  const errors: FieldErrors = {}
  const add = (field: keyof RegisterRequest, message: string) => {
    (errors[field] ??= []).push(message)
  }
  const username = data.username.trim()
  const email = data.email.trim()

  if (!username) add('username', 'Username is required.')
  else if (username.length < 3 || username.length > 50)
    add('username', 'Username must be between 3 and 50 characters.')

  if (!email) add('email', 'Email is required.')
  else {
    if (!/^[^\s@]+@[^\s@]+$/.test(email))
      add('email', 'Please enter a valid email address.')
    if (email.length > 100)
      add('email', 'Email cannot be longer than 100 characters.')
  }

  if (!data.password.trim()) add('password', 'Password is required.')
  else {
    if (data.password.length < 6 || data.password.length > 100)
      add('password', 'Password must be between 6 and 100 characters.')
    if (!/[a-z]/.test(data.password))
      add('password', "Passwords must have at least one lowercase ('a'-'z').")
    if (!/[0-9]/.test(data.password))
      add('password', "Passwords must have at least one digit ('0'-'9').")
    if (username && username.toLowerCase() === data.password.toLowerCase())
      add('password', 'Username and password cannot be the same.')
  }

  if (!data.confirmPassword.trim())
    add('confirmPassword', 'Please confirm your password.')
  else if (data.password !== data.confirmPassword)
    add('confirmPassword', 'Passwords do not match.')

  return errors
}

const RegisterForm = ({ onSuccess, modal = false }: RegisterFormProps) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [invalidAttempts, setInvalidAttempts] = useState(0)
  const fieldErrors = submitted ? validate(formData) : {}
  const messages = Object.values(fieldErrors).flat()
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error) errorSummaryRef.current?.focus()
  }, [error])
  useEffect(() => {
    if (invalidAttempts > 0) errorSummaryRef.current?.focus()
  }, [invalidAttempts])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    setSubmitted(true)
    if (Object.keys(validate(formData)).length > 0) {
      setInvalidAttempts((count) => count + 1)
      return
    }

    setIsSubmitting(true)

    try {
      const username = formData.username.trim()

      await AuthService.register({
        ...formData,
        username,
        email: formData.email.trim(),
      })

      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      })

      setSubmitted(false)
      setInvalidAttempts(0)
      onSuccess(username)
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
    <Form noValidate onSubmit={handleSubmit}>
      <p className="text-secondary">All fields are required.</p>
      {(error || messages.length > 0) && (
        <Alert ref={errorSummaryRef} tabIndex={-1} variant="danger" role="alert">
          {error && <div>{error}</div>}
          {messages.length > 0 && (
            <ul className="mb-0">
              {messages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          )}
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
          isInvalid={Boolean(fieldErrors.username)}
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username
            ? 'registerUsernameHelp registerUsernameError'
            : 'registerUsernameHelp'}
          minLength={3}
          maxLength={50}
          required
        />
        {fieldErrors.username && (
          <Form.Control.Feedback type="invalid" id="registerUsernameError">
            {fieldErrors.username.map((message) => <div key={message}>{message}</div>)}
          </Form.Control.Feedback>
        )}
        <Form.Text id="registerUsernameHelp" className="text-secondary">Use 3 to 50 characters.</Form.Text>
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
          isInvalid={Boolean(fieldErrors.email)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email
            ? 'registerEmailHelp registerEmailError'
            : 'registerEmailHelp'}
          maxLength={100}
          required
        />
        {fieldErrors.email && (
          <Form.Control.Feedback type="invalid" id="registerEmailError">
            {fieldErrors.email.map((message) => <div key={message}>{message}</div>)}
          </Form.Control.Feedback>
        )}
        <Form.Text id="registerEmailHelp" className="text-secondary">Enter your email address (up to 100 characters).</Form.Text>
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
          isInvalid={Boolean(fieldErrors.password)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password
            ? 'registerPasswordHelp registerPasswordError'
            : 'registerPasswordHelp'}
          minLength={6}
          maxLength={100}
          required
        />
        {fieldErrors.password && (
          <Form.Control.Feedback type="invalid" id="registerPasswordError">
            {fieldErrors.password.map((message) => <div key={message}>{message}</div>)}
          </Form.Control.Feedback>
        )}
        <Form.Text id="registerPasswordHelp" className="text-secondary">Use 6 to 100 characters with a lowercase letter and a number. The password must differ from the username.</Form.Text>
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
          isInvalid={Boolean(fieldErrors.confirmPassword)}
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={fieldErrors.confirmPassword
            ? 'registerConfirmPasswordHelp registerConfirmPasswordError'
            : 'registerConfirmPasswordHelp'}
          required
        />
        {fieldErrors.confirmPassword && (
          <Form.Control.Feedback type="invalid" id="registerConfirmPasswordError">
            {fieldErrors.confirmPassword.map((message) => <div key={message}>{message}</div>)}
          </Form.Control.Feedback>
        )}
        <Form.Text id="registerConfirmPasswordHelp" className="text-secondary">Repeat the same password.</Form.Text>
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
