import React from 'react'
import GroceryPlanner from '../components/GroceryPlanner'

export default function MonthlyBudget() {
  return (
    <div className="planner-page">
      <GroceryPlanner
        title="Monthly Budget"
        subtitle="Plan your full monthly groceries, track total cost, and save your editable list."
        storageKey="lesscompare.monthly.planner"
      />
    </div>
  )
}
