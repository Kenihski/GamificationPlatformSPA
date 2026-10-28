import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  Modal,
  Row,
  Spinner,
  Tab,
  Tabs,
} from 'react-bootstrap'
import ImageService from '../services/ImageService'
import type {
  AdminUserImage,
  DefaultImage,
} from '../services/ImageService'
import './AdminImagesPage.css'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const AdminImagesPage = () => {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('default')
  const [showModal, setShowModal] = useState(false)
  const [imageName, setImageName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [renamedImages, setRenamedImages] = useState<Record<number, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    data,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-images'],
    queryFn: ImageService.getAdminImages,
  })

  const refreshImages = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-images'] }),
      queryClient.invalidateQueries({ queryKey: ['default-images'] }),
      queryClient.invalidateQueries({ queryKey: ['my-images'] }),
    ])
  }

  const showSuccess = (message: string) => {
    setErrorMessage(null)
    setSuccessMessage(message)
  }

  const showError = (error: Error) => {
    setSuccessMessage(null)
    setErrorMessage(error.message)
  }

  const uploadMutation = useMutation({
    mutationFn: ({ name, imageFile }: { name: string; imageFile: File }) =>
      ImageService.uploadDefaultImage(name, imageFile),
    onSuccess: async () => {
      await refreshImages()
      setShowModal(false)
      setImageName('')
      setFile(null)
      showSuccess('Image uploaded successfully.')
    },
    onError: showError,
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      ImageService.renameDefaultImage(id, name),
    onSuccess: async () => {
      await refreshImages()
      showSuccess('Default image renamed successfully.')
    },
    onError: showError,
  })

  const deleteDefaultMutation = useMutation({
    mutationFn: ImageService.deleteDefaultImage,
    onSuccess: async () => {
      await refreshImages()
      showSuccess('Image deleted successfully.')
    },
    onError: showError,
  })

  const deleteUserMutation = useMutation({
    mutationFn: ImageService.deleteImage,
    onSuccess: async () => {
      await refreshImages()
      setActiveTab('default')
      showSuccess('Image deleted successfully.')
    },
    onError: showError,
  })

  const isUpdating =
    uploadMutation.isPending ||
    renameMutation.isPending ||
    deleteDefaultMutation.isPending ||
    deleteUserMutation.isPending

  const handleUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!imageName.trim() || imageName.trim().length > 100) {
      setErrorMessage('Image name must contain between 1 and 100 characters.')
      return
    }

    if (!file) {
      setErrorMessage('Please select an image.')
      return
    }

    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      setErrorMessage('Choose a JPG, PNG or WebP image up to 5 MB.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    uploadMutation.mutate({ name: imageName.trim(), imageFile: file })
  }

  const handleRename = (
    event: FormEvent<HTMLFormElement>,
    image: DefaultImage
  ) => {
    event.preventDefault()

    const name = (renamedImages[image.defaultImageId] ?? image.name).trim()

    if (!name || name.length > 100) {
      setErrorMessage('Image name must contain between 1 and 100 characters.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    renameMutation.mutate({ id: image.defaultImageId, name })
  }

  const confirmDelete = () =>
    window.confirm(
      'Are you sure you want to permanently delete this image? ' +
      'It will also be removed from any challenges or questions that use it.'
    )

  const handleDeleteDefault = (id: number) => {
    if (!confirmDelete()) return

    setErrorMessage(null)
    setSuccessMessage(null)
    deleteDefaultMutation.mutate(id)
  }

  const handleDeleteUser = (id: number) => {
    if (!confirmDelete()) return

    setErrorMessage(null)
    setSuccessMessage(null)
    deleteUserMutation.mutate(id)
  }

  const imageUrl = (url: string) =>
    `${import.meta.env.VITE_API_BASE_URL}${url}`

  const renderUserImage = (image: AdminUserImage) => (
    <Col key={image.userImageId}>
      <Card className="admin-image-card shadow-sm position-relative">
        <div className="ratio ratio-4x3 bg-light rounded overflow-hidden">
          <img
            src={imageUrl(image.imageUrl)}
            alt={image.fileName}
            className="w-100 h-100 object-fit-cover"
          />
        </div>

        <Dropdown align="end" className="admin-image-options">
          <Dropdown.Toggle
            variant="light"
            size="sm"
            className="admin-image-options-button"
            aria-label="Image options"
          >
            &#8942;
          </Dropdown.Toggle>

          <Dropdown.Menu className="admin-image-options-menu p-3">
            <div className="small text-secondary mb-1">File name</div>
            <div className="fw-semibold text-break mb-3">
              {image.fileName}
            </div>

            <div className="small text-secondary mb-1">Uploaded by</div>
            <div className="fw-semibold mb-3">
              {image.userName ?? `User #${image.userId}`}
            </div>

            <Dropdown.Divider />

            <Button
              variant="outline-danger"
              size="sm"
              className="w-100"
              disabled={isUpdating}
              onClick={() => handleDeleteUser(image.userImageId)}
            >
              Delete Image
            </Button>
          </Dropdown.Menu>
        </Dropdown>
      </Card>
    </Col>
  )

  const renderDefaultImage = (image: DefaultImage) => (
    <Col key={image.defaultImageId}>
      <Card className="admin-image-card shadow-sm position-relative">
        <div className="ratio ratio-4x3 bg-light rounded overflow-hidden">
          <img
            src={imageUrl(image.imageUrl)}
            alt={image.name}
            className="w-100 h-100 object-fit-cover"
          />
        </div>

        <Dropdown align="end" className="admin-image-options">
          <Dropdown.Toggle
            variant="light"
            size="sm"
            className="admin-image-options-button"
            aria-label="Image options"
          >
            &#8942;
          </Dropdown.Toggle>

          <Dropdown.Menu className="admin-image-options-menu p-3">
            <div className="small text-secondary mb-1">Image name</div>
            <div className="fw-semibold text-break mb-3">
              {image.name}
            </div>

            <div className="small text-secondary mb-1">File name</div>
            <div className="fw-semibold text-break mb-3">
              {image.fileName}
            </div>

            <Dropdown.Divider />

            <Form
              onSubmit={(event) => handleRename(event, image)}
              className="mb-2"
            >
              <Form.Label
                className="small"
                htmlFor={`image-name-${image.defaultImageId}`}
              >
                Rename image
              </Form.Label>

              <Form.Control
                id={`image-name-${image.defaultImageId}`}
                size="sm"
                className="mb-2"
                maxLength={100}
                required
                value={renamedImages[image.defaultImageId] ?? image.name}
                onChange={(event) =>
                  setRenamedImages((current) => ({
                    ...current,
                    [image.defaultImageId]: event.target.value,
                  }))
                }
              />

              <Button
                type="submit"
                variant="outline-primary"
                size="sm"
                className="w-100"
                disabled={isUpdating}
              >
                Save Name
              </Button>
            </Form>

            <Dropdown.Divider />

            <Button
              variant="outline-danger"
              size="sm"
              className="w-100"
              disabled={isUpdating}
              onClick={() => handleDeleteDefault(image.defaultImageId)}
            >
              Delete Image
            </Button>
          </Dropdown.Menu>
        </Dropdown>
      </Card>
    </Col>
  )

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading images...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load images: {error.message}
        </Alert>
      </Container>
    )
  }

  const userImages = data?.userImages ?? []
  const defaultImages = data?.defaultImages ?? []

  return (
    <Container className="admin-images-page mt-3">
      <div className="mb-4">
        <h1 className="h2 mb-1">Manage Images</h1>
        <p className="text-secondary mb-0">
          View and manage uploaded and default images.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="danger">
          {errorMessage}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key ?? 'default')}
        className="mb-4 admin-images-tabs"
      >
        <Tab
          eventKey="user"
          title={`User Images (${userImages.length})`}
        >
          {userImages.length === 0 ? (
            <div className="admin-images-empty text-center py-5 rounded">
              <h5>No uploaded images</h5>
              <p className="mb-0">
                Images uploaded by users will appear here.
              </p>
            </div>
          ) : (
            <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
              {userImages.map(renderUserImage)}
            </Row>
          )}
        </Tab>

        <Tab
          eventKey="default"
          title={`Default Images (${defaultImages.length})`}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <p className="text-secondary mb-0">
              Images available to all users.
            </p>

            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
            >
              + Add Image
            </Button>
          </div>

          {defaultImages.length === 0 ? (
            <div className="admin-images-empty text-center py-5 rounded">
              <h5>No default images</h5>
              <p className="mb-0">
                Add a default image to make it available to all users.
              </p>
            </div>
          ) : (
            <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
              {defaultImages.map(renderDefaultImage)}
            </Row>
          )}
        </Tab>
      </Tabs>

      <Modal
        show={showModal}
        onHide={() => {
          if (!uploadMutation.isPending) setShowModal(false)
        }}
        data-bs-theme="dark"
        className="admin-images-modal"
      >
        <Form onSubmit={handleUpload}>
          <Modal.Header closeButton>
            <Modal.Title>Add Default Image</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3" controlId="defaultImageName">
              <Form.Label>Image Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Programming"
                maxLength={100}
                value={imageName}
                onChange={(event) => setImageName(event.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="defaultImageFile">
              <Form.Label>Choose Image</Form.Label>
              <Form.Control
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  const input = event.target as HTMLInputElement
                  setFile(input.files?.[0] ?? null)
                }}
                required
              />
              <Form.Text>
                JPG, PNG or WebP. Maximum 5 MB.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              disabled={uploadMutation.isPending}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Add Image'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default AdminImagesPage
