'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

export default function ToggleInput({ value, onChange, disabled }: TrackingInputProps) {
  const current = value?.value as string | undefined

  return (
    <div className="flex rounded-md overflow-hidden border border-gray-200">
      <button
        type="button"
        onClick={() => onChange({ value: current === 'Present' ? undefined : 'Present' })}
        disabled={disabled}
        className={`px-2.5 h-7 text-xs font-medium transition-colors ${
          current === 'Present'
            ? 'bg-amber-100 text-amber-700 border-r border-amber-200'
            : 'bg-white text-gray-500 border-r border-gray-200 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        Present
      </button>
      <button
        type="button"
        onClick={() => onChange({ value: current === 'Absent' ? undefined : 'Absent' })}
        disabled={disabled}
        className={`px-2.5 h-7 text-xs font-medium transition-colors ${
          current === 'Absent'
            ? 'bg-green-100 text-green-700'
            : 'bg-white text-gray-500 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        Absent
      </button>
    </div>
  )
}
