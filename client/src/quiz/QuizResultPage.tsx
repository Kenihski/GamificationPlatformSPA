import { useQuery } from '@tanstack/react-query'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import QuizService from '../services/QuizService'
import './QuizResultPage.css'

const QuizResultPage = () => {
  const { attemptId } = useParams()
  const id = Number(attemptId)
  const validId = Number.isInteger(id) && id > 0

  const { data: result, isPending, isError, error } = useQuery({
    queryKey: ['quiz-result', id],
    queryFn: () => QuizService.getAttemptResult(id),
    enabled: validId,
    retry: false,
  })

  if (!validId) {
    return <Container className="mt-4"><Alert variant="danger">Invalid attempt ID.</Alert></Container>
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading result...</p>
      </Container>
    )
  }

  if (isError || !result) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{isError ? `Could not load result: ${error.message}` : 'Result not found.'}</Alert>
      </Container>
    )
  }

  const duration = Math.max(0, Math.round(result.timeUsedSeconds))
  const formattedTime = `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`
  const completedAt = result.completedAt
    ? new Date(result.completedAt).toLocaleString('nb-NO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : '—'

  return (
    <Container className="quiz-result-page">
      <Link to={`/challenges/${result.challengeId}`} className="challenge-details-back">
        ← Back to Challenge
      </Link>

      <section className="quiz-result-header">
        <span className="quiz-result-label">ATTEMPT DETAILS</span>
        <h1>{result.challengeTitle}</h1>

        <div className="quiz-result-stats quiz-result-stats-four">
          <div className="quiz-result-stat">
            <span className="quiz-result-stat-label">Score</span>
            <strong>{result.score} / {result.maxPoints}</strong>
          </div>
          <div className="quiz-result-stat">
            <span className="quiz-result-stat-label">Time Used</span>
            <strong>{formattedTime}</strong>
          </div>
          <div className="quiz-result-stat">
            <span className="quiz-result-stat-label">Questions</span>
            <strong>{result.answers.length}</strong>
          </div>
          <div className="quiz-result-stat">
            <span className="quiz-result-stat-label">Completed</span>
            <strong>{completedAt}</strong>
          </div>
        </div>
      </section>

      {!result.showAnswers && (
        <div className="quiz-result-hidden-notice" role="status">
          <strong>Answers Hidden</strong>
          <p>
            The challenge creator has disabled answer review for this challenge.
            You can still view your overall score and points earned for each question.
          </p>
        </div>
      )}

      {result.answers.map((answer, index) => {
        const isAnswered = answer.questionType === 'ShortAnswer'
          ? Boolean(answer.textAnswer?.trim())
          : Boolean(answer.options?.some((option) => option.isSelected)) ||
            Boolean(answer.selectedOptionIds?.length)

        return (
          <section key={answer.questionId} className="quiz-result-question">
            <div className="quiz-question-heading">
              <span className="quiz-question-number">
                QUESTION {index + 1} OF {result.answers.length}
              </span>
              <span className="quiz-question-points">
                {answer.pointsEarned} / {answer.points} points
              </span>
            </div>

            <h2 className="quiz-question-title">{answer.questionTitle}</h2>
            {answer.questionDescription && (
              <p className="quiz-question-description">{answer.questionDescription}</p>
            )}
            {answer.imageUrl && (
              <img className="quiz-question-image" src={answer.imageUrl} alt="" />
            )}

            {result.showAnswers && (
              <>
                {answer.questionType === 'ShortAnswer' ? (
                  <div className="quiz-result-text-answer">
                    <span>Your Answer</span>
                    <div className="quiz-result-answer-value">
                      {answer.textAnswer?.trim() || 'Not answered'}
                    </div>
                  </div>
                ) : (
                  <div className="quiz-result-options">
                    {answer.options?.map((option) => (
                      <div
                        key={option.questionOptionId}
                        className={`quiz-result-option ${
                          option.isCorrect
                            ? 'quiz-result-option-correct'
                            : option.isSelected
                              ? 'quiz-result-option-selected'
                              : ''
                        }`}
                      >
                        <input
                          className="form-check-input"
                          type={answer.questionType === 'MultipleChoice' ? 'checkbox' : 'radio'}
                          checked={option.isSelected}
                          disabled
                          readOnly
                          aria-label={option.text}
                        />
                        <span className="quiz-result-option-text">{option.text}</span>
                        {option.isSelected && (
                          <span className="quiz-result-selected-label">Your answer</span>
                        )}
                        {option.isCorrect && (
                          <span className="quiz-result-correct-label">Correct answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="quiz-result-feedback">
                  <span className={`quiz-result-status ${
                    !isAnswered
                      ? 'quiz-result-status-unanswered'
                      : answer.isCorrect
                        ? 'quiz-result-status-correct'
                        : 'quiz-result-status-wrong'
                  }`}>
                    {!isAnswered ? 'Not answered' : answer.isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </span>

                  {answer.questionType === 'ShortAnswer' &&
                    answer.correctAnswers && answer.correctAnswers.length > 0 && (
                      <p className="quiz-result-correct-answer">
                        <strong>{answer.correctAnswers.length === 1 ? 'Correct answer:' : 'Correct answers:'}</strong>{' '}
                        {answer.correctAnswers.join(', ')}
                      </p>
                    )}

                  {answer.explanation && (
                    <div className="quiz-result-explanation">
                      <strong>Explanation</strong>
                      <p>{answer.explanation}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )
      })}

      <Link
        to={`/challenges/${result.challengeId}`}
        className="btn btn-outline-primary quiz-result-back-button"
      >
        Back to Challenge
      </Link>
    </Container>
  )
}

export default QuizResultPage
