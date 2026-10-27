
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AchievementNotificationService from '../services/AchievementNotificationService'
import type { AchievementNotification } from '../types/AchievementNotification'
import './AchievementNotifications.css'

const AchievementNotifications = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  const [queue, setQueue] = useState<AchievementNotification[]>([])
  const [expiring, setExpiring] = useState(false)
  const [closing, setClosing] = useState(false)
  const [paused, setPaused] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const queueRef = useRef<AchievementNotification[]>([])
  const seenIds = useRef<Set<number>>(new Set())
  const closingRef = useRef(false)
  const activeId = queue[0]?.userAchievementId

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    if (!isAuthenticated || user?.roles.includes('Admin')) {
      queueRef.current = []
      seenIds.current.clear()
      setQueue([])
      return
    }

    let cancelled = false

    const loadNotifications = async () => {
      try {
        const notifications =
          await AchievementNotificationService.getUnseen()

        if (cancelled) return

        const newNotifications = notifications.filter(
          (notification) =>
            !seenIds.current.has(notification.userAchievementId) &&
            !queueRef.current.some(
              (item) =>
                item.userAchievementId === notification.userAchievementId
            )
        )

        if (newNotifications.length > 0) {
          newNotifications.forEach((item) =>
            seenIds.current.add(item.userAchievementId)
          )

          setQueue((current) => [...current, ...newNotifications])
        }
      } catch (error) {
        console.error('Could not load achievement notifications.', error)
      }
    }

    void loadNotifications()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.username, user?.roles, location.pathname])

  useEffect(() => {
    if (activeId === undefined) return

    setExpiring(false)
    setClosing(false)
    setPaused(false)
    closingRef.current = false

    const notification = queueRef.current.find(
      (item) => item.userAchievementId === activeId
    )

    if (notification) {
      setAnnouncement(
        `${notification.name}. ${notification.description}. ` +
        (notification.isGoal ? 'GOAL' : `${notification.points} AP`)
      )
    }

    const highlightTimer = window.setTimeout(() => {
      setExpiring(true)
    }, 4000)

    return () => window.clearTimeout(highlightTimer)
  }, [activeId])

  const closeNotification = async () => {
    if (closingRef.current || activeId === undefined) return

    closingRef.current = true
    setClosing(true)

    try {
      await AchievementNotificationService.markSeen(activeId)
    } catch (error) {
      console.error('Could not mark achievement notification as seen.', error)
    }

    window.setTimeout(() => {
      setQueue((current) => current.slice(1))
    }, 300)
  }

  useEffect(() => {
    if (activeId === undefined || paused || closing) return

    const timer = window.setTimeout(() => {
      void closeNotification()
    }, 8000)

    return () => window.clearTimeout(timer)
  }, [activeId, paused, closing])

  const notification = queue[0]

  if (!notification) return null

  return (
    <>
      <div
        id="achievement-announcement"
        className="visually-hidden"
        role="status"
        aria-atomic="true"
      >
        {announcement}
      </div>

      <div className="achievement-notification-container">
        <div
          key={notification.userAchievementId}
          className={[
            'achievement-notification',
            notification.isGoal ? 'goal-notification' : '',
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
            type="button"
            className="achievement-notification-close"
            aria-label={`Close notification: ${notification.name}`}
            onClick={() => void closeNotification()}
          >
            &times;
          </button>

          <div className="achievement-notification-content">
            <div className="achievement-notification-heading">
              {notification.isGoal
                ? 'GOAL UNLOCKED!'
                : 'ACHIEVEMENT UNLOCKED!'}
            </div>

            <div className="achievement-notification-name">
              {notification.name}
            </div>

            <div className="achievement-notification-description">
              {notification.description}
            </div>
          </div>

          <div className="achievement-notification-points">
            <span>
              {notification.isGoal
                ? 'GOAL'
                : `${notification.points} AP`}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default AchievementNotifications
