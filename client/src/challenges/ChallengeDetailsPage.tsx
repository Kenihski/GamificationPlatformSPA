
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Container,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LoginForm from '../auth/LoginForm'
import ChallengeService from '../services/ChallengeService'
import QuestionService from '../services/QuestionService'
import QuizService from '../services/QuizService'
import './ChallengeDetailsPage.css'

type ManagementAction =
  | 'publish'
  | 'unpublish'
  | 'makeCore'
  | 'makeCommunity'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return null

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`
}

const ChallengeDetailsPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showQuestions, setShowQuestions] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [managementError, setManagementError] = useState<string | null>(null)

  const challengeId = Number(id)
  const validId = Number.isInteger(challengeId) && challengeId > 0

  const {
    data: challenge,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => ChallengeService.getChallenge(challengeId),
    enabled: validId,
    retry: false,
  })

  const isAdmin = user?.roles.includes('Admin') ?? false
  const isOwner =
    challenge != null &&
    user != null &&
    Number(user.userId) === challenge.createdByUserId

  const canManage = isAdmin || isOwner

  const {
    data: questions = [],
    isPending: questionsPending,
    isError: questionsError,
  } = useQuery({
    queryKey: ['questions', challengeId],
    queryFn: () => QuestionService.getQuestions(challengeId),
    enabled: validId && canManage,
    retry: false,
  })

  const {
    data: history = [],
    isPending: historyPending,
    isError: historyError,
  } = useQuery({
    queryKey: ['quiz-history', challengeId, user?.userId],
    queryFn: () => QuizService.getChallengeHistory(challengeId),
    enabled: validId && user != null,
    retry: false,
  })

  const managementMutation = useMutation({
    mutationFn: async (action: ManagementAction) => {
      switch (action) {
        case 'publish':
          await ChallengeService.publishChallenge(challengeId)
          break
        case 'unpublish':
          await ChallengeService.unpublishChallenge(challengeId)
          break
        case 'makeCore':
          await ChallengeService.makeCore(challengeId)
          break
        case 'makeCommunity':
          await ChallengeService.makeCommunity(challengeId)
          break
      }

      return action
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['challenge', challengeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['challenges'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['my-challenges'],
        }),
      ])
    },
    onError: (mutationError: Error) => {
      setManagementError(mutationError.message)
    },
  })

  const handleManagementAction = (action: ManagementAction) => {
    if (!challenge || managementMutation.isPending) return

    let confirmationMessage: string

    switch (action) {
      case 'publish':
        confirmationMessage = 'Are you sure you want to publish this challenge?'
        break
      case 'unpublish':
        confirmationMessage = 'Are you sure you want to unpublish this challenge?'
        break
      case 'makeCore':
        confirmationMessage = 'Are you sure you want to make this a Core Challenge?'
        break
      case 'makeCommunity':
        confirmationMessage = 'Are you sure you want to make this a Community Challenge?'
        break
    }

    if (!window.confirm(confirmationMessage)) return

    setManagementError(null)
    managementMutation.mutate(action)
  }

  if (!validId) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid challenge ID.</Alert>
        <Link to="/challenges">Back to Challenges</Link>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading challenge...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load challenge: {error.message}
        </Alert>
        <Link to="/challenges">Back to Challenges</Link>
      </Container>
    )
  }

  if (!challenge) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Challenge not found.</Alert>
      </Container>
    )
  }

  const imageUrl = getImageUrl(challenge.imageUrl)
  const hasQuestions = challenge.questionCount > 0
  const canTakeChallenge =
    hasQuestions && (challenge.isPublished || canManage)

  return (
    <>
      <Container className="challenge-details-page">
        <Link to="/challenges" className="challenge-details-back">
          <span aria-hidden="true">←</span> Back to Challenges
        </Link>

        <section
          className="challenge-details-overview"
          aria-labelledby="challengeDetailsTitle"
        >
          <div className="challenge-details-image">
            {imageUrl && <img src={imageUrl} alt="" />}
          </div>

          <div className="challenge-details-content">
            <div className="featured-challenge-badges">
              <span
                className={`featured-badge ${
                  challenge.isCore
                    ? 'featured-badge-core'
                    : 'featured-badge-community'
                }`}
              >
                {challenge.isCore ? 'CORE CHALLENGE' : 'COMMUNITY CHALLENGE'}
              </span>

              {!challenge.isPublished && (
                <span className="challenge-details-draft">DRAFT</span>
              )}
            </div>

            <h1 id="challengeDetailsTitle" className="challenge-details-title">
              {challenge.title}
            </h1>

            <p className="challenge-details-description">
              {challenge.description}
            </p>

            <div className="challenge-details-meta">
              <span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                {challenge.maxPoints} points
              </span>

              <span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {challenge.timeLimitMinutes == null
                  ? 'Unlimited time'
                  : `${challenge.timeLimitMinutes} minutes`}
              </span>

              {!challenge.isCore && challenge.creatorUsername && (
                <span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                  </svg>
                  Created by {challenge.creatorUsername}
                </span>
              )}
            </div>

            {!challenge.isPublished && canManage && hasQuestions && (
              <div className="challenge-details-notice">
                <strong>Unpublished Challenge</strong>
                <div>
                  This challenge is not published yet. You can take it to test
                  how it works before publishing.
                </div>
              </div>
            )}

            {!hasQuestions && canManage && (
              <div className="challenge-details-notice">
                Add at least one question before starting this challenge.
              </div>
            )}

            <div className="challenge-details-actions">
              {user && canTakeChallenge && (
                <Link
                  to={`/quiz/${challenge.challengeId}`}
                  className="btn btn-primary featured-challenge-button"
                >
                  {history.length > 0
                    ? 'Take Challenge Again'
                    : 'Start Challenge'}
                </Link>
              )}

              {!user && challenge.isPublished && hasQuestions && (
                <Button
                  variant="primary"
                  className="featured-challenge-button"
                  onClick={() => setShowLogin(true)}
                >
                  Log in to Start Challenge
                </Button>
              )}

              {(challenge.isPublished || canManage) && (
                <Link
                  to={`/challenges/${challengeId}/leaderboard`}
                  className="btn btn-outline-primary"
                >
                  View Leaderboard
                </Link>
              )}
            </div>

            {user && canTakeChallenge && history.length > 0 && !isOwner && (
              <p className="challenge-details-note">
                Only your first completed attempt counts toward the leaderboard.
              </p>
            )}
          </div>
        </section>

        {canManage && (
          <section className="challenge-details-panel mt-4">
            <h2 className="challenge-details-section-title">
              Challenge Management
            </h2>

            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-4">
              <div>
                <div className="mb-2">
                  <strong>Status: </strong>
                  <span
                    className={
                      challenge.isPublished
                        ? 'challenge-management-status challenge-management-status-published'
                        : 'challenge-management-status challenge-management-status-draft'
                    }
                  >
                    {challenge.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div>
                  <strong>Type: </strong>
                  <span
                    className={
                      challenge.isCore
                        ? 'featured-badge featured-badge-core challenge-table-badge'
                        : 'featured-badge featured-badge-community challenge-table-badge'
                    }
                  >
                    {challenge.isCore ? 'CORE' : 'COMMUNITY'}
                  </span>
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {isAdmin &&
                  (challenge.isCore ? (
                    <Button
                      className="my-challenges-type-button featured-badge-community"
                      disabled={managementMutation.isPending}
                      onClick={() => handleManagementAction('makeCommunity')}
                    >
                      Community
                    </Button>
                  ) : (
                    <Button
                      className="my-challenges-type-button featured-badge-core"
                      disabled={managementMutation.isPending}
                      onClick={() => handleManagementAction('makeCore')}
                    >
                      Core
                    </Button>
                  ))}

                {challenge.isPublished ? (
                  <Button
                    variant="outline-danger"
                    disabled={managementMutation.isPending}
                    onClick={() => handleManagementAction('unpublish')}
                  >
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    disabled={managementMutation.isPending || !hasQuestions}
                    onClick={() => handleManagementAction('publish')}
                  >
                    Publish
                  </Button>
                )}
              </div>
            </div>

            {managementError && (
              <Alert variant="danger" role="alert">
                {managementError}
              </Alert>
            )}

            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
              <Button
                variant="outline-primary"
                type="button"
                aria-expanded={showQuestions}
                aria-controls="questionOverview"
                onClick={() => setShowQuestions((previous) => !previous)}
              >
                Questions ({challenge.questionCount})
              </Button>

              <Link
                to={`/challenges/${challengeId}/questions/create`}
                className="btn btn-primary"
              >
                + Add Question
              </Link>
            </div>

            {showQuestions && (
              <div id="questionOverview">
                {questionsPending ? (
                  <div role="status">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading questions...</span>
                  </div>
                ) : questionsError ? (
                  <Alert variant="danger">
                    Could not load questions.
                  </Alert>
                ) : questions.length === 0 ? (
                  <Alert variant="info">
                    No questions have been added yet.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered className="align-middle">
                      <thead>
                        <tr>
                          <th>Question</th>
                          <th>Answer Options</th>
                          <th>Points</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {[...questions]
                          .sort((a, b) => a.questionId - b.questionId)
                          .map((question) => (
                            <tr key={question.questionId}>
                              <td>
                                <strong>{question.title}</strong>
                                {question.description && (
                                  <div className="text-muted small mt-1">
                                    {question.description}
                                  </div>
                                )}
                              </td>

                              <td>
                                {question.questionType === 'ShortAnswer'
                                  ? question.acceptedAnswers.map(
                                      (answer, index) => (
                                        <div key={index}>
                                          ✓ <strong>{answer}</strong>
                                        </div>
                                      )
                                    )
                                  : question.options.map((option) => (
                                      <div key={option.questionOptionId}>
                                        {option.isCorrect ? (
                                          <>
                                            ✓ <strong>{option.text}</strong>
                                          </>
                                        ) : (
                                          <>○ {option.text}</>
                                        )}
                                      </div>
                                    ))}
                              </td>

                              <td>{question.points}</td>

                              <td>
                                <div className="d-flex gap-2 flex-wrap">
                                  <Link
                                    to={`/challenges/${challengeId}/questions/${question.questionId}/edit`}
                                    className="btn btn-sm btn-outline-warning challenge-question-action"
                                  >
                                    Edit
                                  </Link>

                                  <Link
                                    to={`/challenges/${challengeId}/questions/${question.questionId}/delete`}
                                    className="btn btn-sm btn-outline-danger challenge-question-action"
                                  >
                                    Delete
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {user && (
          <section className="challenge-details-panel mt-4">
            <h2 className="challenge-details-section-title">Your History</h2>

            {historyPending ? (
              <div role="status">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Loading history...</span>
              </div>
            ) : historyError ? (
              <Alert variant="danger">
                Could not load your attempt history.
              </Alert>
            ) : history.length === 0 ? (
              <div className="challenge-history-empty">
                You have no previous attempts for this challenge.
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped className="align-middle">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Attempt</th>
                      <th>Time</th>
                      <th>Score</th>
                      <th>Completed</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((attempt) => (
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
                          <Link
                            to={`/quiz/attempts/${attempt.challengeAttemptId}`}
                          >
                            Attempt {attempt.attemptNumber}
                          </Link>
                        </td>

                        <td>{attempt.timeUsed}</td>

                        <td>
                          <strong>
                            {attempt.score} / {challenge.maxPoints}
                          </strong>
                        </td>

                        <td>
                          {attempt.completedAt
                            ? new Date(attempt.completedAt).toLocaleString(
                                'nb-NO',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </section>
        )}
      </Container>

      <Modal
        show={showLogin}
        onHide={() => setShowLogin(false)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <LoginForm onSuccess={() => setShowLogin(false)} />

          <p className="text-center mt-3 mb-0">
            Don't have an account?{' '}
            <span className="text-secondary">
              Registration coming soon.
            </span>
          </p>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default ChallengeDetailsPage
