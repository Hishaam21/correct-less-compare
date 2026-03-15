import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const productsPath = path.join(__dirname, 'src', 'data', 'products.json')

// Headers to avoid being blocked
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

// Scrape My Catalogue (my-catalogue.co.za)
export async function scrapeMyCatalogue() {
  try {
    console.log('🔄 Scraping My Catalogue...')
    
    const { data } = await axios.get('https://my-catalogue.co.za/', { headers, timeout: 15000 })
    const $ = cheerio.load(data)
    const products = []
    let id = 1

    // Try multiple selector patterns
    const selectors = [
      'div[class*="product"]',
      '.product',
      '[data-product]',
      'article[class*="product"]',
      'li[class*="product"]'
    ]

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element)
        
        const name = $el.find('h2, .product-name, .title, [class*="name"]').text().trim()
        const priceText = $el.find('.price, .product-price, [class*="price"], [data-price]').text().trim()
        const imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || $el.find('[class*="image"] img').attr('src')
        
        if (name && priceText) {
          const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
          
          if (!isNaN(price) && price > 0) {
            products.push({
              id: id++,
              name: name.substring(0, 100),
              category: 'groceries',
              store: 'My Catalogue',
              price: price,
              image: imageUrl || 'https://via.placeholder.com/300x300?text=Product'
            })
          }
        }
      })
      if (products.length > 0) break // If we found products, stop trying
    }

    console.log(`✅ Scraped ${products.length} products from My Catalogue`)
    return products
  } catch (error) {
    console.error('❌ My Catalogue scraping error:', error.message)
    return []
  }
}

// Scrape My Specials (myspecials.co.za)
export async function scrapeMySpecials() {
  try {
    console.log('🔄 Scraping My Specials...')
    
    const { data } = await axios.get('https://myspecials.co.za/', { headers, timeout: 15000 })
    const $ = cheerio.load(data)
    const products = []
    let id = 1000

    // Try multiple selector patterns
    const selectors = [
      'div[class*="product"]',
      'article[class*="product"]',
      '.product',
      '[data-product]',
      'li[class*="product"]'
    ]

    for (const selector of selectors) {
      $(selector).each((index, element) => {
        const $el = $(element)
        
        const name = $el.find('h2, .product-name, .title, [class*="name"], a').text().trim()
        const priceText = $el.find('.price, .product-price, [class*="price"], [data-price]').text().trim()
        const imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src') || $el.find('[class*="image"] img').attr('src')
        
        if (name && priceText) {
          const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
          
          if (!isNaN(price) && price > 0) {
            products.push({
              id: id++,
              name: name.substring(0, 100),
              category: 'groceries',
              store: 'My Specials',
              price: price,
              image: imageUrl || 'https://via.placeholder.com/300x300?text=Product'
            })
          }
        }
      })
      if (products.length > 0) break // If we found products, stop trying
    }

    console.log(`✅ Scraped ${products.length} products from My Specials`)
    return products
  } catch (error) {
    console.error('❌ My Specials scraping error:', error.message)
    return []
  }
}

// Scrape Both & Combine
export async function scrapeAllPrices() {
  try {
    console.log('\n🚀 Starting web scrape for product prices...\n')
    
    const catalogueProducts = await scrapeMyCatalogue()
    await new Promise(r => setTimeout(r, 2000)) // Respectful delay
    
    const specialsProducts = await scrapeMySpecials()
    await new Promise(r => setTimeout(r, 2000))
    
    let allProducts = [...catalogueProducts, ...specialsProducts]
    
    // If scraping returned nothing, use sample data
    if (allProducts.length === 0) {
      console.log('⚠️  Live scraping returned no products. Using sample data...')
      allProducts = getSampleProducts()
    }
    
    // Remove duplicates by name
    const unique = Array.from(
      new Map(allProducts.map(item => [item.name, item])).values()
    )
    
    // Save to products.json
    fs.writeFileSync(productsPath, JSON.stringify(unique, null, 2))
    
    console.log('\n✅ All products scraped and saved!')
    console.log(`📊 Total unique products: ${unique.length}`)
    console.log(`📁 Saved to: ${productsPath}\n`)
    
    return unique
  } catch (error) {
    console.error('❌ Scraping failed:', error.message)
    return []
  }
}

// Manual scrape with detailed fallback
export async function scrapeWithFallback() {
  console.log('\n🔍 Attempting detailed scrape with fallback selectors...\n')
  
  try {
    const { data } = await axios.get('https://my-catalogue.co.za/', { headers })
    const $ = cheerio.load(data)
    
    // Log page structure for debugging
    console.log('Available elements:')
    console.log('- Scripts:', $('script').length)
    console.log('- Links:', $('a').length)
    console.log('- Images:', $('img').length)
    
    // Try multiple selector patterns
    const selectors = [
      { name: '.product-name', price: '.product-price', image: 'img.product-image' },
      { name: '[data-testid="product-name"]', price: '[data-testid="product-price"]', image: 'img[alt]' },
      { name: '.item-title', price: '.item-price', image: '.item-image img' },
      { name: 'h3', price: '.price', image: 'img' }
    ]
    
    for (const selector of selectors) {
      const items = $(selector.name).length
      if (items > 5) {
        console.log(`✅ Found ${items} items with selectors:`, selector)
        return selector
      }
    }
    
    console.log('⚠️ Could not find reliable selectors')
    return null
  } catch (error) {
    console.error('Error in fallback scrape:', error.message)
    return null
  }
}

// Normalize product data from scraper
function normalizeProduct(rawProduct, store) {
  return {
    name: rawProduct.name || 'Unknown Product',
    price: rawProduct.price || 0,
    store: store,
    link: rawProduct.url || rawProduct.productUrl || 'https://my-catalogue.co.za',
    lastUpdated: new Date().toISOString(),
    promo: rawProduct.promo || null
  }
}

// Search and scrape products by query from both websites
// Wrap searchProducts with a timeout to prevent hanging on network issues
export async function searchProducts(searchQuery) {
  return Promise.race([
    _searchProductsInternal(searchQuery),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search timeout - using fallback')), 10000)
    )
  ]).catch(err => {
    console.log(`⚠️  Search failed (${err.message}) - returning empty`)
    return []
  })
}

async function _searchProductsInternal(searchQuery) {
  try {
    console.log(`🔍 Scraping for: "${searchQuery}"`)
    
    let allProducts = []
    
    // Search My Catalogue
    try {
      const catalogueUrl = `https://my-catalogue.co.za/?s=${encodeURIComponent(searchQuery)}`
      console.log(`🔄 Scraping My Catalogue...`)
      
      const { data } = await axios.get(catalogueUrl, { headers, timeout: 15000 })
      const $ = cheerio.load(data)
      
      // Try multiple selector patterns
      const selectors = [
        'div[class*="product"]',
        '.product',
        'article[class*="product"]',
        '[data-product]',
        'li[class*="product"]'
      ]
      
      for (const selector of selectors) {
        $(selector).each((index, element) => {
          if (allProducts.length >= 20) return // Limit results per site
          
          const $el = $(element)
          
          const name = $el.find('h2, .product-name, .title, [class*="name"], a').text().trim()
          const priceText = $el.find('.price, .product-price, [class*="price"], [data-price]').text().trim()
          const productUrl = $el.find('a').attr('href') || catalogueUrl
          
          if (name && priceText && name.toLowerCase().includes(searchQuery.toLowerCase())) {
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
            
            if (!isNaN(price) && price > 0) {
              allProducts.push(normalizeProduct({
                name: name.substring(0, 150),
                price: price,
                url: productUrl
              }, 'My Catalogue'))
            }
          }
        })
        if (allProducts.length > 0) break
      }
      
      console.log(`✅ Found ${allProducts.length} product(s) on My Catalogue`)
    } catch (error) {
      console.log(`⚠️ My Catalogue error: ${error.message}`)
    }
    
    // Respectful delay between requests
    await new Promise(r => setTimeout(r, 2000))
    
    // Search My Specials
    try {
      const specialsUrl = `https://myspecials.co.za/?s=${encodeURIComponent(searchQuery)}`
      console.log(`🔄 Scraping My Specials...`)
      
      const { data } = await axios.get(specialsUrl, { headers, timeout: 15000 })
      const $ = cheerio.load(data)
      
      // Try multiple selector patterns
      const selectors = [
        'div[class*="product"]',
        'article[class*="product"]',
        '.product',
        '[data-product]',
        'li[class*="product"]'
      ]
      
      for (const selector of selectors) {
        $(selector).each((index, element) => {
          if (allProducts.length >= 40) return // Limit total results
          
          const $el = $(element)
          
          const name = $el.find('h2, .product-name, .title, [class*="name"], a').text().trim()
          const priceText = $el.find('.price, .product-price, [class*="price"], [data-price]').text().trim()
          const productUrl = $el.find('a').attr('href') || specialsUrl
          
          if (name && priceText && name.toLowerCase().includes(searchQuery.toLowerCase())) {
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
            
            if (!isNaN(price) && price > 0) {
              allProducts.push(normalizeProduct({
                name: name.substring(0, 150),
                price: price,
                url: productUrl
              }, 'My Specials'))
            }
          }
        })
        if (allProducts.length > 20) break
      }
      
      console.log(`✅ Found ${allProducts.length} total product(s)`)
    } catch (error) {
      console.log(`⚠️ My Specials error: ${error.message}`)
    }

    // Respectful delay between requests
    await new Promise(r => setTimeout(r, 2000))
    
    // Search Shoprite
    try {
      const shopritUrl = `https://www.shoprite.co.za/search?q=${encodeURIComponent(searchQuery)}`
      console.log(`🔄 Scraping Shoprite...`)
      
      const { data } = await axios.get(shopritUrl, { headers, timeout: 15000 })
      const $ = cheerio.load(data)
      
      // Debug: Check what's on the page
      const productElements = $('[class*="product"], .product, article[class*="product"], [data-product], li[class*="product"]')
      console.log(`📝 Shoprite: Found ${productElements.length} potential product elements`)
      
      // Try multiple selector patterns for Shoprite
      const selectors = [
        'div[class*="product"]',
        '.product',
        'article[class*="product"]',
        '[data-product]',
        'li[class*="product"]',
        '[class*="item"]',
        'a[href*="/p/"]'
      ]
      
      let shopritProducts = 0
      for (const selector of selectors) {
        $(selector).each((index, element) => {
          if (allProducts.length >= 60) return
          
          const $el = $(element)
          const name = $el.find('h2, .product-name, .title, [class*="name"], span').text().trim() || $el.text().trim().substring(0, 100)
          const priceText = $el.find('.price, .product-price, [class*="price"], [data-price]').text().trim()
          const productUrl = $el.find('a').attr('href') || $el.attr('href') || shopritUrl
          
          if (name && priceText && name.toLowerCase().includes(searchQuery.toLowerCase()) && name.length > 3) {
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
            
            if (!isNaN(price) && price > 0 && price < 10000) {
              allProducts.push(normalizeProduct({
                name: name.substring(0, 150),
                price: price,
                url: productUrl.startsWith('http') ? productUrl : 'https://www.shoprite.co.za' + productUrl
              }, 'Shoprite'))
              shopritProducts++
            }
          }
        })
        if (shopritProducts > 0) break
      }
      
      console.log(`✅ Found ${shopritProducts} product(s) from Shoprite`)
    } catch (error) {
      console.log(`⚠️ Shoprite error: ${error.message}`)
    }

    // Respectful delay between requests
    await new Promise(r => setTimeout(r, 2000))
    
    // Search Checkers
    try {
      const checkersUrl = `https://www.checkers.co.za/search?q=${encodeURIComponent(searchQuery)}`
      console.log(`🔄 Scraping Checkers...`)
      
      const { data } = await axios.get(checkersUrl, { headers, timeout: 15000 })
      const $ = cheerio.load(data)
      
      // Debug: Check what's on the page
      const productElements = $('[class*="product"], .product, article[class*="product"], [data-product], li[class*="product"]')
      console.log(`📝 Checkers: Found ${productElements.length} potential product elements`)
      
      // Try multiple selector patterns for Checkers
      const selectors = [
        'div[class*="product"]',
        '.product',
        'article[class*="product"]',
        '[data-product]',
        'li[class*="product"]',
        '[class*="item"]',
        'a[href*="/p/"]'
      ]
      
      let checkersProducts = 0
      for (const selector of selectors) {
        $(selector).each((index, element) => {
          if (allProducts.length >= 80) return
          
          const $el = $(element)
          const name = $el.find('h2, .product-name, .title, [class*="name"], span').text().trim() || $el.text().trim().substring(0, 100)
          const priceText = $el.find('.price, .product-price, [class*="price"], [data-price]').text().trim()
          const productUrl = $el.find('a').attr('href') || $el.attr('href') || checkersUrl
          
          if (name && priceText && name.toLowerCase().includes(searchQuery.toLowerCase()) && name.length > 3) {
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''))
            
            if (!isNaN(price) && price > 0 && price < 10000) {
              allProducts.push(normalizeProduct({
                name: name.substring(0, 150),
                price: price,
                url: productUrl.startsWith('http') ? productUrl : 'https://www.checkers.co.za' + productUrl
              }, 'Checkers'))
              checkersProducts++
            }
          }
        })
        if (checkersProducts > 0) break
      }
      
      console.log(`✅ Found ${checkersProducts} product(s) from Checkers`)
    } catch (error) {
      console.log(`⚠️ Checkers error: ${error.message}`)
    }
    
    console.log(`📊 Returning ${allProducts.length} results for "${searchQuery}"`)
    return allProducts
  } catch (error) {
    console.error('❌ Search failed:', error.message)
    return []
  }
}

// Sample products for fallback when live scraping fails
function getSampleProducts() {
  const sampleData = [
    { id: 1, name: 'Spekko Rice 1kg', category: 'groceries', store: 'My Catalogue', price: 45.99, image: 'https://via.placeholder.com/300x300?text=Rice' },
    { id: 2, name: 'Spekko Rice 1kg', category: 'groceries', store: 'My Specials', price: 42.99, image: 'https://via.placeholder.com/300x300?text=Rice' },
    { id: 3, name: 'Golden Delight Rice 2kg', category: 'groceries', store: 'My Catalogue', price: 89.99, image: 'https://via.placeholder.com/300x300?text=Rice' },
    { id: 4, name: 'Golden Delight Rice 2kg', category: 'groceries', store: 'My Specials', price: 85.99, image: 'https://via.placeholder.com/300x300?text=Rice' },
    { id: 5, name: 'Sunflower Oil 500ml', category: 'groceries', store: 'My Catalogue', price: 34.99, image: 'https://via.placeholder.com/300x300?text=Oil' },
    { id: 6, name: 'Sunflower Oil 500ml', category: 'groceries', store: 'My Specials', price: 32.99, image: 'https://via.placeholder.com/300x300?text=Oil' },
    { id: 7, name: 'Bread 700g', category: 'groceries', store: 'My Catalogue', price: 12.99, image: 'https://via.placeholder.com/300x300?text=Bread' },
    { id: 8, name: 'Bread 700g', category: 'groceries', store: 'My Specials', price: 11.99, image: 'https://via.placeholder.com/300x300?text=Bread' },
    { id: 9, name: 'Sugar 2kg', category: 'groceries', store: 'My Catalogue', price: 22.99, image: 'https://via.placeholder.com/300x300?text=Sugar' },
    { id: 10, name: 'Sugar 2kg', category: 'groceries', store: 'My Specials', price: 21.99, image: 'https://via.placeholder.com/300x300?text=Sugar' },
    { id: 11, name: 'Peanut Butter 400g', category: 'groceries', store: 'My Catalogue', price: 28.99, image: 'https://via.placeholder.com/300x300?text=Peanut' },
    { id: 12, name: 'Peanut Butter 400g', category: 'groceries', store: 'My Specials', price: 26.99, image: 'https://via.placeholder.com/300x300?text=Peanut' },
    { id: 13, name: 'Maize Meal 5kg', category: 'groceries', store: 'My Catalogue', price: 38.99, image: 'https://via.placeholder.com/300x300?text=Maize' },
    { id: 14, name: 'Maize Meal 5kg', category: 'groceries', store: 'My Specials', price: 36.99, image: 'https://via.placeholder.com/300x300?text=Maize' },
    { id: 15, name: 'Milk 1L', category: 'groceries', store: 'My Catalogue', price: 16.99, image: 'https://via.placeholder.com/300x300?text=Milk' },
    { id: 16, name: 'Milk 1L', category: 'groceries', store: 'My Specials', price: 15.99, image: 'https://via.placeholder.com/300x300?text=Milk' },
    { id: 17, name: 'Eggs (Dozen)', category: 'groceries', store: 'My Catalogue', price: 24.99, image: 'https://via.placeholder.com/300x300?text=Eggs' },
    { id: 18, name: 'Eggs (Dozen)', category: 'groceries', store: 'My Specials', price: 23.99, image: 'https://via.placeholder.com/300x300?text=Eggs' },
    { id: 19, name: 'Tomato Sauce 400g', category: 'groceries', store: 'My Catalogue', price: 8.99, image: 'https://via.placeholder.com/300x300?text=Sauce' },
    { id: 20, name: 'Tomato Sauce 400g', category: 'groceries', store: 'My Specials', price: 7.99, image: 'https://via.placeholder.com/300x300?text=Sauce' }
  ]
  console.log(`✅ Loaded ${sampleData.length} sample products`)
  return sampleData
}
