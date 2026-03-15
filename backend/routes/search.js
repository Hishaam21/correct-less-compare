import express from 'express'
import { clearCache, getCachedResults, setCachedResults } from '../../cache.js'
import { aggregateResults, getHealthStatus, resetCircuitBreaker } from '../scraperManager.js'

const router = express.Router()

router.get('/search', async (req, res) => {
  try {
    const query = String(req.query.query || '').trim().toLowerCase()
    const forceFresh = req.query.fresh === 'true'

    if (!query) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query parameter is required'
      })
    }

    if (!forceFresh) {
      const cached = getCachedResults(query)
      if (cached) {
        return res.json({
          query: cached.query,
          cached: true,
          lastUpdated: cached.lastUpdated,
          results: cached.results
        })
      }
    }

    const liveResults = await aggregateResults(query)
    clearCache(query)
    setCachedResults(query, liveResults)
    const saved = getCachedResults(query)

    return res.json({
      query,
      cached: false,
      lastUpdated: saved?.lastUpdated || new Date().toISOString(),
      results: saved?.results || liveResults
    })
  } catch (error) {
    console.error('[search] error:', error.message)
    return res.status(500).json({
      error: 'Search failed',
      query: String(req.query.query || '').trim().toLowerCase(),
      cached: false,
      lastUpdated: new Date().toISOString(),
      results: []
    })
  }
})

router.get('/search/health', (req, res) => {
  try {
    const health = getHealthStatus()
    const statusCode = health.healthy ? 200 : 206
    return res.status(statusCode).json(health)
  } catch (error) {
    return res.status(500).json({
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
})

router.post('/search/reset-breaker', (req, res) => {
  try {
    const { store } = req.body || {}
    if (!store) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Store name is required'
      })
    }

    const result = resetCircuitBreaker(store)
    return res.status(result.success ? 200 : 404).json(result)
  } catch (error) {
    return res.status(500).json({
      error: 'Reset failed',
      message: error.message
    })
  }
})

export default router
