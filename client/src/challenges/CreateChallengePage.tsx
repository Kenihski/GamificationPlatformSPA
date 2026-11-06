
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import ChallengeService from '../services/ChallengeService'
import type { ChallengeSaveRequest } from '../services/ChallengeService'
import ImageService from '../services/ImageService'
import { useAuth } from '../auth/AuthContext'
import './CreateChallengePage.css'

type ImageCategory = 'upload' | 'my' | 'default'
type FieldErrors = Partial<Record<'title' | 'description' | 'image', string>>

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageSource = (url: string) =>
  url.startsWith('http') ? url : `${apiBaseUrl}${url}`

const CreateChallengePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.roles.includes('Admin') ?? false
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [showAnswers, setShowAnswers] = useState(false)
  const [imageCategory, setImageCategory] = useState<ImageCategory>('default')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isCore, setIsCore] = useState(false)
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (errorMessage || Object.keys(fieldErrors).length > 0) {
      errorSummaryRef.current?.focus()
    }
  }, [errorMessage, fieldErrors])

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

  // Preselect Freyr's Question 1 image once defaults are available.
  useEffect(() => {
    if (imageCategory !== 'default' || imageUrl) return
    const firstImage = defaultImagesQuery.data?.find(
      (image) => image.name === 'Question 1'
    )
    if (firstImage) setImageUrl(firstImage.imageUrl)
  }, [defaultImagesQuery.data, imageCategory, imageUrl])

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
        isCore: isAdmin && isCore,
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
    setFieldErrors((current) => ({ ...current, image: undefined }))
    setImageCategory(category)
    setImageUrl(category === 'default' ? (defaultImagesQuery.data?.find(image => image.name === 'Question 1')?.imageUrl ?? '') : '')
    setImageFile(null)
    setUploadedPreviewUrl(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const errors: FieldErrors = {}
    if (!title.trim()) errors.title = 'Challenge title is required.'
    if (!description.trim()) errors.description = 'Description is required.'

    if (imageCategory === 'upload') {
      if (!imageFile) {
        errors.image = 'Please select an image.'
      } else if (imageFile.size > 5 * 1024 * 1024) {
        errors.image = 'The image must be 5 MB or smaller.'
      } else if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
        errors.image = 'Choose a JPG, PNG or WebP image.'
      }
    } else if (!imageUrl) {
      errors.image = 'Please select an image.'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

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

      {(errorMessage || Object.keys(fieldErrors).length > 0) && (
        <Alert ref={errorSummaryRef} tabIndex={-1} variant="danger" role="alert" aria-label="Validation summary">
          <strong>Please correct the following errors:</strong>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mb-0 mt-2">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          )}
          {errorMessage && <div className="mt-2">{errorMessage}</div>}
        </Alert>
      )}

      <Form noValidate onSubmit={handleSubmit}>
        {isAdmin ? (
          <Form.Group className="mb-3" controlId="challengeType">
            <Form.Label>Challenge Type</Form.Label>
            <Form.Select
              value={isCore ? 'core' : 'community'}
              onChange={(event) => setIsCore(event.target.value === 'core')}
            >
              <option value="community">Community</option>
              <option value="core">Core</option>
            </Form.Select>
            <Form.Text className="text-secondary">
              You can change the type later only for challenges you created.
            </Form.Text>
          </Form.Group>
        ) : (
          <p className="text-secondary">Your challenge will be created as a Community challenge.</p>
        )}

        <Form.Group className="mb-3" controlId="challengeTitle">
          <Form.Label>
            Title <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            required
            maxLength={100}
            isInvalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'challenge-title-error' : undefined}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setFieldErrors((current) => ({ ...current, title: undefined }))
            }}
          />
          {fieldErrors.title && (
            <Form.Control.Feedback type="invalid" id="challenge-title-error">
              {fieldErrors.title}
            </Form.Control.Feedback>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="challengeDescription">
          <Form.Label>
            Description <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            required
            maxLength={500}
            isInvalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? 'challenge-description-error' : undefined}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setFieldErrors((current) => ({ ...current, description: undefined }))
            }}
          />
          {fieldErrors.description && (
            <Form.Control.Feedback type="invalid" id="challenge-description-error">
              {fieldErrors.description}
            </Form.Control.Feedback>
          )}
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
            <option value="upload">Upload new image...</option>
            <option value="my">My Images</option>
            <option value="default">Default Images</option>
          </Form.Select>
          <Form.Text className="text-secondary" role="status">
            Question 1 is selected by default. Choose another default image,
            one of your images, or upload a new one.
          </Form.Text>

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
                  setFieldErrors((current) => ({ ...current, image: undefined }))
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
                  onChange={(event) => {
                    setImageUrl(event.target.value)
                    setFieldErrors((current) => ({ ...current, image: undefined }))
                  }}
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
                  onChange={(event) => {
                    setImageUrl(event.target.value)
                    setFieldErrors((current) => ({ ...current, image: undefined }))
                  }}
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

          {fieldErrors.image && (
            <div className="invalid-feedback d-block" role="alert">
              {fieldErrors.image}
            </div>
          )}

          <div role="status" className="visually-hidden">
            {previewUrl ? 'Challenge image preview updated.' : 'Choose an image to preview.'}
          </div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Selected challenge image preview"
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
