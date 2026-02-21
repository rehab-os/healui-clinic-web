'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

export default function ScaleInput({ value, onChange, definition, disabled }: TrackingInputProps) {
  const current = value?.value as number | undefined
  const min = definition.min ?? 0
  const max = definition.max ?? 10
  const labels = definition.labels

  const buttons = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  return (
    <div className="flex gap-0.5">
      {buttons.map(n => {
        const isActive = current === n
        const label = labels?.[String(n)]
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange({ value: current === n ? undefined : n })}
            disabled={disabled}
            title={label || undefined}
            className={`min-w-[26px] h-7 text-xs font-medium rounded transition-colors ${
              isActive
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
