export interface Challenge {
  challengeId: number
  title: string
  description: string | null
  imageUrl: string | null
  isPublished: boolean
  isCore: boolean
  timeLimitMinutes: number | null
  showAnswersAfterCompletion: boolean
  maxPoints: number
  questionCount: number
  createdByUserId: number
  creatorUsername: string | null
}

export type ChallengeFilter = 'All' | 'Core' | 'Community'