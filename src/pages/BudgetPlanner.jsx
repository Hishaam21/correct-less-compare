import React from 'react'
import GroceryPlanner from '../components/GroceryPlanner'

export default function BudgetPlanner() {
  return (
    <div className="planner-page">
      <GroceryPlanner
        title="Budget Planner"
        subtitle="Add items, prices, and quantities. Totals and remaining budget update instantly."
        storageKey="lesscompare.budget.planner"
      />
    </div>
  )
}
