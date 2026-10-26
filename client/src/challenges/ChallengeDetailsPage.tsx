
import { useQuery } from '@tanstack/react-query'
import { Alert, Badge, Card, Container, Spinner } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import ChallengeService from '../services/ChallengeService'
import './ChallengeDetailsPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`
}

const ChallengeDetailsPage = () => {
  const { id } = useParams()
  const challengeId = Number(id)
  const validId = Number.isInteger(challengeId) && challengeId > 0

  const {
    data: challenge,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => ChallengeService.getChallenge(challengeId),
    enabled: validId,
    retry: false,
  })

  if (!validId) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid challenge ID.</Alert>
        <Link to="/challenges">Back to Challenges</Link>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading challenge...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load challenge: {error.message}
        </Alert>
        <Link to="/challenges">Back to Challenges</Link>
      </Container>
    )
  }

  if (!challenge) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Challenge not found.</Alert>
      </Container>
    )
  }

  const imageUrl = getImageUrl(challenge.imageUrl)

  return (
    <Container className="challenge-details-page">
      <Link to="/challenges" className="btn btn-outline-primary mb-4">
        Back to Challenges
      </Link>

      <Card className="challenge-details-card">
        {imageUrl && (
          <Card.Img
            variant="top"
            src={imageUrl}
            alt={challenge.title}
            className="challenge-details-image"
          />
        )}

        <Card.Body>
          <Badge bg={challenge.isCore ? 'primary' : 'secondary'}>
            {challenge.isCore ? 'Core Challenge' : 'Community Challenge'}
          </Badge>

          <h1 className="mt-3">{challenge.title}</h1>

          <p className="challenge-details-description">
            {challenge.description}
          </p>

          <div className="challenge-details-stats">
            <div>
              <strong>Max Points</strong>
              <p>{challenge.maxPoints}</p>
            </div>

            <div>
              <strong>Time Limit</strong>
              <p>
                {challenge.timeLimitMinutes == null
                  ? 'No time limit'
                  : `${challenge.timeLimitMinutes} minutes`}
              </p>
            </div>
          </div>

          <Link
            to={`/quiz/${challenge.challengeId}`}
            className="btn btn-primary btn-lg"
          >
            Start Challenge
          </Link>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default ChallengeDetailsPage
