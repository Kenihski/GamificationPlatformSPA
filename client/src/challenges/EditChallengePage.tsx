
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ChallengeService from '../services/ChallengeService'
import type { ChallengeSaveRequest } from '../services/ChallengeService'
import ImageService from '../services/ImageService'
import type { Challenge } from '../types/Challenge'
import './CreateChallengePage.css'

type ImageCategory = 'none' | 'current' | 'upload' | 'my' | 'default'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageSource = (url: string) =>
  url.startsWith('http')
    ? url
    : `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`

interface EditFormProps {
  challenge: Challenge
}

const EditForm = ({ challenge }: EditFormProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(challenge.title)
  const [description, setDescription] = useState(challenge.description ?? '')
  const [timeLimit, setTimeLimit] = useState(
    challenge.timeLimitMinutes?.toString() ?? ''
  )
  const [showAnswers, setShowAnswers] = useState(
    challenge.showAnswersAfterCompletion ?? true
  )
  const [imageCategory, setImageCategory] = useState<ImageCategory>('current')
  const [imageUrl, setImageUrl] = useState(challenge.imageUrl ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [imageInitialized, setImageInitialized] = useState(false)

  const defaultImagesQuery = useQuery({
    queryKey: ['default-images'],
    queryFn: ImageService.getDefaultImages,
  })

  const myImagesQuery = useQuery({
    queryKey: ['my-images'],
    queryFn: ImageService.getMyImages,
  })

  const defaultImages = defaultImagesQuery.data ?? []
  const myImages = myImagesQuery.data ?? []

  const currentImage = challenge.imageUrl ?? ''
  const isMyImage = myImages.some((image) => image.imageUrl === currentImage)
  const isDefaultImage = defaultImages.some(
    (image) => image.imageUrl === currentImage
  )
  const isOtherImage = Boolean(
    currentImage && !isMyImage && !isDefaultImage
  )

  useEffect(() => {
    if (
      imageInitialized ||
      defaultImagesQuery.isPending ||
      myImagesQuery.isPending
    ) {
      return
    }

    if (!currentImage) {
      setImageCategory('none')
    } else if (isMyImage) {
      setImageCategory('my')
    } else if (isDefaultImage) {
      setImageCategory('default')
    } else {
      setImageCategory('current')
    }

    setImageInitialized(true)
  }, [
    imageInitialized,
    defaultImagesQuery.isPending,
    myImagesQuery.isPending,
    currentImage,
    isMyImage,
    isDefaultImage,
  ])

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      let selectedImageUrl =
        imageCategory === 'upload' ? '' : imageUrl

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

      await ChallengeService.updateChallenge(challenge.challengeId, data)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenge'] }),
      ])

      navigate('/my-challenges')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const handleCategoryChange = (category: ImageCategory) => {
    setImageCategory(category)
    setImageUrl(category === 'current' ? currentImage : '')
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

    updateMutation.mutate()
  }

  const previewUrl =
    imageCategory === 'upload'
      ? uploadedPreviewUrl
      : imageUrl
        ? getImageSource(imageUrl)
        : null

  return (
    <Container className="create-challenge-page py-4">
      <h2 className="my-4">Update Challenge</h2>

      {errorMessage && (
        <Alert variant="danger">{errorMessage}</Alert>
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
            {isOtherImage && (
              <option value="current">Current image</option>
            )}
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
                <>
                  <Form.Select
                    id="myImageSelect"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                  >
                    <option value="">-- Select your image --</option>
                    {myImages.map((image) => (
                      <option key={image.userImageId} value={image.imageUrl}>
                        {image.fileName}
                      </option>
                    ))}
                  </Form.Select>

                  {imageUrl && (
                    <div className="text-end mt-1">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-secondary text-decoration-none"
                        onClick={() => setImageUrl('')}
                      >
                        Remove image
                      </Button>
                    </div>
                  )}
                </>
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
                  {defaultImages.map((image) => (
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

        <div className="d-flex gap-2">
          <Button
            type="submit"
            variant="outline-warning"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>

          <Link to="/my-challenges" className="btn btn-outline-primary">
            Cancel
          </Link>
        </div>
      </Form>
    </Container>
  )
}

const EditChallengePage = () => {
  const { id } = useParams()
  const challengeId = Number(id)
  const validId = Number.isInteger(challengeId) && challengeId > 0

  const { data: challenge, isPending, isError, error } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => ChallengeService.getChallenge(challengeId),
    enabled: validId,
    retry: false,
  })

  if (!validId) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid challenge ID.</Alert>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading challenge...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load challenge: {error.message}
        </Alert>
      </Container>
    )
  }

  if (!challenge) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Challenge not found.</Alert>
      </Container>
    )
  }

  return <EditForm key={challenge.challengeId} challenge={challenge} />
}

export default EditChallengePage
