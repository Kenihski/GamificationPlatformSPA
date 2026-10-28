import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap'
import { Link } from 'react-router-dom'
import ImageService from '../services/ImageService'
import './MyImagesPage.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MyImagesPage = () => {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    data: images = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['my-images'],
    queryFn: ImageService.getMyImages,
  })

  const uploadMutation = useMutation({
    mutationFn: ImageService.uploadImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-images'] })
      setFile(null)
      setFileInputKey((key) => key + 1)
      setSuccessMessage('Image uploaded successfully.')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ImageService.deleteImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-images'] })
      setSuccessMessage('Image deleted successfully.')
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
    },
  })

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!file) {
      setErrorMessage('Please select an image.')
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Only JPG, PNG and WebP images are allowed.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('The image must be smaller than 5 MB.')
      return
    }

    uploadMutation.mutate(file)
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('Delete this image?')) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    deleteMutation.mutate(id)
  }

  return (
    <Container className="my-images-page mt-4 mb-5">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1>My Images</h1>
          <p className="text-secondary mb-0">
            Upload and manage images used in your challenges and questions.
          </p>
        </div>

        <Link to="/my-challenges" className="btn btn-outline-secondary">
          Back to My Challenges
        </Link>
      </div>

        {successMessage && (
        <Alert variant="success">
            {successMessage}
        </Alert>
        )}

      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h2 className="h5">Upload an image</h2>

          <Form onSubmit={handleUpload}>
            <Form.Group className="mb-3" controlId="imageFile">
              <Form.Label>
                Choose a JPG, PNG or WebP image (maximum 5 MiB)
              </Form.Label>
              <Form.Control
                key={fileInputKey}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                required
              />
            </Form.Group>

            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Image'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <h2 className="h4 mb-3">Uploaded images</h2>

      {isPending ? (
        <div role="status">
          <Spinner animation="border" size="sm" className="me-2" />
          Loading images...
        </div>
      ) : isError ? (
        <Alert variant="danger">
          Could not load your images: {error.message}
        </Alert>
      ) : images.length === 0 ? (
        <Alert variant="info">
          You have not uploaded any images yet.
        </Alert>
      ) : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {images.map((image) => {
            const isDeleting =
              deleteMutation.isPending &&
              deleteMutation.variables === image.userImageId

            return (
              <Col key={image.userImageId}>
                <Card className="h-100 shadow-sm my-images-card">
                  <div className="ratio ratio-4x3">
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${image.imageUrl}`}
                      alt={image.fileName}
                      className="w-100 h-100 object-fit-cover rounded-top"
                    />
                  </div>

                  <Card.Body className="d-flex flex-column gap-2">
                    <p className="card-text text-break mb-0">
                      {image.fileName}
                    </p>

                    <div className="mt-auto">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(image.userImageId)}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Image'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </Container>
  )
}

export default MyImagesPage
