'use client'

import React from 'react'
import type { TrackingInputProps } from '../tracking.types'

const MMT_GRADES = ['0', '1', '1+', '2-', '2', '2+', '3-', '3', '3+', '4-', '4', '4+', '5']

export default function MMTGradeInput({ value, onChange, disabled }: TrackingInputProps) {
  const current = value?.value as string | undefined

  return (
    <div className="flex flex-wrap gap-0.5">
      {MMT_GRADES.map(grade => {
        const isActive = current === grade
        return (
          <button
            key={grade}
            type="button"
            onClick={() => onChange({ value: current === grade ? undefined : grade })}
            disabled={disabled}
            className={`min-w-[28px] h-6 px-1 text-[11px] font-medium rounded transition-colors ${
              isActive
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            {grade}
          </button>
        )
      })}
    </div>
  )
}
