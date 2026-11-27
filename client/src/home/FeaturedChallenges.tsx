
import { useState } from 'react'
import { Carousel } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Challenge } from '../types/Challenge'
import './HomePage.css'
import { getImageUrl } from '../shared/imageUrl'

const PointsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5-4.9 7-1L12 2Z" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
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

// Users who ask for reduced motion get no automatic rotation.
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const FeaturedChallenges = ({ challenges }: FeaturedChallengesProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

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

  const hasSeveral = challenges.length > 1

  return (
    <div className="featured-challenges">
      <h2 className="featured-challenges-title">Featured Challenges</h2>

      {/* Bootstrap's carousel, as in Subapp 1. Rotation pauses while the mouse
          or keyboard focus is inside, so users can read and use the links. */}
      <Carousel
        className="featured-carousel"
        aria-label="Featured challenges"
        activeIndex={activeIndex % challenges.length}
        onSelect={(index) => setActiveIndex(index)}
        interval={paused || prefersReducedMotion() ? null : 5000}
        pause={false}
        controls={hasSeveral}
        indicators={hasSeveral}
        indicatorLabels={challenges.map((_, index) => `Go to challenge ${index + 1}`)}
        prevLabel="Previous challenge"
        nextLabel="Next challenge"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
        }}
      >
        {challenges.map((challenge, index) => {
          const imageUrl = getImageUrl(challenge.imageUrl)

          return (
            <Carousel.Item key={challenge.challengeId}>
              <div className="featured-challenge-card">
                <div className="featured-challenge-image">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  )}
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
                        : `${challenge.timeLimitMinutes} min`}
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
            </Carousel.Item>
          )
        })}
      </Carousel>
    </div>
  )
}

export default FeaturedChallenges
