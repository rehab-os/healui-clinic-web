'use client'

import React from 'react'
import { Plus, Stethoscope } from 'lucide-react'

interface ConditionsSectionProps {
  children: React.ReactNode
  conditionCount?: number
  onAddCondition?: () => void
  loading?: boolean
}

/**
 * ConditionsSection - Left column container (60% width on desktop)
 * Displays condition cards, protocols, and phase/goal selectors
 */
export default function ConditionsSection({
  children,
  conditionCount = 0,
  onAddCondition,
  loading = false
}: ConditionsSectionProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {/* Loading skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-[#000000]/10 p-5 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (conditionCount === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#000000]/10 p-5">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#eff8ff] rounded-full mb-3">
            <Stethoscope className="h-8 w-8 text-[#1e5f79]" />
          </div>
          <h3 className="text-lg font-semibold text-[#000000] mb-2">No Conditions Added</h3>
          <p className="text-gray-600 mb-5 max-w-sm mx-auto">
            Add conditions to this visit to track treatments, generate protocols, and monitor patient progress.
          </p>
          {onAddCondition && (
            <button
              onClick={onAddCondition}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#1e5f79] text-white rounded-lg hover:bg-[#164557] transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Condition
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-[#000000]">
            Conditions
          </h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {conditionCount} {conditionCount === 1 ? 'condition' : 'conditions'} being treated
          </p>
        </div>
        {onAddCondition && (
          <button
            onClick={onAddCondition}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#1e5f79] text-[#1e5f79] rounded-lg hover:bg-[#eff8ff] transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Condition</span>
          </button>
        )}
      </div>

      {/* Conditions Content */}
      {children}
    </div>
  )
}
