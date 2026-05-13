import axios from 'axios'
import { load } from 'cheerio'

const STORE_NAME = 'Takealot'
const SITE_BASE_URL = 'https://www.takealot.com'
const SEARCH_URL = 'https://www.takealot.com/s'
const MAX_PAGES = 1

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
}

export async function scrapeTakealot(query) {
  const results = []
  const seen = new Set()

  if (!query || query.trim().length === 0) return results

  await randomDelay()

  for (let page = 0; page < MAX_PAGES; page += 1) {
    try {
      const searchUrl = `${SEARCH_URL}?query=${encodeURIComponent(query)}${page > 0 ? '&page=' + (page + 1) : ''}`
      
      console.log(`[${STORE_NAME}] Scraping: ${searchUrl}`)
      
      const response = await axios.get(searchUrl, {
        headers,
        timeout: 30000
      })

      if (!response.data) {
        console.log(`[${STORE_NAME}] No response data received`)
        break
      }

      const $ = load(response.data)
      
      // Try multiple selector strategies for finding products
      let productElements = $(
        '[data-test="product-grid-item"], ' +
        'div[data-testid*="product"], ' +
        'article[class*="product"], ' +
        'div[class*="ProductTile"], ' +
        'div[class*="product-card"], ' +
        '[class*="product-item"]'
      )

      // If standard selectors don't work, try product link-based approach
      if (productElements.length === 0) {
        console.log(`[${STORE_NAME}] Standard selectors found 0 products, trying fallback`)
        productElements = $('a[href*="/p/"]').closest('div').filter((i, el) => {
          return $(el).find('h2, h3, [class*="title"]').length > 0
        })
      }

      console.log(`[${STORE_NAME}] Found ${productElements.length} product elements on page ${page}`)

      if (productElements.length === 0) break

      const products = []
      productElements.each((idx, element) => {
        const productData = extractProductData($, element)
        if (productData) products.push(productData)
      })

      console.log(`[${STORE_NAME}] Extracted ${products.length} valid products from page ${page}`)

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

  console.log(`[${STORE_NAME}] Total results: ${results.length}`)
  return results
}

function extractProductData($, element) {
  try {
    const $el = $(element)
    
    let name = $el.find('h2, [class*="title"], .productTitle, a[title]').first().text()
    if (!name) name = $el.find('a').first().attr('title') || $el.find('a').first().text()

    // Extract price - more robust pattern for South African Rand
    let price = ''
    
    // Try data attributes first
    price = $el.find('[class*="price"], [data-price], [data-testid*="price"]').first().text()
    
    // If not found, search for spans with price patterns
    if (!price) {
      price = $el.find('span, div').filter((i, el) => {
        const text = $(el).text()
        return text.match(/R\s*[\d,]+(\.\d{2})?/) || 
               text.match(/^[\d,]+(\.\d{2})?/) && text.length < 20
      }).first().text()
    }

    let link = $el.find('a').first().attr('href') || ''
    if (link && !link.startsWith('http')) {
      link = link.startsWith('/') ? SITE_BASE_URL + link : SITE_BASE_URL + '/' + link
    }

    let brand = $el.find('[class*="brand"], .productBrand').text()
    let size = $el.find('[class*="size"], .productSize, [data-test*="size"]').text()

    name = normalizeWhitespace(name)
    price = normalizePrice(price)
    brand = normalizeWhitespace(brand)
    size = normalizeWhitespace(size)

    if (!name || !price || !link) return null

    return { name, price: Number(price), link, brand: brand || undefined, size: size || undefined }
  } catch (error) {
    console.error('[Takealot] Error extracting product data:', error.message)
    return null
  }
}

function parseProduct(product, siteBaseUrl, storeName) {
  const name = normalizeWhitespace(product?.name)
  const price = Number(product?.price)
  const link = String(product?.link || '').trim()

  if (!name || !Number.isFinite(price) || price <= 0 || !link) return null

  const result = {
    name,
    price: Number(price.toFixed(2)),
    store: storeName,
    link,
    lastChecked: new Date().toISOString()
  }

  if (product.brand) result.brand = product.brand
  if (product.size) result.size = product.size

  return result
}

function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function normalizePrice(priceStr) {
  // Handle South African Rand format (R 123,45 or R123.45)
  const cleaned = String(priceStr || '')
    .replace(/[R\s]/g, '') // Remove R and spaces
    .replace(/,(\d{2})$/, '.$1') // Handle comma as decimal separator
    .replace(/,/g, '') // Remove thousands separators

  const match = cleaned.match(/[\d.]+/)
  const price = parseFloat(match?.[0] || '0')
  
  return isNaN(price) ? 0 : price
}

function randomDelay() {
  const delayMs = 2000 + Math.floor(Math.random() * 3000)
  return new Promise(resolve => setTimeout(resolve, delayMs))
}

export default scrapeTakealot