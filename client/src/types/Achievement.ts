export interface Achievement {
  achievementId: number
  name: string
  description: string
  points: number
  isGoal: boolean
  isUnlocked: boolean
  unlockedAt: string | null
}

export interface MyAchievements {
  username: string
  totalPoints: number
  maxPoints: number
  unlockedCount: number
  totalAchievements: number
  milestoneName: string
  milestoneIcon: string
  milestoneMessage: string
  currentMilestonePoints: number
  nextMilestonePoints: number
  progressPercent: number
  achievements: Achievement[]
}


export interface AdminAchievement {
  achievementId: number
  name: string
  description: string
  points: number
  type: string
  requirementValue: number
  isActive: boolean
  isGoal: boolean
}

export interface AchievementSaveRequest {
  name: string
  description: string
  type: string
  points: number
  requirementValue: number
  isActive: boolean
}
