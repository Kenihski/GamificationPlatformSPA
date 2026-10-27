
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Row, Spinner } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import LeaderboardService from '../services/LeaderboardService'
import HallOfFameService from '../services/HallOfFameService'
import './HomePage.css'

const HomeRankingCards = () => {
  const {
    data: coreLeaderboard,
    isPending: corePending,
    isError: coreError,
  } = useQuery({
    queryKey: ['core-leaderboard'],
    queryFn: LeaderboardService.getCoreLeaderboard,
  })

  const {
    data: hallOfFame,
    isPending: hallPending,
    isError: hallError,
  } = useQuery({
    queryKey: ['hall-of-fame'],
    queryFn: HallOfFameService.getAll,
  })

  return (
    <section className="home-section">
      <Row className="g-4">
        <Col lg={6}>
          <Card className="home-ranking-card h-100">
            <Card.Body>
              <div className="home-ranking-header">
                <div>
                  <p className="home-ranking-label">
                    COMPETE &amp; IMPROVE
                  </p>
                  <h2>Core Leaderboard</h2>
                </div>

                <span className="home-ranking-symbol" aria-hidden="true">
                  ⭐
                </span>
              </div>

              {corePending ? (
                <div role="status" className="home-ranking-empty">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Loading results...</span>
                </div>
              ) : coreError ? (
                <p className="home-ranking-empty">
                  Could not load Core Leaderboard results.
                </p>
              ) : coreLeaderboard.entries.length > 0 ? (
                <div className="home-ranking-list">
                  {coreLeaderboard.entries.slice(0, 5).map((entry) => (
                    <div
                      className="home-ranking-entry"
                      key={entry.userId}
                    >
                      <div className="home-ranking-user">
                        <span className="home-ranking-position">
                          {entry.rank}
                        </span>

                        <span>{entry.username}</span>
                      </div>

                      <strong>
                        {entry.totalPoints.toLocaleString('en-US', {
                          maximumFractionDigits: 1,
                        })}{' '}
                        pts
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="home-ranking-empty">
                  No Core Challenge results yet.
                </p>
              )}

              <Link
                to="/leaderboard"
                className="btn btn-outline-primary home-ranking-button"
              >
                View Core Leaderboard
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="home-ranking-card h-100">
            <Card.Body>
              <div className="home-ranking-header">
                <div>
                  <p className="home-ranking-label">
                    UNLOCK ACHIEVEMENTS
                  </p>
                  <h2>Hall of Fame</h2>
                </div>

                <span className="home-ranking-symbol" aria-hidden="true">
                  🏆
                </span>
              </div>

              {hallPending ? (
                <div role="status" className="home-ranking-empty">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Loading results...</span>
                </div>
              ) : hallError ? (
                <p className="home-ranking-empty">
                  Could not load Hall of Fame results.
                </p>
              ) : hallOfFame.users.length > 0 ? (
                <div className="home-ranking-list">
                  {hallOfFame.users.slice(0, 5).map((entry) => (
                    <div
                      className="home-ranking-entry"
                      key={entry.userId}
                    >
                      <div className="home-ranking-user">
                        <span className="home-ranking-position">
                          {entry.rank}
                        </span>

                        <span>{entry.username}</span>
                      </div>

                      <strong>
                        {entry.achievementPoints} AP
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="home-ranking-empty">
                  No achievement results yet.
                </p>
              )}

              <Link
                to="/hall-of-fame"
                className="btn btn-outline-primary home-ranking-button"
              >
                View Hall of Fame
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </section>
  )
}

export default HomeRankingCards
