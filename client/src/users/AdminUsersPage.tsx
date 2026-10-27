import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Container, Form, Spinner, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import UserService from '../services/UserService'
import './AdminUsersPage.css'

const AdminUsersPage = () => {
  const [search, setSearch] = useState('')

  const {
    data: users = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: UserService.getAllUsers,
  })

  const searchTerm = search.trim().toLowerCase()

  const filteredUsers = users.filter((user) =>
    `${user.username} ${user.email}`
      .toLowerCase()
      .includes(searchTerm)
  )

  if (isPending) {
    return (
      <Container className="text-center mt-5" role="status">
        <Spinner animation="border" />
        <p className="mt-2">Loading users...</p>
      </Container>
    )
  }

  if (isError) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Could not load users: {error.message}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <div className="users-table-header mb-4">
        <div>
          <h1 className="fw-bold mb-1">List of Users</h1>
          <p className="text-secondary mb-0">
            View all registered users and click a username to view their details.
          </p>
        </div>

        <div className="users-table-search">
          <Form.Label htmlFor="userSearch" visuallyHidden>
            Search users
          </Form.Label>

          <Form.Control
            id="userSearch"
            type="search"
            placeholder="Search username or email..."
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <p className="visually-hidden" role="status" aria-atomic="true">
        {filteredUsers.length === 0
          ? 'No users match your search.'
          : `${filteredUsers.length} ${
              filteredUsers.length === 1 ? 'user' : 'users'
            } found.`}
      </p>

      <div className="table-responsive">
        <Table striped className="align-middle users-table">
          <thead>
            <tr>
              <th scope="col" className="text-center">Id</th>
              <th scope="col">Username</th>
              <th scope="col">Email</th>
              <th scope="col" className="text-center">Role</th>
              <th scope="col" className="text-center">
                Challenges Created
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => {
              const isAdmin = user.roles.includes('Admin')

              return (
                <tr key={user.userId}>
                  <td className="text-center">{user.userId}</td>

                  <td>
                    <Link to={`/admin/users/${user.userId}`}>
                      {user.username}
                    </Link>
                  </td>

                  <td>{user.email}</td>

                  <td className="text-center">
                    <span
                      className={`user-role-badge ${
                        isAdmin
                          ? 'user-role-admin'
                          : 'user-role-member'
                      }`}
                    >
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>

                  <td className="text-center">
                    {user.challengesCreated}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>

      {filteredUsers.length === 0 && (
        <Alert variant="info" className="mt-3">
          No users match your search.
        </Alert>
      )}
    </Container>
  )
}

export default AdminUsersPage
