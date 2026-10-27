import apiFetch from './ApiClient'
import type { AchievementNotification } from '../types/AchievementNotification'

const getUnseen = async (): Promise<AchievementNotification[]> => {
  const response = await apiFetch('/api/achievement-notifications/unseen')
  return response.json() as Promise<AchievementNotification[]>
}

const markSeen = async (userAchievementId: number): Promise<void> => {
  await apiFetch(
    `/api/achievement-notifications/${userAchievementId}/mark-seen`,
    { method: 'POST' }
  )
}

const AchievementNotificationService = {
  getUnseen,
  markSeen,
}

export default AchievementNotificationService
