
import { useState } from 'react'
import { Button, Container, Modal, Nav, Navbar, Offcanvas } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LoginForm from '../auth/LoginForm'
import './NavMenu.css'

const NavMenu = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const { user, isAuthenticated, logout } = useAuth()
  const isAdmin = user?.roles.includes('Admin') ?? false

  const closeMenu = () => setShowMenu(false)

  const handleLogout = () => {
    logout()
    closeMenu()
  }

  return (
    <>
      <Navbar className="site-navbar" variant="dark">
        <Container fluid>
          <Button
            variant="outline-light"
            className="me-3 menu-toggle"
            onClick={() => setShowMenu(true)}
            aria-label="Open navigation menu"
            aria-controls="sidebar-menu"
          >
            <span className="navbar-toggler-icon" />
          </Button>

          <Navbar.Brand as={Link} to="/" className="me-auto">
            Learning Challenge Hub
          </Navbar.Brand>

          <Nav className="align-items-center">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3">
                <span className="navbar-welcome">
                  Welcome, {user?.username}
                </span>

                <Button variant="outline-light" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="primary" onClick={() => setShowLogin(true)}>
                Login
              </Button>
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
          <h6 className="sidebar-heading">Explore</h6>

          <Nav className="flex-column">
            <Nav.Link as={NavLink} to="/" end onClick={closeMenu}>
              Home
            </Nav.Link>

            <Nav.Link as={NavLink} to="/challenges" onClick={closeMenu}>
              Challenges
            </Nav.Link>

            <Nav.Link as={NavLink} to="/hall-of-fame" onClick={closeMenu}>
              Hall of Fame
            </Nav.Link>

            <Nav.Link as={NavLink} to="/leaderboard" onClick={closeMenu}>
              Core Leaderboard
            </Nav.Link>
          </Nav>

          {isAuthenticated && (
            <>
              <hr className="my-3" />

              <h6 className="sidebar-heading">
                {isAdmin ? 'My Workspace' : 'My Learning'}
              </h6>

              <Nav className="flex-column">
                <Nav.Link as={NavLink} to="/my-challenges" onClick={closeMenu}>
                  My Challenges
                </Nav.Link>

                <Nav.Link as={NavLink} to="/challenges/create" onClick={closeMenu}>
                  Create Challenge
                </Nav.Link>

                <Nav.Link as={NavLink} to="/my-images" onClick={closeMenu}>
                  My Images
                </Nav.Link>

                {!isAdmin && (
                  <Nav.Link as={NavLink} to="/achievements" onClick={closeMenu}>
                    Achievements
                  </Nav.Link>
                )}
              </Nav>
            </>
          )}

          {isAdmin && (
            <>
              <hr className="my-3" />

              <h6 className="sidebar-heading">Administration</h6>

              <Nav className="flex-column">
                <Nav.Link as={NavLink} to="/admin/users" onClick={closeMenu}>
                  Users
                </Nav.Link>

                <Nav.Link as={NavLink} to="/admin/questions" onClick={closeMenu}>
                  Questions
                </Nav.Link>

                <Nav.Link as={NavLink} to="/admin/achievements" onClick={closeMenu}>
                  Achievements
                </Nav.Link>

                <Nav.Link as={NavLink} to="/admin/images" onClick={closeMenu}>
                  Images
                </Nav.Link>
              </Nav>
            </>
          )}

          <div className="sidebar-footer mt-auto">
            <Nav.Link as={NavLink} to="/about" onClick={closeMenu}>
              About
            </Nav.Link>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <Modal
        show={showLogin}
        onHide={() => setShowLogin(false)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <LoginForm onSuccess={() => setShowLogin(false)} />

          <p className="text-center mt-3 mb-0">
            Don't have an account?{' '}
            <span className="text-secondary">
              Registration coming soon.
            </span>
          </p>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default NavMenu
