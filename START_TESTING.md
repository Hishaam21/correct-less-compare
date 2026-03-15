## 🧪 READY TO TEST - Everything Integrated

Your Less Compare system is now **100% ready to test**. Here's exactly what to do.

---

## 🚀 START HERE (3 Simple Steps)

### Step 1: Start the Backend Server (Port 3000)
```bash
# In a terminal, run:
node server-new.js
```

**Expected output:**
```
🚀 Less Compare Backend Server
📍 Running on http://localhost:3000

✅ Features enabled:
   - Cache-first search with 24h TTL
   - Rate limiting: 5 requests/minute per IP
   - Circuit breaker protection per retailer
   - Sequential scraping (low request volume)
   - 6 retailers: Checkers, Shoprite, Pick n Pay, Woolworths, Game, Makro

📚 API Endpoints:
   GET  /api/search?query=PRODUCT_NAME
   GET  /api/search?query=PRODUCT_NAME&fresh=true
   GET  /api/search/health
   POST /api/search/reset-breaker
```

**✅ Server running?** Continue to Step 2

---

### Step 2: Start the Frontend (Port 5173)
```bash
# In another terminal, run:
npm run dev
```

**Expected output:**
```
  VITE v5.4.21  ready in XXXX ms

  ➜  Local:   http://localhost:5173/
```

**✅ Frontend running?** Continue to Step 3

---

### Step 3: Open Browser and Test
Go to: **http://localhost:5173/**

You should see:
- ✅ Less Compare header with logo and navigation
- ✅ Hero section with "Find the cheapest groceries near you"
- ✅ Search bar ready to use
- ✅ Feature cards below
- ✅ "Compare results" and "Selected (Budget)" sections

---

## 🧪 Quick Test Sequence

### Test 1: Simple Search
1. Click in search box
2. Type: **rice**
3. Click "Search"
4. **Expected:** Results from multiple retailers appear in "Compare results" section

### Test 2: Cache Works
1. Search for same product again: **rice**
2. **Expected:** Results appear MUCH faster (<50ms vs 15-25 seconds)
3. Look for: "✅ Results cached" message below search

### Test 3: Force Fresh Results
1. In browser console (F12):
   ```javascript
   fetch('http://localhost:3000/api/search?query=rice&fresh=true')
     .then(r => r.json())
     .then(d => console.log(d))
   ```
2. **Expected:** { query, results, cached: false, lastUpdated, ... }

### Test 4: Add to Budget
1. Search for a product
2. Click "Add" button on any result
3. **Expected:** Item appears in "Selected (Budget)" section with total price

### Test 5: Multiple Results
1. Clear search, try: **milk**
2. **Expected:** Results from different stores displayed grouped by product
3. Cheapest option shown in light blue

### Test 6: Rate Limiting
1. Make 6 rapid searches in quick succession:
   ```javascript
   for(let i=0; i<6; i++) {
     fetch(`http://localhost:3000/api/search?query=test${i}`)
   }
   ```
2. **Expected:** 6th request fails with 429 status (Too Many Requests)

### Test 7: Health Check
1. Open: **http://localhost:3000/api/search/health**
2. **Expected:** JSON showing all 6 retailers as CLOSED state (healthy)
3. Check all `isOnline: true`

---

## 📊 What Each Component Does

### Search Component
- ✅ Sends query to `http://localhost:3000/api/search?query=...`
- ✅ Shows "🌍 Fresh results" for first search
- ✅ Shows "✅ Results cached" for repeated searches
- ✅ Handles errors gracefully

### Compare Component
- ✅ Displays all results grouped by product name
- ✅ Highlights cheapest option in each group
- ✅ "Add" button sends item to Selected section
- ✅ Shows "CHEAPEST" badge on lowest price

### Budget Component (Selected)
- ✅ Shows all items you added
- ✅ Displays each item's store and price
- ✅ Calculates and shows total at bottom
- ✅ Updates in real-time as you add items

---

## 🔍 Debugging Checklist

### If backend fails to start:
```bash
# Check if port 3000 is in use
# Windows: 
netstat -ano | findstr :3000

# Kill process using port 3000
taskkill /PID <PID> /F

# Try again
node server-new.js
```

### If search returns no results:
1. Check backend console for errors
2. Verify retailers are responding:
   ```bash
   curl "http://localhost:3000/api/search/health"
   ```
3. All should show `state: "CLOSED"` (working)

### If frontend can't reach backend:
1. Make sure backend is running on port 3000
2. Check CORS is enabled (should be automatic)
3. Open browser DevTools (F12) → Network tab
4. Look at `/api/search` request for error details

### If cache isn't working:
1. Check `.cache/` directory exists (auto-created)
2. Look for `.cache/your-query.json` after search
3. Second search should be instant

---

## 📈 Performance Expectations

| Scenario | Time | Indicator |
|----------|------|-----------|
| **First search** | 15-25 seconds | "🌍 Fresh results" |
| **Repeated search** | <50ms | "✅ Results cached" |
| **With errors** | 10-20 seconds | Still returns partial results |
| **All errors** | 15-25 seconds | Shows error message + cache fallback |

---

## 🛠️ Terminal Commands You Need

### Backend (Terminal 1):
```bash
node server-new.js
```

### Frontend (Terminal 2):
```bash
npm run dev
```

### Check if ports are free:
```bash
# Check port 3000 (backend)
netstat -ano | findstr :3000

# Check port 5173 (frontend)
netstat -ano | findstr :5173
```

### Kill stuck processes:
```bash
# Windows
taskkill /PID <number> /F

# macOS/Linux
kill -9 <number>
```

---

## ✅ Final Verification Checklist

Before you call it "working":

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Can type in search box
- [ ] Search returns results
- [ ] Results show multiple retailers
- [ ] Cache works (2nd search is fast)
- [ ] Can add to budget
- [ ] Total calculates correctly
- [ ] Health endpoint works
- [ ] No console errors

**All checked?** → **You're ready to develop!** 🚀

---

## 🎯 What's Working

### ✅ Backend System
- Cache-first architecture (24h TTL)
- Rate limiting (5/min per IP)
- Circuit breaker (3 failures = 1h disable)
- Sequential scraping (anti-detection)
- 6 retailers (Checkers, Shoprite, Pick n Pay, Woolworths, Game, Makro)
- Health check endpoints
- Error handling (graceful degradation)

### ✅ Frontend Components
- Modern design with gradient background
- Search component with API integration
- Compare section showing results grouped by product
- Budget section tracking selected items
- Real-time total calculation
- Cache status indicators

### ✅ API Endpoints
- `GET /api/search?query=...` - Main search
- `GET /api/search?query=...&fresh=true` - Force fresh
- `GET /api/search/health` - Retailer status
- `POST /api/search/reset-breaker` - Admin reset
- `GET /api/health` - Server health

---

## 🚨 Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Port 3000 in use | `taskkill /PID xxx /F` |
| Port 5173 in use | `taskkill /PID xxx /F` |
| "Cannot find module" | Run `npm install` |
| No results from search | Check backend console for errors |
| Search is slow first time | Normal! Takes 15-25s for live scrape |
| Cache not working | Check `.cache/` directory exists |
| CORS error | Backend should auto-configure |

---

## 📚 Documentation Available

- **BACKEND_DOCUMENTATION.md** - Complete API reference
- **BACKEND_QUICKSTART.md** - Setup guide
- **BACKEND_TESTING.md** - Full test cases
- **BACKEND_DEPLOYMENT.md** - Production deployment

---

## 🎉 You're All Set!

**Everything is ready to test.**

1. Start backend: `node server-new.js`
2. Start frontend: `npm run dev`
3. Open http://localhost:5173
4. Start searching!

If you hit any issues, check the Debugging section above or read the full documentation.

**Happy testing!** 🚀
