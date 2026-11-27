
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Container,
  Spinner,
} from 'react-bootstrap'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getSafeReturnUrl } from '../shared/returnUrl'
import ChallengeService from '../services/ChallengeService'
import QuestionService from '../services/QuestionService'
import usePageTitle from '../shared/usePageTitle'
import { getImageUrl } from '../shared/imageUrl'

const DeleteQuestionPage = () => {
  usePageTitle('Delete Question')
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
  const [searchParams] = useSearchParams()

  // Return to the page the user came from, as in Subapp 1.
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))

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

      navigate(returnUrl ?? `/challenges/${challengeId}?showQuestions=true`, {
        state: {
          // Deleting the last question of a published challenge unpublishes it.
          successMessage: challengeQuery.data?.isPublished && challengeQuery.data.questionCount === 1
            ? 'Question deleted. The challenge was automatically unpublished because it has no questions left. Previous attempts and scores were reset.'
            : 'Question deleted. Previous attempts and scores were reset.',
        },
      })
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

  const questionTypeLabel =
    question.questionType === 'MultipleChoice'
      ? 'Multiple Choice'
      : question.questionType === 'ShortAnswer'
        ? 'Short Answer'
        : 'Single Choice'

  return (
    <Container className="question-form-page management-page my-4">
      <h1 className="mb-4">Delete Question</h1>
      <p className="text-muted">Review the details and consequences before confirming deletion.</p>

      <Card className="border-danger">
        <Card.Body>
          <div className="mb-4">
            <h2 className="h4 card-title">{question.title}</h2>

            {question.description && (
              <p className="card-text">{question.description}</p>
            )}

            <p>
              <strong>Challenge:</strong> {challenge.title}
            </p>

            <p>
              <strong>Question Type:</strong> {questionTypeLabel}
            </p>

            <p>
              <strong>Points:</strong> {question.points}
            </p>

            {question.imageUrl && (
              <div className="mb-3">
                <strong>Image:</strong>
                <br />
                <img
                  src={getImageUrl(question.imageUrl)}
                  alt=""
                  className="img-fluid mt-2"
                  style={{ maxWidth: 250 }}
                />
              </div>
            )}

            <hr />

            {question.questionType === 'ShortAnswer' ? (
              <>
                <h3 className="h5">Accepted Answers</h3>
                {question.acceptedAnswers.map((answer, index) => (
                  <div key={index} className="mb-1">
                    ✓ <strong>{answer}</strong>
                  </div>
                ))}
              </>
            ) : (
              <>
                <h3 className="h5">Answer Options</h3>
                {question.options.map((option, index) => (
                  <div key={option.questionOptionId ?? index} className="mb-1">
                    {option.isCorrect ? (
                      <>
                        ✓ <strong>{option.text}</strong> (Correct)
                      </>
                    ) : (
                      <>○ {option.text}</>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          <Alert variant="danger">
            <p className="mb-2">
              <strong>Warning:</strong> This question will be permanently deleted.
              All attempts, submitted answers and scores for the entire challenge
              will also be permanently deleted, removing those results from the leaderboards.
            </p>
            {isLastPublishedQuestion && (
              <>
                <p className="mb-2"><strong>This is the last question in this published challenge.</strong></p>
                <p className="mb-2">Deleting it will automatically unpublish the challenge.</p>
              </>
            )}
            <p className="mb-0">Are you sure you want to delete this question?</p>
          </Alert>

          {deleteMutation.isError && (
            <Alert variant="danger" role="alert">
              Could not delete question: {deleteMutation.error.message}
            </Alert>
          )}

          <div className="d-flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline-danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Confirm deletion'}
            </Button>

            <Link
              to={returnUrl ?? `/challenges/${challengeId}`}
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

export default DeleteQuestionPage
