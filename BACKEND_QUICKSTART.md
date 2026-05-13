## 🚀 Quick Start Guide - Backend Integration

Complete setup guide for integrating the production-ready search system.

---

## 📦 What You Have

The new backend system includes:

✅ **Cache-First Architecture**
- 24-hour TTL for search results
- Instant responses for repeated searches
- Automatic expiration and refresh

✅ **Rate Limiting**
- 5 requests/minute per IP
- Prevents abuse
- Automatic cleanup

✅ **Circuit Breaker Protection**
- 3 failures = 1 hour disable
- Prevents hammering failing retailers
- Automatic recovery

✅ **Sequential Scraping**
- One retailer at a time
- Low detection risk
- 2-4 second random delays

✅ **6 Retailers**
- Checkers
- Shoprite
- Pick n Pay
- Woolworths
- Game
- Makro

---

## 🔄 Integration Steps

### Step 1: Choose Your Approach

**Option A: Replace server.js (Recommended)**
```bash
# Backup current
cp server.js server-old.js

# Use new version
cp server-new.js server.js
```

**Option B: Keep Both (Safer)**
```bash
# Keep server.js as is
# Run new one on different port
PORT=3001 node server-new.js
```

### Step 2: Test the API

```bash
# Test basic search
curl "http://localhost:3000/api/search?query=rice"

# Test health endpoint
curl "http://localhost:3000/api/search/health"

# Force fresh results
curl "http://localhost:3000/api/search?query=rice&fresh=true"
```

### Step 3: Update Frontend

The API response format is compatible with existing code:

**Old format:**
```javascript
// Legacy endpoint still works
fetch('/api/search', {
  method: 'POST',
  body: JSON.stringify({ query: 'rice' })
})
```

**New format (recommended):**
```javascript
// Modern GET endpoint
fetch(`/api/search?query=${encodeURIComponent('rice')}`)
  .then(r => r.json())
  .then(data => {
    console.log(data.results)
    console.log(data.cached)    // true if from cache
    console.log(data.lastUpdated)
  })
```

### Step 4: Monitor in Production

```bash
# Daily check circuit breaker health
curl http://localhost:3000/api/search/health | jq '.stores'

# Monitor rate limiting
curl http://localhost:3000/api/admin/rate-limit-stats | jq '.activeIPs'

# General health
curl http://localhost:3000/api/health | jq '.'
```

---

## 📊 API Differences

### Query Parameter vs Body

| Aspect | Old | New |
|--------|-----|-----|
| Method | POST | GET or POST |
| URL | POST /api/search | GET /api/search?query=... |
| Body | `{query, fresh}` | None needed |
| Response | `{cached, results}` | `{query, cached, results, lastUpdated}` |

### Examples

**Old (still works):**
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "rice", "fresh": false}'
```

**New (recommended):**
```bash
curl "http://localhost:3000/api/search?query=rice"
curl "http://localhost:3000/api/search?query=rice&fresh=true"
```

---

## 🛠️ Configuration

### Change Cache TTL

Edit `cache.js`:
```javascript
// Current: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000

// Change to 12 hours
const CACHE_TTL = 12 * 60 * 60 * 1000

// Change to 1 hour
const CACHE_TTL = 1 * 60 * 60 * 1000
```

### Change Rate Limits

Edit `backend/middleware/rateLimit.js`:
```javascript
const RATE_LIMIT = {
  maxRequests: 5,           // Currently 5 requests
  windowMs: 60 * 1000       // Per 1 minute
}

// Example: 10 requests per 2 minutes
maxRequests: 10,
windowMs: 2 * 60 * 1000
```

### Change Circuit Breaker Thresholds

Edit `backend/scraperManager.js`:
```javascript
const breakers = {
  'Checkers': new CircuitBreaker('Checkers', 3, 60 * 60 * 1000),
  //                                          ^  ^
  //                                   failures  timeout
}

// Example: Open after 5 failures, 2 hour timeout
new CircuitBreaker('Checkers', 5, 2 * 60 * 60 * 1000)
```

### Change Request Delays

Edit any scraper (e.g., `backend/scrapers/checkers.js`):
```javascript
function randomDelay() {
  // Current: 2-4 seconds
  const delay = 2000 + Math.random() * 2000
  
  // Slower: 3-5 seconds
  const delay = 3000 + Math.random() * 2000
  
  // Faster: 1-2 seconds
  const delay = 1000 + Math.random() * 1000
  
  return new Promise(resolve => setTimeout(resolve, delay))
}
```

---

## 🔍 Testing Your Setup

### Test 1: Basic Search
```bash
curl "http://localhost:3000/api/search?query=rice%201kg" | jq '.'
```
Expected: Array of products from multiple stores

### Test 2: Cache Response
```bash
# First request (not cached)
curl "http://localhost:3000/api/search?query=rice%201kg" | jq '.cached'
# Output: false

# Wait a bit, then repeat
sleep 2
curl "http://localhost:3000/api/search?query=rice%201kg" | jq '.cached'
# Output: true (same results from cache)
```

### Test 3: Force Fresh Results
```bash
curl "http://localhost:3000/api/search?query=rice%201kg&fresh=true" | jq '.cached'
# Output: false (forces live scrape)
```

### Test 4: Health Check
```bash
curl "http://localhost:3000/api/search/health" | jq '.'
```
Expected: All stores showing CLOSED state (working)

### Test 5: Rate Limiting
```bash
# Make 6 requests rapidly
for i in {1..6}; do
  curl "http://localhost:3000/api/search?query=test$i"
done
```
Expected: Last request returns 429 (Too Many Requests)

---

## 📁 File Structure

```
less-compare/
├── server.js                    # Main server
├── server-new.js                # NEW: Updated server (use this)
├── cache.js                     # Cache system (unchanged)
├── BACKEND_DOCUMENTATION.md     # Full documentation
├── BACKEND_QUICKSTART.md        # This file
└── backend/                     # NEW: All backend modules
    ├── circuitBreaker.js
    ├── scraperManager.js
    ├── middleware/
    │   └── rateLimit.js
    ├── routes/
    │   └── search.js
    └── scrapers/
        ├── checkers.js
        ├── shoprite.js
        ├── pnp.js
        ├── woolworths.js
        ├── game.js
        └── makro.js
```

---

## 🚨 Troubleshooting

### Problem: "Cannot find module './backend/...'"
**Solution:** Make sure you're using Node.js with ES modules enabled:
```json
{
  "type": "module"
}
```
Already in package.json, so this should work.

### Problem: Scrapers return empty results
**Solution:** Retailers might have changed their HTML. Update selectors in scrapers:
```javascript
// Check what changed
await axios.get(baseUrl).then(r => console.log(r.data))

// Update selectors
const productSelectors = [
  '.new-selector',  // Add current selector
  '.old-selector'
]
```

### Problem: Rate limit blocking users
**Solution:** Increase the limit:
```javascript
maxRequests: 10,  // Up from 5
windowMs: 60 * 1000
```

### Problem: Circuit breaker stuck open
**Solution:** Reset manually:
```bash
curl -X POST http://localhost:3000/api/search/reset-breaker \
  -H "Content-Type: application/json" \
  -d '{"store": "Checkers"}'
```

### Problem: Too many consecutive requests
**Solution:** Add batch processing or queue system (future enhancement)

---

## 🎯 Performance Expectations

### First Search (Cache Miss): ~15-25 seconds
- 6 retailers × 2-4 second delay = 12-24 seconds
- Plus scraping time = 15-25 seconds total

### Repeated Search (Cache Hit): ~5-50ms
- Direct from cache, instant

### Partial Failure: ~10-20 seconds
- Skips broken retailers, faster

### Expected Results: 30-100 products
- Depends on query relevance
- ~5-20 per retailer typically

---

## 🔄 Migration from Old System

The old system (`server.js`) will continue to work alongside the new system.

### Option 1: Dual System (Safest)
```bash
# Terminal 1: Old system on port 3000
node server.js

# Terminal 2: New system on port 3001
PORT=3001 node server-new.js

# Test new endpoint
curl http://localhost:3001/api/search?query=rice
```

### Option 2: Immediate Switch
```bash
# Backup
cp server.js server-old.js

# Replace
cp server-new.js server.js

# Restart
pm2 restart app  # or node server.js
```

### Option 3: Gradual Cutover
```javascript
// In your frontend, gradually switch:
const useNewBackend = Date.now() > new Date('2025-02-01')

const endpoint = useNewBackend 
  ? '/api/search?query=...'
  : '/api/search (POST)'
```

---

## 📚 Next Steps

1. **Read Full Documentation**
   - See BACKEND_DOCUMENTATION.md for complete API reference

2. **Set Up Monitoring**
   - Monitor `/api/health` endpoint
   - Alert on circuit breaker opens
   - Track cache hit rate

3. **Optimize Configuration**
   - Adjust delays based on retailer detection risk
   - Fine-tune rate limits for your traffic
   - Customize circuit breaker thresholds

4. **Add More Retailers** (Future)
   - Create new scraper in `backend/scrapers/`
   - Add to `scraperManager.js`
   - No other changes needed

5. **Switch to APIs** (When Available)
   - Replace scrapers with API calls
   - Keep same interface
   - System continues without changes

---

**Ready to deploy?** Start with the Quick Integration Steps above! 🚀
