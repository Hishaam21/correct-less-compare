# Quick Start Guide - Web Scraping & Images

## Installation & Setup (5 minutes)

### 1. Install Dependencies
```bash
cd "c:\Users\LENOVO\Downloads\less compare"
npm install
```

### 2. Start the Server
```bash
npm run dev
```
Server will be running on `http://localhost:3000`

### 3. Fetch Products
Make a POST request to trigger scraping:

**Using curl (PowerShell)**:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/scrape/all" -Method POST -ContentType "application/json"
```

**Or from your browser's console** (after logging in):
```javascript
fetch('/api/scrape/all', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
  .then(r => r.json())
  .then(d => console.log(`Scraped ${d.count} products`))
```

### 4. Use the App
1. Go to `http://localhost:5173` (Vite dev server)
2. Login with your credentials
3. Search for a product (e.g., "rice", "sugar", "bread")
4. **Products will show with images!**
5. Click "Add" to compare prices

---

## What Was Implemented

### ✅ Complete Web Scraper
- Scrapes **my-catalogue.co.za** and **myspecials.co.za**
- Extracts product **names, prices, categories, and images**
- Saves to `src/data/products.json`
- **Automatic fallback images** if scraped images unavailable

### ✅ API Endpoints
```
POST /api/scrape/all          → Scrape both websites
POST /api/scrape/catalogue    → Scrape my-catalogue only
POST /api/scrape/specials     → Scrape myspecials only
GET  /api/products            → Get stored products
POST /api/scrape/fallback     → Debug/test scraper
```

### ✅ Product Images in Search Results
- **Compare component** now displays product images (80x80px)
- Images show alongside product names and prices
- Fallback placeholders if images missing/broken

### ✅ Dependencies Added
- `axios` - HTTP requests for scraping
- `cheerio` - HTML parsing
- `node-cron` - For future auto-scraping

---

## Verify It's Working

### Check 1: Scraper Runs
```bash
node -e "import('./scraper.js').then(m => m.scrapeAllPrices())"
```
Should show: `✅ All products scraped and saved!`

### Check 2: Products Fetched
```bash
curl http://localhost:3000/api/products
```
Should return JSON with products and image URLs

### Check 3: UI Shows Images
1. Search for "rice"
2. Click "Add" to compare
3. Look for **product images in Compare section**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module axios" | Run `npm install` |
| No products found | Websites may be down - try `/api/scrape/fallback` to diagnose |
| Images not showing | Check browser console for broken image URLs |
| Server won't start | Check port 3000 isn't in use: `netstat -ano \| findstr :3000` |

---

## Product Data Format

Products are stored in `src/data/products.json`:

```json
[
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
    "name": "Spekko Rice 1kg",
    "category": "groceries",
    "store": "My Specials",
    "price": 42.99,
    "image": "https://via.placeholder.com/300x300?text=Product"
  }
]
```

The **image field** is automatically extracted from the websites.

---

## Optional: Auto-Scrape Daily

To automatically update products every day at 2 AM, add to `server.js` after imports:

```javascript
import cron from 'node-cron'

// Auto-scrape every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🤖 Auto-scraping started...')
  try {
    const products = await scrapeAllPrices()
    console.log(`✅ Auto-scrape done: ${products.length} products`)
  } catch (error) {
    console.error('❌ Auto-scrape failed:', error.message)
  }
})

console.log('⏰ Scheduled scraper: Runs daily at 2 AM')
```

---

## File Summary

| File | Change | Purpose |
|------|--------|---------|
| `scraper.js` | **NEW** | Web scraping implementation |
| `server.js` | ✏️ Modified | Added 5 scraping endpoints |
| `package.json` | ✏️ Modified | Added axios, cheerio, node-cron |
| `src/components/Compare.jsx` | ✏️ Modified | Added image display |
| `src/data/products.json` | ✏️ Modified | Now populated by scraper with images |

---

## Success = When You See This

1. **Console output**:
   ```
   ✅ Scraped 45 products from My Catalogue
   ✅ Scraped 38 products from My Specials
   ✅ All products scraped and saved!
   ```

2. **Search results show images**:
   - Search for "rice"
   - See product photos in Compare section
   - Click "Add" to add to budget

3. **Price comparison works**:
   - Same product shown from different stores
   - Cheapest option highlighted
   - Images visible for each variant

---

## Performance Notes

- **First scrape**: ~10-20 seconds (depends on internet speed)
- **Subsequent scrapes**: ~5-10 seconds
- **Search**: <100ms (local JSON search)
- **Images**: Served from external URLs (cached by browser)

---

**Ready to go! Start with Step 1 above.** 🚀
