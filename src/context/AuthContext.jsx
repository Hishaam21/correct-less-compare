import React, { createContext, useState, useEffect } from 'react'
import { validatePassword } from '../utils/passwordValidator'
import { apiUrl } from '../utils/api'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lesscompare.user')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('lesscompare.user', JSON.stringify(user))
    } else {
      localStorage.removeItem('lesscompare.user')
    }
  }, [user])

  async function signUp(email, password, name) {
    // Validate
    if (!email || !password || !name) throw new Error('All fields required')
    if (!email.includes('@')) throw new Error('Invalid email')

    // Validate password requirements
    const validation = validatePassword(password)
    if (!validation.valid) {
      throw new Error('Password must have: 8+ characters, 1 uppercase letter, 1 number, 1 special character')
    }

    // Call backend
    const response = await fetch(apiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Sign up failed')
    }

    const data = await response.json()
    // Don't set user yet - they need to verify email first
    return data
  }

  async function signIn(email, password) {
    if (!email || !password) throw new Error('Email and password required')

    // Call backend
    const response = await fetch(apiUrl('/api/auth/signin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Sign in failed')
    }

    const data = await response.json()
    setUser(data.user)
    return data.user
  }

  async function requestPasswordReset(email) {
    if (!email) throw new Error('Email required')

    // Call backend
    const response = await fetch(apiUrl('/api/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Password reset request failed')
    }

    return await response.json()
  }

  async function resetPassword(token, password) {
    if (!token || !password) throw new Error('Token and password required')

    // Call backend
    const response = await fetch(apiUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Password reset failed')
    }

    return await response.json()
  }

  async function signInWithGoogle() {
    // Call backend to get OAuth URL
    const response = await fetch(apiUrl('/api/auth/google-signin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Google sign in failed')
    }

    const data = await response.json()
    // Redirect to Google OAuth
    window.location.href = data.authUrl
  }

  async function signUpWithGoogle() {
    // Call backend to get OAuth URL
    const response = await fetch(apiUrl('/api/auth/google-signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Google sign up failed')
    }

    const data = await response.json()
    // Redirect to Google OAuth
    window.location.href = data.authUrl
  }

  async function handleGoogleCallback(accessToken) {
    if (!accessToken) throw new Error('No access token')

    // Call backend to handle callback
    const response = await fetch(apiUrl('/api/auth/google-callback'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to process Google login')
    }

    const data = await response.json()
    setUser(data.user)
    return data.user
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, logout, requestPasswordReset, resetPassword, signInWithGoogle, signUpWithGoogle, handleGoogleCallback }}>
      {children}
    </AuthContext.Provider>
  )
}
