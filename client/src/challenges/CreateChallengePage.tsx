
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import ChallengeService from '../services/ChallengeService'
import type { ChallengeSaveRequest } from '../services/ChallengeService'
import ImageService from '../services/ImageService'
import './CreateChallengePage.css'

type ImageCategory = 'none' | 'upload' | 'my' | 'default'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageSource = (url: string) =>
  url.startsWith('http') ? url : `${apiBaseUrl}${url}`

const CreateChallengePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [showAnswers, setShowAnswers] = useState(false)
  const [imageCategory, setImageCategory] = useState<ImageCategory>('none')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Create a local preview and release it when the file changes.
  useEffect(() => {
    if (!imageFile) {
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setUploadedPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  const defaultImagesQuery = useQuery({
    queryKey: ['default-images'],
    queryFn: ImageService.getDefaultImages,
  })

  const myImagesQuery = useQuery({
    queryKey: ['my-images'],
    queryFn: ImageService.getMyImages,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      let selectedImageUrl = imageCategory === 'upload' ? '' : imageUrl

      if (imageCategory === 'upload' && imageFile) {
        selectedImageUrl = await ImageService.uploadImage(imageFile)
      }

      const data: ChallengeSaveRequest = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: selectedImageUrl,
        timeLimitMinutes: timeLimit === '' ? null : Number(timeLimit),
        showAnswersAfterCompletion: showAnswers,
      }

      return ChallengeService.createChallenge(data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['my-challenges'],
      })

      navigate('/my-challenges')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const handleCategoryChange = (category: ImageCategory) => {
    setImageCategory(category)
    setImageUrl('')
    setImageFile(null)
    setUploadedPreviewUrl(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!title.trim() || !description.trim()) {
      setErrorMessage('Title and description are required.')
      return
    }

    if (imageCategory === 'upload') {
      if (!imageFile) {
        setErrorMessage('Please select an image.')
        return
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        setErrorMessage('The image must be 5 MB or smaller.')
        return
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
        setErrorMessage('Choose a JPG, PNG or WebP image.')
        return
      }
    }

    if (
      (imageCategory === 'my' || imageCategory === 'default') &&
      !imageUrl
    ) {
      setErrorMessage('Please select an image.')
      return
    }

    createMutation.mutate()
  }

  const previewUrl =
    imageCategory === 'upload'
      ? uploadedPreviewUrl
      : imageUrl
        ? getImageSource(imageUrl)
        : null

  return (
    <Container className="create-challenge-page py-4">
      <h2 className="create-challenge-title">Create New Challenge</h2>

      {errorMessage && (
        <Alert variant="danger" role="alert">
          {errorMessage}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="challengeTitle">
          <Form.Label>
            Title <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            required
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="challengeDescription">
          <Form.Label>
            Description <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            required
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="challengeTimeLimit">
          <Form.Label>Time Limit</Form.Label>
          <Form.Select
            value={timeLimit}
            onChange={(event) => setTimeLimit(event.target.value)}
          >
            <option value="">Unlimited</option>
            {[10, 20, 30, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            id="showAnswers"
            type="checkbox"
            label="Show answers after completion"
            checked={showAnswers}
            onChange={(event) => setShowAnswers(event.target.checked)}
          />
          <Form.Text className="text-secondary">
            Allow participants to review their answers, correct answers
            and explanations after completing the challenge.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-4" controlId="imageCategory">
          <Form.Label>Image</Form.Label>
          <Form.Select
            value={imageCategory}
            onChange={(event) =>
              handleCategoryChange(event.target.value as ImageCategory)
            }
          >
            <option value="none">No image</option>
            <option value="upload">Upload new image...</option>
            <option value="my">My Images</option>
            <option value="default">Default Images</option>
          </Form.Select>

          {imageCategory === 'upload' && (
            <div className="mt-3">
              <Form.Label htmlFor="imageUpload">Choose image</Form.Label>
              <Form.Control
                id="imageUpload"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  const input = event.currentTarget as HTMLInputElement
                  setImageFile(input.files?.[0] ?? null)
                  setUploadedPreviewUrl(null)
                }}
              />
              <Form.Text className="text-secondary">
                JPG, PNG or WebP. Maximum 5 MB.
              </Form.Text>
            </div>
          )}

          {imageCategory === 'my' && (
            <div className="mt-3">
              <Form.Label htmlFor="myImageSelect">My Images</Form.Label>
              {myImagesQuery.isPending ? (
                <Spinner animation="border" size="sm" />
              ) : myImagesQuery.isError ? (
                <Alert variant="danger">Could not load your images.</Alert>
              ) : (
                <Form.Select
                  id="myImageSelect"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                >
                  <option value="">-- Select your image --</option>
                  {myImagesQuery.data?.map((image) => (
                    <option key={image.userImageId} value={image.imageUrl}>
                      {image.fileName}
                    </option>
                  ))}
                </Form.Select>
              )}
            </div>
          )}

          {imageCategory === 'default' && (
            <div className="mt-3">
              <Form.Label htmlFor="defaultImageSelect">
                Default Images
              </Form.Label>
              {defaultImagesQuery.isPending ? (
                <Spinner animation="border" size="sm" />
              ) : defaultImagesQuery.isError ? (
                <Alert variant="danger">Could not load default images.</Alert>
              ) : (
                <Form.Select
                  id="defaultImageSelect"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                >
                  <option value="">-- Select default image --</option>
                  {defaultImagesQuery.data?.map((image) => (
                    <option key={image.defaultImageId} value={image.imageUrl}>
                      {image.name}
                    </option>
                  ))}
                </Form.Select>
              )}
            </div>
          )}

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Selected challenge preview"
              className="challenge-image-preview mt-3"
            />
          )}
        </Form.Group>

        <div className="d-flex gap-2 create-challenge-actions">
          <Button type="submit" variant="primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Challenge'}
          </Button>

          <Link to="/my-challenges" className="btn btn-outline-secondary">
            Cancel
          </Link>
        </div>
      </Form>
    </Container>
  )
}

export default CreateChallengePage
