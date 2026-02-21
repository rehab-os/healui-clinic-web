'use client'

import React from 'react'
import { Plus, Stethoscope } from 'lucide-react'

interface VisitCondition {
  id: string
  condition_name: string
  treatment_focus?: string
  condition?: {
    status?: string
  }
}

interface ConditionsSectionProps {
  children: React.ReactNode
  conditions?: VisitCondition[]
  activeConditionId?: string | null
  onConditionChange?: (id: string) => void
  onAddCondition?: () => void
  loading?: boolean
}

export default function ConditionsSection({
  children,
  conditions = [],
  activeConditionId,
  onConditionChange,
  onAddCondition,
  loading = false
}: ConditionsSectionProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-6 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (conditions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 rounded-full mb-3">
            <Stethoscope className="h-7 w-7 text-brand-teal" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">No Conditions Added</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
            Add conditions to track treatments and generate protocols.
          </p>
          {onAddCondition && (
            <button
              onClick={onAddCondition}
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition-colors font-medium"
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
    <div className="space-y-4">
      {/* Condition Tab Bar */}
      {conditions.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-1.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {conditions.map((condition) => {
              const isActive = activeConditionId === condition.id
              const isPrimary = condition.treatment_focus === 'PRIMARY'
              return (
                <button
                  key={condition.id}
                  onClick={() => onConditionChange?.(condition.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand-teal text-white shadow-sm'
                      : 'text-gray-600 hover:bg-teal-50'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      isActive
                        ? 'bg-white'
                        : isPrimary
                          ? 'bg-brand-teal'
                          : 'bg-teal-300'
                    }`}
                  />
                  {condition.condition_name}
                  {condition.condition?.status === 'DISCHARGED' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      Discharged
                    </span>
                  )}
                </button>
              )
            })}
            {onAddCondition && (
              <button
                onClick={onAddCondition}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-brand-teal hover:bg-teal-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            )}
          </div>
        </div>
      )}

      {/* Single condition - just show header + add button */}
      {conditions.length === 1 && onAddCondition && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <h2 className="text-sm font-medium text-gray-600">
              {conditions[0].condition_name}
            </h2>
          </div>
          <button
            onClick={onAddCondition}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-teal hover:bg-teal-50 rounded-lg transition-colors border border-brand-teal/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Condition
          </button>
        </div>
      )}

      {/* Conditions Content */}
      {children}
    </div>
  )
}
