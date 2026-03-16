'use client'

import React, { useMemo, useState } from 'react'
import type { ChartDataPoint } from '../hooks/useTrackingHistory'

interface SpecialTestTimelineProps {
  itemKey: string
  displayName: string
  dataPoints: ChartDataPoint[]
}

export default function SpecialTestTimeline({
  itemKey,
  displayName,
  dataPoints,
}: SpecialTestTimelineProps) {
  const [tappedIdx, setTappedIdx] = useState<number | null>(null)

  const dots = useMemo(() => {
    return dataPoints.map((dp) => {
      const item = dp.items[itemKey]
      if (!item || item.value === undefined || item.value === null || item.value === '') {
        return { visit: dp.visit_number, date: dp.visit_date, status: 'empty' as const }
      }

      const val = String(item.value).toLowerCase()
      const isPositive = val === 'positive' || val === 'true' || val === '+' || val === 'yes'
      const isNegative = val === 'negative' || val === 'false' || val === '-' || val === 'no'

      return {
        visit: dp.visit_number,
        date: dp.visit_date,
        status: isPositive ? 'positive' as const : isNegative ? 'negative' as const : 'empty' as const,
      }
    })
  }, [dataPoints, itemKey])

  if (dots.every(d => d.status === 'empty')) {
    return null
  }

  return (
    <div className="w-full">
      <div className="text-[11px] lg:text-xs font-medium text-gray-700 mb-1.5 lg:mb-2">{displayName}</div>
      <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
        {dots.map((dot, idx) => (
          <div
            key={dot.visit}
            className="relative flex flex-col items-center"
          >
            {/* Visit label */}
            <span className="text-[8px] lg:text-[9px] text-gray-400 mb-0.5 font-medium">V{dot.visit}</span>
            <button
              type="button"
              onClick={() => setTappedIdx(tappedIdx === idx ? null : idx)}
              onMouseEnter={() => setTappedIdx(idx)}
              onMouseLeave={() => setTappedIdx(null)}
              className={`w-6 h-6 lg:w-5 lg:h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-transform active:scale-90
                ${dot.status === 'positive' ? 'bg-red-100 border-red-400 text-red-600' : ''}
                ${dot.status === 'negative' ? 'bg-green-100 border-green-400 text-green-600' : ''}
                ${dot.status === 'empty' ? 'bg-gray-50 border-gray-200 text-gray-300' : ''}
              `}
            >
              {dot.status === 'positive' ? '+' : dot.status === 'negative' ? '-' : ''}
            </button>
            {/* Tooltip — hover on desktop, tap on mobile */}
            {tappedIdx === idx && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                  {dot.date}
                  <br />
                  {dot.status === 'positive' ? 'Positive' : dot.status === 'negative' ? 'Negative' : 'Not recorded'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-400 inline-block" />
          Positive
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-100 border border-green-400 inline-block" />
          Negative
        </span>
      </div>
    </div>
  )
}
