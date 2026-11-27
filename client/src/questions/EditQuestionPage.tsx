
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getSafeReturnUrl } from '../shared/returnUrl'
import ChallengeService from '../services/ChallengeService'
import QuestionService from '../services/QuestionService'
import ImageService from '../services/ImageService'
import type { Question, QuestionSaveRequest, QuestionType } from '../types/Question'
import './QuestionFormPage.css'
import usePageTitle from '../shared/usePageTitle'
import { getImageUrl } from '../shared/imageUrl'

type ImageCategory = 'none' | 'current' | 'upload' | 'my' | 'default'

type AnswerOption = {
  text: string
  isCorrect: boolean
}

const descriptionChoices = [
  'Choose one correct answer.',
  'One or more answers may be correct.',
  'Choose the best answer.',
  'Select all correct answers.',
  'Write the correct answer. Uppercase and lowercase letters are treated the same.',
]

interface EditFormProps {
  question: Question
  challengeTitle: string
}

const EditForm = ({ question, challengeTitle }: EditFormProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  // Return to the page the user came from, as in Subapp 1.
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))

  const challengeId = question.challengeId
  const currentImage = question.imageUrl ?? ''

  const [title, setTitle] = useState(question.title)
  const [questionType, setQuestionType] = useState<QuestionType>(
    question.questionType
  )
  const [descriptionChoice, setDescriptionChoice] = useState(
    question.description
      ? descriptionChoices.includes(question.description)
        ? question.description
        : 'custom'
      : ''
  )
  const [customDescription, setCustomDescription] = useState(
    question.description &&
      !descriptionChoices.includes(question.description)
      ? question.description
      : ''
  )
  const [explanation, setExplanation] = useState(
    question.explanation ?? ''
  )
  const [points, setPoints] = useState(String(question.points))

  const [options, setOptions] = useState<AnswerOption[]>(() =>
    Array.from({ length: 4 }, (_, index) => ({
      text: question.options[index]?.text ?? '',
      isCorrect: question.options[index]?.isCorrect ?? false,
    }))
  )

  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(
    Array.from(
      { length: 4 },
      (_, index) => question.acceptedAnswers[index] ?? ''
    )
  )

  const [imageCategory, setImageCategory] =
    useState<ImageCategory>(currentImage ? 'current' : 'none')
  const [imageUrl, setImageUrl] = useState(currentImage)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadedPreviewUrl, setUploadedPreviewUrl] =
    useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [invalidSubmitCount, setInvalidSubmitCount] = useState(0)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (errorMessage) errorSummaryRef.current?.focus()
  }, [errorMessage])

  // Same as Create Question: move to the summary after a rejected submission.
  useEffect(() => {
    if (invalidSubmitCount > 0) {
      errorSummaryRef.current?.focus()
      errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [invalidSubmitCount])

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

  const isMyImage = myImages.some(
    (image) => image.imageUrl === currentImage
  )
  const isDefaultImage = defaultImages.some(
    (image) => image.imageUrl === currentImage
  )

  const isOtherImage = Boolean(
    currentImage && !isMyImage && !isDefaultImage
  )

  useEffect(() => {
    if (
      defaultImagesQuery.isPending ||
      myImagesQuery.isPending
    ) {
      return
    }

    setImageCategory((previous) => {
      if (previous !== 'current') return previous
      if (!currentImage) return 'none'
      if (isMyImage) return 'my'
      if (isDefaultImage) return 'default'
      return 'current'
    })
  }, [
    defaultImagesQuery.isPending,
    myImagesQuery.isPending,
    currentImage,
    isMyImage,
    isDefaultImage,
  ])

  useEffect(() => {
    if (!imageFile) return

    const objectUrl = URL.createObjectURL(imageFile)
    setUploadedPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  const updateMutation = useMutation({
    mutationFn: async () => {
      let selectedImageUrl =
        imageCategory === 'upload' ? '' : imageUrl

      if (imageCategory === 'upload' && imageFile) {
        selectedImageUrl = await ImageService.uploadImage(imageFile)
      }

      const description =
        descriptionChoice === 'custom'
          ? customDescription.trim()
          : descriptionChoice

      const data: QuestionSaveRequest = {
        title: title.trim(),
        description: description || null,
        explanation: explanation.trim() || null,
        points: Number(points),
        imageUrl: selectedImageUrl || null,
        questionType,
        options:
          questionType === 'ShortAnswer'
            ? []
            : options
                .filter((option) => option.text.trim())
                .map((option) => ({
                  text: option.text.trim(),
                  isCorrect: option.isCorrect,
                })),
        acceptedAnswers:
          questionType === 'ShortAnswer'
            ? acceptedAnswers
                .map((answer) => answer.trim())
                .filter(Boolean)
            : [],
      }

      return QuestionService.updateQuestion(
        challengeId,
        question.questionId,
        data
      )
    },
    onSuccess: async (changed) => {
      const target = returnUrl ?? `/challenges/${challengeId}?showQuestions=true`

      // An unchanged save leaves the form as well, as in Subapp 1.
      if (!changed) {
        navigate(target, { state: { successMessage: 'No changes were made.' } })
        return
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['questions', challengeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['challenge', challengeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['my-challenges'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['challenges'],
        }),
      ])

      navigate(target, {
        state: { successMessage: 'Question updated. Previous attempts and scores were reset.' },
      })
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const handleQuestionTypeChange = (type: QuestionType) => {
    setQuestionType(type)
    setOptions(
      Array.from({ length: 4 }, () => ({
        text: '',
        isCorrect: false,
      }))
    )
    setAcceptedAnswers(['', '', '', ''])
  }

  const handleOptionTextChange = (index: number, text: string) => {
    setOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option
      )
    )
  }

  const handleCorrectChange = (index: number, checked: boolean) => {
    setOptions((previous) =>
      previous.map((option, optionIndex) => ({
        ...option,
        isCorrect:
          questionType === 'SingleChoice'
            ? optionIndex === index
            : optionIndex === index
              ? checked
              : option.isCorrect,
      }))
    )
  }

  const handleAcceptedAnswerChange = (
    index: number,
    value: string
  ) => {
    setAcceptedAnswers((previous) =>
      previous.map((answer, answerIndex) =>
        answerIndex === index ? value : answer
      )
    )
  }

  const handleCategoryChange = (category: ImageCategory) => {
    setImageCategory(category)
    setImageUrl(category === 'current' ? currentImage : '')
    setImageFile(null)
    setUploadedPreviewUrl(null)
  }

  const validateAnswers = (): string | null => {
    if (questionType === 'ShortAnswer') {
      const answers = acceptedAnswers
        .map((answer) => answer.trim())
        .filter(Boolean)

      if (answers.length === 0) {
        return 'Enter between 1 and 4 accepted answers.'
      }

      if (
        new Set(answers.map((answer) => answer.toLowerCase())).size !==
        answers.length
      ) {
        return 'Accepted answers must be different.'
      }

      return null
    }

    const filledOptions = options.filter((option) => option.text.trim())

    if (filledOptions.length < 2) {
      return 'Enter between 2 and 4 answer options.'
    }

    if (
      new Set(
        filledOptions.map((option) => option.text.trim().toLowerCase())
      ).size !== filledOptions.length
    ) {
      return 'Answer options must be different.'
    }

    const correctCount = filledOptions.filter((option) => option.isCorrect).length

    if (questionType === 'SingleChoice' && correctCount !== 1) {
      return 'Single-choice questions must have exactly one correct answer.'
    }

    if (questionType === 'MultipleChoice' && correctCount === 0) {
      return 'Select at least one correct answer.'
    }

    return null
  }

  // Compute errors from the current values so the summary updates as fields are fixed,
  // in the same way as Create Question.
  const validationErrors: { field: string; message: string }[] = []
  if (!title.trim()) {
    validationErrors.push({ field: 'title', message: 'Question title is required.' })
  }
  if (
    String(points).trim() === '' ||
    !Number.isInteger(Number(points)) ||
    Number(points) < 1 ||
    Number(points) > 100
  ) {
    validationErrors.push({ field: 'points', message: 'Points must be between 1 and 100.' })
  }

  const answerError = validateAnswers()
  if (answerError) {
    validationErrors.push({ field: 'answers', message: answerError })
  }

  if (imageCategory === 'upload') {
    if (!imageFile) {
      validationErrors.push({ field: 'image', message: 'Please select an image.' })
    } else if (imageFile.size > 5 * 1024 * 1024) {
      validationErrors.push({ field: 'image', message: 'The image must be 5 MB or smaller.' })
    } else if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
      validationErrors.push({ field: 'image', message: 'Choose a JPG, PNG or WebP image.' })
    }
  } else if ((imageCategory === 'my' || imageCategory === 'default') && !imageUrl) {
    validationErrors.push({ field: 'image', message: 'Please select an image.' })
  }

  const errorFor = (field: string) =>
    showValidation ? validationErrors.find((error) => error.field === field)?.message : undefined

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    setShowValidation(true)
    if (validationErrors.length > 0) {
      setInvalidSubmitCount((count) => count + 1)
      return
    }

    updateMutation.mutate()
  }

  const previewUrl =
    imageCategory === 'upload'
      ? uploadedPreviewUrl
      : imageUrl
        ? getImageUrl(imageUrl)
        : null

  return (
    <Container className="question-form-page management-page my-4">
      <h1 className="mb-4">Update Question</h1>

      <Card className="border-warning">
        <Card.Body>
          <Alert variant="warning">
            <strong>Warning:</strong> Saving changes to this question permanently deletes all
            attempts, submitted answers and scores for the entire challenge, even if you only
            change the text or image. This also removes those results from the leaderboards.
            Saving without changes keeps all results.
          </Alert>

          {(errorMessage || (showValidation && validationErrors.length > 0)) && (
            <Alert ref={errorSummaryRef} tabIndex={-1} variant="danger" role="alert" aria-label="Validation summary">
              <strong>Please correct the following errors:</strong>
              {showValidation && validationErrors.length > 0 && (
                <ul className="mb-0 mt-2">
                  {validationErrors.map(({ field, message }) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              )}
              {errorMessage && <div className="mt-2">{errorMessage}</div>}
            </Alert>
          )}

          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="questionTitle">
              <Form.Label>
                Title <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                required
                maxLength={150}
                isInvalid={Boolean(errorFor('title'))}
                aria-invalid={Boolean(errorFor('title'))}
                aria-describedby={errorFor('title') ? 'question-title-error' : undefined}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              {errorFor('title') && (
                <Form.Control.Feedback id="question-title-error" type="invalid">
                  {errorFor('title')}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="questionType">
              <Form.Label>
                Question Type <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={questionType}
                onChange={(event) =>
                  handleQuestionTypeChange(
                    event.target.value as QuestionType
                  )
                }
                aria-describedby="questionTypeHelp"
              >
                <option value="SingleChoice">Single Choice</option>
                <option value="MultipleChoice">Multiple Choice</option>
                <option value="ShortAnswer">Short Answer</option>
              </Form.Select>
              <Form.Text id="questionTypeHelp">
                {questionType === 'SingleChoice'
                  ? 'Select one correct answer.'
                  : questionType === 'MultipleChoice'
                    ? 'Select one or more correct answers.'
                    : 'Enter one or more accepted answers.'}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="descriptionSelect">
              <Form.Label>Description</Form.Label>
              <Form.Select
                value={descriptionChoice}
                onChange={(event) =>
                  setDescriptionChoice(event.target.value)
                }
              >
                <option value="">-- No description --</option>
                {descriptionChoices.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
                <option value="custom">Custom description...</option>
              </Form.Select>

              {descriptionChoice === 'custom' && (
                <div className="mt-2">
                  <Form.Label htmlFor="customDescription">
                    Custom description
                  </Form.Label>
                  <Form.Control
                    id="customDescription"
                    maxLength={500}
                    value={customDescription}
                    onChange={(event) =>
                      setCustomDescription(event.target.value)
                    }
                    placeholder="Enter description"
                  />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="questionExplanation">
              <Form.Label>Explanation (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={1000}
                value={explanation}
                onChange={(event) =>
                  setExplanation(event.target.value)
                }
                placeholder="Explain why the answer is correct"
              />
              <Form.Text>
                This explanation is shown after the challenge has been
                submitted.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="questionPoints">
              <Form.Label>
                Points <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                required
                min={1}
                max={100}
                step={1}
                isInvalid={Boolean(errorFor('points'))}
                aria-invalid={Boolean(errorFor('points'))}
                aria-describedby={errorFor('points') ? 'question-points-error' : undefined}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
              />
              {errorFor('points') && (
                <Form.Control.Feedback id="question-points-error" type="invalid">
                  {errorFor('points')}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="imageCategory">
              <Form.Label>Image</Form.Label>
              <Form.Select
                value={imageCategory}
                onChange={(event) =>
                  handleCategoryChange(
                    event.target.value as ImageCategory
                  )
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
                  <Form.Label htmlFor="questionImageUpload">
                    Choose image
                  </Form.Label>
                  <Form.Control
                    id="questionImageUpload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(event) => {
                      const input =
                        event.currentTarget as HTMLInputElement
                      setImageFile(input.files?.[0] ?? null)
                      setUploadedPreviewUrl(null)
                    }}
                  />
                  <Form.Text>
                    JPG, PNG or WebP. Maximum 5 MB.
                  </Form.Text>
                </div>
              )}

              {imageCategory === 'my' && (
                <div className="mt-3">
                  <Form.Label htmlFor="myImageSelect">
                    My Images
                  </Form.Label>
                  {myImagesQuery.isPending ? (
                    <Spinner animation="border" size="sm" />
                  ) : myImagesQuery.isError ? (
                    <Alert variant="danger">
                      Could not load your images.
                    </Alert>
                  ) : (
                    <Form.Select
                      id="myImageSelect"
                      value={imageUrl}
                      onChange={(event) =>
                        setImageUrl(event.target.value)
                      }
                    >
                      <option value="">-- Select image --</option>
                      {myImages.map((image) => (
                        <option
                          key={image.userImageId}
                          value={image.imageUrl}
                        >
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
                    <Alert variant="danger">
                      Could not load default images.
                    </Alert>
                  ) : (
                    <Form.Select
                      id="defaultImageSelect"
                      value={imageUrl}
                      onChange={(event) =>
                        setImageUrl(event.target.value)
                      }
                    >
                      <option value="">-- Select image --</option>
                      {defaultImages.map((image) => (
                        <option
                          key={image.defaultImageId}
                          value={image.imageUrl}
                        >
                          {image.name}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </div>
              )}

              {previewUrl && (
                <div className="mt-3">
                  <img
                    src={previewUrl}
                    alt=""
                    className="question-image-preview"
                  />
                </div>
              )}
              {errorFor('image') && (
                <div className="invalid-feedback d-block" role="alert">
                  {errorFor('image')}
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="challengeTitle">
              <Form.Label>Challenge</Form.Label>
              <Form.Control readOnly value={challengeTitle} />
            </Form.Group>

            <hr />

            {questionType === 'ShortAnswer' ? (
              <fieldset>
                <legend className="fs-4">Accepted Answers</legend>
                {errorFor('answers') && (
                  <div className="invalid-feedback d-block" role="alert">{errorFor('answers')}</div>
                )}
                <p className="text-muted">
                  Enter between 1 and 4 accepted answers.
                </p>

                {acceptedAnswers.map((answer, index) => (
                  <Form.Group
                    className="mb-3"
                    key={index}
                    controlId={`acceptedAnswer${index}`}
                  >
                    <Form.Label>
                      Accepted Answer {index + 1}
                    </Form.Label>
                    <Form.Control
                      maxLength={200}
                      value={answer}
                      onChange={(event) =>
                        handleAcceptedAnswerChange(
                          index,
                          event.target.value
                        )
                      }
                    />
                  </Form.Group>
                ))}
              </fieldset>
            ) : (
              <fieldset>
                <legend className="fs-4">Answer Options</legend>
                {errorFor('answers') && (
                  <div className="invalid-feedback d-block" role="alert">{errorFor('answers')}</div>
                )}
                <p className="text-muted">
                  Enter between 2 and 4 answer options.
                </p>

                {options.map((option, index) => (
                  <Form.Group className="mb-3" key={index}>
                    <Form.Label htmlFor={`option${index}`}>
                      Option {index + 1}
                    </Form.Label>
                    <Form.Control
                      id={`option${index}`}
                      maxLength={200}
                      value={option.text}
                      onChange={(event) =>
                        handleOptionTextChange(
                          index,
                          event.target.value
                        )
                      }
                    />
                    <Form.Check
                      className="mt-1"
                      id={`correctOption${index}`}
                      type={
                        questionType === 'SingleChoice'
                          ? 'radio'
                          : 'checkbox'
                      }
                      name={
                        questionType === 'SingleChoice'
                          ? 'correctOption'
                          : undefined
                      }
                      // Screen readers hear "Mark option N as correct answer"; the visible text stays short.
                      label={
                        <>
                          <span className="visually-hidden">Mark option {index + 1} as </span>
                          Correct answer
                        </>
                      }
                      checked={option.isCorrect}
                      onChange={(event) =>
                        handleCorrectChange(
                          index,
                          event.target.checked
                        )
                      }
                    />
                  </Form.Group>
                ))}
              </fieldset>
            )}

            <div className="d-flex gap-2 mt-4">
              <Button
                type="submit"
                variant="outline-warning"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending
                  ? 'Saving...'
                  : 'Save Changes'}
              </Button>

              <Link
                to={returnUrl ?? `/challenges/${challengeId}`}
                className="btn btn-outline-primary"
              >
                Cancel
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}

const EditQuestionPage = () => {
  usePageTitle('Update Question')
  const { id, questionId: questionIdParam } = useParams()

  const challengeId = Number(id)
  const questionId = Number(questionIdParam)

  const validIds =
    Number.isInteger(challengeId) &&
    challengeId > 0 &&
    Number.isInteger(questionId) &&
    questionId > 0

  const challengeQuery = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => ChallengeService.getChallenge(challengeId),
    enabled: validIds,
    retry: false,
  })

  const questionQuery = useQuery({
    queryKey: ['question', challengeId, questionId],
    queryFn: () =>
      QuestionService.getQuestion(challengeId, questionId),
    enabled: validIds,
    retry: false,
  })

  if (!validIds) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Invalid challenge or question ID.
        </Alert>
      </Container>
    )
  }

  if (challengeQuery.isPending || questionQuery.isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading question...</p>
      </Container>
    )
  }

  if (challengeQuery.isError || questionQuery.isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load question.
        </Alert>
        <Link to={`/challenges/${challengeId}`}>
          Back to Challenge
        </Link>
      </Container>
    )
  }

  if (!challengeQuery.data || !questionQuery.data) {
    return (
      <Container className="mt-4">
        <Alert variant="info">Question not found.</Alert>
      </Container>
    )
  }

  return (
    <EditForm
      key={questionQuery.data.questionId}
      question={questionQuery.data}
      challengeTitle={challengeQuery.data.title}
    />
  )
}

export default EditQuestionPage
