
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Container, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import AdminAchievementService from '../services/AdminAchievementService'
import './AchievementsPage.css'
import './AdminAchievementsPage.css'

interface PublishRequest {
  id: number
  isActive: boolean
}

const AdminAchievementsPage = () => {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    data: achievements = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-achievements'],
    queryFn: AdminAchievementService.getAll,
  })

  const publishMutation = useMutation({
    mutationFn: ({ id, isActive }: PublishRequest) =>
      isActive
        ? AdminAchievementService.unpublish(id)
        : AdminAchievementService.publish(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-achievements'],
      })
    },

    onError: (error: Error) => {
      setActionError(error.message)
    },
  })

  const handlePublish = (id: number, isActive: boolean) => {
    setActionError(null)
    publishMutation.mutate({ id, isActive })
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading achievements...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load achievements: {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="achievements-page achievement-admin-page mt-4 mb-5">
      <div className="achievement-header mb-4">
        <div className="achievement-header-top">
          <div>
            <h1 className="mb-2">Achievement Management</h1>
            <p className="mb-0 text-muted">
              Create and manage achievements available to users.
            </p>
          </div>

          <Link
            to="/admin/achievements/create"
            className="btn btn-primary"
          >
            Create Achievement
          </Link>
        </div>
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

      <div className="achievement-list achievement-admin-list">
        {achievements.map((achievement) => {
          const rowClass = achievement.isActive
            ? achievement.isGoal
              ? 'achievement-goal'
              : 'achievement-unlocked'
            : 'achievement-locked'

          const isUpdating =
            publishMutation.isPending &&
            publishMutation.variables?.id === achievement.achievementId

          return (
            <div
              key={achievement.achievementId}
              className={`achievement-row ${rowClass}`}
            >
              <div className="achievement-icon">
                {!achievement.isActive
                  ? '🔒'
                  : achievement.isGoal
                    ? '⭐'
                    : '🏆'}
              </div>

              <div className="achievement-content">
                <div className="achievement-name">
                  {achievement.name}
                </div>

                <div className="achievement-description">
                  {achievement.description}
                </div>

                <div className="achievement-admin-badges mt-2">
                  {achievement.isGoal ? (
                    <>
                      <span className="achievement-admin-badge achievement-admin-badge-goal">
                        System Goal
                      </span>

                      <span className="achievement-admin-badge achievement-admin-badge-requirement">
                        Requirement: {achievement.requirementValue}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={`achievement-admin-badge ${
                          achievement.isActive
                            ? 'achievement-admin-badge-published'
                            : 'achievement-admin-badge-unpublished'
                        }`}
                      >
                        {achievement.isActive
                          ? 'Published'
                          : 'Unpublished'}
                      </span>

                      <span className="achievement-admin-badge achievement-admin-badge-type">
                        {achievement.type}
                      </span>

                      <span className="achievement-admin-badge achievement-admin-badge-requirement">
                        Requirement: {achievement.requirementValue}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="achievement-admin-actions">
                {achievement.isGoal ? (
                  <div className="achievement-system-locked">
                    <span>🔒</span>
                    <span>SYSTEM</span>
                    <span>LOCKED</span>
                  </div>
                ) : (
                  <>
                    <Link
                      to={`/admin/achievements/${achievement.achievementId}/edit`}
                      className="btn btn-outline-warning btn-sm"
                    >
                      Edit
                    </Link>

                    <Button
                      size="sm"
                      variant={
                        achievement.isActive
                          ? 'outline-secondary'
                          : 'outline-success'
                      }
                      disabled={publishMutation.isPending}
                      onClick={() =>
                        handlePublish(
                          achievement.achievementId,
                          achievement.isActive
                        )
                      }
                    >
                      {isUpdating
                        ? 'Updating...'
                        : achievement.isActive
                          ? 'Unpublish'
                          : 'Publish'}
                    </Button>

                    <Link
                      to={`/admin/achievements/${achievement.achievementId}/delete`}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Delete
                    </Link>
                  </>
                )}
              </div>

              <div className="achievement-points">
                {achievement.isGoal ? (
                  <span className="achievement-goal-label">
                    GOAL
                  </span>
                ) : (
                  <>
                    <span className="achievement-points-number">
                      {achievement.points}
                    </span>
                    <span className="achievement-points-label">
                      AP
                    </span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export default AdminAchievementsPage
