import axios from 'axios'
import { load } from 'cheerio'

const STORE_NAME = 'Clicks'
const SITE_BASE_URL = 'https://www.clicks.co.za'
const SEARCH_URL = 'https://www.clicks.co.za/search'
const MAX_PAGES = 1

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'DNT': '1',
  'Connection': 'keep-alive'
}

const productSelectors = [
  '[data-product-id]',
  '.product-item',
  '.product-card',
  '.product-tile',
  '.product-listing',
  '.product',
  'article',
  'li[class*="product"]',
  '[id^="product"]'
]

export async function scrapeClicks(query) {
  const results = []
  const seen = new Set()

  if (!query || query.trim().length === 0) return results

  await randomDelay()

  for (let page = 0; page < MAX_PAGES; page += 1) {
    try {
      const searchUrl = `${SEARCH_URL}?text=${encodeURIComponent(query)}${page > 0 ? '&page=' + (page + 1) : ''}`
      const response = await axios.get(searchUrl, {
        headers,
        timeout: 30000
      })

      if (!response.data) break

      const $ = load(response.data)
      let productElements = $(productSelectors.join(', '))

      if (productElements.length === 0) {
        // Fallback selectors for alternative layout structures
        productElements = $('a[href*="/product/"] , a[href*="/p/"]')
      }

      if (productElements.length === 0) break

      const products = []
      productElements.slice(0, 40).each((idx, element) => {
        const productData = extractProductData($, element)
        if (productData) products.push(productData)
      })

      if (products.length === 0) break

      for (const product of products) {
        const parsed = parseProduct(product, SITE_BASE_URL, STORE_NAME)
        if (!parsed) continue

        const key = `${parsed.name}|${parsed.price}|${parsed.link}`
        if (seen.has(key)) continue
        seen.add(key)
        results.push(parsed)
      }
    } catch (error) {
      console.error(`[${STORE_NAME}] Error scraping page ${page}:`, error.message)
      if (page === 0) break
    }
  }

  return results
}

function extractProductData($, element) {
  try {
    const $el = $(element)

    let name = normalizeWhitespace(
      $el.find('h2, h3, [class*=\"title\"], [class*=\"name\"], .product-name, a[title]').first().text() ||
      $el.find('a').first().attr('title') ||
      $el.find('a').first().text()
    )

    let priceText = normalizeWhitespace(
      $el.find('[class*=\"price\"], [data-price], [data-testid*=\"price\"]').first().text()
    )
    if (!priceText) {
      priceText = normalizeWhitespace(
        $el.find('span, div').filter((i, el) => {
          const text = $(el).text()
          return /R\s*[\d,]+(\.\d{1,2})?/.test(text) || /^\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(text)
        }).first().text()
      )
    }

    let link = $el.find('a[href]').first().attr('href') || ''
    if (link && !link.startsWith('http')) {
      link = link.startsWith('/') ? SITE_BASE_URL + link : `${SITE_BASE_URL}/${link}`
    }

    if (!name || !link) return null

    const price = normalizePrice(priceText)
    if (!price) return null

    return { name, price, link }
  } catch (error) {
    console.error('[Clicks] Error extracting product data:', error.message)
    return null
  }
}

function parseProduct(product, siteBaseUrl, storeName) {
  const name = normalizeWhitespace(product?.name)
  const price = Number(product?.price)
  const link = String(product?.link || '').trim()

  if (!name || !Number.isFinite(price) || price <= 0 || !link) return null

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

function normalizePrice(priceStr) {
  const cleaned = String(priceStr || '')
    .replace(/R/g, '')
    .replace(/\s/g, '')
    .replace(/,([0-9]{2})$/, '.$1')
    .replace(/,/g, '')

  const match = cleaned.match(/[0-9]+(?:\.[0-9]{1,2})?/) || []
  return parseFloat(match[0] || '0') || 0
}

function randomDelay() {
  const delayMs = 2000 + Math.floor(Math.random() * 3000)
  return new Promise(resolve => setTimeout(resolve, delayMs))
}

export default scrapeClicks