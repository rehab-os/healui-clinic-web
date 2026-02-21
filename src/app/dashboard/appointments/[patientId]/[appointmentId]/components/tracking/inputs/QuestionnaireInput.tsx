'use client'

import React from 'react'
import { ClipboardList } from 'lucide-react'
import type { TrackingInputProps } from '../tracking.types'

export default function QuestionnaireInput({ value, onChange, definition, disabled }: TrackingInputProps) {
  const current = (value?.value as number | undefined) ?? ''
  const range = definition.score_range || [definition.min ?? 0, definition.max ?? 100]

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={current}
        onChange={e => {
          const v = e.target.value
          onChange({ value: v === '' ? undefined : Number(v) })
        }}
        min={range[0]}
        max={range[1]}
        disabled={disabled}
        placeholder={`${range[0]}–${range[1]}`}
        className="w-20 h-7 px-2 text-xs text-right border border-gray-200 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled
        title="Full questionnaire (coming soon)"
        className="h-7 px-2 flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
      >
        <ClipboardList className="h-3 w-3" />
        PROM
      </button>
    </div>
  )
}
