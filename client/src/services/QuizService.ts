
import apiFetch from './ApiClient'
import type {
  QuizStartResponse,
  QuizSubmissionRequest,
  QuizSubmitResponse,
  QuizAttemptResult,
} from '../types/Quiz'

const startQuiz = async (challengeId: number): Promise<QuizStartResponse> => {
  const response = await apiFetch(
    `/api/quiz/challenges/${challengeId}/start`,
    { method: 'POST' }
  )

  return response.json() as Promise<QuizStartResponse>
}

const submitQuiz = async (
  challengeId: number,
  submission: QuizSubmissionRequest
): Promise<QuizSubmitResponse> => {
  const response = await apiFetch(
    `/api/quiz/challenges/${challengeId}/submit`,
    {
      method: 'POST',
      body: JSON.stringify(submission),
    }
  )

  return response.json() as Promise<QuizSubmitResponse>
}

const exitQuiz = async (
  challengeId: number,
  submission: QuizSubmissionRequest
): Promise<QuizSubmitResponse> => {
  const response = await apiFetch(
    `/api/quiz/challenges/${challengeId}/exit`,
    {
      method: 'POST',
      body: JSON.stringify(submission),
    }
  )

  return response.json() as Promise<QuizSubmitResponse>
}

const getAttemptResult = async (
  attemptId: number
): Promise<QuizAttemptResult> => {
  const response = await apiFetch(`/api/quiz/attempts/${attemptId}`)

  return response.json() as Promise<QuizAttemptResult>
}

const QuizService = {
  startQuiz,
  submitQuiz,
  exitQuiz,
  getAttemptResult,
}

export default QuizService
