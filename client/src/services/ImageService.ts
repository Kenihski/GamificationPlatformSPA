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

const ImageService = {
  getDefaultImages,
  getMyImages,
  uploadImage,
  deleteImage,
}

export default ImageService
