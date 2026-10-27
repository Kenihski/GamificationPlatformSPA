
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

export interface CoreLeaderboardEntry {
  rank: number
  userId: number
  username: string
  totalPoints: number
  coreChallengesCompleted: number
  totalTimeSeconds: number
}

export interface CoreLeaderboard {
  entries: CoreLeaderboardEntry[]
}
