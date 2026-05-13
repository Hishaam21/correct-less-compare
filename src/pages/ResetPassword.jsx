import React, { useState, useEffect, useContext } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { validatePassword, getStrengthColor } from '../utils/passwordValidator'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({ valid: false, errors: [], strength: '' })
  const navigate = useNavigate()
  const { resetPassword } = useContext(AuthContext)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  function handlePasswordChange(value) {
    setPassword(value)
    setPasswordValidation(validatePassword(value))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your password')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!passwordValidation.valid) {
      setError('Please fix password requirements: ' + passwordValidation.errors.join(', '))
      return
    }

    setLoading(true)

    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => {
        navigate('/signin')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
        <div className="card">
          <h2>Invalid Reset Link</h2>
          <p className="muted">The password reset link is invalid or has expired.</p>
          <div style={{ marginTop: 20 }}>
            <Link to="/forgot-password" style={{ 
              display: 'inline-block',
              padding: '10px 16px',
              background: '#0b5ed7',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 6,
              fontWeight: 600
            }}>
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <div className="card">
        <h2>Reset Your Password</h2>
        <p className="muted">Enter your new password below.</p>

        {success ? (
          <div style={{ padding: 16, background: '#f0fff4', border: '1px solid #2f9e44', borderRadius: 6, marginBottom: 20 }}>
            <h3 style={{ color: '#2f9e44', marginTop: 0 }}>Password updated!</h3>
            <p className="muted">Your password has been successfully reset. Redirecting to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  disabled={loading}
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    paddingRight: 36,
                    border: password ? `2px solid ${getStrengthColor(passwordValidation.strength)}` : '1px solid #e6e6e6',
                    borderRadius: 6,
                    opacity: loading ? 0.6 : 1
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 18,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      height: 6,
                      flex: 1,
                      background: '#e6e6e6',
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: passwordValidation.strength === 'strong' ? '100%' : passwordValidation.strength === 'medium' ? '66%' : '33%',
                        background: getStrengthColor(passwordValidation.strength),
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: getStrengthColor(passwordValidation.strength) }}>
                      {passwordValidation.strength === 'strong' ? 'Strong' : passwordValidation.strength === 'medium' ? 'Medium' : 'Weak'}
                    </span>
                  </div>

                  {passwordValidation.errors.length > 0 && (
                    <ul style={{ fontSize: 12, color: '#666', margin: 0, paddingLeft: 20 }}>
                      {passwordValidation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Confirm Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  style={{ 
                    width: '100%', 
                    padding: 8, 
                    paddingRight: 36,
                    border: '1px solid #e6e6e6', 
                    borderRadius: 6,
                    opacity: loading ? 0.6 : 1
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  style={{
                    position: 'absolute',
                    right: 8,
                    background: 'none',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 18,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: 12, color: '#dc3545', marginTop: 4, margin: '4px 0 0 0' }}>Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p style={{ fontSize: 12, color: '#2f9e44', marginTop: 4, margin: '4px 0 0 0' }}>✓ Passwords match</p>
              )}
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
              disabled={loading || !passwordValidation.valid || !confirmPassword || password !== confirmPassword}
              style={{
                width: '100%',
                padding: 10,
                background: '#0b5ed7',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
                opacity: (loading || !passwordValidation.valid || !confirmPassword || password !== confirmPassword) ? 0.5 : 1,
                pointerEvents: (loading || !passwordValidation.valid || !confirmPassword || password !== confirmPassword) ? 'none' : 'auto'
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
          <Link to="/signin" style={{ color: '#2f9e44', textDecoration: 'none' }}>Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}
