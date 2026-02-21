'use client'

import React, { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { getTrackingForCondition } from './tracking-data-loader'
import { useTrackingState } from './useTrackingState'
import TrackingItemRow from './TrackingItemRow'

interface ConditionTrackingPanelProps {
  conditionName: string
  visitConditionId: string
}

export default function ConditionTrackingPanel({
  conditionName,
  visitConditionId,
}: ConditionTrackingPanelProps) {
  const tracking = useMemo(() => getTrackingForCondition(conditionName), [conditionName])

  const totalCount = useMemo(
    () => tracking?.categories.reduce((sum, cat) => sum + cat.items.length, 0) ?? 0,
    [tracking]
  )

  const { values, setValue, filledCount } = useTrackingState(visitConditionId, totalCount)

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-300" />
          <span className="text-sm font-semibold text-gray-400">Tracking</span>
          <span className="text-xs text-gray-300 italic">No tracking items for this condition</span>
        </div>
      </div>
    )
  }

  const progressPercent = totalCount > 0 ? (filledCount / totalCount) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with progress bar */}
      <div className="px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-semibold text-gray-900">Tracking</span>
            <span className="text-xs text-gray-400 font-medium">
              {filledCount}/{totalCount}
            </span>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {filledCount === totalCount && totalCount > 0 && (
              <span className="text-[10px] font-medium text-teal-600">Complete</span>
            )}
          </div>
        </div>
      </div>

      {/* Flat grouped list */}
      <div>
        {tracking.categories.map(cat => {
          if (cat.items.length === 0) return null
          const filled = categoryFilledCounts[cat.key] || 0
          return (
            <div key={cat.key}>
              {/* Category divider */}
              <div className="px-5 py-2 bg-gray-50/70 border-y border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {cat.displayName}
                </span>
                <span className="text-[11px] text-gray-300 font-medium">
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
    </div>
  )
}
