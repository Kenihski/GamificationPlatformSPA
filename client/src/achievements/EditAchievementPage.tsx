
import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminAchievementService from '../services/AdminAchievementService'
import type { AchievementSaveRequest } from '../types/Achievement'
import './AchievementFormPages.css'

const EditAchievementPage = () => {
  const { id } = useParams()
  const achievementId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<AchievementSaveRequest | null>(null)

  const {
    data: achievement,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['admin-achievement', achievementId],
    queryFn: () => AdminAchievementService.getById(achievementId),
    enabled: Number.isInteger(achievementId) && achievementId > 0,
  })

  const updateMutation = useMutation({
    mutationFn: (data: AchievementSaveRequest) =>
      AdminAchievementService.update(achievementId, data),

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
          System goals cannot be edited.
        </Alert>
        <Link to="/admin/achievements" className="btn btn-outline-primary">
          Back
        </Link>
      </Container>
    )
  }

  const values: AchievementSaveRequest = form ?? {
    name: achievement.name,
    description: achievement.description,
    type: achievement.type,
    requirementValue: achievement.requirementValue,
    points: achievement.points,
    isActive: achievement.isActive,
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!values.name.trim() || !values.description.trim() || !values.type) {
      setError('Please complete all required fields.')
      return
    }

    if (values.requirementValue < 1) {
      setError('Requirement must be greater than zero.')
      return
    }

    if (values.type === 'ScorePercentage' && values.requirementValue > 100) {
      setError('Percentage requirements cannot exceed 100.')
      return
    }

    updateMutation.mutate(values)
  }

  return (
    <Container className="achievement-form-page mt-4 mb-5">
      <div className="mb-4">
        <h1>Edit Achievement</h1>
        <p className="text-muted">
          Update the achievement details and requirements.
        </p>
      </div>

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3" controlId="achievementName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                required
                maxLength={100}
                value={values.name}
                onChange={(event) =>
                  setForm({ ...values, name: event.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="achievementDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                required
                maxLength={500}
                value={values.description}
                onChange={(event) =>
                  setForm({ ...values, description: event.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="achievementType">
              <Form.Label>Requirement Type</Form.Label>
              <Form.Select
                required
                value={values.type}
                onChange={(event) =>
                  setForm({ ...values, type: event.target.value })
                }
              >
                <option value="ChallengesCompleted">Challenges Completed</option>
                <option value="ScorePercentage">Score Percentage</option>
                <option value="SecondAttemptImprovement">
                  Second Attempt Improvement
                </option>
                <option value="SameChallengeAttempts">
                  Same Challenge Attempts
                </option>
                <option value="ChallengesCreated">Challenges Created</option>
                <option value="CreatorUniqueParticipants">
                  Creator Unique Participants
                </option>
                <option value="ChallengeLeaderboardPosition">
                  Challenge Leaderboard Position
                </option>
                <option value="CoreLeaderboardPosition">
                  Core Leaderboard Position
                </option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="achievementRequirement">
              <Form.Label>Requirement</Form.Label>
              <Form.Control
                type="number"
                min={1}
                required
                value={values.requirementValue}
                onChange={(event) =>
                  setForm({
                    ...values,
                    requirementValue: Number(event.target.value),
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="achievementPoints">
              <Form.Label>Achievement Points</Form.Label>
              <Form.Select
                value={values.points}
                onChange={(event) =>
                  setForm({
                    ...values,
                    points: Number(event.target.value),
                  })
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="outline-warning"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>

              <Link
                to="/admin/achievements"
                className="btn btn-outline-primary"
              >
                Cancel
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default EditAchievementPage
