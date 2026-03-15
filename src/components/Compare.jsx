import React from 'react'

function toPrice(value) {
  const n = Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

export default function Compare({ items = [], selected, setSelected }) {
  function addToSelected(item) {
    setSelected(prev => {
      if (prev.find(p => p.name === item.name && p.store === item.store)) return prev
      return [...prev, item]
    })
  }

  function getGroupedByProduct() {
    const map = {}
    items.forEach(item => {
      if (!map[item.name]) map[item.name] = []
      map[item.name].push(item)
    })
    return map
  }

  const grouped = getGroupedByProduct()
  const productNames = Object.keys(grouped)

  return (
    <section id="compare" className="card">
      <div>
        <h2>Compare results</h2>
        <p className="card-subtitle">
          {items.length === 0
            ? 'No results yet. Search for products to compare.'
            : `Found ${items.length} products from Shoprite, Checkers, and Pick n Pay.`}
        </p>
      </div>

      {items.length > 0 ? (
        <div className="results">
          {productNames.map(productName => {
            const stores = grouped[productName]
            const cheapest = stores.reduce((prev, curr) => (toPrice(curr.price) < toPrice(prev.price) ? curr : prev))

            return (
              <div key={`${productName}-compare`} className="product-group">
                <div className="result-row result-row-title">
                  <div className="result-info">
                    <strong>{productName}</strong>
                    <div className="result-meta">
                      {stores.length} store{stores.length > 1 ? 's' : ''} available
                    </div>
                  </div>
                </div>

                {stores.map((product, idx) => (
                  <div key={`${product.store}-${idx}`} className="result-row">
                    <div className="result-info">
                      <div className="result-meta">
                        {product.store}
                        {toPrice(product.price) === toPrice(cheapest.price) ? (
                          <span className="cheap-badge">Cheapest</span>
                        ) : null}
                      </div>
                      <div className="result-link">
                        <a href={product.link} target="_blank" rel="noreferrer">
                          Open product
                        </a>
                      </div>
                    </div>

                    <div className="price-col">R{toPrice(product.price).toFixed(2)}</div>
                    <button className="add-btn" onClick={() => addToSelected(product)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
