
import { useQuery } from '@tanstack/react-query'
import { Alert, Container, Spinner } from 'react-bootstrap'
import AchievementService from '../services/AchievementService'
import HallOfFameService from '../services/HallOfFameService'
import './AchievementsPage.css'

interface AchievementsPageProps {
  userId?: number
}

const AchievementsPage = ({ userId }: AchievementsPageProps) => {
  const isPublic = userId !== undefined

  const { data, isPending, isError, error } = useQuery({
    queryKey: isPublic
      ? ['public-achievements', userId]
      : ['my-achievements'],
    queryFn: () =>
      isPublic
        ? HallOfFameService.getUserAchievements(userId)
        : AchievementService.getMine(),
    enabled: !isPublic || (Number.isInteger(userId) && userId > 0),
  })

  if (isPublic && (!Number.isInteger(userId) || userId <= 0)) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Invalid user ID.</Alert>
      </Container>
    )
  }

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading achievements...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Could not load achievements: {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="achievements-page py-4">
      <div className="achievement-header mb-4">
        <div className="achievement-header-top">
          <div>
            <h1 className="mb-1">
              {data.milestoneIcon} {data.milestoneName}
            </h1>

            <h5 className="text-muted mb-3">
              {data.username}'s Achievements
            </h5>

            <p className="milestone-message mb-0">
              {data.milestoneMessage}
            </p>
          </div>

          <div className="total-ap-box">
            <span className="total-ap-number">
              {data.totalPoints}
            </span>
            <span className="total-ap-label">AP</span>
          </div>
        </div>

        <hr />

        <div className="achievement-summary">
          <div>
            <strong>
              {data.unlockedCount} / {data.totalAchievements}
            </strong>{' '}
            Achievements Unlocked
          </div>

          <div>
            <strong>
              {data.totalPoints} / {data.maxPoints} AP
            </strong>
          </div>
        </div>

        <div className="mt-3">
          <div className="progress-label">
            {data.milestoneName === 'Legend' ? (
              <>
                <span>Maximum milestone reached</span>
                <span>100%</span>
              </>
            ) : (
              <>
                <span>Progress to next milestone</span>
                <span>
                  {data.totalPoints} / {data.nextMilestonePoints} AP
                </span>
              </>
            )}
          </div>

          <div className="progress achievement-progress">
            <div
              className="progress-bar"
              role="progressbar"
              aria-label="Achievement milestone progress"
              style={{ width: `${data.progressPercent}%` }}
              aria-valuenow={data.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h2>Achievements</h2>

        <p className="text-muted">
          Achievements are unlocked by completing challenges,
          improving scores and contributing to the community.
        </p>
      </div>

      <div className="achievement-list">
        {data.achievements.map((achievement) => {
          const rowClass = achievement.isUnlocked
            ? achievement.isGoal
              ? 'achievement-goal'
              : 'achievement-unlocked'
            : 'achievement-locked'

          return (
            <div
              className={`achievement-row ${rowClass}`}
              key={achievement.achievementId}
            >
              <div className="achievement-icon">
                {achievement.isUnlocked
                  ? achievement.isGoal
                    ? '⭐'
                    : '🏆'
                  : '🔒'}
              </div>

              <div className="achievement-content">
                <div className="achievement-name">
                  {achievement.name}
                </div>

                <div className="achievement-description">
                  {achievement.description}
                </div>

                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="achievement-date">
                    Unlocked{' '}
                    {new Date(achievement.unlockedAt).toLocaleDateString(
                      'nb-NO',
                      {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }
                    )}
                  </div>
                )}
              </div>

              <div className="achievement-points">
                {achievement.isGoal ? (
                  <span className="achievement-goal-label">
                    GOAL
                  </span>
                ) : (
                  <>
                    <span className="achievement-points-number">
                      {achievement.points}
                    </span>

                    <span className="achievement-points-label">
                      AP
                    </span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export default AchievementsPage
