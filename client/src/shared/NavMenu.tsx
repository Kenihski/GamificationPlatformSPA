import { useState } from 'react'
import {
  Button,
  Container,
  Modal,
  Nav,
  Navbar,
  Offcanvas,
} from 'react-bootstrap'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAuthModal } from '../auth/AuthModalContext'
import LoginForm from '../auth/LoginForm'
import RegisterForm from '../auth/RegisterForm'
import MatrixBackground from './MatrixBackground'
import './NavMenu.css'

const NavMenu = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const {
    showLogin,
    showRegister,
    openLogin,
    openRegister,
    closeLogin,
    closeRegister,
  } = useAuthModal()

  const { user, isAuthenticated, logout } = useAuth()
  const isAdmin = user?.roles.includes('Admin') ?? false
  const navigate = useNavigate()
  const location = useLocation()

  const closeMenu = () => setShowMenu(false)

  const handleRegistrationSuccess = () => {
    closeRegister()
    setRegistrationSuccess(true)
    openLogin()
  }

  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/', {
      state: { message: 'You have been logged out successfully.' },
    })
  }

  const isAccountPage =
    location.pathname === '/login' ||
    location.pathname === '/register'

  return (
    <>
      <Navbar className="site-navbar" data-bs-theme="dark">
        <Container fluid>
          <button
            type="button"
            className="navbar-toggler me-3"
            onClick={() => setShowMenu(true)}
            aria-label="Open navigation menu"
            aria-controls="sidebar-menu"
            aria-expanded={showMenu}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <Navbar.Brand as={Link} to="/" className="me-auto">
            Learning Challenge Hub
          </Navbar.Brand>

          <Nav className="align-items-center gap-3">
            <MatrixBackground />

            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3">
                <span className="nav-link navbar-welcome">
                  Welcome, {user?.username}
                </span>

                <Button
                  variant="link"
                  className="nav-link"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              !isAccountPage && (
                <Button
                  variant="primary"
                  className="d-flex align-items-center gap-2"
                  onClick={() => {
                    setRegistrationSuccess(false)
                    openLogin()
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 17l5-5-5-5M15 12H3m9-9h6a3 3 0 013 3v12a3 3 0 01-3 3h-6"
                    />
                  </svg>
                  Login
                </Button>
              )
            )}
          </Nav>
        </Container>
      </Navbar>

      <Offcanvas
        id="sidebar-menu"
        show={showMenu}
        onHide={closeMenu}
        placement="start"
        className="site-sidebar"
        aria-labelledby="sidebar-menu-title"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title id="sidebar-menu-title">
            Learning Challenge Hub
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column">
          <h6 className="sidebar-heading text-muted fw-bold px-3 mb-3">
            Explore
          </h6>

          <Nav className="flex-column">
            <Nav.Link as={NavLink} to="/" end onClick={closeMenu}>
              Home
            </Nav.Link>

            <Nav.Link
              as={NavLink}
              to="/challenges"
              onClick={closeMenu}
            >
              Challenges
            </Nav.Link>

            <Nav.Link
              as={NavLink}
              to="/hall-of-fame"
              onClick={closeMenu}
            >
              Hall of Fame
            </Nav.Link>

            <Nav.Link
              as={NavLink}
              to="/leaderboard"
              onClick={closeMenu}
            >
              Core Leaderboard
            </Nav.Link>
          </Nav>

          {isAuthenticated && (
            <>
              <hr className="my-3" />

              <h6 className="sidebar-heading text-muted fw-bold px-3 mb-3">
                {isAdmin ? 'My Workspace' : 'My Learning'}
              </h6>

              <Nav className="flex-column">
                <Nav.Link
                  as={NavLink}
                  to="/my-challenges"
                  onClick={closeMenu}
                >
                  My Challenges
                </Nav.Link>

                <Nav.Link
                  as={NavLink}
                  to="/challenges/create"
                  onClick={closeMenu}
                >
                  Create Challenge
                </Nav.Link>

                <Nav.Link
                  as={NavLink}
                  to="/my-images"
                  onClick={closeMenu}
                >
                  My Images
                </Nav.Link>

                {!isAdmin && (
                  <Nav.Link
                    as={NavLink}
                    to="/achievements"
                    onClick={closeMenu}
                  >
                    Achievements
                  </Nav.Link>
                )}
              </Nav>
            </>
          )}

          {isAdmin && (
            <>
              <hr className="my-3" />

              <h6 className="sidebar-heading text-muted fw-bold px-3 mb-3">
                Administration
              </h6>

              <Nav className="flex-column">
                <Nav.Link
                  as={NavLink}
                  to="/admin/users"
                  onClick={closeMenu}
                >
                  Users
                </Nav.Link>

                <Nav.Link
                  as={NavLink}
                  to="/admin/questions"
                  onClick={closeMenu}
                >
                  Questions
                </Nav.Link>

                <Nav.Link
                  as={NavLink}
                  to="/admin/achievements"
                  onClick={closeMenu}
                >
                  Achievements
                </Nav.Link>

                <Nav.Link
                  as={NavLink}
                  to="/admin/images"
                  onClick={closeMenu}
                >
                  Images
                </Nav.Link>
              </Nav>
            </>
          )}

          <div className="site-sidebar-footer">
            <Nav.Link
              as={NavLink}
              to="/about"
              onClick={closeMenu}
              className="d-flex align-items-center gap-2"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              About
            </Nav.Link>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal
        show={showLogin}
        onHide={closeLogin}
        centered
        data-bs-theme="dark"
        className="auth-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {registrationSuccess && (
            <div className="alert alert-success">
              Registration successful. Please log in.
            </div>
          )}

          <LoginForm
            modal
            onSuccess={() => {
              closeLogin()
              setRegistrationSuccess(false)
            }}
          />

          <p className="text-center mt-3 mb-0">
            Don't have an account?{' '}
            <button
              type="button"
              className="btn btn-link p-0 align-baseline"
              onClick={openRegister}
            >
              Register here
            </button>
          </p>
        </Modal.Body>
      </Modal>

      <Modal
        show={showRegister}
        onHide={closeRegister}
        centered
        data-bs-theme="dark"
        className="auth-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Account</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <RegisterForm
            modal
            onSuccess={handleRegistrationSuccess}
          />

          <p className="text-center mt-3 mb-0">
            Already have an account?{' '}
            <button
              type="button"
              className="btn btn-link p-0 align-baseline"
              onClick={() => {
                setRegistrationSuccess(false)
                openLogin()
              }}
            >
              Login here
            </button>
          </p>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default NavMenu
