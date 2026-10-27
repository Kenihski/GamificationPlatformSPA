
import apiFetch from './ApiClient'
import type {
  ChallengeLeaderboard,
  CoreLeaderboard,
} from '../types/Leaderboard'

const getChallengeLeaderboard = async (
  challengeId: number
): Promise<ChallengeLeaderboard> => {
  const response = await apiFetch(
    `/api/leaderboard/challenges/${challengeId}`
  )

  return response.json() as Promise<ChallengeLeaderboard>
}

const getCoreLeaderboard = async (): Promise<CoreLeaderboard> => {
  const response = await apiFetch('/api/leaderboard/total')

  return response.json() as Promise<CoreLeaderboard>
}

const LeaderboardService = {
  getChallengeLeaderboard,
  getCoreLeaderboard,
}

export default LeaderboardService
