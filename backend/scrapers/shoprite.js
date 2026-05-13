import axios from 'axios'

const STORE_NAME = 'Shoprite'
const SITE_BASE_URL = 'https://www.shoprite.co.za'
const API_BASE_URL = 'https://api.shopritegroup.co.za/dsl/brands/shoprite/countries/ZA/products'
const API_KEY = '5y2GIJ8RoP8dm5FxUtsBZ66OfvAZ8Njh3Pjaj9WF'
const MAX_PAGES = 1

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json,text/plain,*/*',
  'x-api-key': API_KEY
}

export async function scrapeShoprite(query) {
  const results = []
  const seen = new Set()

  await randomDelay()

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await axios.get(API_BASE_URL, {
      headers,
      timeout: 20000,
      params: {
        query,
        currentPage: page
      }
    })

    const products = response?.data?.response?.products
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

export default scrapeShoprite
