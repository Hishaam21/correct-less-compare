import React, { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../utils/api'
import { addSavedList, loadSavedLists, removeSavedList } from '../utils/storage'

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
  if (!storageKey || typeof window === 'undefined') return null
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
  const [savedLists, setSavedLists] = useState([])
  const [budgetPlan, setBudgetPlan] = useState(null)
  const [recalculateLoading, setRecalculateLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  useEffect(() => {
    setSavedLists(loadSavedLists())
  }, [])

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
    setBudgetPlan(null)
    setFeedbackMessage('')
  }

  function addItem() {
    setItems(prev => [...prev, buildEmptyItem()])
    setSaveMessage('')
    setBudgetPlan(null)
  }

  function removeItem(index) {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [buildEmptyItem()]
    })
    setSaveMessage('')
    setBudgetPlan(null)
  }

  function savePlan() {
    if (!storageKey) return
    const payload = { budget: budgetInput, items }
    localStorage.setItem(storageKey, JSON.stringify(payload))
    setSaveMessage('Plan saved.')
  }

  function saveCurrentAsList() {
    const listName = window.prompt('Name this grocery list for quick reuse:')
    if (!listName || !listName.trim()) return
    const payload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: listName.trim(),
      createdAt: new Date().toISOString(),
      budget: budgetInput,
      items
    }
    const next = addSavedList(payload)
    setSavedLists(next)
    setFeedbackMessage(`Saved list “${payload.name}” for quick reuse.`)
  }

  function loadSavedList(list) {
    setBudgetInput(list.budget || '')
    setItems(list.items && list.items.length > 0 ? list.items : [buildEmptyItem()])
    setSaveMessage(`Loaded saved list “${list.name}”.`)
    setBudgetPlan(null)
    setFeedbackMessage('')
  }

  function deleteSavedListItem(listId) {
    const next = removeSavedList(listId)
    setSavedLists(next)
    setFeedbackMessage('Saved list removed.')
  }

  async function recalculateBudget() {
    const requestItems = items
      .filter(item => String(item.name || '').trim())
      .map(item => ({
        name: String(item.name).trim(),
        qty: toPositiveInt(item.quantity)
      }))

    if (requestItems.length === 0) {
      setFeedbackMessage('Add at least one item to recalculate.')
      return
    }

    setRecalculateLoading(true)
    setFeedbackMessage('')

    try {
      const response = await fetch(apiUrl('/api/budget'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: requestItems })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to recalculate budget')
      }

      setBudgetPlan(data)
      const total = Number(data.total || 0)
      const overBudget = totals.hasBudget && total > totals.budget
      setFeedbackMessage(
        overBudget
          ? 'Your list is over budget. We found cheaper option suggestions below.'
          : 'Budget recalculated with the latest prices.'
      )
    } catch (error) {
      setFeedbackMessage(error.message || 'Budget recalculation failed.')
    } finally {
      setRecalculateLoading(false)
    }
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
        <button type="button" className="btn-secondary" onClick={saveCurrentAsList}>
          Save List
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={recalculateBudget}
          disabled={recalculateLoading}
        >
          {recalculateLoading ? 'Checking prices...' : 'Recalculate Latest Prices'}
        </button>
      </div>

      {saveMessage || feedbackMessage ? (
        <p className="muted">{saveMessage || feedbackMessage}</p>
      ) : null}

      {savedLists.length > 0 ? (
        <div className="saved-lists">
          <h3>Saved lists</h3>
          <ul>
            {savedLists.map(list => (
              <li key={list.id} className="saved-list-item">
                <div>
                  <strong>{list.name}</strong>
                  <small>{list.items.length} item{list.items.length > 1 ? 's' : ''}</small>
                </div>
                <div className="saved-list-actions">
                  <button className="btn-secondary" onClick={() => loadSavedList(list)}>
                    Load
                  </button>
                  <button className="btn-secondary" onClick={() => deleteSavedListItem(list.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {budgetPlan ? (
        <div className="budget-plan-results">
          <h3>Recommended budget picks</h3>
          <p className="small">
            Total: <strong>R{Number(budgetPlan.total || 0).toFixed(2)}</strong>
            {totals.hasBudget ? (
              <span>{Number(budgetPlan.total || 0) > totals.budget ? ' — over budget' : ' — within budget'}</span>
            ) : null}
          </p>
          {Array.isArray(budgetPlan.picks) && budgetPlan.picks.length > 0 ? (
            <div className="budget-plan-items">
              {budgetPlan.picks.map((pick, index) => (
                <div key={`budget-pick-${index}`} className="budget-plan-item">
                  <div>
                    <strong>{pick.query}</strong>
                    <div className="small">Quantity: {pick.qty || 1}</div>
                  </div>
                  <div>
                    {pick.found ? (
                      <span>R{Number(pick.cost).toFixed(2)}</span>
                    ) : (
                      <span className="muted">No match</span>
                    )}
                  </div>
                  {Array.isArray(pick.candidates) && pick.candidates.length > 1 ? (
                    <p className="suggestion-text">
                      Cheaper alternatives: {pick.candidates.slice(1, 3).map(option => `${option.store} R${Number(option.price).toFixed(2)}`).join(', ')}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

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
