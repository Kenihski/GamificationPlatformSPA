
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavMenu from './shared/NavMenu'
import HomePage from './home/HomePage'
import ChallengeListPage from './challenges/ChallengeListPage'
import ChallengeDetailsPage from './challenges/ChallengeDetailsPage'
import MyChallengesPage from './challenges/MyChallengesPage'
import CreateChallengePage from './challenges/CreateChallengePage'
import EditChallengePage from './challenges/EditChallengePage'
import QuizPage from './quiz/QuizPage'
import QuizResultPage from './quiz/QuizResultPage'
import ProtectedRoute from './auth/ProtectedRoute'

const App = () => {
  return (
    <BrowserRouter>
      <NavMenu />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/challenges" element={<ChallengeListPage />} />
        <Route path="/challenges/:id" element={<ChallengeDetailsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/my-challenges" element={<MyChallengesPage />} />
          <Route path="/challenges/create" element={<CreateChallengePage />} />
          <Route path="/challenges/:id/edit" element={<EditChallengePage />} />
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
