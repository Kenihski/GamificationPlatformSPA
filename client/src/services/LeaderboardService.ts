import apiFetch from './ApiClient'
import type { ChallengeLeaderboard } from '../types/Leaderboard'

const getChallengeLeaderboard = async (
  challengeId: number
): Promise<ChallengeLeaderboard> => {
  const response = await apiFetch(
    `/api/leaderboard/challenges/${challengeId}`
  )

  return response.json() as Promise<ChallengeLeaderboard>
}

const LeaderboardService = {
  getChallengeLeaderboard,
}

export default LeaderboardService