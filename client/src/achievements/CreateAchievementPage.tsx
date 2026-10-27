
import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Container, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import AdminAchievementService from '../services/AdminAchievementService'
import type { AchievementSaveRequest } from '../types/Achievement'
import './AchievementFormPages.css'

const CreateAchievementPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<AchievementSaveRequest>({
    name: '',
    description: '',
    type: '',
    requirementValue: 0,
    points: 5,
    isActive: true,
  })

  const createMutation = useMutation({
    mutationFn: AdminAchievementService.create,

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.description.trim() || !form.type) {
      setError('Please complete all required fields.')
      return
    }

    if (form.requirementValue < 1) {
      setError('Requirement must be greater than zero.')
      return
    }

    if (form.type === 'ScorePercentage' && form.requirementValue > 100) {
      setError('Percentage requirements cannot exceed 100.')
      return
    }

    createMutation.mutate(form)
  }

  return (
    <Container className="achievement-form-page mt-4 mb-5">
      <div className="mb-4">
        <h1>Create Achievement</h1>
        <p className="text-muted">
          Create a new achievement that users can unlock.
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
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
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
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="achievementType">
              <Form.Label>Requirement Type</Form.Label>
              <Form.Select
                required
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
              >
                <option value="">Select requirement type</option>
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
                value={form.requirementValue || ''}
                onChange={(event) =>
                  setForm({
                    ...form,
                    requirementValue: Number(event.target.value),
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="achievementPoints">
              <Form.Label>Achievement Points</Form.Label>
              <Form.Select
                value={form.points}
                onChange={(event) =>
                  setForm({ ...form, points: Number(event.target.value) })
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4" controlId="achievementIsActive">
              <Form.Check
                type="checkbox"
                label="Publish immediately"
                checked={form.isActive}
                onChange={(event) =>
                  setForm({ ...form, isActive: event.target.checked })
                }
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? 'Creating...'
                  : 'Create Achievement'}
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

export default CreateAchievementPage
