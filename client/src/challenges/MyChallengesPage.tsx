
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Container,
  Spinner,
  Table,
} from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ChallengeService from '../services/ChallengeService'
import './MyChallengesPage.css'

type ChallengeAction =
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'make-core'
  | 'make-community'

interface ActionRequest {
  id: number
  action: ChallengeAction
}

const MyChallengesPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [actionError, setActionError] = useState<string | null>(null)

  const isAdmin = user?.roles.includes('Admin') ?? false

  const {
    data: challenges = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-challenges'],
    queryFn: ChallengeService.getMyChallenges,
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: ActionRequest) => {
      switch (action) {
        case 'delete':
          return ChallengeService.deleteChallenge(id)
        case 'publish':
          return ChallengeService.publishChallenge(id)
        case 'unpublish':
          return ChallengeService.unpublishChallenge(id)
        case 'make-core':
          return ChallengeService.makeCore(id)
        case 'make-community':
          return ChallengeService.makeCommunity(id)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenge'] }),
      ])
    },
    onError: (error: Error) => {
      setActionError(error.message)
    },
  })

  const handleAction = (id: number, action: ChallengeAction) => {
    setActionError(null)
    actionMutation.mutate({ id, action })
  }

  const handleDelete = (id: number, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    handleAction(id, 'delete')
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading your challenges...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load your challenges: {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="my-challenges-page py-4">
      <div className="my-4">
        <h1 className="fw-bold mb-1">My Challenges</h1>
        <p className="text-secondary mb-0">
          Manage your challenges, edit their content, and control
          their publication status.
        </p>
      </div>

      {actionError && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {challenges.length === 0 ? (
        <Alert variant="info">
          You have not created any challenges yet.
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped className="align-middle">
            <thead>
              <tr>
                <th>Challenge</th>
                <th className="text-center">Questions</th>
                <th className="text-center">Max Points</th>
                <th className="text-center">Status</th>
                {isAdmin && (
                  <th className="text-center">Type</th>
                )}
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {challenges.map((challenge) => {
                const isUpdating =
                  actionMutation.isPending &&
                  actionMutation.variables?.id === challenge.challengeId

                const isDeleting =
                  isUpdating &&
                  actionMutation.variables?.action === 'delete'

                return (
                  <tr key={challenge.challengeId}>
                    <td>{challenge.title}</td>

                    <td className="text-center">
                      {challenge.questionCount}
                    </td>

                    <td className="text-center">
                      {challenge.maxPoints}
                    </td>

                    <td className="text-center">
                      <span
                        className={
                          challenge.isPublished
                            ? 'challenge-management-status challenge-management-status-published'
                            : 'challenge-management-status challenge-management-status-draft'
                        }
                      >
                        {challenge.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="text-center">
                        <span
                          className={
                            challenge.isCore
                              ? 'featured-badge featured-badge-core challenge-table-badge'
                              : 'featured-badge featured-badge-community challenge-table-badge'
                          }
                        >
                          {challenge.isCore ? 'CORE' : 'COMMUNITY'}
                        </span>
                      </td>
                    )}

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
                          onClick={() =>
                            handleDelete(
                              challenge.challengeId,
                              challenge.title
                            )
                          }
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>

                        <Button
                          size="sm"
                          variant={
                            challenge.isPublished
                              ? 'outline-secondary'
                              : 'outline-success'
                          }
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            handleAction(
                              challenge.challengeId,
                              challenge.isPublished
                                ? 'unpublish'
                                : 'publish'
                            )
                          }
                        >
                          {isUpdating && !isDeleting
                            ? 'Updating...'
                            : challenge.isPublished
                              ? 'Unpublish'
                              : 'Publish'}
                        </Button>

                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            disabled={actionMutation.isPending}
                            onClick={() =>
                              handleAction(
                                challenge.challengeId,
                                challenge.isCore
                                  ? 'make-community'
                                  : 'make-core'
                              )
                            }
                          >
                            {challenge.isCore ? 'Community' : 'Core'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      )}

      <Link
        to="/challenges/create"
        className="btn btn-primary mt-3"
      >
        Create New Challenge
      </Link>
    </Container>
  )
}

export default MyChallengesPage
