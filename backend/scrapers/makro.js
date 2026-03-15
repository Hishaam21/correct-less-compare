/**
 * Makro South Africa Retailer Scraper
 * Scrapes Makro search results only
 * Safe, minimal impact, public pages only
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

const STORE_NAME = 'Makro'
const BASE_URL = 'https://www.makro.co.za'

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

export async function scrapeMakro(query) {
  try {
    console.log(`🛒 [Makro] Searching for: "${query}"`)
    
    await randomDelay()

    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}`
    
    const { data } = await axios.get(searchUrl, {
      headers,
      timeout: 12000
    })

    const $ = cheerio.load(data)
    const products = []

    const productSelectors = [
      '.product',
      '[class*="product"]',
      '.search-result',
      'li[class*="product"]'
    ]

    for (const selector of productSelectors) {
      $(selector).slice(0, 20).each((index, element) => {
        const $element = $(element)
        
        const name = $element.find('.product-title, .product-name, h2').text().trim()
        const priceText = $element.find('.price, .product-price, [data-price]').text().trim()
        const productUrl = $element.find('a').attr('href') || ''
        const linkUrl = productUrl.startsWith('http') ? productUrl : `${BASE_URL}${productUrl}`

        const price = parseFloat(priceText.replace(/[^\d.]/g, ''))

        if (name && !isNaN(price) && price > 0) {
          products.push({
            name: name.substring(0, 150),
            price: parseFloat(price.toFixed(2)),
            store: STORE_NAME,
            link: linkUrl || BASE_URL,
            category: 'groceries',
            lastChecked: new Date().toISOString()
          })
        }
      })
      
      if (products.length > 0) break
    }

    console.log(`✅ [Makro] Found ${products.length} products`)
    return products
  } catch (error) {
    console.error(`❌ [Makro] Scraping failed:`, error.message)
    throw error
  }
}

export default scrapeMakro
