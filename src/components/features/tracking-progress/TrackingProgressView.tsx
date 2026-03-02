'use client'

import React, { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { BarChart3, TrendingUp, Table2, Loader2 } from 'lucide-react'
import { useTrackingHistory } from './hooks/useTrackingHistory'
import { getTrackingForCondition } from '@/app/dashboard/appointments/[patientId]/[appointmentId]/components/tracking/tracking-data-loader'
import type { TrackingItemDefinition } from '@/app/dashboard/appointments/[patientId]/[appointmentId]/components/tracking/tracking.types'
import { getChartType } from './utils/chartability'
import OverallProgressSummary from './OverallProgressSummary'
import SpecialTestTimeline from './charts/SpecialTestTimeline'

// Dynamic imports for recharts-based charts (~200KB deferred)
const NumericTrendChart = dynamic(() => import('./charts/NumericTrendChart'), { ssr: false })
const BilateralComparisonChart = dynamic(() => import('./charts/BilateralComparisonChart'), { ssr: false })
const PROMSubscaleRadar = dynamic(() => import('./charts/PROMSubscaleRadar'), { ssr: false })
const MMTProgressChart = dynamic(() => import('./charts/MMTProgressChart'), { ssr: false })

type Tab = 'summary' | 'trends' | 'raw'

interface TrackingProgressViewProps {
  patientConditionId: string
  conditionName: string
}

const CATEGORY_ORDER = ['essential', 'function', 'rom', 'strength', 'measurements', 'special_tests']
const CATEGORY_LABELS: Record<string, string> = {
  essential: 'Essential',
  function: 'Function',
  rom: 'Range of Motion',
  strength: 'Strength',
  measurements: 'Measurements',
  special_tests: 'Special Tests',
}

export default function TrackingProgressView({
  patientConditionId,
  conditionName,
}: TrackingProgressViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const { chartData, isLoading } = useTrackingHistory(patientConditionId)

  // Get tracking definitions for this condition
  const tracking = useMemo(() => getTrackingForCondition(conditionName), [conditionName])

  // Build definitions map
  const definitions = useMemo(() => {
    if (!tracking) return {} as Record<string, TrackingItemDefinition>
    const map: Record<string, TrackingItemDefinition> = {}
    for (const cat of tracking.categories) {
      for (const item of cat.items) {
        map[item.key] = item.definition
      }
    }
    return map
  }, [tracking])

  // Group items by category for trends tab
  const categorizedItems = useMemo(() => {
    if (!tracking) return []
    return CATEGORY_ORDER
      .map(catKey => {
        const cat = tracking.categories.find(c => c.key === catKey)
        if (!cat || cat.items.length === 0) return null
        return {
          key: catKey,
          label: CATEGORY_LABELS[catKey] || catKey,
          items: cat.items,
        }
      })
      .filter(Boolean) as Array<{ key: string; label: string; items: typeof tracking.categories[0]['items'] }>
  }, [tracking])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
          <span className="text-sm text-gray-400">Loading progress data...</span>
        </div>
      </div>
    )
  }

  if (!chartData || chartData.total_visits === 0) {
    return (
      <div className="bg-white rounded-lg px-4 py-2.5 lg:p-5">
        <div className="flex items-center gap-2 text-gray-400">
          <BarChart3 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          <span className="text-xs lg:text-sm">No tracking history yet</span>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'summary' as Tab, label: 'Summary', icon: BarChart3 },
    { id: 'trends' as Tab, label: 'Trends', icon: TrendingUp },
    { id: 'raw' as Tab, label: 'Raw Data', icon: Table2 },
  ]

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Tab navigation */}
      <div className="px-3 lg:px-5 py-2 lg:py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4 text-teal-600" />
          <span className="text-[11px] lg:text-sm font-semibold text-gray-900">Progress</span>
          <span className="text-[9px] lg:text-[10px] text-gray-400 font-medium">
            {chartData.total_visits} visits
          </span>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-0.5 lg:gap-1 px-2 lg:px-2.5 py-1 text-[10px] lg:text-[11px] font-medium rounded-md transition-colors
                ${activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <tab.icon className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-3 py-2.5 lg:p-5">
        {activeTab === 'summary' && (
          <OverallProgressSummary
            dataPoints={chartData.data_points}
            definitions={definitions}
            totalVisits={chartData.total_visits}
          />
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {categorizedItems.map((cat) => (
              <div key={cat.key}>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {cat.label}
                </div>
                <div className="space-y-4">
                  {cat.items.map((item) => {
                    const chartType = getChartType(
                      item.definition.input,
                      item.definition.bilateral,
                      item.definition.direction,
                    )

                    if (chartType === 'none') return null

                    if (chartType === 'line') {
                      return (
                        <div key={item.key}>
                          <NumericTrendChart
                            itemKey={item.key}
                            displayName={item.definition.display_name}
                            dataPoints={chartData.data_points}
                            direction={item.definition.direction}
                            unit={item.definition.unit}
                            min={item.definition.min}
                            max={item.definition.max}
                          />
                          {/* Show radar overlay for PROMs with subscales */}
                          {item.definition.input === 'questionnaire' && (
                            <PROMSubscaleRadar
                              itemKey={item.key}
                              displayName={item.definition.display_name}
                              dataPoints={chartData.data_points}
                            />
                          )}
                        </div>
                      )
                    }

                    if (chartType === 'bilateral') {
                      return (
                        <BilateralComparisonChart
                          key={item.key}
                          itemKey={item.key}
                          displayName={item.definition.display_name}
                          dataPoints={chartData.data_points}
                          direction={item.definition.direction}
                          unit={item.definition.unit}
                          min={item.definition.min}
                          max={item.definition.max}
                        />
                      )
                    }

                    if (chartType === 'timeline') {
                      return (
                        <SpecialTestTimeline
                          key={item.key}
                          itemKey={item.key}
                          displayName={item.definition.display_name}
                          dataPoints={chartData.data_points}
                        />
                      )
                    }

                    if (chartType === 'step') {
                      return (
                        <MMTProgressChart
                          key={item.key}
                          itemKey={item.key}
                          displayName={item.definition.display_name}
                          dataPoints={chartData.data_points}
                          bilateral={item.definition.bilateral}
                        />
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'raw' && (
          <RawDataTable
            dataPoints={chartData.data_points}
            definitions={definitions}
          />
        )}
      </div>
    </div>
  )
}

// ── Raw Data Table ─────────────────────────────────────────

function RawDataTable({
  dataPoints,
  definitions,
}: {
  dataPoints: Array<{ visit_date: string; visit_number: number; items: Record<string, any> }>
  definitions: Record<string, TrackingItemDefinition>
}) {
  // Collect all item keys across all visits
  const allKeys = useMemo(() => {
    const keys = new Set<string>()
    dataPoints.forEach(dp => Object.keys(dp.items).forEach(k => keys.add(k)))
    return Array.from(keys)
  }, [dataPoints])

  if (allKeys.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-4">No data</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 font-medium text-gray-500 sticky left-0 bg-white">Item</th>
            {dataPoints.map((dp) => (
              <th key={dp.visit_number} className="text-center py-2 px-2 font-medium text-gray-500 whitespace-nowrap">
                V{dp.visit_number}
                <br />
                <span className="font-normal text-gray-400">{dp.visit_date}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allKeys.map((key) => {
            const def = definitions[key]
            return (
              <tr key={key} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-1.5 px-2 text-gray-700 sticky left-0 bg-white font-medium whitespace-nowrap">
                  {def?.display_name || key}
                </td>
                {dataPoints.map((dp) => {
                  const item = dp.items[key]
                  let display = ''
                  if (item) {
                    if (item.left !== undefined || item.right !== undefined) {
                      display = `L:${item.left ?? '-'} R:${item.right ?? '-'}`
                    } else if (item.value !== undefined) {
                      display = String(item.value)
                    }
                  }
                  return (
                    <td key={dp.visit_number} className="py-1.5 px-2 text-center text-gray-600">
                      {display || <span className="text-gray-300">-</span>}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
