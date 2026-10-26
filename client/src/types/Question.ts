
export type QuestionType =
  | 'SingleChoice'
  | 'MultipleChoice'
  | 'ShortAnswer'

export interface QuestionOption {
  questionOptionId: number
  text: string
  isCorrect: boolean
}

export interface Question {
  questionId: number
  challengeId: number
  title: string
  description: string | null
  explanation: string | null
  points: number
  imageUrl: string | null
  questionType: QuestionType
  options: QuestionOption[]
  acceptedAnswers: string[]
}

export interface QuestionOptionSaveRequest {
  text: string
  isCorrect: boolean
}

export interface QuestionSaveRequest {
  title: string
  description: string | null
  explanation: string | null
  points: number
  imageUrl: string | null
  questionType: QuestionType
  options: QuestionOptionSaveRequest[]
  acceptedAnswers: string[]
}
