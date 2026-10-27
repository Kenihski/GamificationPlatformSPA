
import { useQuery } from '@tanstack/react-query'
import { Alert, Container, Spinner, Table } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import LeaderboardService from '../services/LeaderboardService'
import './ChallengeLeaderboardPage.css'

const formatTime = (seconds: number) => {
  if (seconds >= 60) {
    return `${Math.round(seconds / 60)} min`
  }

  return `${Math.round(seconds)} sec`
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ChallengeLeaderboardPage = () => {
  const { id } = useParams()
  const challengeId = Number(id)
  const validId = Number.isInteger(challengeId) && challengeId > 0

  const { data, isPending, isError } = useQuery({
    queryKey: ['challenge-leaderboard', challengeId],
    queryFn: () => LeaderboardService.getChallengeLeaderboard(challengeId),
    enabled: validId,
    retry: false,
  })

  if (!validId) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid challenge ID.</Alert>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading leaderboard...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load leaderboard.
        </Alert>
        <Link to={`/challenges/${challengeId}`}>
          Back to Challenge
        </Link>
      </Container>
    )
  }

  return (
    <Container className="leaderboard-page mt-4">
      <div className="leaderboard-page-header">
        <p className="leaderboard-page-label">
          COMPETE &amp; IMPROVE
        </p>

        <h1>🏆 Leaderboard</h1>

        <h4 className="mb-3">{data.title}</h4>

        <p className="leaderboard-page-description">
          Rankings are based on each user's first completed attempt
          in this challenge.
        </p>
      </div>

      {data.entries.length > 0 ? (
        <div className="leaderboard-table-container">
          <div className="table-responsive">
            <Table className="leaderboard-table align-middle">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Score</th>
                  <th>Time</th>
                  <th>Completed</th>
                </tr>
              </thead>

              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.userId}>
                    <td>
                      <div className="leaderboard-rank">
                        <span className="leaderboard-rank-number">
                          {entry.rank}
                        </span>

                        {entry.rank === 1 && (
                          <span className="leaderboard-medal" title="Gold">
                            🥇
                          </span>
                        )}

                        {entry.rank === 2 && (
                          <span className="leaderboard-medal" title="Silver">
                            🥈
                          </span>
                        )}

                        {entry.rank === 3 && (
                          <span className="leaderboard-medal" title="Bronze">
                            🥉
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="leaderboard-username">
                      {entry.username}
                    </td>

                    <td className="leaderboard-points">
                      {entry.score} / {data.maxPoints}
                    </td>

                    <td>{formatTime(entry.timeUsedSeconds)}</td>

                    <td>{formatDate(entry.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      ) : (
        <Alert variant="info">No scores yet.</Alert>
      )}

      <Link
        to={`/challenges/${challengeId}`}
        className="btn btn-outline-primary leaderboard-back-button mt-4"
      >
        Back to Challenge
      </Link>
    </Container>
  )
}

export default ChallengeLeaderboardPage
