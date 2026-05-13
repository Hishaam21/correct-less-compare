import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { requestPasswordReset } = useContext(AuthContext)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (!email) {
        setError('Please enter your email address')
        setLoading(false)
        return
      }

      await requestPasswordReset(email)
      setSuccess(true)
      setEmail('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <div className="card">
        <h2>Reset Password</h2>
        <p className="muted">Enter your email address and we'll send you a link to reset your password.</p>

        {success ? (
          <div style={{ padding: 16, background: '#f0f9ff', border: '1px solid #0084ff', borderRadius: 6, marginBottom: 20 }}>
            <h3 style={{ color: '#0084ff', marginTop: 0 }}>Check your email</h3>
            <p className="muted">We've sent a password reset link to <strong>{email}</strong>. Please check your email (including spam folder) and follow the link to reset your password.</p>
            <p className="muted">If you don't receive an email within a few minutes, try signing up instead or contact support.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  border: '1px solid #e6e6e6', 
                  borderRadius: 6,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'text'
                }}
              />
            </div>

            {error && (
              <div style={{ 
                padding: 10, 
                background: '#fee', 
                border: '1px solid #f99', 
                borderRadius: 6, 
                color: '#c33',
                marginBottom: 12,
                fontSize: 14
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 10,
                background: '#0b5ed7',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
          Remember your password? <Link to="/signin" style={{ color: '#2f9e44', textDecoration: 'none' }}>Sign In</Link>
        </p>

        <p style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>
          Don't have an account? <Link to="/signup" style={{ color: '#2f9e44', textDecoration: 'none' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
