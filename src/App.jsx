import React, { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Search from './components/Search'
import SearchFilters from './components/SearchFilters'
import RecipeAssistant from './components/RecipeAssistant'
import Compare from './components/Compare'
import Budget from './components/Budget'
import Notifications from './components/Notifications'
import BudgetPlanner from './pages/BudgetPlanner'
import MonthlyBudget from './pages/MonthlyBudget'
import {
  addPriceAlert,
  loadPriceAlerts,
  loadPriceHistory,
  removePriceAlert,
  updatePriceHistoryForResults
} from './utils/storage'

function uniqueValues(items = []) {
  return Array.from(new Set(items.filter(Boolean)))
}

function getNearbyStoreSelection(lat, storeOptions) {
  if (!Array.isArray(storeOptions) || storeOptions.length === 0) {
    return []
  }

  const capetown = ['Shoprite', 'My Specials', 'Woolworths']
  const johannesburg = ['Shoprite', 'Game', 'Makro', 'Clicks']
  const online = ['Takealot', 'HiFi Corp', 'Dis-Chem']

  if (lat < -33.5) {
    return storeOptions.filter(store => capetown.includes(store))
  }

  if (lat < -29.0) {
    return storeOptions.filter(store => johannesburg.includes(store))
  }

  return storeOptions.filter(store => online.includes(store)).length > 0
    ? storeOptions.filter(store => online.includes(store))
    : storeOptions
}

export default function App() {
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [priceHistory, setPriceHistory] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStores, setSelectedStores] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [onlyCheapest, setOnlyCheapest] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')

  useEffect(() => {
    setAlerts(loadPriceAlerts())
    setPriceHistory(loadPriceHistory())
  }, [])

  const storeOptions = useMemo(() => {
    return uniqueValues(results.map(item => item.store)).sort()
  }, [results])

  const categoryOptions = useMemo(() => {
    return uniqueValues(results.map(item => String(item.category || 'Uncategorized'))).sort()
  }, [results])

  const filteredResults = useMemo(() => {
    if (!results.length) return []

    let filtered = results.filter(item => {
      if (selectedStores.length > 0 && !selectedStores.includes(item.store)) {
        return false
      }
      if (categoryFilter && String(item.category).toLowerCase() !== categoryFilter.toLowerCase()) {
        return false
      }

      const price = Number.parseFloat(String(item.price))
      if (minPrice !== '' && Number.isFinite(price) && price < Number(minPrice)) {
        return false
      }
      if (maxPrice !== '' && Number.isFinite(price) && price > Number(maxPrice)) {
        return false
      }
      return true
    })

    if (onlyCheapest) {
      const bestItems = {}
      filtered.forEach(item => {
        const key = String(item.name || '').trim().toLowerCase()
        if (!bestItems[key] || Number(item.price) < Number(bestItems[key].price)) {
          bestItems[key] = item
        }
      })
      filtered = Object.values(bestItems)
    }

    return filtered
  }, [results, selectedStores, categoryFilter, minPrice, maxPrice, onlyCheapest])

  function handleSearchComplete(results, query) {
    const history = updatePriceHistoryForResults(results)
    setPriceHistory(history)
    setResults(results)
    setSearchQuery(query)
    setSelectedStores(uniqueValues(results.map(item => item.store)))
    setCategoryFilter('')
    setMinPrice('')
    setMaxPrice('')
    setOnlyCheapest(false)
    setLocationStatus('')

    const triggered = results.flatMap(result => {
      return alerts
        .filter(alert =>
          alert.name.toLowerCase() === String(result.name).toLowerCase() &&
          alert.store.toLowerCase() === String(result.store).toLowerCase() &&
          Number(result.price) <= Number(alert.targetPrice)
        )
        .map(alert => ({
          title: `Price alert triggered for ${alert.name}`,
          message: `${alert.store} is now R${Number(result.price).toFixed(2)} and at or below your target of R${Number(alert.targetPrice).toFixed(2)}.`
        }))
    })

    if (triggered.length) {
      setNotifications(prev => [...triggered, ...prev].slice(0, 6))
    }
  }

  function handleRecipeSearch(results, query) {
    handleSearchComplete(results, query)
  }

  function handleTrackPrice(product) {
    const currentPrice = Number.parseFloat(String(product.price))
    const userInput = window.prompt(
      `Set a target price for ${product.name} at ${product.store}. Current price is R${currentPrice.toFixed(2)}. Enter your target:`
    )

    if (!userInput) return
    const targetPrice = Number.parseFloat(userInput)
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      window.alert('Please enter a valid target price.')
      return
    }

    const alert = {
      id: `${product.name.toLowerCase()}|${product.store.toLowerCase()}`,
      name: product.name,
      store: product.store,
      targetPrice,
      createdAt: new Date().toISOString()
    }

    const nextAlerts = addPriceAlert(alert)
    setAlerts(nextAlerts)

    if (currentPrice <= targetPrice) {
      setNotifications(prev => [
        {
          title: `Price already below target for ${product.name}`,
          message: `${product.store} is already at R${currentPrice.toFixed(2)}, which is at or below your target of R${targetPrice.toFixed(2)}.`
        },
        ...prev
      ].slice(0, 6))
    }
  }

  function handleRemoveAlert(alertId) {
    const nextAlerts = removePriceAlert(alertId)
    setAlerts(nextAlerts)
  }

  function toggleStore(storeName) {
    setSelectedStores(prev => {
      if (prev.includes(storeName)) {
        return prev.filter(store => store !== storeName)
      }
      return [...prev, storeName]
    })
  }

  function handleCategoryChange(category) {
    setCategoryFilter(category)
  }

  function handlePriceChange(key, value) {
    if (key === 'min') {
      setMinPrice(value)
    } else {
      setMaxPrice(value)
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not available in this browser.')
      return
    }

    setLocationStatus('Detecting nearby stores…')
    navigator.geolocation.getCurrentPosition(
      position => {
        const nearest = getNearbyStoreSelection(position.coords.latitude, storeOptions)
        if (nearest.length) {
          setSelectedStores(nearest)
          setLocationStatus(`Nearby stores selected based on your location.`)
        } else {
          setLocationStatus('Location detected, but nearby store group is not available. Showing all stores.')
          setSelectedStores(storeOptions)
        }
      },
      () => {
        setLocationStatus('Unable to detect location. Please allow location access or try again.')
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  function clearFilters() {
    setCategoryFilter('')
    setMinPrice('')
    setMaxPrice('')
    setOnlyCheapest(false)
    setSelectedStores(storeOptions)
    setLocationStatus('Filters reset to all stores.')
  }

  return (
    <div className="app-root">
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <section className="hero-section">
                <h2>Find the cheapest groceries near you.</h2>
                <p>Don&apos;t guess. Compare prices instantly across retailers, build recipe shopping lists, and save plans for later.</p>
              </section>

              <div className="main-content">
                <div className="feature-cards">
                  <div className="feature-card">
                    <div className="feature-icon">Save</div>
                    <h3>Save shopping lists</h3>
                    <p>Keep reusable lists for weekly shopping and load them instantly.</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">Trend</div>
                    <h3>See price history</h3>
                    <p>Watch price changes and identify the best time to buy your favourites.</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">Nearby</div>
                    <h3>Nearby store view</h3>
                    <p>Filter retailers and choose the stores that are easiest for you to visit.</p>
                  </div>
                </div>

                <Search
                  onSearch={setResults}
                  loading={loading}
                  setLoading={setLoading}
                  onSearchComplete={handleSearchComplete}
                />

                <RecipeAssistant onRecipeSearch={handleRecipeSearch} setLoading={setLoading} />
                <SearchFilters
                  stores={storeOptions}
                  categories={categoryOptions}
                  selectedStores={selectedStores}
                  categoryFilter={categoryFilter}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onlyCheapest={onlyCheapest}
                  locationStatus={locationStatus}
                  onStoreChange={toggleStore}
                  onCategoryChange={handleCategoryChange}
                  onPriceChange={handlePriceChange}
                  onToggleCheapest={setOnlyCheapest}
                  onUseLocation={handleUseLocation}
                  onClearFilters={clearFilters}
                />

                <Notifications
                  notifications={notifications}
                  alerts={alerts}
                  onRemoveAlert={handleRemoveAlert}
                />

                <div className="compare-header-bar card">
                  <div>
                    <h2>Compare results</h2>
                    <p className="small">Showing {filteredResults.length} of {results.length} results{searchQuery ? ` for “${searchQuery}”` : ''}.</p>
                  </div>
                  <Link className="cta-button" to="/monthly-budget">
                    <span>Plan Monthly Budget</span>
                  </Link>
                </div>

                <Compare
                  items={filteredResults}
                  selected={selected}
                  setSelected={setSelected}
                  loading={loading}
                  alerts={alerts}
                  onTrackPrice={handleTrackPrice}
                  priceHistory={priceHistory}
                />
                <Budget selected={selected} />
              </div>
            </>
          }
        />

        <Route path="/budget-plan" element={<BudgetPlanner />} />
        <Route path="/monthly-budget" element={<MonthlyBudget />} />
      </Routes>
    </div>
  )
}
