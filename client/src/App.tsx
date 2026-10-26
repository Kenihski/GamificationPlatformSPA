
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
import ProtectedRoute from './auth/ProtectedRoute'

const App = () => {
  return (
    <BrowserRouter>
      <NavMenu />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/challenges" element={<ChallengeListPage />} />
        <Route path="/challenges/:id" element={<ChallengeDetailsPage />} />

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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
