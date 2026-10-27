import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Container, Spinner, Table } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import UserService from '../services/UserService'
import ChallengeService from '../services/ChallengeService'
import './AdminUsersPage.css'
import './AdminUserDetailsPage.css'

type ChallengeAction = 'delete' | 'publish' | 'unpublish'

const PAGE_SIZE = 12

const AdminUserDetailsPage = () => {
  const { id } = useParams()
  const userId = Number(id)
  const queryClient = useQueryClient()

  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null)
  const [historyPage, setHistoryPage] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-user-details', userId],
    queryFn: () => UserService.getUserDetails(userId),
    enabled: Number.isInteger(userId) && userId > 0,
  })

  const actionMutation = useMutation({
    mutationFn: async ({
      challengeId,
      action,
    }: {
      challengeId: number
      action: ChallengeAction
    }) => {
      switch (action) {
        case 'delete':
          return ChallengeService.deleteChallenge(challengeId)
        case 'publish':
          return ChallengeService.publishChallenge(challengeId)
        case 'unpublish':
          return ChallengeService.unpublishChallenge(challengeId)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-user-details', userId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['my-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
      ])
    },
    onError: (error: Error) => {
      setActionError(error.message)
    },
  })

  const handleAction = (challengeId: number, action: ChallengeAction) => {
    setActionError(null)
    actionMutation.mutate({ challengeId, action })
  }

  const handleDelete = (challengeId: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`)) {
      handleAction(challengeId, 'delete')
    }
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Invalid user ID.</Alert>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading user details...</p>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Could not load user details: {error?.message ?? 'User not found.'}
        </Alert>
        <Link to="/admin/users" className="btn btn-outline-primary">
          Back to Users
        </Link>
      </Container>
    )
  }

  const { user, createdChallenges, challengeHistory } = data
  const isAdmin = user.roles.includes('Admin')

  const pageCount = Math.ceil(challengeHistory.length / PAGE_SIZE)
  const currentPage = Math.min(historyPage, Math.max(0, pageCount - 1))

  const visibleHistory = challengeHistory.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  )

  const selectedChallenge =
    challengeHistory.find((challenge) => challenge.challengeId === selectedChallengeId)
    ?? challengeHistory[0]

  return (
    <Container className="admin-user-details py-4">
      <h2 className="my-4">{user.username}</h2>

      <div className="mb-4">
        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Role:</strong>{' '}
          <span
            className={`user-role-badge ${
              isAdmin ? 'user-role-admin' : 'user-role-member'
            }`}
          >
            {isAdmin ? 'Admin' : 'User'}
          </span>
        </p>
      </div>

      {actionError && (
        <Alert variant="danger" dismissible onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <h3 className="mt-4">Created Challenges</h3>

      {createdChallenges.length === 0 ? (
        <Alert variant="info">
          This user has not created any challenges.
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped className="align-middle users-table">
            <thead>
              <tr>
                <th scope="col">Challenge</th>
                <th scope="col" className="text-center">Questions</th>
                <th scope="col" className="text-center">Max Points</th>
                <th scope="col" className="text-center">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {createdChallenges.map((challenge) => {
                const isUpdating =
                  actionMutation.isPending &&
                  actionMutation.variables?.challengeId === challenge.challengeId

                return (
                  <tr key={challenge.challengeId}>
                    <td>{challenge.title}</td>
                    <td className="text-center">{challenge.questions}</td>
                    <td className="text-center">{challenge.maxPoints}</td>

                    <td className="text-center">
                      <span
                        className={`challenge-management-status ${
                          challenge.isPublished
                            ? 'challenge-management-status-published'
                            : 'challenge-management-status-draft'
                        }`}
                      >
                        {challenge.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex flex-nowrap gap-1 align-items-center my-challenges-actions">
                        <Link
                          to={`/challenges/${challenge.challengeId}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View
                        </Link>

                        <Link
                          to={`/challenges/${challenge.challengeId}/edit`}
                          className="btn btn-sm btn-outline-warning"
                        >
                          Edit
                        </Link>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={actionMutation.isPending}
                          onClick={() => handleDelete(challenge.challengeId, challenge.title)}
                        >
                          {isUpdating && actionMutation.variables?.action === 'delete'
                            ? 'Deleting...'
                            : 'Delete'}
                        </Button>

                        <Button
                          size="sm"
                          variant={challenge.isPublished ? 'outline-secondary' : 'outline-success'}
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            handleAction(
                              challenge.challengeId,
                              challenge.isPublished ? 'unpublish' : 'publish'
                            )
                          }
                        >
                          {isUpdating && actionMutation.variables?.action !== 'delete'
                            ? 'Updating...'
                            : challenge.isPublished
                              ? 'Unpublish'
                              : 'Publish'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      )}

      <h3 id="challengeHistoryHeading" className="mt-5 mb-4">
        Challenge History
      </h3>

      {challengeHistory.length === 0 ? (
        <Alert variant="info">
          This user has not completed any challenges yet.
        </Alert>
      ) : (
        <>
          <nav className="user-history-navigation" aria-labelledby="challengeHistoryHeading">
            <div className="user-history-navigation-grid">
              {visibleHistory.map((challenge) => (
                <button
                  key={challenge.challengeId}
                  type="button"
                  className={`user-history-nav-button ${
                    selectedChallenge.challengeId === challenge.challengeId ? 'active' : ''
                  }`}
                  aria-pressed={selectedChallenge.challengeId === challenge.challengeId}
                  onClick={() => setSelectedChallengeId(challenge.challengeId)}
                >
                  {challenge.challengeTitle}
                </button>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="user-history-pagination">
                <Button
                  variant="outline-primary"
                  disabled={currentPage === 0}
                  onClick={() => {
                    setHistoryPage(currentPage - 1)
                    setSelectedChallengeId(null)
                  }}
                >
                  Previous
                </Button>

                <span aria-live="polite">
                  Page {currentPage + 1} of {pageCount}
                </span>

                <Button
                  variant="outline-primary"
                  disabled={currentPage === pageCount - 1}
                  onClick={() => {
                    setHistoryPage(currentPage + 1)
                    setSelectedChallengeId(null)
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </nav>

          {(() => {
            const activeChallenge =
              visibleHistory.find((challenge) => challenge.challengeId === selectedChallengeId)
              ?? visibleHistory[0]

            return (
              <section className="user-history-card">
                <div className="user-history-card-header">
                  <h4>{activeChallenge.challengeTitle}</h4>
                  <span className="user-history-attempt-count">
                    {activeChallenge.attempts.length}{' '}
                    {activeChallenge.attempts.length === 1 ? 'attempt' : 'attempts'}
                  </span>
                </div>

                <div className="table-responsive">
                  <Table striped className="align-middle users-table mb-0">
                    <thead>
                      <tr>
                        <th scope="col">Status</th>
                        <th scope="col">Attempt</th>
                        <th scope="col">Time</th>
                        <th scope="col">Score</th>
                        <th scope="col">Completed</th>
                      </tr>
                    </thead>

                    <tbody>
                      {activeChallenge.attempts.map((attempt) => (
                        <tr key={attempt.challengeAttemptId}>
                          <td>
                            <strong>
                              {attempt.isBest && attempt.isLatest
                                ? 'BEST / LATEST'
                                : attempt.isBest
                                  ? 'BEST'
                                  : attempt.isLatest
                                    ? 'LATEST'
                                    : ''}
                            </strong>
                          </td>

                          <td>
                            <Link to={`/quiz/attempts/${attempt.challengeAttemptId}`}>
                              Attempt {attempt.attemptNumber}
                            </Link>
                          </td>

                          <td>{attempt.timeUsed ?? '-'}</td>
                          <td>
                            <strong>
                              {attempt.score} / {activeChallenge.maxPoints}
                            </strong>
                          </td>
                          <td>{attempt.completedAt ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </section>
            )
          })()}
        </>
      )}

      <Link to="/admin/users" className="btn btn-outline-primary mt-4">
        Back to Users
      </Link>
    </Container>
  )
}

export default AdminUserDetailsPage
