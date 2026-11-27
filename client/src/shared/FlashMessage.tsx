import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'

// Navigation state used to pass a one-time message to the next page.
export type FlashState = { successMessage?: string } | null

// Shows a success message passed through navigation state, like TempData
// and _FeedbackMessages in Subapp 1.
const FlashMessage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [message] = useState(
    () => (location.state as FlashState)?.successMessage ?? null
  )
  const messageRef = useRef<HTMLDivElement>(null)
  const handled = useRef(false)

  useEffect(() => {
    if (!message || handled.current) return
    handled.current = true

    // The page does not reload in the SPA, so move focus to the message
    // to make screen readers announce it.
    messageRef.current?.focus()

    // Clear the state so the message does not return on refresh or Back.
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [message, navigate, location.pathname, location.search])

  if (!message) return null

  return (
    <Alert ref={messageRef} tabIndex={-1} variant="success" role="status">
      {message}
    </Alert>
  )
}

export default FlashMessage
