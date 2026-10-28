import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavMenu from './shared/NavMenu'
import AchievementNotifications from './achievements/AchievementNotifications'
import ProtectedRoute from './auth/ProtectedRoute'
import { AuthModalProvider } from './auth/AuthModalContext'

// Load pages only when they are needed.
const HomePage = lazy(() => import('./home/HomePage'))
const AboutPage = lazy(() => import('./home/AboutPage'))
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

const AdminUsersPage = lazy(
  () => import('./users/AdminUsersPage')
)
const AdminUserDetailsPage = lazy(
  () => import('./users/AdminUserDetailsPage')
)

const App = () => {
  return (
    <BrowserRouter>
      <AuthModalProvider>
        <NavMenu />
        <AchievementNotifications />

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
              <Route path="/challenges/create" element={<CreateChallengePage />} />
              <Route path="/challenges/:id/edit" element={<EditChallengePage />} />
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
            </Route>
          </Routes>
        </Suspense>
      </AuthModalProvider>
    </BrowserRouter>
  )
}

export default App
