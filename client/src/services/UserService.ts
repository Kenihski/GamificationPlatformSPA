import apiFetch from './ApiClient'
import type { AdminUser } from '../types/AdminUser'
import type { AdminUserDetails } from '../types/AdminUserDetails'

const getAllUsers = async (): Promise<AdminUser[]> => {
  const response = await apiFetch('/api/users')
  return response.json() as Promise<AdminUser[]>
}

const getUserDetails = async (id: number): Promise<AdminUserDetails> => {
  const response = await apiFetch(`/api/users/${id}`)
  return response.json() as Promise<AdminUserDetails>
}

const UserService = {
  getAllUsers,
  getUserDetails,
}

export default UserService
