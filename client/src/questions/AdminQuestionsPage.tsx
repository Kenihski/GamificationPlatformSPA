
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Container, Form, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import QuestionService from '../services/QuestionService'
import './AdminQuestionsPage.css'

const CHALLENGE_PAGE_SIZE = 12
const QUESTION_PAGE_SIZE = 10
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const getImageSource = (url: string) =>
  url.startsWith('http')
    ? url
    : `${API_BASE_URL}/${url.replace(/^\/+/, '')}`

const AdminQuestionsPage = () => {
  const [search, setSearch] = useState('')
  const [selectedChallengeId, setSelectedChallengeId] =
    useState<number | null>(null)
  const [challengePage, setChallengePage] = useState(1)
  const [questionPage, setQuestionPage] = useState(1)

  const { data: questions = [], isPending, isError, error } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: QuestionService.getAllQuestions,
  })

  const challenges = Array.from(
    new Map(
      questions.map((question) => [
        question.challengeId,
        {
          id: question.challengeId,
          title: question.challengeTitle,
          count: questions.filter(
            (item) => item.challengeId === question.challengeId
          ).length,
        },
      ])
    ).values()
  ).sort((a, b) => a.title.localeCompare(b.title))

  const navigationItems = [
    { id: null, title: 'All Questions', count: questions.length },
    ...challenges,
  ]

  const challengePageCount = Math.max(
    1,
    Math.ceil(navigationItems.length / CHALLENGE_PAGE_SIZE)
  )
  const currentChallengePage = Math.min(challengePage, challengePageCount)

  const visibleNavigation = navigationItems.slice(
    (currentChallengePage - 1) * CHALLENGE_PAGE_SIZE,
    currentChallengePage * CHALLENGE_PAGE_SIZE
  )

  const filteredQuestions = questions.filter((question) => {
    const matchesChallenge =
      selectedChallengeId === null ||
      question.challengeId === selectedChallengeId

    const searchableText =
      `${question.title} ${question.description ?? ''}`.toLowerCase()

    return matchesChallenge &&
      searchableText.includes(search.trim().toLowerCase())
  })

  const questionPageCount = Math.max(
    1,
    Math.ceil(filteredQuestions.length / QUESTION_PAGE_SIZE)
  )
  const currentQuestionPage = Math.min(questionPage, questionPageCount)

  const visibleQuestions = filteredQuestions.slice(
    (currentQuestionPage - 1) * QUESTION_PAGE_SIZE,
    currentQuestionPage * QUESTION_PAGE_SIZE
  )

  const selectedTitle =
    navigationItems.find((item) => item.id === selectedChallengeId)?.title ??
    'All Questions'

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading questions...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Could not load questions: {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <div className="questions-page-header mb-4">
        <div>
          <h1 className="fw-bold mb-2">List of Questions</h1>
          <p className="challenge-list-description mb-0">
            Overview of all questions in the system.
          </p>
        </div>

        <div className="questions-search">
          <Form.Label htmlFor="questionSearch" visuallyHidden>
            Search questions
          </Form.Label>
          <Form.Control
            id="questionSearch"
            type="search"
            placeholder="Search questions..."
            autoComplete="off"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setQuestionPage(1)
            }}
          />
        </div>
      </div>

      {questions.length === 0 ? (
        <Alert variant="info">
          There are no questions in the system yet.
        </Alert>
      ) : (
        <>
          <nav
            className="questions-navigation"
            aria-label="Filter questions by challenge"
          >
            <div className="questions-navigation-grid">
              {visibleNavigation.map((item) => (
                <button
                  key={item.id ?? 'all'}
                  type="button"
                  className="questions-nav-button"
                  aria-pressed={selectedChallengeId === item.id}
                  onClick={() => {
                    setSelectedChallengeId(item.id)
                    setQuestionPage(1)
                  }}
                >
                  {item.title}
                  <span className="questions-nav-count">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {challengePageCount > 1 && (
              <div className="questions-navigation-pagination">
                <Button
                  variant="outline-primary"
                  disabled={currentChallengePage === 1}
                  onClick={() => setChallengePage((page) => page - 1)}
                >
                  Previous
                </Button>

                <span>
                  Page {currentChallengePage} of {challengePageCount}
                </span>

                <Button
                  variant="outline-primary"
                  disabled={currentChallengePage === challengePageCount}
                  onClick={() => setChallengePage((page) => page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </nav>

          <section className="questions-results" aria-labelledby="questionsResultsHeading">
            <div className="questions-results-header">
              <h2 id="questionsResultsHeading" className="h4 mb-0">
                {selectedTitle}
              </h2>

              <span className="questions-result-count" role="status">
                {filteredQuestions.length}{' '}
                {filteredQuestions.length === 1 ? 'question' : 'questions'}
              </span>
            </div>

            <div className="table-responsive">
              <Table striped className="align-middle questions-table">
                <thead>
                  <tr>
                    <th scope="col" className="text-center">Id</th>
                    <th scope="col">Question</th>
                    <th scope="col" className="text-center">Points</th>
                    <th scope="col">Challenge</th>
                    <th scope="col">Owner</th>
                    <th scope="col" className="text-center">Image</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleQuestions.map((question) => (
                    <tr key={question.questionId}>
                      <td className="text-center">{question.questionId}</td>
                      <td>{question.title}</td>
                      <td className="text-center">{question.points}</td>
                      <td>
                        <Link to={`/challenges/${question.challengeId}`}>
                          {question.challengeTitle}
                        </Link>
                      </td>
                      <td>
                        {question.ownerUsername}
                      </td>
                      <td className="text-center">
                        {question.imageUrl ? (
                          <img
                            src={getImageSource(question.imageUrl)}
                            alt=""
                            className="questions-table-image"
                          />
                        ) : (
                          <span className="question-table-no-image">
                            No image
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-nowrap gap-1 align-items-center questions-table-actions">
                          <Link
                            className="btn btn-sm btn-outline-warning"
                            to={`/challenges/${question.challengeId}/questions/${question.questionId}/edit`}
                          >
                            Edit
                          </Link>
                          <Link
                            className="btn btn-sm btn-outline-danger"
                            to={`/challenges/${question.challengeId}/questions/${question.questionId}/delete`}
                          >
                            Delete
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {filteredQuestions.length === 0 && (
              <Alert variant="info" className="mt-3">
                No questions match your search.
              </Alert>
            )}

            {filteredQuestions.length > 0 && questionPageCount > 1 && (
              <div className="questions-table-pagination">
                <Button
                  variant="outline-primary"
                  disabled={currentQuestionPage === 1}
                  onClick={() => setQuestionPage((page) => page - 1)}
                >
                  Previous
                </Button>

                <span>
                  Page {currentQuestionPage} of {questionPageCount}
                </span>

                <Button
                  variant="outline-primary"
                  disabled={currentQuestionPage === questionPageCount}
                  onClick={() => setQuestionPage((page) => page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </section>
        </>
      )}
    </Container>
  )
}

export default AdminQuestionsPage
