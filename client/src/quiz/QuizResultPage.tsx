
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Card,
  Container,
  Spinner,
} from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import QuizService from '../services/QuizService'
import './QuizPage.css'

const QuizResultPage = () => {
  const { attemptId } = useParams()
  const id = Number(attemptId)
  const validId = Number.isInteger(id) && id > 0

  const {
    data: result,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['quiz-result', id],
    queryFn: () => QuizService.getAttemptResult(id),
    enabled: validId,
    retry: false,
  })

  if (!validId) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid attempt ID.</Alert>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading result...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load result: {error.message}
        </Alert>
      </Container>
    )
  }

  if (!result) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Result not found.</Alert>
      </Container>
    )
  }

  const percentage =
    result.maxPoints > 0
      ? Math.round((result.score / result.maxPoints) * 100)
      : 0

  const minutes = Math.floor(result.timeUsedSeconds / 60)
  const seconds = result.timeUsedSeconds % 60

  return (
    <Container className="quiz-page">
      <Card className="quiz-question-card mb-4">
        <Card.Body className="text-center">
          <h1 className="mb-3">Challenge Result</h1>
          <h2 className="h4 mb-4">{result.challengeTitle}</h2>

          <Badge bg="success">Completed</Badge>

          <div className="my-4">
            <div className="display-4 fw-bold">
              {result.score} / {result.maxPoints}
            </div>

            <p className="text-secondary mt-2">
              {percentage}% of available points
            </p>
          </div>

          <p>
            Time used: {minutes} min {seconds} sec
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
            <Link
              to={`/challenges/${result.challengeId}`}
              className="btn btn-primary"
            >
              Back to Challenge
            </Link>

            <Link to="/challenges" className="btn btn-outline-light">
              All Challenges
            </Link>
          </div>
        </Card.Body>
      </Card>

      <h2 className="h4 mb-3">Question Results</h2>

      {!result.showAnswers && (
        <Alert variant="info">
          Detailed answers are not available for this challenge.
        </Alert>
      )}

      {result.answers.map((answer, index) => (
        <Card
          key={answer.questionId}
          className="quiz-question-card mb-3"
        >
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">
                Question {index + 1}: {answer.questionTitle}
              </h3>

              <Badge bg={answer.isCorrect ? 'success' : 'danger'}>
                {answer.pointsEarned} / {answer.points} pts
              </Badge>
            </div>

            {answer.questionDescription && (
              <p className="text-secondary">
                {answer.questionDescription}
              </p>
            )}

            <p>
              <strong>Result: </strong>
              {answer.isCorrect ? 'Correct' : 'Incorrect'}
            </p>

            {result.showAnswers && (
              <>
                {answer.questionType === 'ShortAnswer' ? (
                  <p>
                    <strong>Your answer: </strong>
                    {answer.textAnswer || 'No answer'}
                  </p>
                ) : (
                  answer.options?.map((option) => (
                    <div key={option.questionOptionId} className="mb-2">
                      <Badge
                        bg={option.isCorrect ? 'success' : 'secondary'}
                        className="me-2"
                      >
                        {option.isCorrect ? 'Correct' : 'Option'}
                      </Badge>

                      {option.text}

                      {option.isSelected && (
                        <span className="ms-2 text-info">
                          (Selected)
                        </span>
                      )}
                    </div>
                  ))
                )}

                {answer.correctAnswers &&
                  answer.correctAnswers.length > 0 && (
                    <p className="mt-3">
                      <strong>Correct answer: </strong>
                      {answer.correctAnswers.join(', ')}
                    </p>
                  )}

                {answer.explanation && (
                  <Alert variant="info" className="mt-3 mb-0">
                    <strong>Explanation: </strong>
                    {answer.explanation}
                  </Alert>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      ))}
    </Container>
  )
}

export default QuizResultPage
