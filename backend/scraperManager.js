import scrapeCheckers from './scrapers/checkers.js'
import scrapeShoprite from './scrapers/shoprite.js'
import scrapePnP from './scrapers/pnp.js'
import CircuitBreaker from './circuitBreaker.js'

const STORE_CONFIG = [
  { name: 'Shoprite', fn: scrapeShoprite },
  { name: 'Checkers', fn: scrapeCheckers },
  { name: 'Pick n Pay', fn: scrapePnP }
]

const breakers = Object.fromEntries(
  STORE_CONFIG.map(store => [store.name, new CircuitBreaker(store.name)])
)

export async function aggregateResults(query) {
  const allResults = []

  for (const store of STORE_CONFIG) {
    try {
      const results = await breakers[store.name].execute(() => store.fn(query))
      if (Array.isArray(results) && results.length > 0) {
        allResults.push(...results)
      }
    } catch (error) {
      console.error(`[${store.name}] scraper failed:`, error.message)
    }
  }

  return allResults
}

export function resetCircuitBreaker(storeName) {
  const breaker = breakers[storeName]
  if (!breaker) {
    return { success: false, message: `Store ${storeName} not found` }
  }

  breaker.reset()
  return { success: true, message: `Circuit breaker for ${storeName} reset` }
}

export function getHealthStatus() {
  const stores = {}
  let healthy = true

  for (const store of STORE_CONFIG) {
    const status = breakers[store.name].getStatus()
    const isOnline = status.state !== 'OPEN'
    stores[store.name] = {
      ...status,
      isOnline
    }
    if (!isOnline) healthy = false
  }

  return {
    timestamp: new Date().toISOString(),
    healthy,
    stores
  }
}

export default {
  aggregateResults,
  resetCircuitBreaker,
  getHealthStatus
}
