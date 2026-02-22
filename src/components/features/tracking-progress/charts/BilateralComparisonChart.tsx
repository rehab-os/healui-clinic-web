'use client'

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { Direction } from '@/app/dashboard/appointments/[patientId]/[appointmentId]/components/tracking/tracking.types'
import type { ChartDataPoint } from '../hooks/useTrackingHistory'
import { shouldReverseYAxis } from '../utils/chartability'

interface BilateralComparisonChartProps {
  itemKey: string
  displayName: string
  dataPoints: ChartDataPoint[]
  direction?: Direction
  unit?: string | null
  min?: number
  max?: number
}

export default function BilateralComparisonChart({
  itemKey,
  displayName,
  dataPoints,
  direction,
  unit,
  min,
  max,
}: BilateralComparisonChartProps) {
  const chartData = useMemo(() => {
    return dataPoints
      .map((dp) => {
        const item = dp.items[itemKey]
        if (!item) return null
        const hasLeft = item.left !== undefined && item.left !== null && item.left !== ''
        const hasRight = item.right !== undefined && item.right !== null && item.right !== ''
        if (!hasLeft && !hasRight) return null
        return {
          visit: dp.visit_number,
          date: dp.visit_date,
          left: hasLeft ? Number(item.left) : undefined,
          right: hasRight ? Number(item.right) : undefined,
        }
      })
      .filter(Boolean) as Array<{ visit: number; date: string; left?: number; right?: number }>
  }, [dataPoints, itemKey])

  const reversed = shouldReverseYAxis(direction)

  if (chartData.length < 2) {
    return (
      <div className="text-xs text-gray-400 italic py-4 text-center">
        Need 2+ visits to show trend
      </div>
    )
  }

  // Compute Y domain
  const allValues = chartData.flatMap(d => [d.left, d.right].filter((v): v is number => v !== undefined))
  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  const padding = (dataMax - dataMin) * 0.15 || 1
  const yMin = min !== undefined ? Math.min(min, dataMin - padding) : dataMin - padding
  const yMax = max !== undefined ? Math.max(max, dataMax + padding) : dataMax + padding

  return (
    <div className="w-full">
      <div className="text-xs font-medium text-gray-700 mb-2">{displayName}</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="visit"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis
            reversed={reversed}
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            label={unit ? { value: unit, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' } : undefined}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
            labelFormatter={(label) => {
              const point = chartData.find(d => d.visit === label)
              return point ? `Visit ${label} (${point.date})` : `Visit ${label}`
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="left"
            name="Left"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: '#06b6d4', r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="right"
            name="Right"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
