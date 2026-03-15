import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { signUpUser, signInUser, getAllUsers, requestPasswordReset, resetPasswordWithToken } from './supabase.js'
import { clearCache, getCacheStats } from './cache.js'
import { rateLimitMiddleware, getRateLimitStats } from './backend/middleware/rateLimit.js'
import searchRoutes from './backend/routes/search.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Apply rate limiting to all /api/search routes
app.use('/api/search', rateLimitMiddleware)

// Register search routes
app.use('/api', searchRoutes)

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})


// Password validation helper
function validatePassword(password) {
  const errors = []

  if (!password) {
    return { valid: false, errors: ['Password is required'] }
  }

  if (password.length < 8) {
    errors.push('At least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('At least 1 uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('At least 1 number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least 1 special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * AUTH ENDPOINTS
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: passwordValidation.errors
      })
    }

    const result = await signUpUser(email, password, name)

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      message: 'Signup successful',
      user: result.user
    })
  } catch (error) {
    console.error('Signup error:', error.message)
    res.status(500).json({ error: 'Signup failed' })
  }
})

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await signInUser(email, password)

    if (result.error) {
      return res.status(401).json({ error: result.error })
    }

    res.json({
      message: 'Login successful',
      user: result.user,
      session: result.session
    })
  } catch (error) {
    console.error('Signin error:', error.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await getAllUsers()
    res.json({ users })
  } catch (error) {
    console.error('Fetch users error:', error.message)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

/**
 * PASSWORD RESET ENDPOINTS
 */
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    await requestPasswordReset(email, transporter)

    res.json({
      message: 'Password reset link sent to email'
    })
  } catch (error) {
    console.error('Password reset request error:', error.message)
    res.status(500).json({ error: 'Failed to process password reset request' })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' })
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: passwordValidation.errors
      })
    }

    const result = await resetPasswordWithToken(token, newPassword)

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      message: 'Password reset successful'
    })
  } catch (error) {
    console.error('Password reset error:', error.message)
    res.status(500).json({ error: 'Password reset failed' })
  }
})

/**
 * CACHE MANAGEMENT ENDPOINTS (Admin)
 */
app.get('/api/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats()
    res.json(stats)
  } catch (error) {
    console.error('Cache stats error:', error.message)
    res.status(500).json({ error: 'Failed to get cache stats' })
  }
})

app.post('/api/cache/clear', (req, res) => {
  try {
    const { query } = req.body
    clearCache(query || 'all')
    res.json({ message: `Cache cleared${query ? ` for "${query}"` : ''}` })
  } catch (error) {
    console.error('Cache clear error:', error.message)
    res.status(500).json({ error: 'Failed to clear cache' })
  }
})

/**
 * RATE LIMIT STATS (Admin)
 */
app.get('/api/admin/rate-limit-stats', (req, res) => {
  try {
    const stats = getRateLimitStats()
    res.json(stats)
  } catch (error) {
    console.error('Rate limit stats error:', error.message)
    res.status(500).json({ error: 'Failed to get rate limit stats' })
  }
})

/**
 * HEALTH CHECK ENDPOINT
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cacheEnabled: true,
    rateLimitingEnabled: true
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`\n🚀 Less Compare Backend Server`)
  console.log(`📍 Running on http://localhost:${PORT}`)
  console.log(`\n✅ Features enabled:`)
  console.log(`   - Cache-first search with 24h TTL`)
  console.log(`   - Rate limiting: 5 requests/minute per IP`)
  console.log(`   - Circuit breaker protection per retailer`)
  console.log(`   - Sequential scraping (low request volume)`)
  console.log(`   - 3 retailers: Checkers, Shoprite, Pick n Pay`)
  console.log(`\n📚 API Endpoints:`)
  console.log(`   GET  /api/search?query=PRODUCT_NAME`)
  console.log(`   GET  /api/search?query=PRODUCT_NAME&fresh=true`)
  console.log(`   GET  /api/search/health`)
  console.log(`   POST /api/search/reset-breaker`)
  console.log(`   GET  /api/health`)
  console.log(`\n`)
})


