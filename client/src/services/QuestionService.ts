
import apiFetch from './ApiClient'
import type {
  Question,
  QuestionSaveRequest,
} from '../types/Question'

const getQuestions = async (challengeId: number): Promise<Question[]> => {
  const response = await apiFetch(
    `/api/challenges/${challengeId}/questions`
  )

  return response.json() as Promise<Question[]>
}

const getQuestion = async (
  challengeId: number,
  questionId: number
): Promise<Question> => {
  const response = await apiFetch(
    `/api/challenges/${challengeId}/questions/${questionId}`
  )

  return response.json() as Promise<Question>
}

const createQuestion = async (
  challengeId: number,
  data: QuestionSaveRequest
): Promise<Question> => {
  const response = await apiFetch(
    `/api/challenges/${challengeId}/questions`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )

  return response.json() as Promise<Question>
}

const updateQuestion = async (
  challengeId: number,
  questionId: number,
  data: QuestionSaveRequest
): Promise<void> => {
  await apiFetch(
    `/api/challenges/${challengeId}/questions/${questionId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

const deleteQuestion = async (
  challengeId: number,
  questionId: number
): Promise<void> => {
  await apiFetch(
    `/api/challenges/${challengeId}/questions/${questionId}`,
    {
      method: 'DELETE',
    }
  )
}

const QuestionService = {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
}

export default QuestionService
