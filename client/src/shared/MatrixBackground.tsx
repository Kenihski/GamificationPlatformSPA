
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import './MatrixBackground.css'

const characters = '01{}[]();<>/=#@$'
const fontSize = 16

interface MatrixColumn {
  y: number
  speed: number
  color: string
}

const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const isTakingChallenge = /^\/quiz\/\d+$/.test(location.pathname)

  const storageKey = isTakingChallenge
    ? 'matrix-challenge-animation-enabled'
    : 'matrix-animation-enabled'

  const [enabled, setEnabled] = useState(false)
  const [tooltipDismissed, setTooltipDismissed] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )

    const savedPreference = localStorage.getItem(storageKey)

    setEnabled(
      savedPreference === 'true' ||
      (savedPreference !== 'false' &&
        !isTakingChallenge &&
        !reducedMotion.matches)
    )

    const handleReducedMotionChange = () => {
      if (localStorage.getItem(storageKey) === null) {
        setEnabled(!isTakingChallenge && !reducedMotion.matches)
      }
    }

    reducedMotion.addEventListener('change', handleReducedMotionChange)

    return () => {
      reducedMotion.removeEventListener(
        'change',
        handleReducedMotionChange
      )
    }
  }, [storageKey, isTakingChallenge])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) return

    let animationId = 0
    let lastFrame = 0
    let columns: MatrixColumn[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const columnCount = Math.ceil(canvas.width / fontSize)

      columns = Array.from({ length: columnCount }, () => ({
        y: Math.random() * -canvas.height,
        speed: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#587cff' : '#a56aff',
      }))
    }

    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw)

      if (timestamp - lastFrame < 50) return

      lastFrame = timestamp

      context.fillStyle = 'rgba(7, 10, 25, 0.08)'
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.font = `${fontSize}px monospace`

      columns.forEach((column, index) => {
        const character =
          characters[Math.floor(Math.random() * characters.length)]

        context.fillStyle = column.color
        context.shadowColor = column.color
        context.shadowBlur = 8

        context.fillText(
          character,
          index * fontSize,
          column.y
        )

        context.shadowBlur = 0

        column.y += column.speed * fontSize

        if (column.y > canvas.height && Math.random() > 0.95) {
          column.y = -fontSize
        }
      })
    }

    const restartAnimation = () => {
      cancelAnimationFrame(animationId)
      lastFrame = 0

      context.clearRect(0, 0, canvas.width, canvas.height)

      if (enabled) {
        animationId = requestAnimationFrame(draw)
      }
    }

    const handleResize = () => {
      resizeCanvas()
      restartAnimation()
    }

    resizeCanvas()
    restartAnimation()

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [enabled])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTooltipDismissed(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const toggleAnimation = () => {
    const nextEnabled = !enabled

    setEnabled(nextEnabled)

    try {
      localStorage.setItem(storageKey, String(nextEnabled))
    } catch {
      // The toggle still works without browser storage.
    }
  }

  const action = enabled
    ? 'Pause background animation'
    : 'Enable background animation'

  return (
    <>
      {createPortal(
        <canvas
          ref={canvasRef}
          id="matrixBackground"
          aria-hidden="true"
        />,
        document.body
      )}

      <div
        ref={controlRef}
        className={`matrix-control ${
          tooltipDismissed ? 'tooltip-dismissed' : ''
        }`}
        onMouseEnter={() => setTooltipDismissed(false)}
        onFocusCapture={() => setTooltipDismissed(false)}
      >
        <button
          type="button"
          className="btn btn-outline-secondary matrix-toggle"
          onClick={toggleAnimation}
          aria-label={action}
          aria-controls="matrixBackground"
          aria-pressed={enabled}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d={
                enabled
                  ? 'M6 5h4v14H6zM14 5h4v14h-4z'
                  : 'M8 5v14l11-7z'
              }
            />
          </svg>
        </button>

        <span className="matrix-tooltip" aria-hidden="true">
          {action}
        </span>
      </div>
    </>
  )
}

export default MatrixBackground
