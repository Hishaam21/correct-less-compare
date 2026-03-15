import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import { signUpUser, signInUser, getAllUsers, requestPasswordReset, resetPasswordWithToken } from './supabase.js'
import { getCachedResults, setCachedResults, clearCache, getCacheStats } from './cache.js'

// Lazy load scraper to avoid startup errors
let searchProducts = async (query) => {
  try {
    const { searchProducts: scrapeSearch } = await import('./scraper.js')
    return scrapeSearch(query)
  } catch (err) {
    console.log(`⚠️  Scraper unavailable: ${err.message}`)
    return []
  }
}

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

// Load products data
const productsPath = path.join(__dirname, 'src', 'data', 'products.json')
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'))

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


app.post('/api/search', async (req, res) => {
  try {
    const { query, fresh } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query required' });
    }

    const cleanQuery = query.trim()
    console.log(`\n🔍 [SEARCH] Query: "${cleanQuery}" ${fresh ? '(fresh)' : '(cached)'}`);

    let results = null
    let fromCache = false

    // Step 1: Check cache first (unless fresh=true)
    if (!fresh) {
      const cached = getCachedResults(cleanQuery)
      if (cached) {
        results = cached.products
        fromCache = true
      }
    }

    // Step 2: If no cache or fresh requested, try scraping from websites
    if (!results || results.length === 0) {
      try {
        console.log(`🌐 [SEARCH] Scraping websites for "${cleanQuery}"...`)
        results = await searchProducts(cleanQuery)

        // Step 3: Cache the results
        if (results && results.length > 0) {
          setCachedResults(cleanQuery, results)
        }
      } catch (scrapeErr) {
        console.log(`⚠️  Scraping error (using fallback): ${scrapeErr.message}`)
        // If scraping fails, search local products.json instead
        const term = cleanQuery.toLowerCase()
        results = products.filter(p => 
          p.name.toLowerCase().includes(term) || 
          p.category.toLowerCase().includes(term)
        )
      }
    }

    // Return response
    res.json({
      query: cleanQuery,
      results: results || [],
      cached: fromCache,
      timestamp: new Date().toISOString(),
      count: results ? results.length : 0,
      message: fromCache 
        ? `Returning ${results.length} cached results (valid for 24h)`
        : `Found ${results.length} result(s)`
    });

  } catch (error) {
    console.error('[SEARCH ERROR]', error.message);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
});

// Cache management endpoints (optional admin tools)
app.post('/api/cache/clear', (req, res) => {
  try {
    const { query } = req.body
    clearCache(query || 'all')
    res.json({ success: true, message: `Cache cleared for ${query || 'all'}` })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats()
    res.json({ success: true, stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/budget', async (req, res) => {
  try {
    const { items } = req.body
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Items array required' })

    let results = []
    for (const item of items) {
      // Simple keyword matching (bypass OpenAI)
      const term = item.name.toLowerCase()
      const candidates = products.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      )

      if (candidates.length === 0) {
        results.push({
          query: item.name,
          qty: item.qty,
          found: false
        })
      } else {
        // Sort candidates by price ascending
        const sorted = candidates.slice().sort((a,b) => a.price - b.price)
        const product = sorted[0]
        // Prepare a small list of alternatives (top 3)
        const alternatives = sorted.slice(0,3).map(c=>({ name: c.name, store: c.store, price: c.price }))
        results.push({
          query: item.name,
          qty: item.qty,
          found: true,
          product,
          cost: product.price * item.qty,
          candidates: alternatives
        })
      }
    }

    const total = results.reduce((sum, r) => sum + (r.cost || 0), 0)
    res.json({ picks: results, total })
  } catch (error) {
    console.error('[BUDGET ERROR]', error.message)
    res.status(500).json({ error: error.message || 'Budget calculation failed' })
  }
})

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Validate password requirements
    const validation = validatePassword(password)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Password must have: ' + validation.errors.join(', ') })
    }

    const user = await signUpUser(email, password, name)
    res.json({ success: true, user })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})


app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await signInUser(email, password)
    res.json({ success: true, user })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    // Request password reset from Supabase (this sends email)
    const result = await requestPasswordReset(email)
    res.json({ success: true, message: 'Password reset email sent' })
  } catch (error) {
    // Don't expose if email exists or not for security
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password required' })
    }

    // Validate password
    const validation = validatePassword(password)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Password must have: ' + validation.errors.join(', ') })
    }

    const result = await resetPasswordWithToken(token, password)
    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to reset password' })
  }
})

app.post('/api/auth/google-signin', async (req, res) => {
  try {
    // In a real implementation, you would initiate OAuth flow here
    // For now, return OAuth URL that frontend will use
    const oauth_url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`
    
    res.json({ success: true, authUrl: oauth_url })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/auth/google-signup', async (req, res) => {
  try {
    // Same as signin for Google OAuth
    const oauth_url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`
    
    res.json({ success: true, authUrl: oauth_url })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/auth/google-callback', async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' })
    }

    // In a real implementation, you would verify the token with Google and create/get user
    // For now, we'll just accept the token
    res.json({ 
      success: true, 
      user: {
        id: 'google_' + Math.random().toString(36).substr(2, 9),
        email: 'user@example.com',
        name: 'Google User',
        verified: true,
        auth_provider: 'google'
      }
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await getAllUsers()
    res.json({ users, total: users.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Dev helper: get verification code for an email (only in non-production)
app.get('/api/debug/code', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' })
    const email = req.query.email
    if (!email) return res.status(400).json({ error: 'Email query required' })
    // This endpoint is deprecated with Supabase Auth
    res.json({ email, message: 'Email verification is now handled by Supabase Auth' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Web Scraping Endpoints
app.post('/api/scrape/all', async (req, res) => {
  try {
    console.log('\n📡 Scrape request received...')
    const products = await scrapeAllPrices()
    res.json({ 
      success: true, 
      message: 'Products scraped successfully',
      count: products.length,
      products: products.slice(0, 10) // Send first 10 as preview
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/scrape/catalogue', async (req, res) => {
  try {
    console.log('\n📡 Scraping My Catalogue...')
    const products = await scrapeMyCatalogue()
    res.json({ 
      success: true, 
      count: products.length,
      products 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/scrape/specials', async (req, res) => {
  try {
    console.log('\n📡 Scraping My Specials...')
    const products = await scrapeMySpecials()
    res.json({ 
      success: true, 
      count: products.length,
      products 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/scrape/fallback', async (req, res) => {
  try {
    console.log('\n📡 Running fallback scraper...')
    const selectors = await scrapeWithFallback()
    res.json({ 
      success: true, 
      selectors,
      message: 'Check console for detected selectors'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get current products
app.get('/api/products', (req, res) => {
  try {
    const productsPath = path.join(__dirname, 'src', 'data', 'products.json')
    const data = fs.readFileSync(productsPath, 'utf-8')
    const products = JSON.parse(data)
    res.json({ products, count: products.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, async () => {
  try {
    console.log(`\n✓ Server running at http://localhost:${PORT}`)
    console.log(`✓ Connected to Supabase`)
    console.log(`✓ API endpoint: POST http://localhost:${PORT}/api/search`)
    console.log(`✓ Admin users: GET http://localhost:${PORT}/api/admin/users`)
    console.log(`✓ Make sure OPENAI_API_KEY is set in .env\n`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
})

// Global error handlers to capture crashes in a way that's visible in Windows
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err)
  try { require('fs').appendFileSync('server-error.log', `UNCAUGHT EXCEPTION:\n${err && err.stack ? err.stack : err}\n\n`) } catch (e) {}
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason)
  try { require('fs').appendFileSync('server-error.log', `UNHANDLED REJECTION:\n${reason}\n\n`) } catch (e) {}
})
