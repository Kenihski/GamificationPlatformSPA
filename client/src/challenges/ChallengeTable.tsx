
import { Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { Challenge } from '../types/Challenge'

interface ChallengeTableProps {
  challenges: Challenge[]
  completedChallengeIds: number[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://')
  ) {
    return imageUrl
  }

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`
}

const ChallengeTable = ({
  challenges,
  completedChallengeIds,
}: ChallengeTableProps) => {
  const { user } = useAuth()
  const completedIds = new Set(completedChallengeIds)

  return (
    <div className="table-responsive">
      <Table striped className="challenge-table align-middle">
        <thead>
          <tr>
            <th>Id</th>
            <th>Title</th>
            <th>Type</th>
            <th>Description</th>
            <th>Max Points</th>
            <th>Time Limit</th>
            {user && <th>Completed</th>}
            <th>Image</th>
          </tr>
        </thead>

        <tbody>
          {challenges.map((challenge) => {
            const imageUrl = getImageUrl(challenge.imageUrl)
            const isCompleted = completedIds.has(challenge.challengeId)

            return (
              <tr key={challenge.challengeId}>
                <td>{challenge.challengeId}</td>

                <td>
                  <Link to={`/challenges/${challenge.challengeId}`}>
                    {challenge.title}
                  </Link>
                </td>

                <td>
                  <span
                    className={`featured-badge challenge-table-badge ${
                      challenge.isCore
                        ? 'featured-badge-core'
                        : 'featured-badge-community'
                    }`}
                  >
                    {challenge.isCore ? 'CORE' : 'COMMUNITY'}
                  </span>
                </td>

                <td>{challenge.description}</td>

                <td>{challenge.maxPoints}</td>

                <td className="text-nowrap">
                  {challenge.timeLimitMinutes == null
                    ? 'Unlimited'
                    : `${challenge.timeLimitMinutes} minutes`}
                </td>

                {user && (
                  <td className="text-center">
                    {isCompleted ? (
                      <span
                        className="text-success fw-bold fs-4"
                        title="Completed"
                        aria-label="Completed"
                      >
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                )}

                <td>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      className="challenge-table-image"
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}

export default ChallengeTable
