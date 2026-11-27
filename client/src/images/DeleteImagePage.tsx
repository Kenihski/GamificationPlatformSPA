import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ImageService from '../services/ImageService'
import { getSafeReturnUrl } from '../shared/returnUrl'

type DeleteImagePageProps = {
  // Default images belong to the admin library; user images to a user's library.
  isDefaultImage?: boolean
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageSource = (url: string) =>
  url.startsWith('http') ? url : `${apiBaseUrl}/${url.replace(/^\/+/, '')}`

// Shared confirmation page for deleting library images, as ConfirmDelete in Subapp 1.
const DeleteImagePage = ({ isDefaultImage = false }: DeleteImagePageProps) => {
  const { id } = useParams()
  const imageId = Number(id)
  const validId = Number.isInteger(imageId) && imageId > 0
  const { user } = useAuth()
  const isAdmin = user?.roles.includes('Admin') ?? false
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const returnUrl =
    getSafeReturnUrl(searchParams.get('returnUrl')) ??
    (isDefaultImage || isAdmin ? '/admin/images' : '/my-images')

  // The deletion impact lists the challenges whose cover changes to Question 1.
  const impactQuery = useQuery({
    queryKey: ['image-deletion-impact', isDefaultImage, imageId],
    queryFn: async () => {
      if (isDefaultImage) {
        const info = await ImageService.getDefaultImageDeletionImpact(imageId)
        return { protectedFallback: info.protectedFallback, impact: info.impact }
      }
      return { protectedFallback: false, impact: await ImageService.getImageDeletionImpact(imageId) }
    },
    enabled: validId,
    retry: false,
  })

  // The image URL comes from the same lists the image pages use.
  const imageUrlQuery = useQuery({
    queryKey: ['image-delete-preview', isDefaultImage, isAdmin, imageId],
    queryFn: async () => {
      if (isDefaultImage) {
        const images = await ImageService.getDefaultImages()
        return images.find((image) => image.defaultImageId === imageId)?.imageUrl ?? null
      }
      const images = isAdmin
        ? (await ImageService.getAdminImages()).userImages
        : await ImageService.getMyImages()
      return images.find((image) => image.userImageId === imageId)?.imageUrl ?? null
    },
    enabled: validId,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      isDefaultImage
        ? ImageService.deleteDefaultImage(imageId)
        : ImageService.deleteImage(imageId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-images'] }),
        queryClient.invalidateQueries({ queryKey: ['my-images'] }),
        queryClient.invalidateQueries({ queryKey: ['default-images'] }),
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['my-challenges'] }),
      ])

      navigate(returnUrl, {
        state: {
          successMessage: isDefaultImage
            ? 'Default image deleted successfully.'
            : 'Image deleted successfully.',
        },
      })
    },
  })

  if (!validId) {
    return (
      <Container className="management-page my-4">
        <Alert variant="danger" role="alert">Invalid image ID.</Alert>
        <Link to={returnUrl}>Back to images</Link>
      </Container>
    )
  }

  if (impactQuery.isPending || imageUrlQuery.isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading image...</p>
      </Container>
    )
  }

  if (impactQuery.isError || !impactQuery.data) {
    return (
      <Container className="management-page my-4">
        <Alert variant="danger" role="alert">
          Could not load the image: {impactQuery.error?.message ?? 'Unknown error.'}
        </Alert>
        <Link to={returnUrl}>Back to images</Link>
      </Container>
    )
  }

  const { protectedFallback, impact } = impactQuery.data
  const imageUrl = imageUrlQuery.data

  // Images that cannot be deleted are explained here instead of on a confirmation form.
  const blockingMessage = protectedFallback
    ? 'Question 1 is the fallback image and cannot be deleted.'
    : impact.questions.length > 0
      ? `This image is used by ${impact.questions.length} question(s). Remove or replace it in those questions before deleting it.`
      : null

  return (
    <Container className="management-page my-4">
      <h1 className="mb-4">Delete Image</h1>

      <Card className="border-danger">
        <Card.Body>
          <h2 className="h4 text-break">{impact.imageName}</h2>

          {imageUrl && (
            <img
              src={getImageSource(imageUrl)}
              alt=""
              className="img-fluid rounded mb-3 d-block"
              style={{ maxHeight: 200, objectFit: 'contain' }}
            />
          )}

          {blockingMessage ? (
            <Alert variant="danger" role="alert">
              {blockingMessage}
              {impact.questions.length > 0 && (
                <>
                  <p className="mt-2 mb-1">Used in:</p>
                  <ul className="mb-0">
                    {impact.questions.map((question) => (
                      <li key={question.questionId}>
                        <Link to={`/challenges/${question.challengeId}/questions/${question.questionId}/edit`}>
                          {question.title} (edit question #{question.questionId})
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Alert>
          ) : (
            <Alert variant="danger">
              <p className="mb-0">
                Are you sure you want to permanently delete this image? This cannot be undone.
              </p>
              {impact.challenges.length > 0 && (
                <>
                  <p className="mt-2 mb-1">
                    This image is used as the challenge image for the following challenges.
                    Confirming deletion will replace it with Question 1 in each of them:
                  </p>
                  <ul className="mb-0">
                    {impact.challenges.map((challenge) => (
                      <li key={challenge.challengeId}>
                        <Link to={`/challenges/${challenge.challengeId}`}>
                          {challenge.title} (challenge #{challenge.challengeId})
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Alert>
          )}

          {deleteMutation.isError && (
            <Alert variant="danger" role="alert">
              Could not delete the image: {deleteMutation.error.message}
            </Alert>
          )}

          <div className="d-flex flex-wrap gap-2 mt-2">
            {!blockingMessage && (
              <Button
                variant="outline-danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm deletion'}
              </Button>
            )}

            <Link to={returnUrl} className="btn btn-outline-secondary">
              Cancel
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default DeleteImagePage
