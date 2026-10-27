
import { useQuery } from '@tanstack/react-query'
import { Alert, Container, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import LeaderboardService from '../services/LeaderboardService'
import './ChallengeLeaderboardPage.css'

const formatTotalTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours >= 1) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

const CoreLeaderboardPage = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['core-leaderboard'],
    queryFn: LeaderboardService.getCoreLeaderboard,
    retry: false,
  })

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
          Could not load Core Leaderboard.
        </Alert>
        <Link to="/challenges">Back to Challenges</Link>
      </Container>
    )
  }

  return (
    <Container className="leaderboard-page mt-4">
      <div className="leaderboard-page-header">
        <p className="leaderboard-page-label">
          COMPETE &amp; IMPROVE
        </p>

        <h1>⭐ Core Leaderboard</h1>

        <p className="leaderboard-page-description">
          Rankings are based on your first completed attempt
          in each Core Challenge.
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
                  <th>Total Points</th>
                  <th>Core Completed</th>
                  <th>Total Time</th>
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
                          <span
                            className="leaderboard-medal"
                            title="Gold"
                          >
                            🥇
                          </span>
                        )}

                        {entry.rank === 2 && (
                          <span
                            className="leaderboard-medal"
                            title="Silver"
                          >
                            🥈
                          </span>
                        )}

                        {entry.rank === 3 && (
                          <span
                            className="leaderboard-medal"
                            title="Bronze"
                          >
                            🥉
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="leaderboard-username">
                      {entry.username}
                    </td>

                    <td className="leaderboard-points">
                      {entry.totalPoints.toLocaleString('en-US', {
                        maximumFractionDigits: 1,
                      })}
                    </td>

                    <td>{entry.coreChallengesCompleted}</td>

                    <td>{formatTotalTime(entry.totalTimeSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      ) : (
        <Alert variant="info">
          No leaderboard results yet.
        </Alert>
      )}

      <Link
        to="/challenges"
        className="btn btn-outline-primary leaderboard-back-button mt-4"
      >
        Back to Challenges
      </Link>
    </Container>
  )
}

export default CoreLeaderboardPage
