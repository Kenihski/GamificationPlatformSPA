import { useQuery } from '@tanstack/react-query'
import { Alert, Container, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import HallOfFameService from '../services/HallOfFameService'
import './HallOfFamePage.css'

const HallOfFamePage = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['hall-of-fame'],
    queryFn: HallOfFameService.getAll,
  })

  return (
    <Container className="hall-of-fame-page mt-4 mb-5">
      <div className="mb-4">
        <h1>🏆 Hall of Fame</h1>
        <p className="text-muted">
          See how the community ranks based on Achievement Points.
        </p>
      </div>

      {isPending ? (
        <div className="text-center mt-5" role="status">
          <Spinner animation="border" />
          <p className="mt-2">Loading Hall of Fame...</p>
        </div>
      ) : isError ? (
        <Alert variant="danger">
          Could not load Hall of Fame.
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table hover className="align-middle hall-of-fame-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Milestone</th>
                <th>Achievements</th>
                <th>AP</th>
              </tr>
            </thead>

            <tbody>
              {data.users.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <strong>{user.rank}</strong>
                  </td>

                  <td>
                    <Link
                      to={`/hall-of-fame/users/${user.userId}/achievements`}
                      className="hall-of-fame-username text-decoration-none fw-semibold"
                    >
                      {user.username}
                    </Link>
                  </td>

                  <td>
                    <span className="me-1">{user.milestoneIcon}</span>
                    {user.milestoneName}
                  </td>

                  <td>{user.achievementCount}</td>

                  <td>
                    <strong>{user.achievementPoints}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {data.users.length === 0 && (
            <p className="text-muted mt-3">
              No users found.
            </p>
          )}
        </div>
      )}

      <Link
        to="/challenges"
        className="btn btn-outline-primary hall-of-fame-back-button mt-4"
      >
        Back to Challenges
      </Link>
    </Container>
  )
}

export default HallOfFamePage