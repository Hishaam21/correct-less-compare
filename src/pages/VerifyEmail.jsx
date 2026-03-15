import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiUrl } from '../utils/api'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  const previewUrl = location.state?.preview || null
  
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    
    if (!code || code.length !== 6) {
      setError('Please enter the 6-character code')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/auth/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      if (data.success) {
        // Store user in localStorage
        localStorage.setItem('lesscompare.user', JSON.stringify(data.user))
        // Redirect to home
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendCode() {
    setResendLoading(true)
    setResendSuccess(false)
    setError('')

    try {
      const response = await fetch(apiUrl('/api/auth/resend-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code')
      }

      if (data.success) {
        setResendSuccess(true)
        // If preview URL returned (Ethereal), open it in a new tab for convenience
        if (data.preview) {
          window.open(data.preview, '_blank')
        }
        setTimeout(() => setResendSuccess(false), 3000)
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  if (!email) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
        <div className="card">
          <p style={{ color: '#d32f2f' }}>No email found. Please sign up first.</p>
          <button
            onClick={() => navigate('/signup')}
            style={{
              width: '100%',
              padding: 10,
              background: '#0b5ed7',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Go to Sign Up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <div className="card">
        <h2>Verify Your Email</h2>
        <p className="muted">
          We sent a verification code to <strong>{email}</strong>. Enter the 6-character code below.
        </p>
        {previewUrl && (
          <p style={{ fontSize: 13 }}>
            Dev preview: <a href={previewUrl} target="_blank" rel="noreferrer">Open email preview</a>
          </p>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Verification Code</label>
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength="6"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 24,
                textAlign: 'center',
                letterSpacing: 8,
                border: '1px solid #e6e6e6',
                borderRadius: 6,
                fontWeight: 'bold'
              }}
            />
          </div>

          {error && <p style={{ color: '#d32f2f', marginBottom: 12 }}>{error}</p>}
          {resendSuccess && <p style={{ color: '#2f9e44', marginBottom: 12 }}>✓ Code resent! Check your email.</p>}

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
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <button
          onClick={handleResendCode}
          disabled={resendLoading}
          style={{
            width: '100%',
            padding: 10,
            background: 'transparent',
            color: '#0b5ed7',
            border: '1px solid #0b5ed7',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            opacity: resendLoading ? 0.7 : 1
          }}
        >
          {resendLoading ? 'Resending...' : 'Didn\'t receive code? Resend'}
        </button>
      </div>
    </div>
  )
}
