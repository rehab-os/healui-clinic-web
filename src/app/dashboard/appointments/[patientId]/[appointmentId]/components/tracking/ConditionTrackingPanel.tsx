'use client'

import React, { useMemo, useState } from 'react'
import { Activity, Save, Check, Loader2, ChevronDown } from 'lucide-react'
import { getTrackingForCondition } from './tracking-data-loader'
import { useTrackingPersistence } from './useTrackingPersistence'
import TrackingItemRow from './TrackingItemRow'

interface ConditionTrackingPanelProps {
  conditionName: string
  visitConditionId: string
  patientConditionId: string
  visitId: string
  conditionLaterality?: string
  onSaveSuccess?: () => void
}

// Items that should render as bilateral when condition laterality is 'bilateral'
const BILATERAL_PROMOTABLE_ITEMS = new Set(['vas', 'nprs', 'pain_score', 'night_pain_severity'])

export default function ConditionTrackingPanel({
  conditionName,
  visitConditionId,
  patientConditionId,
  visitId,
  conditionLaterality,
  onSaveSuccess,
}: ConditionTrackingPanelProps) {
  const isBilateralCondition = conditionLaterality === 'bilateral'
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
      onSaveSuccess,
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

            // Check if this category has multiple questionnaires (PROMs)
            const questionnaireItems = cat.items.filter(i => i.definition.input === 'questionnaire')
            const hasCollapsiblePROMs = questionnaireItems.length > 1

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
                {hasCollapsiblePROMs ? (
                  <CollapsiblePROMCategory
                    items={cat.items}
                    values={values}
                    setValue={setValue}
                  />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {cat.items.map(item => (
                      <TrackingItemRow
                        key={item.key}
                        item={item}
                        value={values[item.key]}
                        onChange={(val) => setValue(item.key, val)}
                        forceBilateral={isBilateralCondition && BILATERAL_PROMOTABLE_ITEMS.has(item.key)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

// ── Collapsible PROM section: show primary PROM, collapse the rest ──

import type { TrackingItem, TrackingValue } from './tracking.types'

function CollapsiblePROMCategory({
  items,
  values,
  setValue,
}: {
  items: TrackingItem[]
  values: Record<string, TrackingValue>
  setValue: (key: string, val: TrackingValue) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Split: primary = first priority questionnaire (or first item), rest = secondary
  const primaryIdx = items.findIndex(i => i.isPriority && i.definition.input === 'questionnaire')
  const primary = items[primaryIdx >= 0 ? primaryIdx : 0]
  const nonQuestionnaire = items.filter(i => i.definition.input !== 'questionnaire')
  const secondaryPROMs = items.filter(i => i.definition.input === 'questionnaire' && i.key !== primary.key)

  return (
    <div className="divide-y divide-gray-50">
      {/* Non-questionnaire items always show */}
      {nonQuestionnaire.map(item => (
        <TrackingItemRow
          key={item.key}
          item={item}
          value={values[item.key]}
          onChange={(val) => setValue(item.key, val)}
        />
      ))}

      {/* Primary PROM always visible */}
      <TrackingItemRow
        item={primary}
        value={values[primary.key]}
        onChange={(val) => setValue(primary.key, val)}
      />

      {/* Secondary PROMs — collapsed */}
      {secondaryPROMs.length > 0 && (
        <>
          {expanded && secondaryPROMs.map(item => (
            <TrackingItemRow
              key={item.key}
              item={item}
              value={values[item.key]}
              onChange={(val) => setValue(item.key, val)}
            />
          ))}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] lg:text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 transition-colors"
          >
            <span>
              {expanded
                ? 'show less'
                : `+${secondaryPROMs.length} more questionnaire${secondaryPROMs.length !== 1 ? 's' : ''}`
              }
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </>
      )}
    </div>
  )
}
