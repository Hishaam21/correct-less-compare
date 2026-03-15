import React from 'react'

function toPrice(value) {
  const n = Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}

export default function Budget({ selected = [] }) {
  const total = selected.reduce((sum, item) => sum + toPrice(item.price), 0)

  return (
    <section id="budget" className="card">
      <h2>Selected Budget Items</h2>
      {selected.length > 0 ? (
        <div>
          <p className="card-subtitle">{selected.length} item{selected.length > 1 ? 's' : ''} selected</p>
          <ul className="selected-list">
            {selected.map((item, idx) => (
              <li key={`${item.store}-${idx}`} className="selected-row">
                <div>
                  <strong>{item.name}</strong>
                  <small>@ {item.store}</small>
                </div>
                <div className="selected-price">R{toPrice(item.price).toFixed(2)}</div>
              </li>
            ))}
          </ul>
          <div className="selected-total">
            <span>Total: </span>
            <strong>R{total.toFixed(2)}</strong>
          </div>
        </div>
      ) : (
        <p className="card-subtitle">No products selected yet.</p>
      )}
    </section>
  )
}
