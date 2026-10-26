
import apiFetch from './ApiClient'
import type { Challenge, ChallengeFilter } from '../types/Challenge'

export interface ChallengeSaveRequest {
  title: string
  description: string
  imageUrl: string
  timeLimitMinutes: number | null
  showAnswersAfterCompletion: boolean
}

const getChallenges = async (
  filter: ChallengeFilter = 'All',
  searchTerm = ''
): Promise<Challenge[]> => {
  const params = new URLSearchParams({
    filter,
    searchTerm,
  })

  const response = await apiFetch(`/api/challenges?${params}`)

  return response.json() as Promise<Challenge[]>
}

const getChallenge = async (id: number): Promise<Challenge> => {
  const response = await apiFetch(`/api/challenges/${id}`)

  return response.json() as Promise<Challenge>
}

const getMyChallenges = async (): Promise<Challenge[]> => {
  const response = await apiFetch('/api/challenges/mine')

  return response.json() as Promise<Challenge[]>
}

const createChallenge = async (
  data: ChallengeSaveRequest
): Promise<Challenge> => {
  const response = await apiFetch('/api/challenges', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  return response.json() as Promise<Challenge>
}

const updateChallenge = async (
  id: number,
  data: ChallengeSaveRequest
): Promise<void> => {
  await apiFetch(`/api/challenges/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

const deleteChallenge = async (id: number): Promise<void> => {
  await apiFetch(`/api/challenges/${id}`, {
    method: 'DELETE',
  })
}

const publishChallenge = async (id: number): Promise<void> => {
  await apiFetch(`/api/challenges/${id}/publish`, {
    method: 'POST',
  })
}

const unpublishChallenge = async (id: number): Promise<void> => {
  await apiFetch(`/api/challenges/${id}/unpublish`, {
    method: 'POST',
  })
}

const makeCore = async (id: number): Promise<void> => {
  await apiFetch(`/api/challenges/${id}/make-core`, {
    method: 'POST',
  })
}

const makeCommunity = async (id: number): Promise<void> => {
  await apiFetch(`/api/challenges/${id}/make-community`, {
    method: 'POST',
  })
}

const ChallengeService = {
  getChallenges,
  getChallenge,
  getMyChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  publishChallenge,
  unpublishChallenge,
  makeCore,
  makeCommunity,
}

export default ChallengeService
