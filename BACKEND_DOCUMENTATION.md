## 🚀 Less Compare - Production-Ready Backend Search System

Complete documentation for the enterprise-grade search aggregation system.

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Request                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼────────────┐
                    │  Rate Limiting Check   │
                    │  (5 req/min per IP)    │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼────────────┐
                    │  Cache-First Logic     │
                    │  (24-hour TTL)         │
                    └──────────┬─────────────┘
                               │
              ┌────────────────┴────────────────┐
              │ Cache HIT                       │ Cache MISS
              │ Return Cached Results           │ Trigger Live Scraping
              │                                 │
              │                      ┌──────────▼──────────┐
              │                      │  Sequential Scraper │
              │                      │  Manager            │
              │                      └──────────┬──────────┘
              │                                 │
              │                ┌────────────────┼────────────────┐
              │                │                │                │ ... (more)
              │         ┌──────▼──┐      ┌─────▼──┐       ┌─────┴──┐
              │         │Checkers │      │Shoprite│       │Pick n Pay
              │         │Circuit  │      │Circuit │       │Circuit
              │         │Breaker  │      │Breaker │       │Breaker
              │         └────┬─────┘      └────┬──┘       └────┬──┘
              │              │                 │              │
              │              └─────────────────┼──────────────┘
              │                                │
              │                 ┌──────────────▼──────────────┐
              │                 │  Aggregate Results          │
              │                 │  (Standardized Format)      │
              │                 └──────────────┬──────────────┘
              │                                │
              └────────────────┬───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Cache New Results  │
                    │  (for next search)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼────────────┐
                    │  Return to Client     │
                    │  { cached, results }  │
                    └───────────────────────┘
```

---

## 🗂️ Directory Structure

```
backend/
├── circuitBreaker.js           # Circuit breaker pattern implementation
├── scraperManager.js           # Orchestrates sequential scraping
├── middleware/
│   └── rateLimit.js            # Rate limiting (5 req/min per IP)
├── routes/
│   └── search.js               # Main API routes
└── scrapers/
    ├── checkers.js             # Checkers scraper
    ├── shoprite.js             # Shoprite scraper
    ├── pnp.js                  # Pick n Pay scraper
    ├── woolworths.js           # Woolworths scraper
    ├── game.js                 # Game scraper
    └── makro.js                # Makro scraper
```

---

## 🔌 API Endpoints

### 1. **GET /api/search**
Main search endpoint with cache-first architecture.

**Query Parameters:**
- `query` (required): Product name to search for
- `fresh` (optional): Set to `true` to skip cache and fetch live data

**Example Requests:**
```bash
# Get cached results (if available)
GET /api/search?query=rice%201kg

# Force fresh live results
GET /api/search?query=rice%201kg&fresh=true
```

**Response Success (200):**
```json
{
  "query": "rice 1kg",
  "lastUpdated": "2025-01-14T10:30:45.123Z",
  "cached": false,
  "resultsCount": 24,
  "results": [
    {
      "name": "Tastic Rice 1kg",
      "price": 45.99,
      "store": "Checkers",
      "link": "https://www.checkers.co.za/...",
      "category": "groceries",
      "lastChecked": "2025-01-14T10:30:45.123Z"
    },
    {
      "name": "PnP Rice 1kg",
      "price": 44.99,
      "store": "Pick n Pay",
      "link": "https://www.pnp.co.za/...",
      "category": "groceries",
      "lastChecked": "2025-01-14T10:30:45.123Z"
    }
  ]
}
```

**Response No Results (200):**
```json
{
  "query": "rice 1kg",
  "lastUpdated": "2025-01-14T10:30:45.123Z",
  "cached": false,
  "resultsCount": 0,
  "message": "No products found. Retailers may be temporarily unavailable.",
  "results": []
}
```

**Response Rate Limited (429):**
```json
{
  "error": "Too many requests",
  "message": "Maximum 5 search requests per minute",
  "retryAfter": 60
}
```

---

### 2. **GET /api/search/health**
Get health status of all retailer scrapers.

**Response:**
```json
{
  "timestamp": "2025-01-14T10:30:45.123Z",
  "healthy": true,
  "stores": {
    "Checkers": {
      "store": "Checkers",
      "state": "CLOSED",
      "failures": 0,
      "threshold": 3,
      "disabledUntil": null,
      "isOnline": true
    },
    "Shoprite": {
      "store": "Shoprite",
      "state": "OPEN",
      "failures": 3,
      "threshold": 3,
      "disabledUntil": "2025-01-14T11:30:45.123Z",
      "isOnline": false
    }
  }
}
```

**Status Codes:**
- `200`: All retailers healthy
- `206`: Some retailers disabled (partial content)

---

### 3. **POST /api/search/reset-breaker**
Manually reset a circuit breaker (admin function).

**Request Body:**
```json
{
  "store": "Checkers"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Circuit breaker for Checkers reset"
}
```

**Response Not Found (404):**
```json
{
  "success": false,
  "message": "Store Checkers not found"
}
```

---

### 4. **GET /api/health**
General server health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-14T10:30:45.123Z",
  "uptime": 3600.5,
  "cacheEnabled": true,
  "rateLimitingEnabled": true
}
```

---

### 5. **GET /api/admin/rate-limit-stats** (Admin)
Get current rate limiting statistics.

**Response:**
```json
{
  "activeIPs": 3,
  "maxRequests": 5,
  "window": "60s",
  "details": [
    {
      "ip": "192.168.1.100",
      "recentRequests": 2
    },
    {
      "ip": "10.0.0.5",
      "recentRequests": 5
    }
  ]
}
```

---

## 🔄 How It Works

### Cache-First Architecture
1. User requests `/api/search?query=rice`
2. System checks cache for results
3. If cache valid (<24 hours old): **Return immediately** ⚡
4. If cache expired or missing: **Fetch fresh results** 🌍
5. Combine results from all retailers
6. Store in cache for future requests

### Sequential Scraping
- Scrapers run **one at a time**, not in parallel
- **Benefits:**
  - Low request volume
  - Avoids rate limit triggers
  - Better control and error handling
  - Easier to debug

### Circuit Breaker Pattern
```
CLOSED ──[ 3 consecutive failures ]──> OPEN ──[ 1 hour timeout ]──> HALF_OPEN
  ✅                                      ❌                          ⚡
Success                            Disabled temporarily            Testing
```

When a retailer fails 3 times in a row:
1. Circuit opens (OPEN state)
2. Store disabled for 1 hour
3. Other stores continue working
4. After timeout, tries one request (HALF_OPEN)
5. If successful, circuit closes (CLOSED)

### Rate Limiting
- **Max:** 5 search requests per minute per IP
- **Window:** 60 seconds sliding window
- **Behavior:** Reject with 429 status if limit exceeded
- **Cleanup:** Automatic cleanup of old request logs every 5 minutes

---

## 🛒 Supported Retailers

| Retailer | Status | Scraper | Notes |
|----------|--------|---------|-------|
| Checkers | ✅ Active | `checkers.js` | Limited to 20 results per query |
| Shoprite | ✅ Active | `shoprite.js` | Limited to 20 results per query |
| Pick n Pay | ✅ Active | `pnp.js` | Limited to 20 results per query |
| Woolworths | ✅ Active | `woolworths.js` | Limited to 20 results per query |
| Game | ✅ Active | `game.js` | Limited to 20 results per query |
| Makro | ✅ Active | `makro.js` | Limited to 20 results per query |

---

## ⚙️ Configuration

### Cache TTL
Located in `cache.js`:
```javascript
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
```

### Rate Limiting
Located in `backend/middleware/rateLimit.js`:
```javascript
const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
}
```

### Circuit Breaker Thresholds
Located in `backend/circuitBreaker.js`:
```javascript
new CircuitBreaker(storeName, failureThreshold = 3, resetTimeout = 60 * 60 * 1000)
// failureThreshold: number of consecutive failures before opening
// resetTimeout: how long to keep circuit open (1 hour default)
```

### Request Delays
Located in each scraper (e.g., `backend/scrapers/checkers.js`):
```javascript
function randomDelay() {
  const delay = 2000 + Math.random() * 2000 // 2-4 seconds
  return new Promise(resolve => setTimeout(resolve, delay))
}
```

---

## 🚨 Error Handling

### Scenario 1: Single Scraper Fails
```
Query: "rice"
├─ Checkers ✅ found 12 products
├─ Shoprite ❌ failed
├─ Pick n Pay ✅ found 8 products
├─ Woolworths ✅ found 15 products
├─ Game ✅ found 5 products
└─ Makro ✅ found 10 products

Result: Return 50 products from 5 stores, skip Shoprite
```

### Scenario 2: Retailer Circuit Opens
```
Query: "rice"
├─ Checkers ✅ found 12 products
├─ Shoprite 🚫 CIRCUIT OPEN (disabled for 58 more minutes)
├─ Pick n Pay ✅ found 8 products
└─ Woolworths ✅ found 15 products

Result: Return 35 products, skip Shoprite
```

### Scenario 3: All Retailers Fail
```
Query: "rice"
├─ Checkers ❌
├─ Shoprite ❌
├─ Pick n Pay ❌
├─ Woolworths ❌
├─ Game ❌
└─ Makro ❌

Response:
{
  "query": "rice",
  "message": "Live results temporarily unavailable.",
  "cached": false,
  "results": []
}
```

---

## 📊 Production Monitoring

### Logs to Watch
```bash
# Successful scrape
✅ [Checkers] Found 12 products

# Circuit breaker triggered
🔴 [Shoprite] Circuit OPEN - disabled until 11:30:45

# Rate limit hit
⚠️ [192.168.1.100] Rate limit exceeded

# Cache hit
✅ Cache HIT for "rice 1kg" (age: 45 minutes)
```

### Endpoint Health Checks
```bash
# Monitor health endpoint every minute
curl http://localhost:3000/api/health

# Check retailer circuit breaker status hourly
curl http://localhost:3000/api/search/health

# Monitor rate limiting
curl http://localhost:3000/api/admin/rate-limit-stats
```

---

## 🔐 Security Considerations

1. **Rate Limiting**
   - Prevents abuse and protects against DDoS
   - Per-IP tracking prevents coordinated attacks

2. **Circuit Breaker**
   - Protects retailers from continuous hammering
   - Automatic recovery after cooldown period

3. **Sequential Processing**
   - Lower request volume = less suspicious
   - Harder to detect as bot activity

4. **Random Delays**
   - 2-4 second delays between requests
   - Simulates human-like behavior

5. **Realistic Headers**
   - Chrome user agent
   - Referer headers
   - Accept headers

---

## 🚀 Deployment Checklist

- [ ] Update retailer URLs if they change
- [ ] Adjust random delays if needed (2-4s default)
- [ ] Set up monitoring for `/api/health` endpoint
- [ ] Configure rate limits for your expected traffic
- [ ] Set circuit breaker timeouts appropriately
- [ ] Monitor cache hit rates
- [ ] Set up alerts for circuit breaker opens
- [ ] Test with each retailer's site
- [ ] Verify all 6 retailers are returning results
- [ ] Monitor logs for scraping issues
- [ ] Have fallback product data ready

---

## 🔧 Troubleshooting

### Q: Scraper returns 0 results
**A:** Retailer website structure changed. Update CSS selectors in scraper:
```javascript
const productSelectors = [
  '.product-tile',      // Old selector
  '.new-product-class', // Add new selector
  '[data-id]'
]
```

### Q: Circuit breaker stuck in OPEN state
**A:** Use admin endpoint to reset:
```bash
curl -X POST http://localhost:3000/api/search/reset-breaker \
  -H "Content-Type: application/json" \
  -d '{"store": "Checkers"}'
```

### Q: Rate limiting blocking legitimate users
**A:** Adjust limit in `backend/middleware/rateLimit.js`:
```javascript
const RATE_LIMIT = {
  maxRequests: 10,      // Increase from 5
  windowMs: 60 * 1000
}
```

### Q: Cache never expires
**A:** Force fresh results with:
```bash
GET /api/search?query=rice&fresh=true
```

---

## 📈 Performance Metrics

Typical response times:
- **Cache HIT:** 5-50ms ⚡
- **Fresh request:** 15-25 seconds (6 sequential scrapers × 2-4s delay each)
- **Partial failure:** 10-20 seconds (skips broken stores)
- **All failure:** 15-25 seconds (still attempts all stores)

Expected data:
- **Average results per search:** 30-100 products
- **Cache hit rate:** 80-90% (after first 24 hours)
- **Daily API requests:** Highly variable based on users

---

## 🤝 Extending for APIs

When retailers provide official APIs:
1. Create new scraper module: `backend/scrapers/newStore.js`
2. Keep identical interface:
   ```javascript
   export async function scrapeNewStore(query) {
     // ... API call instead of web scraping
     return [{name, price, store, link, category, lastChecked}]
   }
   ```
3. Add to `scraperManager.js`
4. No changes needed to routes or middleware

---

**Last Updated:** January 14, 2025
**Version:** 1.0.0 Production Ready
