import React, { useMemo, useState } from 'react'

function toNumber(value) {
  const n = Number.parseFloat(String(value || '').trim())
  return Number.isFinite(n) ? n : 0
}

function toPositiveInt(value) {
  const n = Number.parseInt(String(value || '').trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function buildEmptyItem() {
  return { name: '', price: '', quantity: '1' }
}

function loadState(storageKey) {
  if (!storageKey) return null
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      budget: typeof parsed?.budget === 'string' ? parsed.budget : '',
      items: Array.isArray(parsed?.items) && parsed.items.length > 0 ? parsed.items : [buildEmptyItem()]
    }
  } catch {
    return null
  }
}

export default function GroceryPlanner({ title, subtitle, storageKey }) {
  const initial = loadState(storageKey)
  const [budgetInput, setBudgetInput] = useState(initial?.budget ?? '')
  const [items, setItems] = useState(initial?.items ?? [buildEmptyItem()])
  const [saveMessage, setSaveMessage] = useState('')

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => {
      const qty = toPositiveInt(item.quantity)
      return sum + qty
    }, 0)

    const totalCost = items.reduce((sum, item) => {
      const price = toNumber(item.price)
      const qty = toPositiveInt(item.quantity)
      return sum + price * qty
    }, 0)

    const budget = toNumber(budgetInput)
    const hasBudget = String(budgetInput).trim() !== ''
    const remaining = hasBudget ? budget - totalCost : null

    return { totalItems, totalCost, remaining, hasBudget, budget }
  }, [items, budgetInput])

  function updateItem(index, key, value) {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
    setSaveMessage('')
  }

  function addItem() {
    setItems(prev => [...prev, buildEmptyItem()])
    setSaveMessage('')
  }

  function removeItem(index) {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [buildEmptyItem()]
    })
    setSaveMessage('')
  }

  function savePlan() {
    if (!storageKey) return
    const payload = { budget: budgetInput, items }
    localStorage.setItem(storageKey, JSON.stringify(payload))
    setSaveMessage('Plan saved.')
  }

  return (
    <section className="card planner-card">
      <h2>{title}</h2>
      {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}

      <div className="planner-header">
        <label htmlFor={`${storageKey || 'planner'}-budget`} className="planner-label">
          Budget (ZAR)
        </label>
        <input
          id={`${storageKey || 'planner'}-budget`}
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={budgetInput}
          placeholder="Enter budget"
          onChange={e => {
            setBudgetInput(e.target.value)
            setSaveMessage('')
          }}
        />
      </div>

      <div className="planner-list">
        <div className="planner-row planner-row-head">
          <span>Item</span>
          <span>Price</span>
          <span>Qty</span>
          <span>Action</span>
        </div>
        {items.map((item, index) => (
          <div className="planner-row" key={`planner-item-${index}`}>
            <input
              type="text"
              value={item.name}
              placeholder="Grocery item"
              onChange={e => updateItem(index, 'name', e.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={item.price}
              placeholder="0.00"
              onChange={e => updateItem(index, 'price', e.target.value)}
            />
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={item.quantity}
              onChange={e => updateItem(index, 'quantity', e.target.value)}
            />
            <button type="button" className="btn-secondary" onClick={() => removeItem(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="planner-actions">
        <button type="button" className="btn-primary" onClick={addItem}>
          Add Item
        </button>
        <button type="button" className="btn-secondary" onClick={savePlan}>
          Save Plan
        </button>
      </div>

      {saveMessage ? <p className="muted">{saveMessage}</p> : null}

      <div className="planner-summary">
        <p>Total planned groceries: <strong>{totals.totalItems}</strong></p>
        <p>Total cost: <strong>R{totals.totalCost.toFixed(2)}</strong></p>
        {totals.hasBudget ? (
          <p>
            Remaining balance:{' '}
            <strong style={{ color: totals.remaining < 0 ? '#dc3545' : '#2ecc71' }}>
              R{totals.remaining.toFixed(2)}
            </strong>
          </p>
        ) : null}
      </div>
    </section>
  )
}
