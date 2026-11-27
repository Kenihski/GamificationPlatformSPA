
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ChallengeService from '../services/ChallengeService'
import type { ChallengeSaveRequest } from '../services/ChallengeService'
import ImageService from '../services/ImageService'
import QuestionService from '../services/QuestionService'
import QuestionOverview from '../questions/QuestionOverview'
import { getSafeReturnUrl, withReturnUrl } from '../shared/returnUrl'
import FlashMessage from '../shared/FlashMessage'
import { useAuth } from '../auth/AuthContext'
import type { Challenge } from '../types/Challenge'
import './CreateChallengePage.css'
import usePageTitle from '../shared/usePageTitle'
import { getImageUrl } from '../shared/imageUrl'

type ImageCategory = 'current' | 'upload' | 'my' | 'default'
type FieldErrors = Partial<Record<'title' | 'description' | 'image', string>>

interface EditFormProps {
  challenge: Challenge
}

const EditForm = ({ challenge }: EditFormProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Return to the page the user came from, as in Subapp 1. My Challenges is the default.
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))

  // The question overview starts closed so the form and its buttons come first.
  // It opens automatically when the user returns from a question page.
  const showQuestions = searchParams.get('showQuestions') === 'true'
  const toggleQuestions = () => {
    const next = new URLSearchParams(searchParams)
    if (showQuestions) next.delete('showQuestions')
    else next.set('showQuestions', 'true')
    setSearchParams(next, { replace: true })
  }

  // Question pages opened from here come back to this form with the overview open.
  const questionReturnParams = new URLSearchParams({ showQuestions: 'true' })
  if (returnUrl) questionReturnParams.set('returnUrl', returnUrl)
  const questionReturnUrl = `/challenges/${challenge.challengeId}/edit?${questionReturnParams}`

  const questionsQuery = useQuery({
    queryKey: ['questions', challenge.challengeId],
    queryFn: () => QuestionService.getQuestions(challenge.challengeId),
  })

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [validationSubmitCount, setValidationSubmitCount] = useState(0)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  // Same validation as Create Challenge: focus the summary only after a
  // rejected submission or a server error, not while typing.
  useEffect(() => {
    if (validationSubmitCount > 0) errorSummaryRef.current?.focus()
  }, [validationSubmitCount])

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }
  useEffect(() => {
    if (errorMessage) errorSummaryRef.current?.focus()
  }, [errorMessage])
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

  const fallbackImage = defaultImages.find(image => image.name === 'Question 1' || image.imageUrl === '/images/Question_1.png')?.imageUrl ?? ''
  const currentImage = challenge.imageUrl || fallbackImage
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

    if (!challenge.imageUrl) {
      setImageUrl(fallbackImage)
      setImageCategory('default')
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
    fallbackImage,
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
        imageUrl: selectedImageUrl || fallbackImage,
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
        queryClient.invalidateQueries({ queryKey: ['admin-user-details'] }),
      ])

      navigate(returnUrl ?? '/my-challenges')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const handleCategoryChange = (category: ImageCategory) => {
    clearFieldError('image')
    setImageCategory(category)
    setImageUrl(category === 'current' ? currentImage : category === 'default' ? fallbackImage : '')
    setImageFile(null)
    setUploadedPreviewUrl(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    const errors: FieldErrors = {}
    if (!title.trim()) errors.title = 'Challenge title is required.'
    if (!description.trim()) errors.description = 'Description is required.'

    // An empty image selection falls back to Question 1, as in Subapp 1.
    if (imageCategory === 'upload' && imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        errors.image = 'The image must be 5 MB or smaller.'
      } else if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
        errors.image = 'Choose a JPG, PNG or WebP image.'
      }
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setValidationSubmitCount((count) => count + 1)
      return
    }

    updateMutation.mutate()
  }

  const fallbackPreviewUrl = fallbackImage ? getImageUrl(fallbackImage) : null
  const previewUrl =
    imageCategory === 'upload'
      ? uploadedPreviewUrl || fallbackPreviewUrl
      : imageUrl
        ? getImageUrl(imageUrl)
        : fallbackPreviewUrl

  return (
    <Container className="create-challenge-page management-page my-4">
      <h1 className="mb-4">Update Challenge</h1>

      <FlashMessage />

      <Card className="border-warning">
        <Card.Body>
          <Alert variant="warning">
            <strong>Before saving:</strong> Changes update this challenge's details and settings.
            Existing questions, attempts and scores are kept. Changing answer review settings
            also affects access to answers from previous attempts.
          </Alert>

          {(errorMessage || Object.keys(fieldErrors).length > 0) && (
            <Alert ref={errorSummaryRef} tabIndex={-1} variant="danger" role="alert" aria-label="Validation summary">
              <strong>Please correct the following errors:</strong>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="mb-0 mt-2">
                  {Object.entries(fieldErrors).filter(([, message]) => Boolean(message)).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              )}
              {errorMessage && <div className="mt-2">{errorMessage}</div>}
            </Alert>
          )}

          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="challengeTitle">
              <Form.Label>
                Title <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                maxLength={100}
                value={title}
                isInvalid={Boolean(fieldErrors.title)}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? 'challenge-title-error' : undefined}
                onChange={(event) => {
                  setTitle(event.target.value)
                  clearFieldError('title')
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
                value={description}
                isInvalid={Boolean(fieldErrors.description)}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'challenge-description-error' : undefined}
                onChange={(event) => {
                  setDescription(event.target.value)
                  clearFieldError('description')
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

                {isOtherImage && (
                  <option value="current">Current image</option>
                )}
                <option value="upload">Upload new image...</option>
                <option value="my">My Images</option>
                <option value="default">Default Images</option>
              </Form.Select>
              <Form.Text className="text-secondary">
                If no image is selected, Question 1 will be used. You can choose another image.
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
                      clearFieldError('image')
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

              {fieldErrors.image && (
                <div className="invalid-feedback d-block" role="alert">
                  {fieldErrors.image}
                </div>
              )}

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt=""
                  className="challenge-image-preview mt-3"
                />
              )}
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
              <div className="d-flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="outline-warning"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>

                <Link to={returnUrl ?? '/my-challenges'} className="btn btn-outline-primary">
                  Cancel
                </Link>
              </div>

              {/* Same toggle as on Challenge Details; it opens the question overview below. */}
              <Button
                variant="outline-primary"
                type="button"
                aria-expanded={showQuestions}
                aria-controls="questionOverview"
                onClick={toggleQuestions}
              >
                Questions ({questionsQuery.data?.length ?? challenge.questionCount})
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Manage the questions here as well, so editing does not require the details page. */}
      <Card
        as="section"
        id="questionOverview"
        className="mt-4"
        aria-labelledby="questionOverviewTitle"
        hidden={!showQuestions}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mb-3">
            <h2 id="questionOverviewTitle" className="h4 mb-0">
              Questions ({questionsQuery.data?.length ?? challenge.questionCount})
            </h2>

            <Link
              to={withReturnUrl(`/challenges/${challenge.challengeId}/questions/create`, questionReturnUrl)}
              className="btn btn-primary"
            >
              + Add Question
            </Link>
          </div>

          {questionsQuery.isPending ? (
            <div role="status">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading questions...</span>
            </div>
          ) : questionsQuery.isError ? (
            <Alert variant="danger" role="alert">Could not load questions.</Alert>
          ) : (
            <QuestionOverview
              challengeId={challenge.challengeId}
              questions={questionsQuery.data}
              returnUrl={questionReturnUrl}
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}

const EditChallengePage = () => {
  usePageTitle('Update Challenge')
  const { user } = useAuth()
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

  const canManage = Boolean(
    user && (
      user.roles.includes('Admin') ||
      user.userId === challenge.createdByUserId
    )
  )

  if (!canManage) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" role="alert">
          You do not have permission to edit this challenge.
        </Alert>
        <Link to={`/challenges/${challenge.challengeId}`}>
          Back to challenge
        </Link>
      </Container>
    )
  }

  return <EditForm key={challenge.challengeId} challenge={challenge} />
}

export default EditChallengePage
