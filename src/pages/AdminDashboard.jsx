import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../utils/api'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const response = await fetch(apiUrl('/api/admin/users'))
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: 24 }}>
      <div className="card">
        <h2>Admin Dashboard — Registered Users</h2>
        <p className="muted">View all users who have signed up</p>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <p className="muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="muted">No users registered yet</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e6e6e6' }}>
                  <th style={{ textAlign: 'left', padding: 12, fontWeight: 600 }}>ID</th>
                  <th style={{ textAlign: 'left', padding: 12, fontWeight: 600 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 12, fontWeight: 600 }}>Email</th>
                  <th style={{ textAlign: 'left', padding: 12, fontWeight: 600 }}>Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 12 }}>{u.id}</td>
                    <td style={{ padding: 12 }}>{u.name}</td>
                    <td style={{ padding: 12 }}>{u.email}</td>
                    <td style={{ padding: 12 }} className="muted small">
                      {new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ marginTop: 16, fontSize: 14, fontWeight: 600 }}>
          Total users: <span style={{ color: '#0b5ed7' }}>{users.length}</span>
        </p>

        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#0b5ed7',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
