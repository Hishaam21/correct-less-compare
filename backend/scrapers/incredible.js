import axios from 'axios'
import { load } from 'cheerio'

const STORE_NAME = 'Incredible Connection'
const BASE_URL = 'https://www.incredible.co.za'
const SEARCH_URL = 'https://www.incredible.co.za/search'

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Referer': BASE_URL
}

function randomDelay() {
  const delay = 2000 + Math.random() * 2000
  return new Promise(resolve => setTimeout(resolve, delay))
}

export async function scrapeIncredible(query) {
  try {
    console.log(`🛒 [${STORE_NAME}] Searching for: "${query}"`)
    
    if (!query || query.trim().length === 0) {
      return []
    }

    await randomDelay()

    const searchUrl = `${SEARCH_URL}?q=${encodeURIComponent(query)}`
    
    const { data } = await axios.get(searchUrl, {
      headers,
      timeout: 15000
    })

    const $ = load(data)
    const products = []
    const seen = new Set()

    // Multiple selector fallbacks for flexibility
    const productSelectors = [
      '[data-product-id]',
      '.product-item',
      '[class*="product-card"]',
      '[class*="product-tile"]',
      '.product',
      'li[class*="product"]',
      'article[class*="product"]',
      '[data-testid*="product"]'
    ]

    for (const selector of productSelectors) {
      $(selector).slice(0, 20).each((index, element) => {
        const $element = $(element)
        
        // Extract product information
        const name = normalizeWhitespace(
          $element.find('.product-title, .product-name, h2, h3, [class*="title"]').first().text() ||
          $element.find('a').first().attr('title') ||
          $element.find('a').first().text()
        )
        
        const priceText = $element.find('.price, .product-price, [data-price], [class*="price"]').first().text()
        const price = normalizePrice(priceText)
        
        const productUrl = $element.find('a').first().attr('href') || ''
        const linkUrl = productUrl
          ? productUrl.startsWith('http') 
            ? productUrl 
            : `${BASE_URL}${productUrl.startsWith('/') ? '' : '/'}${productUrl}`
          : ''

        if (name && Number.isFinite(price) && price > 0 && linkUrl) {
          const key = `${name}|${price}|${linkUrl}`
          if (seen.has(key)) return
          seen.add(key)

          products.push({
            name: name.substring(0, 150),
            price: parseFloat(price.toFixed(2)),
            store: STORE_NAME,
            link: linkUrl,
            lastChecked: new Date().toISOString()
          })
        }
      })
      
      if (products.length > 0) break
    }

    console.log(`✅ [${STORE_NAME}] Found ${products.length} products`)
    return products
  } catch (error) {
    console.error(`❌ [${STORE_NAME}] Scraping failed:`, error.message)
    return []
  }
}

function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function normalizePrice(priceText) {
  const match = String(priceText || '').match(/[\d.]+/)
  return parseFloat(match?.[0] || '0') || 0
}

export default scrapeIncredible