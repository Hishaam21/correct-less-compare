import React, { useState } from 'react'
import { apiUrl } from '../utils/api'

export default function Search({ onSearch }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
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
      const response = await fetch(apiUrl(`/api/search?query=${encodeURIComponent(query)}`))
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Search failed')
      }

      const results = Array.isArray(data.results) ? data.results : []
      onSearch(results)
      setInfo(
        data.cached
          ? `Cached results from ${new Date(data.lastUpdated).toLocaleString()}`
          : `Live prices updated ${new Date(data.lastUpdated).toLocaleString()}`
      )
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
              placeholder="Search for a product (e.g. milk)"
              value={q}
              onChange={e => setQ(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {info ? <p className="muted">{info}</p> : null}
      </div>
    </section>
  )
}
