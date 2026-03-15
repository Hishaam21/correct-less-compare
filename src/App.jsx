import React, { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Search from './components/Search'
import Compare from './components/Compare'
import Budget from './components/Budget'
import BudgetPlanner from './pages/BudgetPlanner'
import MonthlyBudget from './pages/MonthlyBudget'

export default function App() {
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([])

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
                <p>Don&apos;t guess. Compare prices instantly.</p>
              </section>

              <div className="main-content">
                <Search onSearch={setResults} />

                <Link className="cta-button" to="/monthly-budget">
                  <span>Plan Monthly Budget</span>
                </Link>

                <Compare items={results} selected={selected} setSelected={setSelected} />
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
