# Web Scraping API Reference

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Scrape All Products
**Endpoint**: `POST /api/scrape/all`

**Description**: Scrapes both my-catalogue.co.za and myspecials.co.za, deduplicates products, and saves to products.json

**Request**:
```bash
curl -X POST http://localhost:3000/api/scrape/all \
  -H "Content-Type: application/json"
```

**Response Success** (200):
```json
{
  "success": true,
  "count": 83,
  "message": "Products scraped successfully",
  "preview": [
    {
      "id": 1,
      "name": "Spekko Rice 1kg",
      "category": "groceries",
      "store": "My Catalogue",
      "price": 45.99,
      "image": "https://my-catalogue.co.za/images/rice.jpg"
    }
  ]
}
```

**Response Error** (500):
```json
{
  "success": false,
  "message": "Failed to scrape: Network timeout"
}
```

---

### 2. Scrape My Catalogue Only
**Endpoint**: `POST /api/scrape/catalogue`

**Description**: Scrapes only my-catalogue.co.za

**Request**:
```bash
curl -X POST http://localhost:3000/api/scrape/catalogue \
  -H "Content-Type: application/json"
```

**Response Success** (200):
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Product Name",
      "category": "groceries",
      "store": "My Catalogue",
      "price": 99.99,
      "image": "https://..."
    }
  ]
}
```

---

### 3. Scrape My Specials Only
**Endpoint**: `POST /api/scrape/specials`

**Description**: Scrapes only myspecials.co.za

**Request**:
```bash
curl -X POST http://localhost:3000/api/scrape/specials \
  -H "Content-Type: application/json"
```

**Response Success** (200):
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "Product Name",
      "category": "groceries",
      "store": "My Specials",
      "price": 99.99,
      "image": "https://..."
    }
  ]
}
```

---

### 4. Get Current Products
**Endpoint**: `GET /api/products`

**Description**: Returns all products currently stored in products.json

**Request**:
```bash
curl http://localhost:3000/api/products
```

**Response Success** (200):
```json
{
  "success": true,
  "count": 83,
  "products": [
    {
      "id": 1,
      "name": "Spekko Rice 1kg",
      "category": "groceries",
      "store": "My Catalogue",
      "price": 45.99,
      "image": "https://my-catalogue.co.za/images/rice.jpg"
    },
    {
      "id": 2,
      "name": "Sunflower Rice 1kg",
      "category": "groceries",
      "store": "My Specials",
      "price": 42.99,
      "image": "https://myspecials.co.za/images/rice.jpg"
    }
  ]
}
```

---

### 5. Run Fallback Scraper (Diagnostic)
**Endpoint**: `POST /api/scrape/fallback`

**Description**: Runs diagnostic scraper to detect CSS selector changes. Use if main scrapers stop working.

**Request**:
```bash
curl -X POST http://localhost:3000/api/scrape/fallback \
  -H "Content-Type: application/json"
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Fallback scraper completed",
  "myCatalogueStatus": "Found 12 selectors matching 'div[class*=\"product\"]'",
  "mySpecialsStatus": "Found 8 selectors matching '.item'"
}
```

---

## Product Schema

All products follow this schema:

```json
{
  "id": 1,
  "name": "String (max 100 chars)",
  "category": "groceries | appliances | beauty | sports | auto",
  "store": "My Catalogue | My Specials | Other",
  "price": 0.00,
  "image": "https://... | https://via.placeholder.com/300x300"
}
```

### Field Descriptions
- **id**: Unique identifier (auto-incremented)
- **name**: Product name (truncated to 100 chars)
- **category**: Product category (default: groceries)
- **store**: Retailer name where product is from
- **price**: Price in South African Rand (ZAR)
- **image**: Product image URL (or placeholder if not found)

---

## Usage Examples

### JavaScript/React
```javascript
// Trigger scrape
async function scrapeProducts() {
  const response = await fetch('/api/scrape/all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await response.json()
  
  if (data.success) {
    console.log(`Scraped ${data.count} products`)
    return data.preview
  }
  throw new Error(data.message)
}

// Get current products
async function getProducts() {
  const response = await fetch('/api/products')
  const data = await response.json()
  
  return data.products // Array of products with images
}

// Use in component
const products = await getProducts()
products.forEach(p => {
  console.log(`${p.name}: R${p.price} - ${p.image}`)
})
```

### Command Line (Bash/PowerShell)
```powershell
# Scrape all products
Invoke-WebRequest -Uri "http://localhost:3000/api/scrape/all" `
  -Method POST `
  -ContentType "application/json" | ConvertFrom-Json

# Get products
Invoke-WebRequest -Uri "http://localhost:3000/api/products" | ConvertFrom-Json
```

---

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 500 | `Failed to scrape: Network timeout` | Check internet, verify websites are up |
| 500 | `Failed to scrape: No products found` | Websites may have changed HTML structure - run `/api/scrape/fallback` |
| 400 | `Missing required parameter` | Check request body is valid JSON |
| 404 | `Endpoint not found` | Verify URL and method (POST vs GET) |

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

---

## Rate Limiting & Best Practices

### Scraping Best Practices
1. **Don't spam**: Scrape once per day max
2. **Respect robots.txt**: Our scraper includes proper User-Agent headers
3. **Error handling**: Always wrap scrape calls in try/catch
4. **Logging**: Monitor server logs for issues

### Recommended Schedule
- **Development**: Manual scrapes as needed
- **Production**: Automated daily scrape at 2 AM (via cron)

### Example Cron Setup (in server.js)
```javascript
import cron from 'node-cron'

// Scrape daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const products = await scrapeAllPrices()
    console.log(`✅ Daily scrape: ${products.length} products`)
  } catch (error) {
    console.error('❌ Daily scrape failed:', error)
  }
})
```

---

## Testing Endpoints

### Test 1: Check if server is running
```bash
curl http://localhost:3000/api/products
```
Should return current products or empty array.

### Test 2: Trigger scrape and see results
```bash
curl -X POST http://localhost:3000/api/scrape/all
```
Should return success=true with count and preview.

### Test 3: Verify products have images
```bash
curl http://localhost:3000/api/products | jq '.products[0].image'
```
Should return an image URL (https://...).

---

## Performance Metrics

| Operation | Time | Notes |
|-----------|------|-------|
| First scrape | 15-20s | Initial site requests |
| Subsequent scrape | 5-10s | Cached responses |
| Get products | <100ms | Local JSON read |
| Fallback scraper | 20-30s | Diagnostic, slower |

---

## Troubleshooting API Issues

### Scraper returns no products
1. Verify websites are accessible:
   ```bash
   curl https://my-catalogue.co.za
   curl https://myspecials.co.za
   ```
2. Run fallback scraper to check CSS selectors
3. Check if websites changed their HTML structure

### Images not in response
1. Websites may not have images in listings
2. Fallback placeholder images should show instead
3. Check scraper.js CSS selectors for image extraction

### API endpoint not responding
1. Verify server is running: `npm run dev`
2. Check port 3000 is not in use
3. Look at server console for errors
4. Verify firewall/antivirus not blocking port

---

## Data Persistence

### Where data is stored
```
src/data/products.json
```

### Backup and restore
```bash
# Backup current products
cp src/data/products.json src/data/products.backup.json

# Restore from backup
cp src/data/products.backup.json src/data/products.json
```

---

## Complete Scraper Implementation Flow

```
POST /api/scrape/all
    ↓
Import scraper.js functions
    ↓
scrapeMyCatalogue()
├─ Fetch my-catalogue.co.za HTML
├─ Parse with cheerio
├─ Extract: name, price, image
└─ Return array of products

scrapeMySpecials()
├─ Fetch myspecials.co.za HTML
├─ Parse with cheerio
├─ Extract: name, price, image
└─ Return array of products

Combine & Deduplicate
├─ Merge both arrays
├─ Remove duplicates by name
└─ Add unique IDs

Save to products.json
├─ Write combined array to file
├─ Log: "All products scraped"
└─ Return success response
```

---

## Support & Maintenance

For issues:
1. Check server logs: terminal where `npm run dev` is running
2. Run `/api/scrape/fallback` to diagnose selector issues
3. Verify internet connection and website accessibility
4. Check browser console for image loading errors
5. Ensure all npm dependencies installed: `npm install`

---

**Last Updated**: Web scraping v1.0  
**Status**: Production Ready ✅
