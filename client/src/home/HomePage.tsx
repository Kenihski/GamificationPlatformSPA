
import { Link } from 'react-router-dom'
import { Card, Col, Container, Row } from 'react-bootstrap'
import './HomePage.css'

const HomePage = () => {
  return (
    <Container className="home-page">
      <section className="home-hero text-center">
        <p className="home-subtitle">
          LEARN • CHALLENGE • IMPROVE
        </p>

        <h1 className="display-4">
          Welcome to the Challenge Hub
        </h1>

        <p className="lead">
          Test your knowledge, complete challenges
          and track your progress.
        </p>

        <div className="home-hero-actions">
          <Link to="/challenges" className="btn btn-primary btn-lg">
            Browse Challenges
          </Link>

          <button
            type="button"
            className="btn btn-outline-primary btn-lg"
            disabled
          >
            Register
          </button>
        </div>
      </section>

      <section className="home-section">
        <h2 className="mb-4">Featured Challenges</h2>
        <p className="text-secondary">
          Featured challenges will appear here.
        </p>
      </section>

      <section className="home-section">
        <Row className="g-4">
          <Col lg={6}>
            <Card className="home-ranking-card h-100">
              <Card.Body>
                <p className="home-ranking-label">
                  COMPETE &amp; IMPROVE
                </p>

                <h2>Core Leaderboard ⭐</h2>

                <p>Core Challenge results will appear here.</p>

                <Link
                  to="/leaderboard"
                  className="btn btn-outline-primary"
                >
                  View Core Leaderboard
                </Link>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="home-ranking-card h-100">
              <Card.Body>
                <p className="home-ranking-label">
                  UNLOCK ACHIEVEMENTS
                </p>

                <h2>Hall of Fame 🏆</h2>

                <p>Achievement rankings will appear here.</p>

                <Link
                  to="/hall-of-fame"
                  className="btn btn-outline-primary"
                >
                  View Hall of Fame
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="home-section">
        <h2 className="mb-4">How It Works</h2>

        <Row className="g-4">
          <Col md={6}>
            <Card className="home-feature-card h-100">
              <Card.Body>
                <h3>Core Challenges</h3>
                <p>
                  Official challenges with individual leaderboards.
                  Your first completed attempt also counts toward
                  the overall Core Leaderboard.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="home-feature-card h-100">
              <Card.Body>
                <h3>Community Challenges</h3>
                <p>
                  User-created challenges with individual leaderboards.
                  Results do not affect the overall Core Leaderboard.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="home-feature-card h-100">
              <Card.Body>
                <h3>Core Leaderboard</h3>
                <p>
                  An overall ranking combining results across Core
                  Challenges, normalized to 100 points per challenge.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="home-feature-card h-100">
              <Card.Body>
                <h3>Achievements &amp; Hall of Fame</h3>
                <p>
                  Unlock achievements to earn Achievement Points (AP).
                  Your total AP determines your Hall of Fame ranking.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>
    </Container>
  )
}

export default HomePage
