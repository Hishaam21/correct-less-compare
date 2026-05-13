## 🚨 TROUBLESHOOTING - If Something Breaks During Startup

Quick fixes for common startup issues.

---

## ❌ Port Already in Use

### Error:
```
Error: listen EADDRINUSE: address already in use :::3000
```

### Fix:
```bash
# Find process using port 3000
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Kill the process
# Windows:
taskkill /PID <number> /F

# macOS/Linux:
kill -9 <PID>

# Then try again
node server-new.js
```

---

## ❌ Module Not Found

### Error:
```
Error: Cannot find module './backend/routes/search.js'
```

### Fix:
1. Make sure you're in the right directory:
   ```bash
   cd c:\Users\LENOVO\Downloads\less\ compare
   ```

2. Check all backend files exist:
   ```bash
   ls -la backend/
   ls -la backend/routes/
   ls -la backend/scrapers/
   ```

3. If missing, download them again or verify:
   ```bash
   # Should show: circuitBreaker.js, scraperManager.js, middleware/, routes/, scrapers/
   ls backend/
   ```

---

## ❌ CORS Error in Browser

### Error in Console:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/search?query=...'
Access-Control-Allow-Origin: missing
```

### Fix:
1. Make sure backend is running: `node server-new.js`
2. Check server output shows: `app.use(cors())`
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh page (Ctrl+Shift+R)

---

## ❌ API Returns Error

### Error:
```json
{"error": "Search failed"}
```

### Debug:
1. Check backend console for error messages
2. Verify retailers are available:
   ```bash
   curl http://localhost:3000/api/search/health
   ```
3. Try a simple search in browser console:
   ```javascript
   fetch('http://localhost:3000/api/search?query=test')
     .then(r => r.json())
     .then(console.log)
   ```

---

## ❌ Frontend Won't Load

### Error:
```
Failed to fetch dynamically imported module
```

### Fix:
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf .vite
   ```

3. Try again:
   ```bash
   npm run dev
   ```

---

## ❌ Search Returns No Results

### Possible Causes:
1. **Retailers are down** - Check `/api/search/health`
2. **Circuit breaker open** - Retailer disabled after failures
3. **Cache issue** - Try `&fresh=true` parameter
4. **Network issue** - Check internet connection

### Debug:
```bash
# Test API directly
curl "http://localhost:3000/api/search?query=rice"

# Force fresh results
curl "http://localhost:3000/api/search?query=rice&fresh=true"

# Check health
curl "http://localhost:3000/api/search/health" | jq '.'
```

---

## ❌ Slow Response Time

### If first search takes 30+ seconds:
- **Normal!** First search scrapes 6 retailers (15-25 seconds)
- Future searches use cache (<50ms)

### If consistently slow:
1. Check internet connection
2. Try `&fresh=false` (use cached results)
3. Verify retailers aren't rate-limiting:
   ```bash
   curl "http://localhost:3000/api/search/health"
   ```

---

## ❌ 429 Too Many Requests

### Error:
```
{"error": "Too many requests", "message": "Maximum 5 search requests per minute"}
```

### Fix:
- Wait 60 seconds before the next search
- Or increase limit in `backend/middleware/rateLimit.js`:
  ```javascript
  maxRequests: 10,  // up from 5
  ```

---

## ❌ Cache Not Working

### Symptoms:
- Second search takes same time as first
- No cache files in `.cache/` directory

### Fix:
1. Check `.cache/` directory exists:
   ```bash
   ls -la .cache/
   ```

2. If missing, create it:
   ```bash
   mkdir -p .cache
   ```

3. Check permissions:
   ```bash
   chmod 755 .cache
   ```

4. Try searching again - cache file should appear

---

## ✅ Everything Failing? Reset Everything

```bash
# 1. Kill all Node processes
# Windows:
taskkill /F /IM node.exe

# macOS/Linux:
killall node

# 2. Clear cache
rm -rf .cache

# 3. Clear node_modules
rm -rf node_modules
npm install

# 4. Clear vite cache
rm -rf .vite

# 5. Start fresh
node server-new.js  # Terminal 1
npm run dev         # Terminal 2
```

---

## 🆘 Still Broken?

### Check These Files Exist:
```bash
✅ server-new.js
✅ backend/circuitBreaker.js
✅ backend/scraperManager.js
✅ backend/middleware/rateLimit.js
✅ backend/routes/search.js
✅ backend/scrapers/checkers.js
✅ backend/scrapers/shoprite.js
✅ backend/scrapers/pnp.js
✅ backend/scrapers/woolworths.js
✅ backend/scrapers/game.js
✅ backend/scrapers/makro.js
```

### Check These Are Updated:
✅ src/components/Search.jsx
✅ src/components/Compare.jsx
✅ src/components/Budget.jsx
✅ src/App.jsx

### Read Documentation:
- START_TESTING.md - Quick test guide
- BACKEND_DOCUMENTATION.md - Full API reference
- BACKEND_QUICKSTART.md - Setup guide

---

## 🎯 Confirm Working

Once you fix the issue, verify:

```bash
# 1. Backend running
curl http://localhost:3000/api/health

# 2. Frontend loading
# Open http://localhost:5173 in browser

# 3. Search working
# Search for "rice" in the UI

# 4. Results showing
# Should see products from Checkers, Shoprite, etc.

# 5. Cache working
# Search for "rice" again - should be instant

# 6. Budget working
# Click "Add" on a result - should appear in Selected section
```

All 6 checks passing? **You're good to go!** 🚀

---

## 📞 Quick Reference

| Issue | Command |
|-------|---------|
| Port in use | `taskkill /F /IM node.exe` |
| Clear cache | `rm -rf .cache` |
| Force fresh modules | `rm -rf node_modules && npm install` |
| Check backend | `curl http://localhost:3000/api/health` |
| Check retailers | `curl http://localhost:3000/api/search/health` |
| Test search | `curl "http://localhost:3000/api/search?query=rice"` |
| Hard reset | See "Everything Failing?" section above |

