
export interface QuizOption {
  questionOptionId: number
  text: string
}

export type QuestionType = 'SingleChoice' | 'MultipleChoice' | 'ShortAnswer'

export interface QuizQuestion {
  questionId: number
  title: string
  description: string | null
  questionType: QuestionType
  imageUrl: string | null
  points: number
  options: QuizOption[]
}

export interface QuizStartResponse {
  challengeId: number
  title: string
  description: string
  timeLimitMinutes: number | null
  challengeAttemptId: number
  startedAt: string
  questions: QuizQuestion[]
}

export interface QuizSubmissionRequest {
  challengeAttemptId: number
  answers: Record<number, number[]>
  textAnswers: Record<number, string>
}

export interface QuizSubmitResponse {
  challengeId: number
  challengeTitle: string
  challengeAttemptId: number
  score: number
  maxScore: number
  completedAt: string
  timeUsedSeconds: number
  showAnswers: boolean
  exited: boolean
  timedOut: boolean
  attemptDetailsUrl: string
}

export interface QuizResultOption {
  questionOptionId: number
  text: string
  isCorrect: boolean
  isSelected: boolean
}

export interface QuizResultAnswer {
  questionId: number
  questionTitle: string
  questionDescription: string | null
  questionType: QuestionType
  imageUrl: string | null
  points: number
  isCorrect: boolean
  pointsEarned: number
  explanation: string | null
  selectedOptionIds: number[] | null
  textAnswer: string | null
  correctAnswers: string[] | null
  options: QuizResultOption[] | null
}

export interface QuizAttemptResult {
  challengeAttemptId: number
  challengeId: number
  challengeTitle: string
  score: number
  maxPoints: number
  startedAt: string
  completedAt: string
  timeUsedSeconds: number
  showAnswers: boolean
  answers: QuizResultAnswer[]
}
