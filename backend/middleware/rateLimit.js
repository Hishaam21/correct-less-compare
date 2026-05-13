/**
 * Rate Limiting Middleware
 * Max 5 search requests per minute per IP
 * Prevents abuse and excessive traffic
 */

const requestLog = new Map()

const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const now = Date.now()

  if (!requestLog.has(ip)) {
    requestLog.set(ip, [])
  }

  // Get requests from this IP in the current window
  const requests = requestLog.get(ip)
  const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT.windowMs)

  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    console.log(`⚠️  Rate limit exceeded for IP: ${ip}`)
    return res.status(429).json({
      error: 'Too many requests',
      message: `Maximum ${RATE_LIMIT.maxRequests} search requests per minute`,
      retryAfter: Math.ceil(RATE_LIMIT.windowMs / 1000)
    })
  }

  // Add current request to log
  recentRequests.push(now)
  requestLog.set(ip, recentRequests)

  // Log current usage
  console.log(`📊 [${ip}] Rate limit: ${recentRequests.length}/${RATE_LIMIT.maxRequests} requests`)

  next()
}

/**
 * Cleanup old request logs (run periodically)
 */
export function cleanupOldRequests() {
  const now = Date.now()
  const threshold = now - (5 * RATE_LIMIT.windowMs) // Keep last 5 minutes of data

  for (const [ip, requests] of requestLog.entries()) {
    const recentRequests = requests.filter(timestamp => timestamp > threshold)
    if (recentRequests.length === 0) {
      requestLog.delete(ip)
    } else {
      requestLog.set(ip, recentRequests)
    }
  }
}

/**
 * Get rate limit stats (for monitoring)
 */
export function getRateLimitStats() {
  return {
    activeIPs: requestLog.size,
    maxRequests: RATE_LIMIT.maxRequests,
    window: `${RATE_LIMIT.windowMs / 1000}s`,
    details: Array.from(requestLog.entries()).map(([ip, requests]) => ({
      ip,
      recentRequests: requests.length
    }))
  }
}

// Cleanup old request logs every 5 minutes
setInterval(cleanupOldRequests, 5 * 60 * 1000)

export default rateLimitMiddleware
