import apiFetch from './ApiClient'
import type { HallOfFameResponse } from '../types/HallOfFame'
import type { MyAchievements } from '../types/Achievement'

const getAll = async (): Promise<HallOfFameResponse> => {
  const response = await apiFetch('/api/hall-of-fame')
  return response.json() as Promise<HallOfFameResponse>
}

const getUserAchievements = async (
  userId: number
): Promise<MyAchievements> => {
  const response = await apiFetch(
    `/api/hall-of-fame/users/${userId}/achievements`
  )
  return response.json() as Promise<MyAchievements>
}

const HallOfFameService = {
  getAll,
  getUserAchievements,
}

export default HallOfFameService
