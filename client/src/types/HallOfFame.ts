export interface HallOfFameUser {
  rank: number
  userId: number
  username: string
  milestoneName: string
  milestoneIcon: string
  achievementCount: number
  achievementPoints: number
}

export interface HallOfFameResponse {
  users: HallOfFameUser[]
}