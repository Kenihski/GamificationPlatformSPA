
import apiFetch from './ApiClient'
import type { MyAchievements } from '../types/Achievement'

const getMine = async (): Promise<MyAchievements> => {
  const response = await apiFetch('/api/achievements/mine')

  return response.json() as Promise<MyAchievements>
}

const AchievementService = { getMine }

export default AchievementService
