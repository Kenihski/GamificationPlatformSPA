export interface AchievementNotification {
  userAchievementId: number
  achievementId: number
  name: string
  description: string
  points: number
  isGoal: boolean
  unlockedAt: string
}
