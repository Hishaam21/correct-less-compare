import React, { useState } from 'react'
import { apiUrl } from '../utils/api'

function parseRecipeItems(text) {
  return Array.from(new Set(
    text
      .split(/\r?\n|,|;/)
      .map(item => item.trim())
      .filter(Boolean)
  ))
}

export default function RecipeAssistant({ onRecipeSearch, setLoading }) {
  const [recipeText, setRecipeText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [localLoading, setLocalLoading] = useState(false)

  async function handleRecipeSubmit(e) {
    e.preventDefault()
    const items = parseRecipeItems(recipeText)
    if (items.length === 0) {
      setFeedback('Please add ingredients or recipe items, one per line.')
      return
    }

    setFeedback('')
    setLocalLoading(true)
    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: items.join(', ') })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to search recipe items')
      }

      const results = Array.isArray(data.results) ? data.results : []
      onRecipeSearch(results, items.join(', '), data.message || `Built list from ${items.length} item(s)`)
      setFeedback(`Recipe list built with ${results.length} matched product(s).`)
    } catch (err) {
      setFeedback(err.message || 'Recipe search failed.')
      onRecipeSearch([], '', '')
    } finally {
      setLocalLoading(false)
      setLoading(false)
    }
  }

  return (
    <section className="recipe-card card">
      <div className="recipe-header">
        <div>
          <h2>Recipe shopping helper</h2>
          <p className="card-subtitle">Paste ingredients or type a recipe list and build a shopping list automatically.</p>
        </div>
      </div>

      <form onSubmit={handleRecipeSubmit} className="recipe-form">
        <textarea
          value={recipeText}
          placeholder="Example:\nRice\nMilk 1L\nTomato sauce\nChicken breasts"
          onChange={e => setRecipeText(e.target.value)}
        />
        <div className="recipe-actions">
          <button type="submit" className="btn-primary" disabled={localLoading}>
            {localLoading ? 'Building list...' : 'Build shopping list'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setRecipeText('')
              setFeedback('')
            }}
          >
            Clear
          </button>
        </div>
      </form>

      <div className="recipe-suggestions">
        <p className="small">Tip: separate items with new lines, commas, or semicolons.</p>
        <p className="small">Try recipes like “oatmeal, eggs, bananas” or “chicken, rice, salad vegetables”.</p>
      </div>

      {feedback ? <p className="muted">{feedback}</p> : null}
    </section>
  )
}
