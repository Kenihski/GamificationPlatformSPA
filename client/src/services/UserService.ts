import apiFetch from './ApiClient'
import type { AdminUser } from '../types/AdminUser'

const getAllUsers = async (): Promise<AdminUser[]> => {
  const response = await apiFetch('/api/users')
  return response.json() as Promise<AdminUser[]>
}

const UserService = {
  getAllUsers,
}

export default UserService
