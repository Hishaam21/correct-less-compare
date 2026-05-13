import React from 'react'

function toPrice(value) {
  const n = Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

function formatHistory(history = []) {
  if (!history || history.length === 0) return null
  const prices = history.map(entry => Number(entry.price)).filter(Number.isFinite)
  if (prices.length === 0) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const trend = prices[prices.length - 1] === prices[0]
    ? 'stable'
    : prices[prices.length - 1] > prices[0]
      ? 'up'
      : 'down'
  return { min, max, trend, points: prices }
}

export default function Compare({ items = [], selected, setSelected, loading, alerts = [], onTrackPrice, priceHistory = {} }) {
  function addToSelected(item) {
    if (item.isFallback) return
    setSelected(prev => {
      if (prev.find(p => p.name === item.name && p.store === item.store)) return prev
      return [...prev, item]
    })
  }

  function getGroupedByStore() {
    const map = {}
    items.forEach(item => {
      const store = item.store || 'Unknown'
      if (!map[store]) map[store] = []
      map[store].push(item)
    })
    return map
  }

  function getGroupedByName() {
    const map = {}
    items.forEach(item => {
      const name = String(item.name || 'Unknown').trim().toLowerCase()
      if (!map[name]) map[name] = []
      map[name].push(item)
    })
    return map
  }

  const grouped = getGroupedByStore()
  const groupedByName = getGroupedByName()
  const storeNames = Object.keys(grouped).sort()

  const displayItems = selected && selected.length > 0 ? selected : items
  const validDisplayItems = displayItems.filter(item => !item.isFallback)
  const itemsForCalculation = validDisplayItems.length > 0 ? validDisplayItems : []
  
  const groupedByNameForCalc = {}
  itemsForCalculation.forEach(item => {
    const name = String(item.name || 'Unknown').trim().toLowerCase()
    if (!groupedByNameForCalc[name]) groupedByNameForCalc[name] = []
    groupedByNameForCalc[name].push(item)
  })

  const itemGroups = Object.values(groupedByNameForCalc)
  const storesForCalc = selected && selected.length > 0 
    ? [...new Set(selected.filter(item => !item.isFallback).map(item => item.store))].sort()
    : storeNames

  const storeTotals = storesForCalc.map(storeName => {
    const subtotal = itemGroups.reduce((sum, entries) => {
      const option = entries.find(item => item.store === storeName)
      return sum + (option ? toPrice(option.price) : 0)
    }, 0)
    const coversAll = itemGroups.every(entries => entries.some(item => item.store === storeName))
    return { storeName, subtotal, coversAll }
  })

  const distinctProducts = Object.keys(groupedByNameForCalc).length
  const showBasketSummary = selected && selected.length > 0

  const bestCombo = Object.values(groupedByNameForCalc).map(entries => (
    entries.reduce((best, candidate) => toPrice(candidate.price) < toPrice(best.price) ? candidate : best, entries[0])
  ))
  const comboTotal = bestCombo.reduce((sum, item) => sum + toPrice(item.price), 0)
  const cheapestFullStore = storeTotals
    .filter(store => store.coversAll)
    .sort((a, b) => a.subtotal - b.subtotal)[0]
  const benchmark = cheapestFullStore ? cheapestFullStore.subtotal : storeTotals.reduce((sum, store) => Math.min(sum, store.subtotal), Infinity)
  const savings = Number.isFinite(benchmark) ? Math.max(0, benchmark - comboTotal) : 0

  const activeAlertMap = new Set(alerts.map(alert => `${alert.name.toLowerCase()}|${alert.store.toLowerCase()}`))

  return (
    <section id="compare" className="card">
      <div className="compare-header">
        <div>
          <h2>Compare results</h2>
          <p className="card-subtitle">
            {items.length === 0
              ? 'No results yet. Search for products to compare.'
              : `Found ${items.length} products from ${storeNames.join(', ')}.`}
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="summary-grid">
          {showBasketSummary ? (
            <>
              <div className="summary-card">
                <h3>Store basket totals</h3>
                {storeTotals.map(store => (
                  <div key={`summary-${store.storeName}`} className="summary-row">
                    <span>{store.storeName}</span>
                    <strong>R{store.subtotal.toFixed(2)}</strong>
                    {store.coversAll ? <span className="tag">Full basket</span> : <span className="tag muted-tag">Partial</span>}
                  </div>
                ))}
              </div>

              <div className="summary-card">
                <h3>Smart basket</h3>
                <p className="small">
                  {savings > 0
                    ? `Save R${savings.toFixed(2)} by buying each product at the cheapest store.`
                    : 'Each item is already priced competitively.'}
                </p>
                <div className="summary-row">
                  <span>Best combination</span>
                  <strong>R{comboTotal.toFixed(2)}</strong>
                </div>
                {cheapestFullStore ? (
                  <p className="small">Cheapest single store basket: {cheapestFullStore.storeName} at R{cheapestFullStore.subtotal.toFixed(2)}</p>
                ) : (
                  <p className="small">No single store carries the full search basket.</p>
                )}
              </div>
            </>
          ) : (
            <div className="summary-card">
              <h3>Price comparison</h3>
              <p className="small">
                For single-item searches, price comparison appears in the store results below.
                Search for more items to see full basket totals and savings insights.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="loading-skeleton">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      ) : items.length > 0 ? (
        <div className="results">
          {storeNames.map(storeName => {
            const products = grouped[storeName]
              .slice()
              .sort((a, b) => {
                if (a.isFallback !== b.isFallback) return a.isFallback ? 1 : -1
                return toPrice(a.price) - toPrice(b.price)
              })

            return (
              <div key={`${storeName}-store`} className="store-group">
                <div className="store-header">
                  <h3>{storeName}</h3>
                  <span className="store-count">{products.length} product{products.length > 1 ? 's' : ''}</span>
                </div>

                {products.map((product, idx) => {
                  const history = formatHistory(priceHistory[`${product.name.toLowerCase()}|${product.store.toLowerCase()}`])
                  const rowKey = `${product.name}-${idx}`
                  const isTracked = activeAlertMap.has(`${product.name.toLowerCase()}|${product.store.toLowerCase()}`)
                  const suggested = !product.isFallback
                    ? bestCombo.find(item => item.name === product.name && item.price !== product.price)
                    : null

                  return (
                    <div key={rowKey} className="result-row">
                      <div className="result-info">
                        <div className="product-name">
                          {product.name}
                          {isTracked ? <span className="alert-tag">Tracking</span> : null}
                        </div>
                        <div className="result-meta">
                          {product.brand && <span>Brand: {product.brand}</span>}
                          {product.size && <span>Size: {product.size}</span>}
                        </div>
                        {history ? (
                          <>
                            <div className="history-summary">
                              <span>Lowest: R{history.min.toFixed(2)}</span>
                              <span>Highest: R{history.max.toFixed(2)}</span>
                              <span>Trend: {history.trend}</span>
                            </div>
                            <div className="history-trend">
                              <span className={`trend-pill trend-${history.trend}`}>
                                {history.trend}
                              </span>
                              <div className="sparkline" aria-label="Price history sparkline">
                                {history.points.map((value, barIndex) => {
                                  const normalized = history.max === history.min
                                    ? 0.5
                                    : (value - history.min) / (history.max - history.min)
                                  const height = 18 + normalized * 40
                                  return (
                                    <span
                                      key={`sparkline-${barIndex}`}
                                      className="sparkline-bar"
                                      style={{ height: `${height}px` }}
                                      title={`R${value.toFixed(2)}`}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          </>
                        ) : null}
                                <div className="result-link">
                            <a href={product.link} target="_blank" rel="noreferrer" className="view-product-btn">
                              View Product
                            </a>
                          </div>
                        </div>

                        <div className="price-col">
                          {product.isFallback ? 'N/A' : `R${toPrice(product.price).toFixed(2)}`}
                          {!product.isFallback && idx === 0 && products.length > 1 ? <span className="cheap-badge">Cheapest</span> : null}
                        </div>
                        <div className="result-actions">
                          {product.isFallback ? (
                            <button className="btn-secondary" disabled>
                              Unavailable
                            </button>
                          ) : (
                            <>
                              <button className="add-btn" onClick={() => addToSelected(product)}>
                                Add
                              </button>
                              <button className="track-btn" onClick={() => onTrackPrice && onTrackPrice(product)}>
                                Track price
                              </button>
                            </>
                          )}
                        </div>
                        {product.isFallback ? (
                          <p className="suggestion-text">
                            {product.fallbackMessage || 'Live price could not be found for this store.'}
                          </p>
                        ) : suggested ? (
                          <p className="suggestion-text">
                            Cheaper option: {suggested.store} at R{toPrice(suggested.price).toFixed(2)}
                          </p>
                        ) : null}
                      </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
