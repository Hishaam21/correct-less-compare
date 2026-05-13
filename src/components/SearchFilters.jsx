import React from 'react'

export default function SearchFilters({
  stores = [],
  categories = [],
  selectedStores = [],
  categoryFilter = '',
  minPrice = '',
  maxPrice = '',
  onlyCheapest = false,
  locationStatus = '',
  onStoreChange,
  onCategoryChange,
  onPriceChange,
  onToggleCheapest,
  onUseLocation,
  onClearFilters
}) {
  const sortedStores = stores.slice().sort()
  const sortedCategories = categories.slice().sort()

  return (
    <section className="filter-panel">
      <div className="filter-group">
        <div className="section-header">
          <h3>Store filters</h3>
          <p className="small">Choose which retailers to compare.</p>
        </div>
        <div className="filter-checkbox-group">
          {sortedStores.map(store => (
            <label key={store} className="filter-checkbox">
              <input
                type="checkbox"
                checked={selectedStores.includes(store)}
                onChange={() => onStoreChange(store)}
              />
              <span>{store}</span>
            </label>
          ))}
        </div>
        <div className="filter-actions">
          <button type="button" className="btn-secondary" onClick={onUseLocation}>
            Use my location
          </button>
          <button type="button" className="btn-secondary" onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
        {locationStatus ? <p className="location-note">{locationStatus}</p> : null}
      </div>

      <div className="filter-group">
        <div className="section-header">
          <h3>Refine results</h3>
          <p className="small">Narrow the list by category and price.</p>
        </div>
        <div className="filter-field">
          <label>Category</label>
          <select value={categoryFilter} onChange={e => onCategoryChange(e.target.value)}>
            <option value="">All categories</option>
            {sortedCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="filter-range-row">
          <div className="filter-field">
            <label>Min price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={e => onPriceChange('min', e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="filter-field">
            <label>Max price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={e => onPriceChange('max', e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="filter-toggle-row">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={onlyCheapest}
              onChange={e => onToggleCheapest(e.target.checked)}
            />
            <span>Show only the cheapest item per product</span>
          </label>
        </div>
      </div>
    </section>
  )
}
