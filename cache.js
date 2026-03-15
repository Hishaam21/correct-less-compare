import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cacheDir = path.join(__dirname, '.cache')
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true })
}

export function getCachedResults(query) {
  try {
    const normalizedQuery = normalizeQuery(query)
    const cacheFile = getCacheFilePath(normalizedQuery)

    if (!fs.existsSync(cacheFile)) {
      return null
    }

    const raw = fs.readFileSync(cacheFile, 'utf-8')
    const parsed = JSON.parse(raw)
    const lastUpdatedMs = Date.parse(parsed.lastUpdated || '')
    const isValidDate = !Number.isNaN(lastUpdatedMs)
    const isFresh = isValidDate && Date.now() - lastUpdatedMs < CACHE_TTL_MS

    if (!isFresh) {
      fs.unlinkSync(cacheFile)
      return null
    }

    return {
      query: parsed.query || normalizedQuery,
      results: Array.isArray(parsed.results) ? parsed.results : [],
      links: Array.isArray(parsed.links) ? parsed.links : [],
      lastUpdated: parsed.lastUpdated
    }
  } catch (err) {
    console.error(`Cache read error for "${query}":`, err.message)
    return null
  }
}

export function setCachedResults(query, results) {
  try {
    const normalizedQuery = normalizeQuery(query)
    const cacheFile = getCacheFilePath(normalizedQuery)
    const nowIso = new Date().toISOString()
    const normalizedResults = normalizeResults(results, nowIso)
    const cacheData = {
      query: normalizedQuery,
      results: normalizedResults,
      links: normalizedResults.map(item => item.link).filter(Boolean),
      lastUpdated: nowIso
    }

    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2))
  } catch (err) {
    console.error(`Cache write error for "${query}":`, err.message)
  }
}

export function clearCache(query = 'all') {
  try {
    if (query === 'all') {
      const files = fs.readdirSync(cacheDir)
      files.forEach(file => {
        fs.unlinkSync(path.join(cacheDir, file))
      })
      return
    }

    const normalizedQuery = normalizeQuery(query)
    const cacheFile = getCacheFilePath(normalizedQuery)
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile)
    }
  } catch (err) {
    console.error('Cache clear error:', err.message)
  }
}

export function getCacheStats() {
  try {
    const files = fs.readdirSync(cacheDir)
    let totalSize = 0
    let oldestTime = Date.now()
    let newestTime = 0

    files.forEach(file => {
      const filePath = path.join(cacheDir, file)
      const stat = fs.statSync(filePath)
      totalSize += stat.size
      if (stat.mtimeMs < oldestTime) oldestTime = stat.mtimeMs
      if (stat.mtimeMs > newestTime) newestTime = stat.mtimeMs
    })

    return {
      cacheFiles: files.length,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      oldestFile: files.length ? new Date(oldestTime).toISOString() : null,
      newestFile: files.length ? new Date(newestTime).toISOString() : null,
      ttlHours: 24
    }
  } catch (err) {
    return { error: err.message }
  }
}

function getCacheFilePath(query) {
  return path.join(cacheDir, `${sanitizeFilename(query)}.json`)
}

function normalizeResults(results, fallbackTime) {
  if (!Array.isArray(results)) return []

  return results
    .filter(item => item && item.name && item.store && item.link)
    .map(item => ({
      name: String(item.name).trim(),
      price: item.price ?? '',
      store: String(item.store).trim(),
      link: String(item.link).trim(),
      lastChecked: item.lastChecked || fallbackTime
    }))
}

function sanitizeFilename(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 50)
}

function normalizeQuery(query) {
  return String(query || '').trim().toLowerCase()
}
