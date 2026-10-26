
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Container, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ChallengeService from '../services/ChallengeService'
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

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M12 7v14" />
    <path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1h-4a4 4 0 0 0-4 2 4 4 0 0 0-4-2H4a1 1 0 0 1-1-1Z" />
  </svg>
)

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4v3a4 4 0 0 0 4 4" />
    <path d="M17 6h3v3a4 4 0 0 1-4 4" />
  </svg>
)

const AwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    <path d="m12 5 1 2 2 .3-1.5 1.5.4 2.2-1.9-1-1.9 1 .4-2.2L9 7.3l2-.3z" />
  </svg>
)

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

interface FeatureCardProps {
  title: string
  description: string
  to: string
  color: 'blue' | 'purple'
  icon: React.ReactNode
}

const FeatureCard = ({
  title,
  description,
  to,
  color,
  icon,
}: FeatureCardProps) => (
  <Col md={6}>
    <Link to={to} className="home-feature-link">
      <Card className="home-feature-card h-100">
        <Card.Body>
          <div className="home-feature-top">
            <div className={`home-feature-icon home-feature-${color}`}>
              {icon}
            </div>
          </div>
          <h3 className="card-title">{title}</h3>
          <p className="card-text">{description}</p>
        </Card.Body>
      </Card>
    </Link>
  </Col>
)

const FeaturedChallenges = ({
  challenges,
}: {
  challenges: Challenge[]
}) => {
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
                <span className={`featured-badge ${
                  challenge.isCore
                    ? 'featured-badge-core'
                    : 'featured-badge-community'
                }`}>
                  {challenge.isCore
                    ? 'CORE CHALLENGE'
                    : 'COMMUNITY CHALLENGE'}
                </span>
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
              className="featured-carousel-prev"
              onClick={previous}
              aria-label="Previous featured challenge"
            >
              ‹
            </button>

            <button
              type="button"
              className="featured-carousel-next"
              onClick={next}
              aria-label="Next featured challenge"
            >
              ›
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

const HomePage = () => {
  const { user } = useAuth()

  const {
    data: challenges = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['challenges', 'All', ''],
    queryFn: () => ChallengeService.getChallenges('All', ''),
  })

  const featuredChallenges = challenges
    .filter((challenge) => challenge.isPublished)
    .slice(0, 5)

  return (
    <Container className="home-page">
      <section className="home-hero text-center">
        <p className="home-subtitle">
          LEARN • CHALLENGE • IMPROVE
        </p>

        <h1 className="display-4">
          Welcome to the Challenge Hub
        </h1>

        <p className="lead">
          Test your knowledge, complete challenges
          and track your progress.
        </p>

        <div className="home-hero-actions">
          <Link to="/challenges" className="btn btn-primary btn-lg">
            Browse Challenges
          </Link>

          {user ? (
            <Link
              to="/challenges/create"
              className="btn btn-outline-primary btn-lg"
            >
              Create Challenge
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-outline-primary btn-lg"
              disabled
            >
              Register
            </button>
          )}
        </div>
      </section>

      <section className="home-carousel-section">
        {isPending ? (
          <div role="status" className="py-5 text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading featured challenges...</p>
          </div>
        ) : isError ? (
          <p className="home-ranking-empty">
            Could not load featured challenges.
          </p>
        ) : (
          <FeaturedChallenges challenges={featuredChallenges} />
        )}
      </section>

      <section className="home-section">
        <Row className="g-4">
          <Col lg={6}>
            <Card className="home-ranking-card h-100">
              <Card.Body>
                <div className="home-ranking-header">
                  <div>
                    <p className="home-ranking-label">
                      COMPETE &amp; IMPROVE
                    </p>
                    <h2>Core Leaderboard</h2>
                  </div>
                  <span className="home-ranking-symbol" aria-hidden="true">
                    ⭐
                  </span>
                </div>

                <p className="home-ranking-empty">
                  Core Leaderboard results are not connected yet.
                </p>

                <Link
                  to="/leaderboard"
                  className="btn btn-outline-primary home-ranking-button"
                >
                  View Core Leaderboard
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="home-ranking-card h-100">
              <Card.Body>
                <div className="home-ranking-header">
                  <div>
                    <p className="home-ranking-label">
                      UNLOCK ACHIEVEMENTS
                    </p>
                    <h2>Hall of Fame</h2>
                  </div>
                  <span className="home-ranking-symbol" aria-hidden="true">
                    🏆
                  </span>
                </div>

                <p className="home-ranking-empty">
                  Hall of Fame results are not connected yet.
                </p>

                <Link
                  to="/hall-of-fame"
                  className="btn btn-outline-primary home-ranking-button"
                >
                  View Hall of Fame
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      <section
        className="home-section home-features"
        aria-labelledby="howItWorksTitle"
      >
        <h2 id="howItWorksTitle" className="mb-4">
          How It Works
        </h2>

        <Row className="g-4">
          <FeatureCard
            title="Core Challenges"
            description="Official challenges with individual leaderboards. Your first completed attempt also counts toward the overall Core Leaderboard."
            to="/challenges"
            color="blue"
            icon={<BookIcon />}
          />

          <FeatureCard
            title="Community Challenges"
            description="User-created challenges with individual leaderboards. Results do not affect the overall Core Leaderboard."
            to="/challenges"
            color="purple"
            icon={<UsersIcon />}
          />

          <FeatureCard
            title="Core Leaderboard"
            description="An overall ranking combining your results across Core Challenges, with scores normalized to 100 points per challenge."
            to="/leaderboard"
            color="purple"
            icon={<TrophyIcon />}
          />

          <FeatureCard
            title="Achievements & Hall of Fame"
            description="Unlock achievements to earn Achievement Points (AP). Your total AP determines your Hall of Fame ranking."
            to="/hall-of-fame"
            color="blue"
            icon={<AwardIcon />}
          />
        </Row>
      </section>
    </Container>
  )
}

export default HomePage
