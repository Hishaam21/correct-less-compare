## 🧪 API Testing Guide

Complete testing and QA procedures for the Less Compare backend system.

---

## 📋 Test Environment Setup

### Prerequisites
```bash
# Ensure Node.js is running
node --version  # Should be v16+

# Verify dependencies installed
npm ls axios cheerio express

# Start server
node server.js  # or server-new.js
```

### Test Tools
```bash
# cURL (command line)
curl http://localhost:3000/api/search?query=rice

# Postman (GUI)
# Import: https://...postman-collection-url

# HTTPie (simpler than cURL)
http get localhost:3000/api/search query==rice

# JavaScript fetch
fetch('/api/search?query=rice').then(r => r.json()).then(console.log)
```

---

## ✅ Test Cases

### 1. Basic Search Functionality

**Test 1.1: Simple Search Query**
```bash
curl "http://localhost:3000/api/search?query=rice"
```
**Expected:**
- Status: 200
- JSON response with results array
- Each result has: name, price, store, link, category, lastChecked

**Test 1.2: URL Encoded Query**
```bash
curl "http://localhost:3000/api/search?query=rice%201kg"
```
**Expected:**
- Same as 1.1
- Special characters properly handled

**Test 1.3: Empty Query**
```bash
curl "http://localhost:3000/api/search?query="
```
**Expected:**
- Status: 400
- Error message about missing query

**Test 1.4: Missing Query Parameter**
```bash
curl "http://localhost:3000/api/search"
```
**Expected:**
- Status: 400
- Error: "Query parameter is required"

---

### 2. Cache Functionality

**Test 2.1: First Request (Cache Miss)**
```bash
curl "http://localhost:3000/api/search?query=unique_test_product_xyz123"
```
**Expected:**
- `cached: false`
- `results` array populated
- `lastUpdated` is current time

**Test 2.2: Repeated Request (Cache Hit)**
```bash
# Same query as 2.1
curl "http://localhost:3000/api/search?query=unique_test_product_xyz123"
```
**Expected:**
- `cached: true`
- Same `lastUpdated` as previous request
- Same `results` array
- Response much faster (<100ms)

**Test 2.3: Force Fresh Results**
```bash
curl "http://localhost:3000/api/search?query=unique_test_product_xyz123&fresh=true"
```
**Expected:**
- `cached: false`
- `lastUpdated` is newer than cached timestamp
- May have different results (if retailer updated)

**Test 2.4: Cache Expiration**
```bash
# Request 1: Cache miss
curl "http://localhost:3000/api/search?query=test_expiry"

# Wait 24+ hours (or modify TTL for testing)
# Request 2: Should be cache miss again
curl "http://localhost:3000/api/search?query=test_expiry"
```
**Expected:**
- First: `cached: false`
- After 24h: `cached: false` (assuming modified TTL for testing)

---

### 3. Rate Limiting

**Test 3.1: Within Limit (5/min)**
```bash
# Make 5 requests quickly
for i in {1..5}; do
  curl "http://localhost:3000/api/search?query=test_$i"
  echo "Request $i done"
done
```
**Expected:**
- All 5 return 200 status
- All return valid results

**Test 3.2: Exceed Limit (6th request)**
```bash
# Make 6 requests quickly
for i in {1..6}; do
  curl "http://localhost:3000/api/search?query=test_$i"
  echo "Request $i done"
done
```
**Expected:**
- First 5 return 200
- 6th returns 429 (Too Many Requests)
- Response includes: `error`, `message`, `retryAfter`

**Test 3.3: Rate Limit Reset**
```bash
# Make 5 requests
for i in {1..5}; do curl "http://localhost:3000/api/search?query=test$i"; done

# Wait 60 seconds (rate window rolls)
sleep 60

# Make 5 more requests
for i in {1..5}; do curl "http://localhost:3000/api/search?query=test$i"; done
```
**Expected:**
- First batch: all 200
- After 60s: all 200
- Window rolls, allows more requests

---

### 4. Circuit Breaker Protection

**Test 4.1: View Circuit Breaker Status**
```bash
curl "http://localhost:3000/api/search/health"
```
**Expected:**
- Status: 200
- All stores showing state: "CLOSED"
- All failures: 0
- All isOnline: true

**Test 4.2: Simulate Store Failure**
```bash
# Manually cause failures:
# 1. Edit backend/scrapers/checkers.js
# 2. Comment out try block or cause error
# 3. Make 3+ requests

curl "http://localhost:3000/api/search?query=test" 
curl "http://localhost:3000/api/search?query=test&fresh=true" 
curl "http://localhost:3000/api/search?query=test&fresh=true" 
```
**Expected:**
- After 3 failures, Checkers circuit opens
- Check health: Checkers state: "OPEN"
- Other stores still fetch results

**Test 4.3: Reset Circuit Breaker Manually**
```bash
curl -X POST "http://localhost:3000/api/search/reset-breaker" \
  -H "Content-Type: application/json" \
  -d '{"store": "Checkers"}'
```
**Expected:**
- Status: 200
- Message: "Circuit breaker for Checkers reset"
- Checkers back to CLOSED state

---

### 5. Partial Failures

**Test 5.1: One Store Fails, Others Work**
```bash
# Disable one scraper temporarily, then search
curl "http://localhost:3000/api/search?query=rice&fresh=true"
```
**Expected:**
- Returns results from other 5 stores
- Respects partial data gracefully
- No crash or empty response

**Test 5.2: All Stores Fail**
```bash
# Disable all scrapers, then search
curl "http://localhost:3000/api/search?query=rice&fresh=true"
```
**Expected:**
- Status: 500
- `message: "Live results temporarily unavailable."`
- `results: []`
- `cached: false`

---

### 6. Response Format Validation

**Test 6.1: Validate Response Structure**
```bash
curl -s "http://localhost:3000/api/search?query=rice" | jq '.'
```
**Expected response structure:**
```json
{
  "query": "string",
  "lastUpdated": "ISO date string",
  "cached": true/false,
  "resultsCount": number,
  "results": [
    {
      "name": "string",
      "price": number,
      "store": "string",
      "link": "string",
      "category": "string",
      "lastChecked": "ISO date string"
    }
  ]
}
```

**Test 6.2: Validate Result Data**
```bash
curl -s "http://localhost:3000/api/search?query=rice" | jq '.results[0]'
```
**Expected:**
- name: non-empty string
- price: number > 0
- store: one of [Checkers, Shoprite, Pick n Pay, Woolworths, Game, Makro]
- link: valid URL
- category: "groceries" or similar
- lastChecked: valid ISO timestamp

---

### 7. Health Endpoints

**Test 7.1: General Health**
```bash
curl "http://localhost:3000/api/health"
```
**Expected:**
- `status: "ok"`
- `uptime: number` (seconds)
- `cacheEnabled: true`
- `rateLimitingEnabled: true`

**Test 7.2: Search Health**
```bash
curl "http://localhost:3000/api/search/health"
```
**Expected:**
- `healthy: true` (when all stores CLOSED)
- `healthy: false` (when any store is OPEN)
- All 6 stores in stores object
- Each with state, failures, threshold, isOnline

---

### 8. Admin Endpoints

**Test 8.1: Rate Limit Stats**
```bash
curl "http://localhost:3000/api/admin/rate-limit-stats"
```
**Expected:**
- `activeIPs: number`
- `maxRequests: 5`
- `window: "60s"`
- `details: array` with IP and recentRequests

---

## 🔄 Automated Test Script

```bash
#!/bin/bash
# save as test-api.sh

echo "🧪 Less Compare API Testing Suite"
echo "=================================="

# Test 1: Basic Search
echo -e "\n1️⃣  Test Basic Search"
curl -s "http://localhost:3000/api/search?query=rice" | jq '.resultsCount'

# Test 2: Cache Hit
echo -e "\n2️⃣  Test Cache (same query)"
curl -s "http://localhost:3000/api/search?query=rice" | jq '.cached'

# Test 3: Force Fresh
echo -e "\n3️⃣  Test Force Fresh"
curl -s "http://localhost:3000/api/search?query=rice&fresh=true" | jq '.cached'

# Test 4: Health Check
echo -e "\n4️⃣  Test Health Endpoint"
curl -s "http://localhost:3000/api/search/health" | jq '.healthy'

# Test 5: Rate Limit Stats
echo -e "\n5️⃣  Test Rate Limit Stats"
curl -s "http://localhost:3000/api/admin/rate-limit-stats" | jq '.activeIPs'

# Test 6: Missing Query
echo -e "\n6️⃣  Test Error Handling"
curl -s "http://localhost:3000/api/search" | jq '.error'

echo -e "\n✅ All tests completed!"
```

Run it:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🐛 Debugging Guide

### Enable Detailed Logging
```javascript
// In server-new.js or routes/search.js, add:
console.log('Full request:', {
  query,
  url: req.url,
  ip: req.ip,
  timestamp: new Date().toISOString()
})
```

### Monitor Request Flow
```bash
# Terminal 1: Run server with logging
NODE_DEBUG=http node server-new.js

# Terminal 2: Make requests
curl "http://localhost:3000/api/search?query=rice"
```

### Check Cache Files
```bash
# View cached results
ls -la .cache/

# Read specific cache
cat ".cache/rice 1kg.json" | jq '.'

# Clear cache
rm -rf .cache/*
```

### Test Individual Scrapers
```javascript
// test-scraper.js
import scrapeCheckers from './backend/scrapers/checkers.js'

const results = await scrapeCheckers('rice')
console.log(`Found ${results.length} products`)
console.log(results[0])
```

Run:
```bash
node test-scraper.js
```

---

## 📊 Performance Testing

### Measure Response Time
```bash
# Without cache (fresh request)
time curl "http://localhost:3000/api/search?query=speed_test&fresh=true"

# With cache (should be much faster)
time curl "http://localhost:3000/api/search?query=speed_test"
```

**Expected times:**
- Fresh: 15-25 seconds
- Cached: <100ms

### Load Testing
```bash
# Install ab (Apache Bench)
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 "http://localhost:3000/api/search?query=rice"
```

### Monitor Concurrent Requests
```bash
# Terminal 1: Monitor active requests (Linux)
watch 'lsof -p $(lsof -ti :3000) | grep IPv4 | wc -l'

# Terminal 2: Make concurrent requests
for i in {1..10}; do
  curl "http://localhost:3000/api/search?query=test" &
done
```

---

## ✔️ Pre-Production Checklist

- [ ] All 6 scrapers return results
- [ ] Cache working (hit/miss correct)
- [ ] Rate limiting at 429 on 6th request
- [ ] Circuit breaker opens after 3 failures
- [ ] Health endpoint returns correct status
- [ ] Error handling for failed retailers
- [ ] Response format matches spec
- [ ] Prices are valid positive numbers
- [ ] Links are valid URLs
- [ ] No console errors
- [ ] Memory usage stable
- [ ] API responds within expected time

---

**Last Updated:** January 14, 2025
**Version:** 1.0.0 QA Ready
