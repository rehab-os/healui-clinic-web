'use client'

import React, { useState, useMemo } from 'react'
import { Activity, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getTrackingForCondition } from './tracking-data-loader'
import { useTrackingState } from './useTrackingState'
import TrackingCategoryTab from './TrackingCategoryTab'

interface ConditionTrackingPanelProps {
  conditionName: string
  visitConditionId: string
}

export default function ConditionTrackingPanel({
  conditionName,
  visitConditionId,
}: ConditionTrackingPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const tracking = useMemo(() => getTrackingForCondition(conditionName), [conditionName])

  const totalCount = useMemo(
    () => tracking?.categories.reduce((sum, cat) => sum + cat.items.length, 0) ?? 0,
    [tracking]
  )

  const { values, setValue, filledCount } = useTrackingState(visitConditionId, totalCount)

  // Find default tab: "essential" if exists, else first category
  const defaultTab = useMemo(() => {
    if (!tracking) return ''
    const essential = tracking.categories.find(c => c.key === 'essential')
    return essential ? essential.key : tracking.categories[0]?.key || ''
  }, [tracking])

  // Empty state — condition not in tracking data
  if (!tracking) {
    return (
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-300" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tracking</span>
          <span className="text-xs text-gray-300 italic">No tracking items for this condition</span>
        </div>
      </div>
    )
  }

  // Count filled per category
  const categoryFilledCounts = useMemo(() => {
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

  return (
    <div className="border-b border-gray-200">
      {/* Header — clickable to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-600" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Tracking</span>
          <span className="text-xs text-gray-500">
            {filledCount}/{totalCount} items recorded
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Content — collapsed by default */}
      {expanded && (
        <div className="px-5 pb-4">
          <Tabs defaultValue={defaultTab} className="gap-0">
            <TabsList className="h-auto p-0.5 bg-gray-100 rounded-lg w-full flex-wrap">
              {tracking.categories.map(cat => (
                <TabsTrigger
                  key={cat.key}
                  value={cat.key}
                  className="text-xs px-2.5 py-1.5 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm rounded-md"
                >
                  {cat.displayName}
                  <span className="ml-1 text-[10px] text-gray-400 data-[state=active]:text-teal-600">
                    {categoryFilledCounts[cat.key] || 0}/{cat.items.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tracking.categories.map(cat => (
              <TabsContent key={cat.key} value={cat.key} className="mt-2">
                <TrackingCategoryTab
                  items={cat.items}
                  values={values}
                  onValueChange={setValue}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  )
}
