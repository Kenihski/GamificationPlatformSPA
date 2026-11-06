import { Link } from 'react-router-dom'
import './NotFoundPage.css'

const NotFoundPage = () => (
  <div className="container not-found-page py-4">
    <section className="alert alert-danger mt-4" role="alert" aria-labelledby="not-found-title">
      <h1 id="not-found-title" className="h3">404 — Page not found</h1>
      <p className="mb-0">
        The requested page or resource could not be found.
        Check the address or return to a page below.
      </p>
    </section>
    <div className="d-flex flex-wrap gap-2">
      <Link to="/" className="btn btn-primary">Back to Home</Link>
      <Link to="/challenges" className="btn btn-secondary">View Challenges</Link>
    </div>
  </div>
)

export default NotFoundPage
