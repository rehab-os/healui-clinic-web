'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

export default function NumericInput({ value, onChange, definition, disabled }: TrackingInputProps) {
  const current = (value?.value as number | undefined) ?? ''

  return (
    <input
      type="number"
      value={current}
      onChange={e => {
        const v = e.target.value
        onChange({ value: v === '' ? undefined : Number(v) })
      }}
      min={definition.min}
      max={definition.max}
      disabled={disabled}
      placeholder={definition.min !== undefined && definition.max !== undefined ? `${definition.min}–${definition.max}` : '—'}
      className="w-20 h-7 px-2 text-xs text-right border border-gray-200 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}
