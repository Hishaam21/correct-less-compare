const PRICE_ALERTS_KEY = 'lesscompare.price.alerts'
const PRICE_HISTORY_KEY = 'lesscompare.price.history'
const SAVED_LISTS_KEY = 'lesscompare.saved.lists'

function safeParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function safeGetItem(key, fallback) {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  return raw ? safeParse(raw, fallback) : fallback
}

function safeSetItem(key, value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadPriceAlerts() {
  return safeGetItem(PRICE_ALERTS_KEY, [])
}

export function savePriceAlerts(alerts) {
  safeSetItem(PRICE_ALERTS_KEY, alerts)
}

export function addPriceAlert(alert) {
  const alerts = loadPriceAlerts()
  const existingIndex = alerts.findIndex(a => a.id === alert.id)
  if (existingIndex > -1) {
    alerts[existingIndex] = alert
  } else {
    alerts.unshift(alert)
  }
  savePriceAlerts(alerts)
  return alerts
}

export function removePriceAlert(alertId) {
  const alerts = loadPriceAlerts().filter(alert => alert.id !== alertId)
  savePriceAlerts(alerts)
  return alerts
}

export function loadPriceHistory() {
  return safeGetItem(PRICE_HISTORY_KEY, {})
}

export function savePriceHistory(history) {
  safeSetItem(PRICE_HISTORY_KEY, history)
}

export function updatePriceHistoryForResults(results = []) {
  const history = loadPriceHistory()
  const timestamp = new Date().toISOString()

  results.forEach(item => {
    if (!item.name || !item.store) return
    const key = `${item.name.toLowerCase()}|${item.store.toLowerCase()}`
    const list = history[key] || []
    const price = Number.parseFloat(String(item.price))
    if (!Number.isFinite(price)) return

    const last = list[list.length - 1]
    if (last && last.price === price) {
      return
    }

    const next = [...list, { price, timestamp }].slice(-6)
    history[key] = next
  })

  savePriceHistory(history)
  return history
}

export function getPriceHistoryForItem(name, store) {
  if (!name || !store) return []
  const history = loadPriceHistory()
  return history[`${name.toLowerCase()}|${store.toLowerCase()}`] || []
}

export function loadSavedLists() {
  return safeGetItem(SAVED_LISTS_KEY, [])
}

export function saveSavedLists(lists) {
  safeSetItem(SAVED_LISTS_KEY, lists)
}

export function addSavedList(list) {
  const saved = loadSavedLists()
  const next = [list, ...saved].slice(0, 12)
  saveSavedLists(next)
  return next
}

export function removeSavedList(id) {
  const saved = loadSavedLists().filter(list => list.id !== id)
  saveSavedLists(saved)
  return saved
}
