'use client'

import React, { useMemo } from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ChartDataPoint } from '../hooks/useTrackingHistory'

interface PROMSubscaleRadarProps {
  itemKey: string
  displayName: string
  dataPoints: ChartDataPoint[]
}

export default function PROMSubscaleRadar({
  itemKey,
  displayName,
  dataPoints,
}: PROMSubscaleRadarProps) {
  const radarData = useMemo(() => {
    if (dataPoints.length === 0) return null

    // Find first (baseline) and last (current) data points with prom_scores
    const pointsWithScores = dataPoints.filter(
      (dp) => dp.prom_scores && typeof dp.prom_scores[itemKey] === 'object'
    )

    if (pointsWithScores.length < 1) return null

    const baseline = pointsWithScores[0].prom_scores![itemKey] as Record<string, number>
    const current = pointsWithScores[pointsWithScores.length - 1].prom_scores![itemKey] as Record<string, number>

    if (!baseline || typeof baseline !== 'object') return null

    const subscaleKeys = Object.keys(baseline)
    return subscaleKeys.map((key) => ({
      subscale: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      baseline: baseline[key] || 0,
      current: current?.[key] || 0,
    }))
  }, [dataPoints, itemKey])

  if (!radarData || radarData.length < 3) {
    return (
      <div className="text-xs text-gray-400 italic py-4 text-center">
        Need subscale scores across visits for radar chart
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="text-xs font-medium text-gray-700 mb-2">{displayName} — Subscales</div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subscale"
            tick={{ fontSize: 9, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            tick={{ fontSize: 8, fill: '#9ca3af' }}
            domain={[0, 100]}
          />
          <Radar
            name="Baseline"
            dataKey="baseline"
            stroke="#9ca3af"
            fill="#9ca3af"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#0d9488"
            fill="#0d9488"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            iconSize={8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
