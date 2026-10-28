
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Challenge } from '../types/Challenge'
import './HomePage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`
}

const PointsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)

interface FeaturedChallengesProps {
  challenges: Challenge[]
}

const FeaturedChallenges = ({ challenges }: FeaturedChallengesProps) => {
  const [activeIndex, setActiveIndex] = useState(0)

  if (challenges.length === 0) {
    return (
      <div className="featured-challenges">
        <h2 className="featured-challenges-title">Featured Challenges</h2>
        <div className="featured-challenges-empty">
          <p>No featured challenges available.</p>
        </div>
      </div>
    )
  }

  const index = activeIndex % challenges.length
  const challenge = challenges[index]
  const imageUrl = getImageUrl(challenge.imageUrl)

  const previous = () => {
    setActiveIndex((current) =>
      (current - 1 + challenges.length) % challenges.length
    )
  }

  const next = () => {
    setActiveIndex((current) => (current + 1) % challenges.length)
  }

  return (
    <div className="featured-challenges">
      <h2 className="featured-challenges-title">Featured Challenges</h2>

      <div className="featured-carousel">
        <div className="featured-carousel-frame">
          <div className="featured-challenge-card">
            <div className="featured-challenge-image">
              {imageUrl && <img src={imageUrl} alt="" />}
            </div>

            <div className="featured-challenge-content">
              <div className="featured-challenge-badges">
                <span
                  className={`featured-badge ${
                    challenge.isCore
                      ? 'featured-badge-core'
                      : 'featured-badge-community'
                  }`}
                >
                  {challenge.isCore ? 'CORE' : 'COMMUNITY'}
                </span>

                {challenge.isPopular && (
                  <span className="featured-badge featured-badge-popular">
                    ★ POPULAR
                  </span>
                )}
              </div>

              <h3 className="featured-challenge-name">
                {challenge.title}
              </h3>

              <p className="featured-challenge-description">
                {challenge.description}
              </p>

              <div className="featured-challenge-meta">
                <span>
                  <PointsIcon />
                  {challenge.maxPoints} points
                </span>

                <span>
                  <ClockIcon />
                  {challenge.timeLimitMinutes == null
                    ? 'Unlimited time'
                    : `${challenge.timeLimitMinutes} minutes`}
                </span>

                {!challenge.isCore && challenge.creatorUsername && (
                  <span>
                    <UserIcon />
                    Created by {challenge.creatorUsername}
                  </span>
                )}
              </div>

              <Link
                to={`/challenges/${challenge.challengeId}`}
                className="btn btn-primary featured-challenge-button"
              >
                View Challenge <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        {challenges.length > 1 && (
          <>
            <button
              type="button"
              className="featured-carousel-prev d-flex align-items-center justify-content-center"
              onClick={previous}
              aria-label="Previous featured challenge"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              className="featured-carousel-next d-flex align-items-center justify-content-center"
              onClick={next}
              aria-label="Next featured challenge"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              />
            </button>

            <div className="featured-carousel-indicators">
              {challenges.map((item, itemIndex) => (
                <button
                  key={item.challengeId}
                  type="button"
                  className={itemIndex === index ? 'active' : ''}
                  onClick={() => setActiveIndex(itemIndex)}
                  aria-label={`Show featured challenge ${itemIndex + 1}`}
                  aria-current={itemIndex === index ? 'true' : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FeaturedChallenges
