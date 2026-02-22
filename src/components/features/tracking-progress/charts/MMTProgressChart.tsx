'use client'

import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ChartDataPoint } from '../hooks/useTrackingHistory'

interface MMTProgressChartProps {
  itemKey: string
  displayName: string
  dataPoints: ChartDataPoint[]
  bilateral?: boolean
}

// Convert MMT grades to numeric for charting
const MMT_ORDER = ['0', '1', '1+', '2-', '2', '2+', '3-', '3', '3+', '4-', '4', '4+', '5-', '5']
function mmtToNumeric(grade: string | number): number {
  const idx = MMT_ORDER.indexOf(String(grade))
  return idx >= 0 ? idx : -1
}
function numericToMMT(val: number): string {
  return MMT_ORDER[Math.round(val)] || ''
}

export default function MMTProgressChart({
  itemKey,
  displayName,
  dataPoints,
  bilateral,
}: MMTProgressChartProps) {
  const chartData = useMemo(() => {
    return dataPoints
      .map((dp) => {
        const item = dp.items[itemKey]
        if (!item) return null

        if (bilateral) {
          const hasLeft = item.left !== undefined && item.left !== null && item.left !== ''
          const hasRight = item.right !== undefined && item.right !== null && item.right !== ''
          if (!hasLeft && !hasRight) return null
          return {
            visit: dp.visit_number,
            date: dp.visit_date,
            left: hasLeft ? mmtToNumeric(item.left!) : undefined,
            right: hasRight ? mmtToNumeric(item.right!) : undefined,
          }
        }

        if (item.value === undefined || item.value === null || item.value === '') return null
        return {
          visit: dp.visit_number,
          date: dp.visit_date,
          value: mmtToNumeric(item.value),
        }
      })
      .filter(Boolean) as Array<{ visit: number; date: string; value?: number; left?: number; right?: number }>
  }, [dataPoints, itemKey, bilateral])

  if (chartData.length < 1) {
    return null
  }

  return (
    <div className="w-full">
      <div className="text-xs font-medium text-gray-700 mb-2">{displayName}</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="visit"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis
            domain={[0, MMT_ORDER.length - 1]}
            ticks={[0, 3, 7, 10, 13]}
            tickFormatter={(val) => numericToMMT(val)}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(value: number, name: string) => [numericToMMT(value), name]}
            labelFormatter={(label) => `Visit ${label}`}
          />
          {bilateral ? (
            <>
              <Bar dataKey="left" name="Left" fill="#06b6d4" radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="right" name="Right" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={12} />
            </>
          ) : (
            <Bar dataKey="value" name={displayName} radius={[2, 2, 0, 0]} barSize={16}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.value !== undefined && entry.value >= 10 ? '#0d9488' : '#14b8a6'}
                />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
