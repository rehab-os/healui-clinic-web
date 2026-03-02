'use client'

import React, { useMemo } from 'react'
import { Activity, Save, Check, Loader2 } from 'lucide-react'
import { getTrackingForCondition } from './tracking-data-loader'
import { useTrackingPersistence } from './useTrackingPersistence'
import TrackingItemRow from './TrackingItemRow'

interface ConditionTrackingPanelProps {
  conditionName: string
  visitConditionId: string
  patientConditionId: string
  visitId: string
}

export default function ConditionTrackingPanel({
  conditionName,
  visitConditionId,
  patientConditionId,
  visitId,
}: ConditionTrackingPanelProps) {
  const tracking = useMemo(() => getTrackingForCondition(conditionName), [conditionName])

  const totalCount = useMemo(
    () => tracking?.categories.reduce((sum, cat) => sum + cat.items.length, 0) ?? 0,
    [tracking]
  )

  const { values, setValue, save, filledCount, isSaving, isLoading, isDirty, lastSavedAt } =
    useTrackingPersistence(
      visitConditionId,
      patientConditionId,
      visitId,
      tracking?.categories ?? null,
      totalCount,
    )

  // Count filled per category
  const categoryFilledCounts = useMemo(() => {
    if (!tracking) return {}
    const counts: Record<string, number> = {}
    for (const cat of tracking.categories) {
      counts[cat.key] = cat.items.filter(item => {
        const v = values[item.key]
        if (!v) return false
        if (v.value !== undefined && v.value !== '' && v.value !== null) return true
        if (v.left !== undefined && v.left !== '' && v.left !== null) return true
        if (v.right !== undefined && v.right !== '' && v.right !== null) return true
        return false
      }).length
    }
    return counts
  }, [tracking, values])

  // Empty state
  if (!tracking) {
    return (
      <div className="bg-white rounded-lg">
        <div className="px-4 lg:px-5 py-2.5 lg:py-4 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-300" />
          <span className="text-xs lg:text-sm font-medium text-gray-400">No tracking items</span>
        </div>
      </div>
    )
  }

  const progressPercent = totalCount > 0 ? (filledCount / totalCount) * 100 : 0

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header with progress bar and save */}
      <div className="px-3 lg:px-5 py-2 lg:py-3.5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 lg:gap-2.5 min-w-0">
            <Activity className="h-3 w-3 lg:h-4 lg:w-4 text-teal-600 flex-shrink-0" />
            <span className="text-[11px] lg:text-sm font-semibold text-gray-900">Tracking</span>
            <span className="text-[10px] lg:text-xs text-gray-400 font-medium">
              {filledCount}/{totalCount}
            </span>
            {/* Progress bar */}
            <div className="w-10 lg:w-16 h-1 lg:h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {/* Status */}
            {lastSavedAt && !isDirty && (
              <span className="text-[10px] lg:text-[11px] text-teal-600 flex items-center gap-0.5 font-medium">
                <Check className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                <span className="hidden min-[400px]:inline">Saved</span>
              </span>
            )}
            {isDirty && (
              <span className="text-[10px] lg:text-[11px] text-amber-500 font-medium">Unsaved</span>
            )}
            {/* Save button */}
            <button
              onClick={save}
              disabled={isSaving || !isDirty}
              className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3.5 py-1 lg:py-1.5 text-[11px] lg:text-xs font-semibold rounded-md lg:rounded-lg transition-all
                ${isDirty
                  ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 lg:h-3.5 lg:w-3.5 animate-spin" />
              ) : (
                <Save className="h-2.5 w-2.5 lg:h-3.5 lg:w-3.5" />
              )}
              <span className="hidden min-[360px]:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="px-5 py-8 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
          <span className="text-sm text-gray-400">Loading saved data...</span>
        </div>
      ) : (
        /* Flat grouped list */
        <div>
          {tracking.categories.map(cat => {
            if (cat.items.length === 0) return null
            const filled = categoryFilledCounts[cat.key] || 0
            return (
              <div key={cat.key}>
                {/* Category divider */}
                <div className="px-3 lg:px-5 py-1.5 lg:py-2 bg-gray-50/70 border-y border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] lg:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {cat.displayName}
                  </span>
                  <span className="text-[10px] lg:text-[11px] text-gray-300 font-medium">
                    {filled}/{cat.items.length}
                  </span>
                </div>
                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {cat.items.map(item => (
                    <TrackingItemRow
                      key={item.key}
                      item={item}
                      value={values[item.key]}
                      onChange={(val) => setValue(item.key, val)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
