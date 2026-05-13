import React, { useState } from 'react'
import { apiUrl } from '../utils/api'

export default function Search({ onSearch, loading, setLoading, onSearchComplete }) {
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    const query = q.trim()
    if (!query) return

    setError('')
    setInfo('')
    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/search'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Search failed')
      }

      const results = Array.isArray(data.results) ? data.results : []
      onSearch(results)
      if (typeof onSearchComplete === 'function') {
        onSearchComplete(results, query)
      }
      setInfo(data.message || (data.cached
        ? `Cached results from ${new Date(data.timestamp).toLocaleString()}`
        : `Live prices updated ${new Date(data.timestamp).toLocaleString()}`))
    } catch (err) {
      onSearch([])
      setError(err.message || 'Unable to fetch live results right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="search">
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <div className="search-form">
            <input
              placeholder="Search for a product or ingredient (e.g. milk, rice, tomatoes)"
              value={q}
              onChange={e => setQ(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        <p className="muted">Try natural language search: “cheap 2kg rice”, “best price for cooking oil”, or “budget milk 1L”.</p>
        {error ? <p className="error">{error}</p> : null}
        {info ? <p className="muted">{info}</p> : null}
      </div>
    </section>
  )
}
