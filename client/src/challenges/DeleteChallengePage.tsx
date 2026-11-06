import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ChallengeService from '../services/ChallengeService'
import '../questions/QuestionFormPage.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageSource = (url: string) =>
  /^https?:\/\//i.test(url)
    ? url
    : `${apiBaseUrl}/${url.replace(/^\/+/, '')}`

const DeleteChallengePage = () => {
  const { id } = useParams()
  const challengeId = Number(id)
  const validId = Number.isInteger(challengeId) && challengeId > 0
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: challenge, isPending, isError } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => ChallengeService.getChallenge(challengeId),
    enabled: validId,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: () => ChallengeService.deleteChallenge(challengeId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] }),
      ])
      navigate('/my-challenges')
    },
  })

  if (!validId) {
    return <Container className="py-4"><Alert variant="danger">Invalid challenge ID.</Alert></Container>
  }

  if (isPending) {
    return <Container className="text-center mt-5" role="status"><Spinner animation="border" /><p className="mt-2">Loading challenge...</p></Container>
  }

  if (isError || !challenge) {
    return <Container className="py-4"><Alert variant="danger">Could not load challenge.</Alert><Link to="/my-challenges">Back to My Challenges</Link></Container>
  }

  const canManage = Boolean(user && (
    user.roles.includes('Admin') || user.userId === challenge.createdByUserId
  ))

  if (!canManage) {
    return <Container className="py-4"><Alert variant="danger" role="alert">You do not have permission to delete this challenge.</Alert><Link to="/my-challenges">Back to My Challenges</Link></Container>
  }

  return (
    <Container className="question-form-page management-page my-4">
      <h1 className="mb-4">Delete Challenge</h1>
      <p className="text-muted">Review the details and consequences before confirming deletion.</p>
      <Card className="border-danger">
        <Card.Body>
          <div className="mb-4">
            <h2 className="h4 mb-3">{challenge.title}</h2>
            <dl className="row mb-0">
              <dt className="col-sm-3">Challenge Id</dt><dd className="col-sm-9">{challenge.challengeId}</dd>
              <dt className="col-sm-3">Title</dt><dd className="col-sm-9">{challenge.title}</dd>
              <dt className="col-sm-3">Description</dt><dd className="col-sm-9">{challenge.description}</dd>
              <dt className="col-sm-3">Max Points</dt><dd className="col-sm-9">{challenge.maxPoints}</dd>
              <dt className="col-sm-3">Time Limit</dt><dd className="col-sm-9">{challenge.timeLimitMinutes == null ? 'Unlimited' : `${challenge.timeLimitMinutes} minutes`}</dd>
              <dt className="col-sm-3">Image</dt>
              <dd className="col-sm-9">
                {challenge.imageUrl
                  ? <img src={getImageSource(challenge.imageUrl)} alt="" className="img-fluid rounded" style={{ maxWidth: 250 }} />
                  : <span className="text-muted">No image selected</span>}
              </dd>
            </dl>
          </div>

          <Alert variant="danger">
            <strong>Warning:</strong> Deleting this challenge permanently removes its questions, answer options, attempts, submitted answers and scores. Its results will also be removed from the leaderboards.
            <div className="mt-2">Are you sure you want to delete this challenge?</div>
          </Alert>

          {deleteMutation.isError && (
            <Alert variant="danger" role="alert">Could not delete challenge: {deleteMutation.error.message}</Alert>
          )}

          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-danger" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? 'Deleting...' : 'Confirm deletion'}
            </Button>
            <Link to="/my-challenges" className="btn btn-outline-primary">Cancel</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default DeleteChallengePage
