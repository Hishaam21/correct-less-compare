import React from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <div className="brand">
        <div className="checkmark-icon">LC</div>
        <h1>LESS COMPARE</h1>
      </div>
      <nav>
        <Link to="/">Search</Link>
        <Link to="/budget-plan">Budget Planner</Link>
        <Link to="/monthly-budget">Monthly Budget</Link>
      </nav>
    </header>
  )
}
