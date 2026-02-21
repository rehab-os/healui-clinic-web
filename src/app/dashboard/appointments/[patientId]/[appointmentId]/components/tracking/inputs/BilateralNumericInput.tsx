'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

export default function BilateralNumericInput({ value, onChange, definition, disabled }: TrackingInputProps) {
  const left = value?.left ?? ''
  const right = value?.right ?? ''

  const inputClass = "w-16 h-7 px-2 text-xs text-right border border-gray-200 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-gray-400 w-3">L</span>
      <input
        type="number"
        value={left}
        onChange={e => {
          const v = e.target.value
          onChange({ ...value, left: v === '' ? undefined : Number(v) })
        }}
        min={definition.min}
        max={definition.max}
        disabled={disabled}
        placeholder="—"
        className={inputClass}
      />
      <span className="text-[10px] font-medium text-gray-400 w-3">R</span>
      <input
        type="number"
        value={right}
        onChange={e => {
          const v = e.target.value
          onChange({ ...value, right: v === '' ? undefined : Number(v) })
        }}
        min={definition.min}
        max={definition.max}
        disabled={disabled}
        placeholder="—"
        className={inputClass}
      />
    </div>
  )
}
