import { Link } from 'react-router-dom'
import usePageTitle from './usePageTitle'

// Shown when a signed-in user opens a page that requires another role.
const AccessDeniedPage = () => {
  usePageTitle('Access Denied')
  return (
    <div className="container mt-5 text-center">
      <h1 className="h2">Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <Link to="/" className="btn btn-primary">
        Back to Home
      </Link>
    </div>
  )
}

export default AccessDeniedPage
