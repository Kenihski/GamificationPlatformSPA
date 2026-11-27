import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import NavMenu from './shared/NavMenu'
import AchievementNotifications from './achievements/AchievementNotifications'
import ProtectedRoute from './auth/ProtectedRoute'
import { AuthModalProvider } from './auth/AuthModalContext'

// Load pages only when they are needed.
const HomePage = lazy(() => import('./home/HomePage'))
const AboutPage = lazy(() => import('./home/AboutPage'))
const NotFoundPage = lazy(() => import('./shared/NotFoundPage'))
const LoginPage = lazy(() => import('./auth/LoginPage'))
const RegisterPage = lazy(() => import('./auth/RegisterPage'))

const ChallengeListPage = lazy(
  () => import('./challenges/ChallengeListPage')
)
const ChallengeDetailsPage = lazy(
  () => import('./challenges/ChallengeDetailsPage')
)
const MyChallengesPage = lazy(
  () => import('./challenges/MyChallengesPage')
)
const CreateChallengePage = lazy(
  () => import('./challenges/CreateChallengePage')
)
const EditChallengePage = lazy(
  () => import('./challenges/EditChallengePage')
)
const DeleteChallengePage = lazy(
  () => import('./challenges/DeleteChallengePage')
)

const CreateQuestionPage = lazy(
  () => import('./questions/CreateQuestionPage')
)
const EditQuestionPage = lazy(
  () => import('./questions/EditQuestionPage')
)
const DeleteQuestionPage = lazy(
  () => import('./questions/DeleteQuestionPage')
)
const AdminQuestionsPage = lazy(
  () => import('./questions/AdminQuestionsPage')
)

const QuizPage = lazy(() => import('./quiz/QuizPage'))
const QuizResultPage = lazy(
  () => import('./quiz/QuizResultPage')
)

const AchievementsPage = lazy(
  () => import('./achievements/AchievementsPage')
)
const AdminAchievementsPage = lazy(
  () => import('./achievements/AdminAchievementsPage')
)
const CreateAchievementPage = lazy(
  () => import('./achievements/CreateAchievementPage')
)
const EditAchievementPage = lazy(
  () => import('./achievements/EditAchievementPage')
)
const DeleteAchievementPage = lazy(
  () => import('./achievements/DeleteAchievementPage')
)

const HallOfFamePage = lazy(
  () => import('./halloffame/HallOfFamePage')
)
const PublicAchievementsPage = lazy(
  () => import('./halloffame/PublicAchievementsPage')
)

const ChallengeLeaderboardPage = lazy(
  () => import('./leaderboard/ChallengeLeaderboardPage')
)
const CoreLeaderboardPage = lazy(
  () => import('./leaderboard/CoreLeaderboardPage')
)

const MyImagesPage = lazy(() => import('./images/MyImagesPage'))
const AdminImagesPage = lazy(
  () => import('./images/AdminImagesPage')
)
const DeleteImagePage = lazy(() => import('./images/DeleteImagePage'))

const AdminUsersPage = lazy(
  () => import('./users/AdminUsersPage')
)
const AdminUserDetailsPage = lazy(
  () => import('./users/AdminUserDetailsPage')
)

// Reset scroll and keyboard focus on page changes, not on query or hash changes.
// A full page load in Subapp 1 starts at the top, so the next Tab reaches the
// skip link; without this, focus would stay on the link that was clicked.
const ScrollToTop = () => {
  const { pathname } = useLocation()
  const focusStartRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Pages that focus a message or error summary do so afterwards and win.
    focusStartRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return <div ref={focusStartRef} tabIndex={-1} className="route-focus-start" />
}

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthModalProvider>
        <a className="skip-to-main" href="#main-content">Skip to main content</a>
        <NavMenu />
        <AchievementNotifications />

        <main id="main-content" className="pb-3" tabIndex={-1}>
        <Suspense fallback={<p className="text-center mt-4">Loading...</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/challenges" element={<ChallengeListPage />} />
            <Route path="/challenges/:id" element={<ChallengeDetailsPage />} />
            <Route
              path="/challenges/:id/leaderboard"
              element={<ChallengeLeaderboardPage />}
            />
            <Route path="/leaderboard" element={<CoreLeaderboardPage />} />
            <Route path="/hall-of-fame" element={<HallOfFamePage />} />
            <Route
              path="/hall-of-fame/users/:id/achievements"
              element={<PublicAchievementsPage />}
            />

            <Route element={<ProtectedRoute />}>
              <Route path="/my-challenges" element={<MyChallengesPage />} />
              <Route path="/my-images" element={<MyImagesPage />} />
              <Route path="/user-images/:id/delete" element={<DeleteImagePage />} />
              <Route path="/challenges/create" element={<CreateChallengePage />} />
              <Route path="/challenges/:id/edit" element={<EditChallengePage />} />
              <Route path="/challenges/:id/delete" element={<DeleteChallengePage />} />
              <Route
                path="/challenges/:id/questions/create"
                element={<CreateQuestionPage />}
              />
              <Route
                path="/challenges/:id/questions/:questionId/edit"
                element={<EditQuestionPage />}
              />
              <Route
                path="/challenges/:id/questions/:questionId/delete"
                element={<DeleteQuestionPage />}
              />
              <Route path="/quiz/:id" element={<QuizPage />} />
              <Route
                path="/quiz/attempts/:attemptId"
                element={<QuizResultPage />}
              />
              <Route path="/achievements" element={<AchievementsPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredRole="Admin" />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route
                path="/admin/users/:id"
                element={<AdminUserDetailsPage />}
              />
              <Route
                path="/admin/questions"
                element={<AdminQuestionsPage />}
              />
              <Route
                path="/admin/achievements"
                element={<AdminAchievementsPage />}
              />
              <Route
                path="/admin/achievements/create"
                element={<CreateAchievementPage />}
              />
              <Route
                path="/admin/achievements/:id/edit"
                element={<EditAchievementPage />}
              />
              <Route
                path="/admin/achievements/:id/delete"
                element={<DeleteAchievementPage />}
              />
              <Route path="/admin/images" element={<AdminImagesPage />} />
              <Route
                path="/admin/images/default/:id/delete"
                element={<DeleteImagePage isDefaultImage />}
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        </main>
      </AuthModalProvider>
    </BrowserRouter>
  )
}

export default App
