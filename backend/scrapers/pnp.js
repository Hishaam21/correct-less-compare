import axios from 'axios'

const STORE_NAME = 'Pick n Pay'
const SITE_BASE_URL = 'https://www.pnp.co.za'
const CONFIG_URL = 'https://www.pnp.co.za/pnphybris/v2/pnp-spa/config'
const SEARCH_URL = 'https://www.pnp.co.za/pnphybris/v2/pnp-spa/products/search'
const MAX_PAGES = 1

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json,text/plain,*/*'
}

let cachedStoreCode = null

export async function scrapePnP(query) {
  const results = []
  const seen = new Set()
  const storeCode = await getStoreCode()

  if (!storeCode) {
    return results
  }

  await randomDelay()

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await axios.post(
      SEARCH_URL,
      {},
      {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        timeout: 25000,
        params: {
          storeCode,
          query,
          currentPage: page,
          fields:
            'products(code,name,url,price(FULL),stock(FULL),images(DEFAULT),averageRating,numberOfReviews),pagination(DEFAULT),currentQuery,freeTextSearch'
        }
      }
    )

    const products = response?.data?.products
    if (!Array.isArray(products) || products.length === 0) {
      break
    }

    for (const product of products) {
      const parsed = parseProduct(product, SITE_BASE_URL, STORE_NAME)
      if (!parsed) continue

      const key = `${parsed.name}|${parsed.price}|${parsed.link}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push(parsed)
    }
  }

  return results
}

async function getStoreCode() {
  if (cachedStoreCode) {
    return cachedStoreCode
  }

  try {
    const response = await axios.get(CONFIG_URL, {
      headers,
      timeout: 20000
    })
    const code = String(response?.data?.hybris?.baseStore?.uid || '').trim()
    cachedStoreCode = code || null
    return cachedStoreCode
  } catch (error) {
    console.error('[Pick n Pay] failed to fetch base store code:', error.message)
    return null
  }
}

function parseProduct(product, siteBaseUrl, storeName) {
  const name = normalizeWhitespace(product?.name)
  const price = Number(product?.price?.value)
  const rawUrl = String(product?.url || '').trim()
  const link = rawUrl.startsWith('http')
    ? rawUrl
    : rawUrl
      ? `${siteBaseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
      : ''

  if (!name || !Number.isFinite(price) || price <= 0 || !link) {
    return null
  }

  return {
    name,
    price: Number(price.toFixed(2)),
    store: storeName,
    link,
    lastChecked: new Date().toISOString()
  }
}

function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function randomDelay() {
  const delayMs = 2000 + Math.floor(Math.random() * 2001)
  return new Promise(resolve => setTimeout(resolve, delayMs))
}

export default scrapePnP
