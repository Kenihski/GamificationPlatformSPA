
import { Card, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Challenge } from '../types/Challenge'

interface ChallengeGridProps {
  challenges: Challenge[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`
}

const ChallengeGrid = ({ challenges }: ChallengeGridProps) => {
  return (
    <Row xs={1} md={2} lg={3} className="g-4">
      {challenges.map((challenge) => (
        <Col key={challenge.challengeId}>
          <Link
            to={`/challenges/${challenge.challengeId}`}
            className="challenge-card-link"
          >
            <Card className="challenge-card">
              <div className="challenge-image-container">
                {getImageUrl(challenge.imageUrl) ? (
                  <Card.Img
                    src={getImageUrl(challenge.imageUrl)!}
                    alt={challenge.title}
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
                      className={`challenge-category ${
                        challenge.isCore ? 'core' : 'community'
                      }`}
                    >
                      {challenge.isCore ? 'CORE' : 'COMMUNITY'}
                    </span>

                    <h2 className="challenge-card-title">
                      {challenge.title}
                    </h2>
                  </div>

                  <div className="challenge-card-stats">
                    <span>{challenge.maxPoints} pts</span>
                    <span>{challenge.timeLimitMinutes} min</span>
                  </div>
                </div>

                <p className="challenge-card-description">
                  {challenge.description}
                </p>
              </Card.Body>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  )
}

export default ChallengeGrid
