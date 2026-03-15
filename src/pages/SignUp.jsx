import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { validatePassword, getStrengthColor } from '../utils/passwordValidator'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({ valid: false, errors: [], strength: '' })
  const [signupSuccess, setSignupSuccess] = useState(false)
  const navigate = useNavigate()
  const { signUp, signUpWithGoogle } = useContext(AuthContext)

  function handlePasswordChange(value) {
    setPassword(value)
    setPasswordValidation(validatePassword(value))
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')

    if (!passwordValidation.valid) {
      setError('Please fix password requirements: ' + passwordValidation.errors.join(', '))
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, name)
      // Show confirmation message and instruct user to check email (Supabase sender)
      setSignupSuccess(true)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleGoogleSignUp() {
    setError('')
    setGoogleLoading(true)

    try {
      await signUpWithGoogle()
    } catch (err) {
      setError(err.message)
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
        <div className="card">
          <h2>Create Account</h2>
          <p className="muted">Join Less Compare to start saving money on groceries.</p>

          {signupSuccess ? (
            <div style={{ padding: 16 }}>
              <h3>Almost done — check your email</h3>
              <p className="muted">We've sent a confirmation email to <strong>{email}</strong>. Please open it and follow the link to activate your account.</p>
              <p className="muted">Note: the confirmation email will be sent by Supabase (look for an email from <strong>supabase.co</strong> or <strong>no-reply@supabase.co</strong>). Check your spam folder if you don't see it.</p>
              <div style={{ marginTop: 12 }}>
                <button onClick={() => navigate('/signin')} style={{ padding: '8px 12px', background: '#0b5ed7', color: 'white', border: 'none', borderRadius: 6 }}>Go to Sign In</button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ 
                  padding: 10, 
                  background: '#fee', 
                  border: '1px solid #f99', 
                  borderRadius: 6, 
                  color: '#c33',
                  marginBottom: 16,
                  fontSize: 14
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSignUp}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={loading || googleLoading}
                    style={{ 
                      width: '100%', 
                      padding: 8, 
                      border: '1px solid #e6e6e6', 
                      borderRadius: 6,
                      opacity: loading || googleLoading ? 0.6 : 1
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading || googleLoading}
                    style={{ 
                      width: '100%', 
                      padding: 8, 
                      border: '1px solid #e6e6e6', 
                      borderRadius: 6,
                      opacity: loading || googleLoading ? 0.6 : 1
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => handlePasswordChange(e.target.value)}
                      disabled={loading || googleLoading}
                      style={{ 
                        width: '100%', 
                        padding: 8, 
                        paddingRight: 36,
                        border: password ? `2px solid ${getStrengthColor(passwordValidation.strength)}` : '1px solid #e6e6e6',
                        borderRadius: 6,
                        opacity: loading || googleLoading ? 0.6 : 1
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading || googleLoading}
                      style={{
                        position: 'absolute',
                        right: 8,
                        background: 'none',
                        border: 'none',
                        cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
                        fontSize: 18,
                        opacity: loading || googleLoading ? 0.6 : 1
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
                            width: `${(passwordValidation.strength === 'strong' ? 100 : passwordValidation.strength === 'medium' ? 50 : 25)}%`,
                            background: getStrengthColor(passwordValidation.strength),
                            transition: 'all 0.3s ease'
                          }}></div>
                        </div>
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 600,
                          color: getStrengthColor(passwordValidation.strength),
                          textTransform: 'capitalize'
                        }}>
                          {passwordValidation.strength}
                        </span>
                      </div>

                      {passwordValidation.errors.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#d32f2f' }}>
                          {passwordValidation.errors.map((err, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {!password && (
                    <p className="muted small">Required: 8+ chars, 1 uppercase, 1 number, 1 special character</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#2f9e44',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    marginBottom: 12,
                    opacity: loading || googleLoading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>

              <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: '1px', background: '#e6e6e6' }} />
                <span style={{ color: '#999', fontSize: 13 }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#e6e6e6' }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  padding: 10,
                  background: 'white',
                  color: '#333',
                  border: '1px solid #e6e6e6',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 14,
                  opacity: loading || googleLoading ? 0.7 : 1,
                  pointerEvents: loading || googleLoading ? 'none' : 'auto'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? 'Signing up...' : 'Sign up with Google'}
              </button>
            </>
          )}

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
            Already have an account? <Link to="/signin" style={{ color: '#0b5ed7', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </>
  )
}
