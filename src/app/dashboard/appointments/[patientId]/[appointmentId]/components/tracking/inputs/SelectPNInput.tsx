'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

export default function SelectPNInput({ value, onChange, disabled }: TrackingInputProps) {
  const current = value?.value as string | undefined

  return (
    <div className="flex rounded-md overflow-hidden border border-gray-200">
      <button
        type="button"
        onClick={() => onChange({ value: current === 'Positive' ? undefined : 'Positive' })}
        disabled={disabled}
        className={`px-3 h-7 text-xs font-medium transition-colors ${
          current === 'Positive'
            ? 'bg-red-100 text-red-700 border-r border-red-200'
            : 'bg-white text-gray-500 border-r border-gray-200 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        +
      </button>
      <button
        type="button"
        onClick={() => onChange({ value: current === 'Negative' ? undefined : 'Negative' })}
        disabled={disabled}
        className={`px-3 h-7 text-xs font-medium transition-colors ${
          current === 'Negative'
            ? 'bg-green-100 text-green-700'
            : 'bg-white text-gray-500 hover:bg-gray-50'
        } disabled:opacity-50`}
      >
        &minus;
      </button>
    </div>
  )
}
