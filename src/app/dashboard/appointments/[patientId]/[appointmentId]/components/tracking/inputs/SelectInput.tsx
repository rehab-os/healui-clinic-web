'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

export default function SelectInput({ value, onChange, definition, disabled }: TrackingInputProps) {
  const current = (value?.value as string) ?? ''
  const options = definition.options || []

  return (
    <select
      value={current}
      onChange={e => onChange({ value: e.target.value || undefined })}
      disabled={disabled}
      className="h-7 px-2 text-xs border border-gray-200 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none disabled:opacity-50 bg-white max-w-[180px]"
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}
