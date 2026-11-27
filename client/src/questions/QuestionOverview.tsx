import { Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { withReturnUrl } from '../shared/returnUrl'
import type { Question } from '../types/Question'
import './QuestionOverview.css'

type QuestionOverviewProps = {
  challengeId: number
  questions: Question[]
  // Page the question pages return to after saving or cancelling.
  returnUrl?: string
}

// Question table shared by Challenge Details and Update Challenge.
const QuestionOverview = ({ challengeId, questions, returnUrl }: QuestionOverviewProps) => {
  if (questions.length === 0) {
    return (
      <div className="question-overview">
        <div className="challenge-details-notice">
          No questions have been added yet.
        </div>
      </div>
    )
  }

  return (
    <div className="question-overview table-responsive">
      <Table striped bordered className="align-middle">
        <thead>
          <tr>
            <th>Question</th>
            <th>Answer Options</th>
            <th>Points</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {[...questions]
            .sort((a, b) => a.questionId - b.questionId)
            .map((question) => (
              <tr key={question.questionId}>
                <td>
                  <strong>{question.title}</strong>
                  {question.description && (
                    <div className="text-muted small mt-1">
                      {question.description}
                    </div>
                  )}
                </td>

                <td>
                  {question.questionType === 'ShortAnswer'
                    ? question.acceptedAnswers.map((answer, index) => (
                        <div key={index}>
                          ✓ <strong>{answer}</strong>
                        </div>
                      ))
                    : question.options.map((option) => (
                        <div key={option.questionOptionId}>
                          {option.isCorrect ? (
                            <>
                              ✓ <strong>{option.text}</strong>
                            </>
                          ) : (
                            <>○ {option.text}</>
                          )}
                        </div>
                      ))}
                </td>

                <td>{question.points}</td>

                <td>
                  <div className="d-flex gap-2 question-overview-actions">
                    <Link
                      to={withReturnUrl(`/challenges/${challengeId}/questions/${question.questionId}/edit`, returnUrl)}
                      className="btn btn-sm btn-outline-warning challenge-question-action"
                    >
                      Edit
                    </Link>

                    <Link
                      to={withReturnUrl(`/challenges/${challengeId}/questions/${question.questionId}/delete`, returnUrl)}
                      className="btn btn-sm btn-outline-danger challenge-question-action"
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
  )
}

export default QuestionOverview
