import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AchievementNotificationService from '../services/AchievementNotificationService'
import type { AchievementNotification } from '../types/AchievementNotification'
import './AchievementNotifications.css'

interface ToastProps {
  item: AchievementNotification
  onClose: (id: number, restoreFocus: boolean) => void
}

const AchievementToast = ({ item, onClose }: ToastProps) => {
  const [paused, setPaused] = useState(false)
  const [expiring, setExpiring] = useState(false)
  const [closing, setClosing] = useState(false)
  const remaining = useRef(8000)
  const lastResume = useRef<number | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (paused || closing) return

    const start = Date.now()
    lastResume.current = start
    const highlight = remaining.current > 4000
      ? window.setTimeout(() => setExpiring(true), remaining.current - 4000)
      : undefined
    const timeout = window.setTimeout(() => setClosing(true), remaining.current)

    return () => {
      window.clearTimeout(timeout)
      if (highlight !== undefined) window.clearTimeout(highlight)
      if (lastResume.current === start) {
        remaining.current = Math.max(0, remaining.current - (Date.now() - start))
        lastResume.current = null
      }
    }
  }, [paused, closing])

  useEffect(() => {
    if (!closing) return
    const restoreFocus = document.activeElement === closeButton.current
    const timer = window.setTimeout(() =>
      onClose(item.userAchievementId, restoreFocus), 300)
    return () => window.clearTimeout(timer)
  }, [closing, item.userAchievementId, onClose])

  return (
    <div
      className={[
        'achievement-notification',
        item.isGoal ? 'goal-notification' : '',
        expiring ? 'expiring' : '',
        closing ? 'closing' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false)
        }
      }}
    >
      <button
        ref={closeButton}
        type="button"
        className="achievement-notification-close"
        aria-label={`Close notification: ${item.name}`}
        onClick={() => setClosing(true)}
      >
        &times;
      </button>
      <div className="achievement-notification-content">
        <div className="achievement-notification-heading">
          {item.isGoal ? 'GOAL UNLOCKED!' : 'ACHIEVEMENT UNLOCKED!'}
        </div>
        <div className="achievement-notification-name">{item.name}</div>
        <div className="achievement-notification-description">
          {item.description}
        </div>
      </div>
      <div className="achievement-notification-points">
        <span>{item.isGoal ? 'GOAL' : `${item.points} AP`}</span>
      </div>
    </div>
  )
}

const AchievementNotifications = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [queue, setQueue] = useState<AchievementNotification[]>([])
  const [visibleCount, setVisibleCount] = useState(1)
  const [wide, setWide] = useState(() =>
    window.matchMedia('(min-width: 992px)').matches)
  const seenIds = useRef<Set<number>>(new Set())
  const queueRef = useRef<AchievementNotification[]>([])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 992px)')
    const onResize = () => setWide(media.matches)
    media.addEventListener('change', onResize)
    return () => media.removeEventListener('change', onResize)
  }, [])

  // Keep notification placement aligned below the actual responsive navbar.
  useEffect(() => {
    const navbar = document.querySelector<HTMLElement>('.site-navbar')
    if (!navbar) return
    const update = () => {
      document.documentElement.style.setProperty(
        '--site-navbar-height', `${navbar.getBoundingClientRect().height}px`)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(navbar)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--site-navbar-height')
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.roles.includes('Admin')) {
      seenIds.current.clear()
      queueRef.current = []
      setQueue([])
      setVisibleCount(1)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const items = await AchievementNotificationService.getUnseen()
        if (cancelled) return
        const fresh = items.filter((item) =>
          !seenIds.current.has(item.userAchievementId) &&
          !queueRef.current.some((existing) =>
            existing.userAchievementId === item.userAchievementId)
        )
        if (!fresh.length) return
        fresh.forEach((item) => seenIds.current.add(item.userAchievementId))
        setQueue((current) => [...current, ...fresh])
      } catch (error) {
        console.error('Could not load achievement notifications.', error)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [isAuthenticated, user?.username, user?.roles, location.pathname])

  // Introduce successive desktop notices at 2.5-second intervals.
  useEffect(() => {
    const allowed = wide ? 3 : 1
    if (visibleCount >= allowed || visibleCount >= queue.length) return
    const timer = window.setTimeout(() => setVisibleCount((count) =>
      Math.min(count + 1, allowed)), 2500)
    return () => window.clearTimeout(timer)
  }, [queue.length, visibleCount, wide])

  const onClose = async (id: number, restoreFocus: boolean) => {
    try {
      await AchievementNotificationService.markSeen(id)
    } catch (error) {
      console.error('Could not mark achievement notification as seen.', error)
    }
    setQueue((current) => current.filter((item) => item.userAchievementId !== id))
    setVisibleCount((count) => Math.max(1, count - 1))
    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>('.site-navbar .navbar-brand')
        target?.focus()
      })
    }
  }

  if (!queue.length) return null

  const active = queue.slice(0, Math.min(visibleCount, wide ? 3 : 1))

  return (
    <>
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {active.map((item) => `${item.name}: ${item.description}`).join('. ')}
      </div>
      <div className="achievement-notification-container">
        {active.map((item) => (
          <AchievementToast key={item.userAchievementId}
            item={item} onClose={(id, restoreFocus) => { void onClose(id, restoreFocus) }} />
        ))}
      </div>
    </>
  )
}

export default AchievementNotifications
