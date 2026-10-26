
import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Container,
  Form,
  Spinner,
} from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import QuizService from '../services/QuizService'
import type {
  QuizStartResponse,
  QuizSubmissionRequest,
} from '../types/Quiz'
import './QuizPage.css'

const QuizPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const challengeId = Number(id)
  const validId = Number.isInteger(challengeId) && challengeId > 0

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
    onSuccess: (result) => {
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
    onSuccess: (result) => {
      navigate(`/quiz/attempts/${result.challengeAttemptId}`, {
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

  return (
    <Container className="quiz-page">
      <div className="mb-4">
        <h1>{quiz.title}</h1>
        <p className="text-secondary">{quiz.description}</p>

        <div className="d-flex gap-3 flex-wrap align-items-center">
          <span>{quiz.questions.length} questions</span>

          {quiz.timeLimitMinutes == null ? (
            <span>No time limit</span>
          ) : (
            <span>{quiz.timeLimitMinutes} minutes</span>
          )}

          {remainingSeconds !== null && (
            <span
              className={
                remainingSeconds <= 60
                  ? 'text-danger fw-bold'
                  : 'fw-bold'
              }
              role="timer"
            >
              Time remaining:{' '}
              {Math.floor(remainingSeconds / 60)}:
              {String(remainingSeconds % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      </div>

      {quiz.questions.map((question, index) => (
        <Card
          key={question.questionId}
          className="quiz-question-card mb-4"
        >
          <Card.Body>
            <div className="d-flex justify-content-between mb-3">
              <span>Question {index + 1}</span>
              <span>{question.points} pts</span>
            </div>

            <h2 className="h5">{question.title}</h2>

            {question.description && (
              <p className="text-secondary">
                {question.description}
              </p>
            )}

            {question.questionType === 'ShortAnswer' ? (
              <Form.Control
                type="text"
                maxLength={200}
                placeholder="Enter your answer"
                value={textAnswers[question.questionId] ?? ''}
                onChange={(event) =>
                  handleTextAnswer(
                    question.questionId,
                    event.target.value
                  )
                }
                disabled={isCompleting || remainingSeconds === 0}
              />
            ) : (
              question.options.map((option) => (
                <Form.Check
                  key={option.questionOptionId}
                  className="mb-2"
                  type={
                    question.questionType === 'SingleChoice'
                      ? 'radio'
                      : 'checkbox'
                  }
                  name={`question-${question.questionId}`}
                  id={`option-${option.questionOptionId}`}
                  label={option.text}
                  checked={
                    answers[question.questionId]?.includes(
                      option.questionOptionId
                    ) ?? false
                  }
                  onChange={(event) => {
                    if (question.questionType === 'SingleChoice') {
                      handleSingleChoice(
                        question.questionId,
                        option.questionOptionId
                      )
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
              ))
            )}
          </Card.Body>
        </Card>
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

      <div className="d-flex justify-content-between gap-3 mb-4">
        <Button
          variant="outline-danger"
          size="lg"
          onClick={handleExit}
          disabled={isCompleting || remainingSeconds === 0}
        >
          {isExiting ? 'Exiting...' : 'Exit Challenge'}
        </Button>

        <Button
          variant="success"
          size="lg"
          onClick={handleSubmit}
          disabled={isCompleting || remainingSeconds === 0}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Challenge'}
        </Button>
      </div>
    </Container>
  )
}

export default QuizPage
