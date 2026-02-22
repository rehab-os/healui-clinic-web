'use client'

import React, { useMemo } from 'react'
import { TrendingDown, TrendingUp, Minus, Award } from 'lucide-react'
import type { ChartDataPoint } from './hooks/useTrackingHistory'
import type { TrackingItemDefinition } from '@/app/dashboard/appointments/[patientId]/[appointmentId]/components/tracking/tracking.types'
import { resolveMCID, computeRAG, type RAGStatus } from './utils/mcid-resolver'
import { getChartType } from './utils/chartability'

interface OverallProgressSummaryProps {
  dataPoints: ChartDataPoint[]
  definitions: Record<string, TrackingItemDefinition>
  totalVisits: number
}

interface ItemSummary {
  key: string
  displayName: string
  baseline: number | string
  current: number | string
  change: string
  rag: RAGStatus
  mcid: number | null
  exceededMcid: boolean
  unit?: string | null
}

export default function OverallProgressSummary({
  dataPoints,
  definitions,
  totalVisits,
}: OverallProgressSummaryProps) {
  const summaries = useMemo(() => {
    if (dataPoints.length < 2) return []

    const first = dataPoints[0]
    const last = dataPoints[dataPoints.length - 1]
    const results: ItemSummary[] = []

    // Get all item keys that appear in data
    const allKeys = new Set<string>()
    dataPoints.forEach(dp => Object.keys(dp.items).forEach(k => allKeys.add(k)))

    for (const key of allKeys) {
      const def = definitions[key]
      if (!def) continue

      const chartType = getChartType(def.input, def.bilateral, def.direction)

      if (chartType === 'line' || chartType === 'bilateral') {
        const firstItem = first.items[key]
        const lastItem = last.items[key]
        if (!firstItem || !lastItem) continue

        // For bilateral, average L/R
        let baselineVal: number
        let currentVal: number

        if (chartType === 'bilateral') {
          const bL = Number(firstItem.left) || 0
          const bR = Number(firstItem.right) || 0
          const cL = Number(lastItem.left) || 0
          const cR = Number(lastItem.right) || 0
          baselineVal = (bL + bR) / 2
          currentVal = (cL + cR) / 2
        } else {
          baselineVal = Number(firstItem.value)
          currentVal = Number(lastItem.value)
          if (isNaN(baselineVal) || isNaN(currentVal)) continue
        }

        const { mcid } = resolveMCID(key)
        const rag = computeRAG(baselineVal, currentVal, def.direction, mcid)

        const rawChange = currentVal - baselineVal
        const arrow = rawChange > 0 ? '+' : ''
        const changeStr = `${arrow}${rawChange.toFixed(1)}`

        const exceededMcid = mcid !== null && rag === 'green'

        results.push({
          key,
          displayName: def.display_name,
          baseline: baselineVal,
          current: currentVal,
          change: changeStr,
          rag,
          mcid,
          exceededMcid,
          unit: def.unit,
        })
      } else if (chartType === 'timeline') {
        // Special test: show last N results
        const testResults = dataPoints
          .map(dp => {
            const item = dp.items[key]
            if (!item || !item.value) return null
            const val = String(item.value).toLowerCase()
            return val === 'positive' || val === '+' ? '+' : val === 'negative' || val === '-' ? '-' : null
          })
          .filter(Boolean)

        if (testResults.length < 2) continue

        const lastTwo = testResults.slice(-2)
        const improving = lastTwo.every(r => r === '-')
        const worsening = lastTwo.every(r => r === '+')

        results.push({
          key,
          displayName: def.display_name,
          baseline: testResults[0]!,
          current: testResults.join(' '),
          change: '',
          rag: improving ? 'green' : worsening ? 'red' : 'amber',
          mcid: null,
          exceededMcid: false,
        })
      }
    }

    return results
  }, [dataPoints, definitions])

  if (summaries.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-6">
        {totalVisits < 2 ? 'Need 2+ visits with tracking data to show progress' : 'No progress data available'}
      </div>
    )
  }

  const greenCount = summaries.filter(s => s.rag === 'green').length
  const amberCount = summaries.filter(s => s.rag === 'amber').length
  const redCount = summaries.filter(s => s.rag === 'red').length

  return (
    <div>
      {/* Summary chips */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-500">{totalVisits} visits tracked</span>
        <div className="flex items-center gap-2">
          {greenCount > 0 && (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-full">
              {greenCount} improved
            </span>
          )}
          {amberCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full">
              {amberCount} stable
            </span>
          )}
          {redCount > 0 && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-medium rounded-full">
              {redCount} worsened
            </span>
          )}
        </div>
      </div>

      {/* Item rows */}
      <div className="space-y-1">
        {summaries.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* RAG icon */}
              {item.rag === 'green' && <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />}
              {item.rag === 'amber' && <Minus className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
              {item.rag === 'red' && <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />}
              {item.rag === 'neutral' && <Minus className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
              <span className="text-xs text-gray-700 truncate">{item.displayName}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Value change */}
              {item.change && (
                <span className="text-xs text-gray-500">
                  {item.baseline} &rarr; {item.current}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              )}

              {/* Change badge */}
              {item.change && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                  ${item.rag === 'green' ? 'bg-green-50 text-green-700' : ''}
                  ${item.rag === 'amber' ? 'bg-amber-50 text-amber-700' : ''}
                  ${item.rag === 'red' ? 'bg-red-50 text-red-700' : ''}
                `}>
                  {item.change}
                </span>
              )}

              {/* MCID badge */}
              {item.exceededMcid && (
                <span className="flex items-center gap-0.5 text-[9px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  <Award className="h-2.5 w-2.5" />
                  MCID
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
