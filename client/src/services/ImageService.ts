import apiFetch from './ApiClient'

export interface DefaultImage {
  defaultImageId: number
  name: string
  fileName: string
  imageUrl: string
}

export interface UserImage {
  userImageId: number
  fileName: string
  imageUrl: string
}

export interface AdminUserImage extends UserImage {
  userId: number
  userName: string | null
}

export interface AdminImages {
  userImages: AdminUserImage[]
  defaultImages: DefaultImage[]
}

const getDefaultImages = async (): Promise<DefaultImage[]> => {
  const response = await apiFetch('/api/images/default')
  return response.json() as Promise<DefaultImage[]>
}

const getMyImages = async (): Promise<UserImage[]> => {
  const response = await apiFetch('/api/images/mine')
  return response.json() as Promise<UserImage[]>
}

const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiFetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  })

  const result = (await response.json()) as { imageUrl: string }
  return result.imageUrl
}

const deleteImage = async (id: number): Promise<void> => {
  await apiFetch(`/api/images/${id}`, {
    method: 'DELETE',
  })
}

const getAdminImages = async (): Promise<AdminImages> => {
  const response = await apiFetch('/api/images/admin')
  return response.json() as Promise<AdminImages>
}

const uploadDefaultImage = async (
  name: string,
  file: File
): Promise<DefaultImage> => {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('file', file)

  const response = await apiFetch('/api/images/default', {
    method: 'POST',
    body: formData,
  })

  return response.json() as Promise<DefaultImage>
}

const renameDefaultImage = async (
  id: number,
  name: string
): Promise<void> => {
  await apiFetch(`/api/images/default/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

const deleteDefaultImage = async (id: number): Promise<void> => {
  await apiFetch(`/api/images/default/${id}`, {
    method: 'DELETE',
  })
}

const ImageService = {
  getDefaultImages,
  getMyImages,
  uploadImage,
  deleteImage,
  getAdminImages,
  uploadDefaultImage,
  renameDefaultImage,
  deleteDefaultImage,
}

export default ImageService
