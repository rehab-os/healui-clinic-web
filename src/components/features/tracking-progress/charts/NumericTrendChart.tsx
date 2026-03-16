'use client'

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { Direction } from '@/app/dashboard/appointments/[patientId]/[appointmentId]/components/tracking/tracking.types'
import type { ChartDataPoint } from '../hooks/useTrackingHistory'
import { resolveMCID } from '../utils/mcid-resolver'
import { shouldReverseYAxis } from '../utils/chartability'
import { useChartHeight } from '../hooks/useChartHeight'

interface NumericTrendChartProps {
  itemKey: string
  displayName: string
  dataPoints: ChartDataPoint[]
  direction?: Direction
  unit?: string | null
  min?: number
  max?: number
}

export default function NumericTrendChart({
  itemKey,
  displayName,
  dataPoints,
  direction,
  unit,
  min,
  max,
}: NumericTrendChartProps) {
  const chartHeight = useChartHeight(140, 180)

  const chartData = useMemo(() => {
    return dataPoints
      .map((dp) => {
        const item = dp.items[itemKey]
        if (!item || item.value === undefined || item.value === null || item.value === '') return null
        return {
          visit: dp.visit_number,
          label: `V${dp.visit_number}`,
          date: dp.visit_date,
          value: Number(item.value),
        }
      })
      .filter(Boolean) as Array<{ visit: number; label: string; date: string; value: number }>
  }, [dataPoints, itemKey])

  const { mcid } = resolveMCID(itemKey)
  const reversed = shouldReverseYAxis(direction)

  if (chartData.length < 2) {
    return (
      <div className="text-xs text-gray-400 italic py-4 text-center">
        Need 2+ visits to show trend
      </div>
    )
  }

  const baseline = chartData[0].value
  const mcidLine = mcid !== null
    ? (direction === 'higher_worse' ? baseline - mcid : baseline + mcid)
    : null

  // Compute Y domain
  const values = chartData.map(d => d.value)
  const allValues = mcidLine !== null ? [...values, mcidLine] : values
  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  const padding = (dataMax - dataMin) * 0.15 || 1
  const yMin = min !== undefined ? Math.min(min, dataMin - padding) : dataMin - padding
  const yMax = max !== undefined ? Math.max(max, dataMax + padding) : dataMax + padding

  return (
    <div className="w-full">
      <div className="text-[11px] lg:text-xs font-medium text-gray-700 mb-1.5 lg:mb-2">{displayName}</div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis
            reversed={reversed}
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            width={35}
            label={unit ? { value: unit, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' } : undefined}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [
              `${value}${unit ? ` ${unit}` : ''}`,
              displayName,
            ]}
            labelFormatter={(label) => {
              const point = chartData.find(d => d.label === label)
              return point ? `Visit ${point.visit} (${point.date})` : String(label)
            }}
          />
          {/* Baseline reference */}
          <ReferenceLine
            y={baseline}
            stroke="#9ca3af"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          {/* MCID reference line */}
          {mcidLine !== null && (
            <ReferenceLine
              y={mcidLine}
              stroke="#10b981"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `MCID`,
                position: 'right',
                fontSize: 9,
                fill: '#10b981',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0d9488"
            strokeWidth={2}
            dot={{ fill: '#0d9488', r: 3 }}
            activeDot={{ r: 5, fill: '#0d9488' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
