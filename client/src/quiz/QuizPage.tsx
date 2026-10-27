
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Container,
  Form,
  Spinner,
} from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QuizService from '../services/QuizService'
import ChallengeService from '../services/ChallengeService'
import type {
  QuizStartResponse,
  QuizSubmissionRequest,
} from '../types/Quiz'
import './QuizPage.css'

const QuizPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const challengeId = Number(id)
  const validId = Number.isInteger(challengeId) && challengeId > 0

  const { data: challenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => ChallengeService.getChallenge(challengeId),
    enabled: validId,
  })

  const [quiz, setQuiz] = useState<QuizStartResponse | null>(null)
  const [startError, setStartError] = useState('')
  const [isStarting, setIsStarting] = useState(true)

  const [answers, setAnswers] = useState<Record<number, number[]>>({})
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({})
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  const [completionType, setCompletionType] = useState<
    'submit' | 'exit' | null
  >(null)

  const completionStarted = useRef(false)
  const answersRef = useRef(answers)
  const textAnswersRef = useRef(textAnswers)

  useEffect(() => {
    answersRef.current = answers
    textAnswersRef.current = textAnswers
  }, [answers, textAnswers])

  useEffect(() => {
    if (!validId) return

    let active = true

    setIsStarting(true)
    setStartError('')

    QuizService.startQuiz(challengeId)
      .then((result) => {
        if (active) {
          setQuiz(result)
          setIsStarting(false)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStartError(
            error instanceof Error
              ? error.message
              : 'Could not start challenge.'
          )
          setIsStarting(false)
        }
      })

    return () => {
      active = false
    }
  }, [challengeId, validId])

  const {
    mutate: submitQuiz,
    isPending: isSubmitting,
    isError: submitFailed,
    error: submitError,
  } = useMutation({
    mutationFn: (submission: QuizSubmissionRequest) =>
      QuizService.submitQuiz(challengeId, submission),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ['completed-challenges'],
      })

      navigate(`/quiz/attempts/${result.challengeAttemptId}`, {
        replace: true,
      })
    },
    onError: () => {
      completionStarted.current = false
      setCompletionType(null)
    },
  })

  const {
    mutate: exitQuiz,
    isPending: isExiting,
    isError: exitFailed,
    error: exitError,
  } = useMutation({
    mutationFn: (submission: QuizSubmissionRequest) =>
      QuizService.exitQuiz(challengeId, submission),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['completed-challenges'],
      })

      navigate(`/challenges/${challengeId}`, {
        replace: true,
      })
    },
    onError: () => {
      completionStarted.current = false
      setCompletionType(null)
    },
  })

  const completeQuiz = (type: 'submit' | 'exit') => {
    if (!quiz || completionStarted.current) return

    completionStarted.current = true
    setCompletionType(type)

    const submission: QuizSubmissionRequest = {
      challengeAttemptId: quiz.challengeAttemptId,
      answers: answersRef.current,
      textAnswers: textAnswersRef.current,
    }

    if (type === 'exit') {
      exitQuiz(submission)
    } else {
      submitQuiz(submission)
    }
  }

  useEffect(() => {
    if (!quiz || quiz.timeLimitMinutes == null) {
      setRemainingSeconds(null)
      return
    }

    const startedAt = new Date(quiz.startedAt).getTime()
    const deadline = startedAt + quiz.timeLimitMinutes * 60_000

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      )

      setRemainingSeconds(remaining)
    }

    updateTimer()

    const interval = window.setInterval(updateTimer, 1000)

    return () => window.clearInterval(interval)
  }, [quiz])

  useEffect(() => {
    if (remainingSeconds !== 0 || !quiz || completionStarted.current) {
      return
    }

    completeQuiz('submit')
  }, [remainingSeconds, quiz])

  const handleSingleChoice = (questionId: number, optionId: number) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: [optionId],
    }))
  }

  const handleMultipleChoice = (
    questionId: number,
    optionId: number,
    checked: boolean
  ) => {
    setAnswers((previous) => {
      const selected = previous[questionId] ?? []

      return {
        ...previous,
        [questionId]: checked
          ? [...selected.filter((id) => id !== optionId), optionId]
          : selected.filter((id) => id !== optionId),
      }
    })
  }

  const handleTextAnswer = (questionId: number, value: string) => {
    setTextAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }))
  }

  const handleSubmit = () => {
    completeQuiz('submit')
  }

  const handleExit = () => {
    if (!quiz || completionStarted.current) return

    const confirmed = window.confirm(
      'Are you sure you want to exit? Your current answers will be submitted.'
    )

    if (confirmed) {
      completeQuiz('exit')
    }
  }

  if (!validId) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid challenge ID.</Alert>
        <Link to="/challenges">Back to Challenges</Link>
      </Container>
    )
  }

  if (isStarting) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Starting challenge...</p>
      </Container>
    )
  }

  if (startError || !quiz) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not start challenge: {startError}
        </Alert>
        <Link to={`/challenges/${challengeId}`}>
          Back to Challenge
        </Link>
      </Container>
    )
  }

  const isCompleting =
    isSubmitting ||
    isExiting ||
    completionType !== null

  const totalPoints = quiz.questions.reduce(
    (total, question) => total + question.points,
    0
  )

  return (
    <Container className="quiz-page quiz-take-page">
      <section className="quiz-take-header">
        <div className="quiz-take-header-top">
          {challenge && (
            <span
              className={`featured-badge ${
                challenge.isCore
                  ? 'featured-badge-core'
                  : 'featured-badge-community'
              }`}
            >
              {challenge.isCore ? 'CORE CHALLENGE' : 'COMMUNITY CHALLENGE'}
            </span>
          )}
        </div>

        <h1>{quiz.title}</h1>

        {quiz.description && (
          <p className="quiz-take-description">{quiz.description}</p>
        )}

        <div className="quiz-take-stats">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" aria-hidden="true">
              <path d="M8 21h8" />
              <path d="M12 17v4" />
              <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
              <path d="M7 6H4v3a4 4 0 0 0 4 4" />
              <path d="M17 6h3v3a4 4 0 0 0-4 4" />
            </svg>
            {totalPoints} points
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {quiz.questions.length} questions
          </span>
        </div>

        <div
          className={`quiz-take-timer ${
            quiz.timeLimitMinutes == null ? 'quiz-take-timer-unlimited' : ''
          }`}
          role={remainingSeconds !== null ? 'timer' : undefined}
          aria-label={remainingSeconds !== null ? 'Time remaining' : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {remainingSeconds === null ? (
            <>
              <strong>Time Limit:</strong>
              <span>Unlimited</span>
            </>
          ) : (
            <>
              <strong>Time Remaining:</strong>
              <span className={remainingSeconds <= 60 ? 'text-danger fw-bold' : ''}>
                {Math.floor(remainingSeconds / 60)}:
                {String(remainingSeconds % 60).padStart(2, '0')}
              </span>
            </>
          )}
        </div>
      </section>

      {quiz.questions.length === 0 && (
        <Alert variant="info">This challenge has no questions yet.</Alert>
      )}

      {quiz.questions.map((question, index) => (
        <section
          key={question.questionId}
          className="quiz-question-card"
          aria-labelledby={`quizQuestion_${question.questionId}`}
        >
          <div className="quiz-question-heading">
            <span className="quiz-question-number">
              QUESTION {index + 1} OF {quiz.questions.length}
            </span>
            <span className="quiz-question-points">
              {question.points} points
            </span>
          </div>

          <h2 id={`quizQuestion_${question.questionId}`} className="quiz-question-title">
            {question.title}
          </h2>

          {question.description && (
            <p className="quiz-question-description">{question.description}</p>
          )}

          {question.imageUrl && (
            <img src={question.imageUrl} alt="" className="quiz-question-image" />
          )}

          {question.questionType === 'ShortAnswer' ? (
            <div className="quiz-short-answer">
              <label htmlFor={`textAnswer_${question.questionId}`} className="form-label">
                Your Answer
              </label>
              <Form.Control
                id={`textAnswer_${question.questionId}`}
                type="text"
                maxLength={200}
                autoComplete="off"
                value={textAnswers[question.questionId] ?? ''}
                onChange={(event) =>
                  handleTextAnswer(question.questionId, event.target.value)
                }
                disabled={isCompleting || remainingSeconds === 0}
              />
            </div>
          ) : (
            <>
              <p id={`answerInstruction_${question.questionId}`}
                className="quiz-answer-instruction">
                {question.questionType === 'MultipleChoice'
                  ? 'Select all correct answers.'
                  : 'Select one answer.'}
              </p>

              <div
                className="quiz-answer-options"
                role={question.questionType === 'MultipleChoice' ? 'group' : 'radiogroup'}
                aria-labelledby={`quizQuestion_${question.questionId}`}
                aria-describedby={`answerInstruction_${question.questionId}`}
              >
                {question.options.map((option) => (
                  <div key={option.questionOptionId} className="quiz-answer-option">
                    <input
                      className="form-check-input"
                      type={question.questionType === 'SingleChoice' ? 'radio' : 'checkbox'}
                      name={`answers_${question.questionId}`}
                      id={`option_${option.questionOptionId}`}
                      checked={
                        answers[question.questionId]?.includes(option.questionOptionId) ?? false
                      }
                      onChange={(event) => {
                        if (question.questionType === 'SingleChoice') {
                          handleSingleChoice(question.questionId, option.questionOptionId)
                        } else {
                          handleMultipleChoice(
                            question.questionId,
                            option.questionOptionId,
                            event.target.checked
                          )
                        }
                      }}
                      disabled={isCompleting || remainingSeconds === 0}
                    />
                    <label htmlFor={`option_${option.questionOptionId}`}>
                      {option.text}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      ))}

      {submitFailed && (
        <Alert variant="danger">
          Could not submit challenge: {submitError.message}
        </Alert>
      )}
      {exitFailed && (
        <Alert variant="danger">
          Could not exit challenge: {exitError.message}
        </Alert>
      )}
      {remainingSeconds === 0 && (
        <Alert variant="warning">
          Time has expired. Your challenge is being submitted.
        </Alert>
      )}

      {quiz.questions.length > 0 && (
        <div className="quiz-take-actions">
          <Button
            variant="primary"
            className="quiz-submit-button"
            onClick={handleSubmit}
            disabled={isCompleting || remainingSeconds === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </Button>

          <Button
            variant="outline-secondary"
            className="quiz-exit-button"
            onClick={handleExit}
            disabled={isCompleting || remainingSeconds === 0}
          >
            {isExiting ? 'Exiting...' : 'Exit Challenge'}
          </Button>
        </div>
      )}
    </Container>
  )
}

export default QuizPage
