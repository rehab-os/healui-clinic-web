'use client'

import React from 'react'
import { ClinicalInsightType } from '@/types/clinical-insights.types'

interface InsightTypeFilterProps {
  activeType: string | null
  onFilterChange: (type: string | null) => void
  counts?: Record<string, number>
}

/**
 * InsightTypeFilter - Filter chips for insight types
 * "All", "Observations", "Progress", "Setbacks", etc.
 * Active state in Brand Teal
 */
export default function InsightTypeFilter({
  activeType,
  onFilterChange,
  counts = {}
}: InsightTypeFilterProps) {
  const filterOptions = [
    { value: null, label: 'All', color: 'text-gray-700' },
    { value: ClinicalInsightType.OBSERVATION, label: 'Observations', color: 'text-blue-700' },
    { value: ClinicalInsightType.PROGRESS, label: 'Progress', color: 'text-green-700' },
    { value: ClinicalInsightType.SETBACK, label: 'Setbacks', color: 'text-red-700' },
    { value: ClinicalInsightType.MILESTONE, label: 'Milestones', color: 'text-purple-700' },
    { value: ClinicalInsightType.PATIENT_FEEDBACK, label: 'Feedback', color: 'text-amber-700' },
  ]

  const getCount = (type: string | null) => {
    if (type === null) {
      return Object.values(counts).reduce((sum, count) => sum + count, 0)
    }
    return counts[type] || 0
  }

  return (
    <div className="p-3 border-b border-[#000000]/10">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filterOptions.map((option) => {
          const isActive = activeType === option.value
          const count = getCount(option.value)

          return (
            <button
              key={option.value || 'all'}
              onClick={() => onFilterChange(option.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#1e5f79] text-white'
                  : 'bg-[#eff8ff] text-gray-700 hover:bg-[#c8eaeb]'
              }`}
            >
              <span>{option.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-white/20'
                    : 'bg-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
