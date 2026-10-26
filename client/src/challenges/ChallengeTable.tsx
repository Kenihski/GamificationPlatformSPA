
import { Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type { Challenge } from '../types/Challenge'

interface ChallengeTableProps {
  challenges: Challenge[]
}

const ChallengeTable = ({ challenges }: ChallengeTableProps) => {
  return (
    <div className="table-responsive">
      <Table striped hover className="challenge-table" variant="dark">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Max Points</th>
            <th>Time Limit</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {challenges.map((challenge) => (
            <tr key={challenge.challengeId}>
              <td>{challenge.title}</td>

              <td>
                <span
                  className={`challenge-category ${
                    challenge.isCore ? 'core' : 'community'
                  }`}
                >
                  {challenge.isCore ? 'CORE' : 'COMMUNITY'}
                </span>
              </td>

              <td>{challenge.maxPoints}</td>

              <td>{challenge.timeLimitMinutes} min</td>

              <td>
                <Link
                  to={`/challenges/${challenge.challengeId}`}
                  className="btn btn-sm btn-outline-primary"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default ChallengeTable
