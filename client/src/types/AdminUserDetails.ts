export interface UserDetails {
  userId: number
  username: string
  email: string
  roles: string[]
}

export interface CreatedChallenge {
  challengeId: number
  title: string
  description: string
  imageUrl: string | null
  isPublished: boolean
  isCore: boolean
  questions: number
  maxPoints: number
}

export interface UserAttemptHistory {
  challengeAttemptId: number
  attemptNumber: number
  score: number
  timeUsed: string | null
  completedAt: string | null
  isBest: boolean
  isLatest: boolean
}

export interface UserChallengeHistory {
  challengeId: number
  challengeTitle: string
  maxPoints: number
  attempts: UserAttemptHistory[]
}

export interface AdminUserDetails {
  user: UserDetails
  createdChallenges: CreatedChallenge[]
  challengeHistory: UserChallengeHistory[]
}
