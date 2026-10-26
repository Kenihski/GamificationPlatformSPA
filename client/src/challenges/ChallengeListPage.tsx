
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Button,
  ButtonGroup,
  Container,
  Form,
  Spinner,
} from 'react-bootstrap'
import ChallengeService from '../services/ChallengeService'
import type { ChallengeFilter } from '../types/Challenge'
import ChallengeGrid from './ChallengeGrid'
import ChallengeTable from './ChallengeTable'
import './Challenges.css'

type ChallengeView = 'Grid' | 'Table'

const getInitialView = (): ChallengeView => {
  return localStorage.getItem('challengeView') === 'Table'
    ? 'Table'
    : 'Grid'
}

const ChallengeListPage = () => {
  const [filter, setFilter] = useState<ChallengeFilter>('All')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<ChallengeView>(getInitialView)

  const { data: challenges, isPending, isError, error } = useQuery({
    queryKey: ['challenges', filter, searchTerm],
    queryFn: () => ChallengeService.getChallenges(filter, searchTerm),
  })

  const changeView = (selectedView: ChallengeView) => {
    setView(selectedView)
    localStorage.setItem('challengeView', selectedView)
  }

  return (
    <Container className="challenge-list-page mt-4 mb-5">
      <div className="mb-4">
        <h1 className="fw-bold mb-2">List of Challenges</h1>
        <p className="challenge-list-description mb-0">
          Explore available challenges and test your knowledge.
        </p>
      </div>

      <div className="challenge-toolbar">
        <ButtonGroup aria-label="Filter challenges">
          {(['All', 'Core', 'Community'] as ChallengeFilter[]).map(
            (option) => (
              <Button
                key={option}
                variant={filter === option ? 'primary' : 'outline-primary'}
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
              >
                {option}
              </Button>
            )
          )}
        </ButtonGroup>

        <Form
          role="search"
          className="challenge-search-form"
          onSubmit={(event) => {
            event.preventDefault()
            setSearchTerm(searchInput)
          }}
        >
          <Form.Control
            type="search"
            placeholder="Search challenges..."
            aria-label="Search challenges by title or description"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />

          <Button variant="outline-primary" type="submit">
            Search
          </Button>
        </Form>

        <ButtonGroup aria-label="Choose challenge view">
          <Button
            variant={view === 'Table' ? 'primary' : 'outline-primary'}
            onClick={() => changeView('Table')}
            aria-pressed={view === 'Table'}
          >
            Table
          </Button>

          <Button
            variant={view === 'Grid' ? 'primary' : 'outline-primary'}
            onClick={() => changeView('Grid')}
            aria-pressed={view === 'Grid'}
          >
            Grid
          </Button>
        </ButtonGroup>
      </div>

      {isPending && (
        <div className="text-center my-5" role="status">
          <Spinner animation="border" />
          <p className="mt-2">Loading challenges...</p>
        </div>
      )}

      {isError && (
        <Alert variant="danger" role="alert">
          Could not load challenges: {error.message}
        </Alert>
      )}

      {challenges && (
        <>
          {challenges.length === 0 ? (
            <Alert variant="info">
              No challenges found matching your search and filters.
            </Alert>
          ) : view === 'Grid' ? (
            <ChallengeGrid challenges={challenges} />
          ) : (
            <ChallengeTable challenges={challenges} />
          )}
        </>
      )}
    </Container>
  )
}

export default ChallengeListPage
