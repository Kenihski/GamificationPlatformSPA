
import { Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Challenge } from '../types/Challenge'

interface ChallengeGridProps {
  challenges: Challenge[]
  completedChallengeIds: number[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`
}

const ChallengeGrid = ({
  challenges,
  completedChallengeIds,
}: ChallengeGridProps) => {
  const completedIds = new Set(completedChallengeIds)

  return (
    <Row xs={1} md={2} lg={3} className="g-4">
      {challenges.map((challenge) => {
        const imageUrl = getImageUrl(challenge.imageUrl)
        const isCompleted = completedIds.has(challenge.challengeId)

        return (
          <Col key={challenge.challengeId}>
            <Link
              to={`/challenges/${challenge.challengeId}`}
              className="challenge-card-link"
            >
              <Card className="challenge-card position-relative">
                {isCompleted && (
                  <div
                    className="completed-corner"
                    title="Completed"
                    aria-label="Challenge completed"
                  >
                    <span>✓</span>
                  </div>
                )}

                <div className="challenge-image-container">
                  {imageUrl ? (
                    <Card.Img
                      src={imageUrl}
                      alt=""
                      className="challenge-image"
                    />
                  ) : (
                    <div className="challenge-image-placeholder">
                      No image
                    </div>
                  )}
                </div>

                <Card.Body className="challenge-card-body">
                  <div className="challenge-card-main">
                    <div className="challenge-card-info">
                      <span
                        className={`featured-badge ${
                          challenge.isCore
                            ? 'featured-badge-core'
                            : 'featured-badge-community'
                        }`}
                      >
                        {challenge.isCore ? 'CORE' : 'COMMUNITY'}
                      </span>

                      <h2 className="challenge-card-title">
                        {challenge.title}
                      </h2>
                    </div>

                    <div className="challenge-card-stats">
                      <span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="m8 12 3 3 5-6" />
                        </svg>
                        {challenge.maxPoints} points
                      </span>

                      <span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {challenge.timeLimitMinutes == null
                          ? 'Unlimited'
                          : `${challenge.timeLimitMinutes} min`}
                      </span>
                    </div>
                  </div>

                  <p className="card-text challenge-card-description">
                    {challenge.description}
                  </p>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )
      })}
    </Row>
  )
}

export default ChallengeGrid
