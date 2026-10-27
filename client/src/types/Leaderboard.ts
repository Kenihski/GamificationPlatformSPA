export interface ChallengeLeaderboardEntry {
  rank: number
  userId: number
  username: string
  score: number
  startedAt: string
  completedAt: string
  timeUsedSeconds: number
}

export interface ChallengeLeaderboard {
  challengeId: number
  title: string
  maxPoints: number
  entries: ChallengeLeaderboardEntry[]
}