
import apiFetch from './ApiClient'
import type {
  AdminAchievement,
  AchievementSaveRequest,
} from '../types/Achievement'

const getAll = async (): Promise<AdminAchievement[]> => {
  const response = await apiFetch('/api/achievements/admin')
  return response.json() as Promise<AdminAchievement[]>
}

const getById = async (id: number): Promise<AdminAchievement> => {
  const response = await apiFetch(`/api/achievements/${id}`)
  return response.json() as Promise<AdminAchievement>
}

const create = async (data: AchievementSaveRequest): Promise<void> => {
  await apiFetch('/api/achievements', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

const update = async (
  id: number,
  data: AchievementSaveRequest
): Promise<void> => {
  await apiFetch(`/api/achievements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const remove = async (id: number): Promise<void> => {
  await apiFetch(`/api/achievements/${id}`, {
    method: 'DELETE',
  })
}

const publish = async (id: number): Promise<void> => {
  await apiFetch(`/api/achievements/${id}/publish`, {
    method: 'POST',
  })
}

const unpublish = async (id: number): Promise<void> => {
  await apiFetch(`/api/achievements/${id}/unpublish`, {
    method: 'POST',
  })
}

const AdminAchievementService = {
  getAll,
  getById,
  create,
  update,
  remove,
  publish,
  unpublish,
}

export default AdminAchievementService
