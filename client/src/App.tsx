
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavMenu from './shared/NavMenu'
import HomePage from './home/HomePage'
import AboutPage from './home/AboutPage'
import ChallengeListPage from './challenges/ChallengeListPage'
import ChallengeDetailsPage from './challenges/ChallengeDetailsPage'
import MyChallengesPage from './challenges/MyChallengesPage'
import CreateChallengePage from './challenges/CreateChallengePage'
import EditChallengePage from './challenges/EditChallengePage'
import CreateQuestionPage from './questions/CreateQuestionPage'
import EditQuestionPage from './questions/EditQuestionPage'
import DeleteQuestionPage from './questions/DeleteQuestionPage'
import QuizPage from './quiz/QuizPage'
import QuizResultPage from './quiz/QuizResultPage'
import AchievementsPage from './achievements/AchievementsPage'
import AchievementNotifications from './achievements/AchievementNotifications'
import AdminAchievementsPage from './achievements/AdminAchievementsPage'
import CreateAchievementPage from './achievements/CreateAchievementPage'
import EditAchievementPage from './achievements/EditAchievementPage'
import DeleteAchievementPage from './achievements/DeleteAchievementPage'
import HallOfFamePage from './halloffame/HallOfFamePage'
import PublicAchievementsPage from './halloffame/PublicAchievementsPage'
import ChallengeLeaderboardPage from './leaderboard/ChallengeLeaderboardPage'
import ProtectedRoute from './auth/ProtectedRoute'

const App = () => {
  return (
    <BrowserRouter>
      <NavMenu />
      <AchievementNotifications />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/challenges" element={<ChallengeListPage />} />
        <Route path="/challenges/:id" element={<ChallengeDetailsPage />} />
        <Route
          path="/challenges/:id/leaderboard"
          element={<ChallengeLeaderboardPage />}
        />
        <Route path="/hall-of-fame" element={<HallOfFamePage />} />
        <Route
          path="/hall-of-fame/users/:id/achievements"
          element={<PublicAchievementsPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/my-challenges" element={<MyChallengesPage />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
