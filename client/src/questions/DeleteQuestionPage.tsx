
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Container,
  Spinner,
} from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ChallengeService from '../services/ChallengeService'
import QuestionService from '../services/QuestionService'
import './QuestionFormPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageSource = (url: string) =>
  url.startsWith('http')
    ? url
    : `${apiBaseUrl}/${url.replace(/^\/+/, '')}`

const DeleteQuestionPage = () => {
  const { id, questionId: questionIdParam } = useParams()

  const challengeId = Number(id)
  const questionId = Number(questionIdParam)

  const validIds =
    Number.isInteger(challengeId) &&
    challengeId > 0 &&
    Number.isInteger(questionId) &&
    questionId > 0

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const challengeQuery = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => ChallengeService.getChallenge(challengeId),
    enabled: validIds,
    retry: false,
  })

  const questionQuery = useQuery({
    queryKey: ['question', challengeId, questionId],
    queryFn: () =>
      QuestionService.getQuestion(challengeId, questionId),
    enabled: validIds,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      QuestionService.deleteQuestion(challengeId, questionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['questions', challengeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['challenge', challengeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['my-challenges'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['challenges'],
        }),
      ])

      navigate(`/challenges/${challengeId}`)
    },
  })

  if (!validIds) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Invalid challenge or question ID.
        </Alert>
        <Link to="/my-challenges">Back to My Challenges</Link>
      </Container>
    )
  }

  if (challengeQuery.isPending || questionQuery.isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading question...</p>
      </Container>
    )
  }

  if (
    challengeQuery.isError ||
    questionQuery.isError ||
    !challengeQuery.data ||
    !questionQuery.data
  ) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Could not load the question.
        </Alert>
        <Link to={`/challenges/${challengeId}`}>
          Back to Challenge
        </Link>
      </Container>
    )
  }

  const challenge = challengeQuery.data
  const question = questionQuery.data

  const isLastPublishedQuestion =
    challenge.isPublished && challenge.questionCount === 1

  return (
    <Container className="question-form-page py-4">
      <h2 className="my-4">Delete Question</h2>

      <Alert variant="warning">
        <strong>Warning:</strong> Deleting this question will reset
        all previous attempts and scores for this challenge.
      </Alert>

      {isLastPublishedQuestion && (
        <Alert variant="warning">
          <strong>Note:</strong> This is the last question in a
          published challenge. Deleting it will automatically
          unpublish the challenge.
        </Alert>
      )}

      {deleteMutation.isError && (
        <Alert variant="danger" role="alert">
          Could not delete question: {deleteMutation.error.message}
        </Alert>
      )}

      <h4 className="mb-3">
        Are you sure you want to delete this question?
      </h4>

      <Card className="mb-4">
        <Card.Body>
          <dl className="row mb-0">
            <dt className="col-sm-3">Title</dt>
            <dd className="col-sm-9">{question.title}</dd>

            {question.description && (
              <>
                <dt className="col-sm-3">Description</dt>
                <dd className="col-sm-9">
                  {question.description}
                </dd>
              </>
            )}

            <dt className="col-sm-3">Challenge</dt>
            <dd className="col-sm-9">{challenge.title}</dd>

            <dt className="col-sm-3">Question Type</dt>
            <dd className="col-sm-9">
              {question.questionType === 'SingleChoice'
                ? 'Single Choice'
                : question.questionType === 'MultipleChoice'
                  ? 'Multiple Choice'
                  : 'Short Answer'}
            </dd>

            <dt className="col-sm-3">Points</dt>
            <dd className="col-sm-9">{question.points}</dd>

            {question.imageUrl && (
              <>
                <dt className="col-sm-3">Image</dt>
                <dd className="col-sm-9">
                  <img
                    src={getImageSource(question.imageUrl)}
                    alt="Question"
                    className="question-image-preview"
                  />
                </dd>
              </>
            )}

            <dt className="col-sm-3">
              {question.questionType === 'ShortAnswer'
                ? 'Accepted Answers'
                : 'Answer Options'}
            </dt>

            <dd className="col-sm-9">
              {question.questionType === 'ShortAnswer' ? (
                question.acceptedAnswers.length > 0 ? (
                  question.acceptedAnswers.map((answer, index) => (
                    <div key={index}>
                      ✓ <strong>{answer}</strong>
                    </div>
                  ))
                ) : (
                  <span className="text-muted">
                    No accepted answers.
                  </span>
                )
              ) : question.options.length > 0 ? (
                question.options.map((option, index) => (
                  <div key={option.questionOptionId ?? index}>
                    {option.isCorrect ? (
                      <>
                        ✓ <strong>{option.text}</strong>
                      </>
                    ) : (
                      <>○ {option.text}</>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-muted">
                  No answer options.
                </span>
              )}
            </dd>
          </dl>
        </Card.Body>
      </Card>

      <div className="d-flex gap-2">
        <Button
          variant="danger"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
        >
          {deleteMutation.isPending
            ? 'Deleting...'
            : 'Delete Question'}
        </Button>

        <Link
          to={`/challenges/${challengeId}`}
          className="btn btn-secondary"
        >
          Cancel
        </Link>
      </div>
    </Container>
  )
}

export default DeleteQuestionPage
