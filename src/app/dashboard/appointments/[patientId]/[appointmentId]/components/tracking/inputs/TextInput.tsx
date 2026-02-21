'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

export default function TextInput({ value, onChange, disabled }: TrackingInputProps) {
  const current = (value?.value as string) ?? ''

  return (
    <input
      type="text"
      value={current}
      onChange={e => onChange({ value: e.target.value || undefined })}
      disabled={disabled}
      placeholder="Enter..."
      className="w-40 h-7 px-2 text-xs border border-gray-200 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none disabled:opacity-50"
    />
  )
}
