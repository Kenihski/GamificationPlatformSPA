export interface AdminQuestion {
  questionId: number
  challengeId: number
  title: string
  description: string | null
  points: number
  imageUrl: string | null
  challengeTitle: string
  ownerId: number
  ownerUsername: string
}
