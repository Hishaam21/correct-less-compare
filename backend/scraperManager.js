import scrapeCheckers from './scrapers/checkers.js'
import scrapeShoprite from './scrapers/shoprite.js'
import scrapePnP from './scrapers/pnp.js'
import scrapeTakealot from './scrapers/takealot.js'
import scrapeIncredible from './scrapers/incredible.js'
import scrapeHifiCorp from './scrapers/hificorp.js'
import scrapeClicks from './scrapers/clicks.js'
import scrapeDisChem from './scrapers/dischem.js'
import scrapeBuildIt from './scrapers/buildit.js'
import scrapeBuilders from './scrapers/builders.js'
import scrapeGame from './scrapers/game.js'
import scrapeMakro from './scrapers/makro.js'
import scrapeWoolworths from './scrapers/woolworths.js'
import CircuitBreaker from './circuitBreaker.js'

const STORE_CONFIG = [
  { name: 'Shoprite', fn: scrapeShoprite },
  { name: 'Checkers', fn: scrapeCheckers },
  { name: 'Pick n Pay', fn: scrapePnP },
  { name: 'Takealot', fn: scrapeTakealot },
  { name: 'Incredible Connection', fn: scrapeIncredible },
  { name: 'HiFi Corp', fn: scrapeHifiCorp },
  { name: 'Clicks', fn: scrapeClicks },
  { name: 'Dis-Chem', fn: scrapeDisChem },
  { name: 'Build It', fn: scrapeBuildIt },
  { name: 'Builders', fn: scrapeBuilders },
  { name: 'Game', fn: scrapeGame },
  { name: 'Makro', fn: scrapeMakro },
  { name: 'Woolworths', fn: scrapeWoolworths }
]

const breakers = Object.fromEntries(
  STORE_CONFIG.map(store => [store.name, new CircuitBreaker(store.name)])
)

export async function aggregateResults(query) {
  const allResults = []
  const missingStores = []

  const scraperPromises = STORE_CONFIG.map(store =>
    withTimeout(
      breakers[store.name].execute(() => store.fn(query)),
      12000,
      store.name
    ).then(results => {
      if (Array.isArray(results) && results.length > 0) {
        allResults.push(...results)
      } else {
        missingStores.push(store.name)
      }
    })
  )

  await Promise.allSettled(scraperPromises)

  if (missingStores.length > 0 && allResults.length === 0) {
    console.log(`No live results from any store; returning empty scrape result set instead of placeholders.`)
  }

  return allResults
}

function withTimeout(promise, timeoutMs, storeName) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => {
      console.warn(`[${storeName}] scraper timed out after ${timeoutMs}ms`)
      resolve([])
    }, timeoutMs))
  ])
}

function createFallbackProduct(storeName, query) {
  const productName = `${query} from ${storeName}`
  const urlMap = {
    'Shoprite': 'https://www.shoprite.co.za/',
    'Checkers': 'https://www.checkers.co.za/',
    'Pick n Pay': 'https://www.pnp.co.za/',
    'Takealot': 'https://www.takealot.com/',
    'Incredible Connection': 'https://www.incredible.co.za/',
    'HiFi Corp': 'https://www.hificorp.co.za/',
    'Clicks': 'https://www.clicks.co.za/',
    'Dis-Chem': 'https://www.dischem.co.za/',
    'Build It': 'https://www.buildit.co.za/',
    'Builders': 'https://www.builders.co.za/'
  }

  return {
    name: productName,
    price: null,
    store: storeName,
    link: urlMap[storeName] || `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    lastChecked: new Date().toISOString(),
    isFallback: true,
    fallbackMessage: `Live price unavailable for ${query} at ${storeName}.`
  }
}

function getFullFallbackCatalog(query) {
  return STORE_CONFIG.map(store => createFallbackProduct(store.name, query))
}

export function resetCircuitBreaker(storeName) {
  const breaker = breakers[storeName]
  if (!breaker) {
    return { success: false, message: `Store ${storeName} not found` }
  }

  breaker.reset()
  return { success: true, message: `Circuit breaker for ${storeName} reset` }
}

export function filterAndRankResults(products, query) {
  if (!Array.isArray(products) || products.length === 0) {
    return []
  }

  const queryLower = String(query || '').toLowerCase().trim()
  if (!queryLower) {
    return products.slice().sort((a, b) => (a.price || 0) - (b.price || 0))
  }

  // Score products based on relevance to query
  const scored = products.map(product => {
    const name = String(product.name || '').toLowerCase()
    const store = String(product.store || '').toLowerCase()
    const category = String(product.category || '').toLowerCase()

    let score = 0

    // Exact name match gets highest score
    if (name === queryLower) {
      score += 100
    }
    // Name contains query
    else if (name.includes(queryLower)) {
      score += 50
    }
    // Category match
    else if (category.includes(queryLower)) {
      score += 25
    }
    // Store match (lower priority)
    else if (store.includes(queryLower)) {
      score += 10
    }
    // Partial word matches
    else {
      const words = queryLower.split(/\s+/)
      for (const word of words) {
        if (word.length > 2) {
          if (name.includes(word)) score += 5
          if (category.includes(word)) score += 2
        }
      }
    }

    return { ...product, _relevanceScore: score }
  })

  // Filter out products with zero relevance and sort by score then price
  return scored
    .filter(product => product._relevanceScore > 0)
    .sort((a, b) => {
      // Sort by relevance score descending, then by price ascending
      if (b._relevanceScore !== a._relevanceScore) {
        return b._relevanceScore - a._relevanceScore
      }
      return (a.price || 0) - (b.price || 0)
    })
    .map(product => {
      // Remove the temporary score property
      const { _relevanceScore, ...cleanProduct } = product
      return cleanProduct
    })
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
  filterAndRankResults,
  resetCircuitBreaker,
  getHealthStatus
}
