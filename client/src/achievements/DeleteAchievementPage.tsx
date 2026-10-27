
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminAchievementService from '../services/AdminAchievementService'
import './AdminAchievementsPage.css'
import './AchievementFormPages.css'

const DeleteAchievementPage = () => {
  const { id } = useParams()
  const achievementId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const {
    data: achievement,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['admin-achievement', achievementId],
    queryFn: () => AdminAchievementService.getById(achievementId),
    enabled: Number.isInteger(achievementId) && achievementId > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: () => AdminAchievementService.remove(achievementId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin-achievements'],
      })
      navigate('/admin/achievements')
    },

    onError: (error: Error) => {
      setError(error.message)
    },
  })

  if (!Number.isInteger(achievementId) || achievementId <= 0) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid achievement ID.</Alert>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading achievement...</p>
      </Container>
    )
  }

  if (isError || !achievement) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Could not load achievement.</Alert>
      </Container>
    )
  }

  if (achievement.isGoal) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          System goals cannot be deleted.
        </Alert>
        <Link to="/admin/achievements" className="btn btn-outline-primary">
          Back
        </Link>
      </Container>
    )
  }

  return (
    <Container className="achievement-form-page mt-4 mb-5">
      <div className="mb-4">
        <h1>Delete Achievement</h1>
        <p className="text-muted">
          Are you sure you want to delete this achievement?
        </p>
      </div>

      <Card className="border-danger">
        <Card.Body>
          <Card.Title as="h4">{achievement.name}</Card.Title>
          <Card.Text>{achievement.description}</Card.Text>

          <div className="achievement-admin-badges mb-3">
            <span className="achievement-admin-badge achievement-admin-badge-type">
              {achievement.type}
            </span>

            <span className="achievement-admin-badge achievement-admin-badge-requirement">
              Requirement: {achievement.requirementValue}
            </span>

            <span className="achievement-delete-points">
              {achievement.points} AP
            </span>
          </div>

          <Alert variant="danger">
            Deleting this achievement will also remove it from users who
            have already unlocked it.
          </Alert>

          {error && <Alert variant="danger">{error}</Alert>}

          <div className="d-flex gap-2">
            <Button
              variant="outline-danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                setError(null)
                deleteMutation.mutate()
              }}
            >
              {deleteMutation.isPending
                ? 'Deleting...'
                : 'Delete Achievement'}
            </Button>

            <Link
              to="/admin/achievements"
              className="btn btn-outline-primary"
            >
              Cancel
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default DeleteAchievementPage
