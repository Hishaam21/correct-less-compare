/**
 * Circuit Breaker Pattern Implementation
 * Prevents continuous attempts to scrape failing retailers
 * After 3 consecutive failures, disables store for 1 hour
 */

class CircuitBreaker {
  constructor(storeName, failureThreshold = 3, resetTimeout = 60 * 60 * 1000) {
    this.storeName = storeName
    this.failureThreshold = failureThreshold
    this.resetTimeout = resetTimeout // 1 hour default
    
    this.state = 'CLOSED' // CLOSED (working), OPEN (broken), HALF_OPEN (testing)
    this.failureCount = 0
    this.lastFailureTime = null
    this.disabledUntil = null
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn) {
    // If circuit is OPEN (disabled), check if reset timeout expired
    if (this.state === 'OPEN') {
      if (Date.now() < this.disabledUntil) {
        const timeLeft = Math.round((this.disabledUntil - Date.now()) / 1000 / 60)
        console.log(`🚫 [${this.storeName}] Circuit OPEN - disabled for ${timeLeft} more minutes`)
        return null
      }
      // Timeout expired, try HALF_OPEN (one test request)
      this.state = 'HALF_OPEN'
      console.log(`⚡ [${this.storeName}] Circuit HALF_OPEN - testing recovery`)
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Record successful request
   */
  onSuccess() {
    this.failureCount = 0
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      console.log(`✅ [${this.storeName}] Circuit CLOSED - recovered from failure`)
    }
  }

  /**
   * Record failed request
   */
  onFailure() {
    this.lastFailureTime = Date.now()
    this.failureCount++

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      this.disabledUntil = Date.now() + this.resetTimeout
      const resetTime = new Date(this.disabledUntil).toLocaleTimeString()
      console.log(`🔴 [${this.storeName}] Circuit OPEN - disabled until ${resetTime}`)
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      store: this.storeName,
      state: this.state,
      failures: this.failureCount,
      threshold: this.failureThreshold,
      disabledUntil: this.disabledUntil ? new Date(this.disabledUntil).toISOString() : null
    }
  }

  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.lastFailureTime = null
    this.disabledUntil = null
    console.log(`🔄 [${this.storeName}] Circuit reset manually`)
  }
}

export default CircuitBreaker
