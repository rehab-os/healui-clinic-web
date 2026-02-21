'use client'

import React from 'react'
import { Star, ArrowUp, ArrowDown } from 'lucide-react'
import type { TrackingItem, TrackingValue } from './tracking.types'
import InputResolver from './InputResolver'

interface TrackingItemRowProps {
  item: TrackingItem
  value: TrackingValue | undefined
  onChange: (value: TrackingValue) => void
}

export default function TrackingItemRow({ item, value, onChange }: TrackingItemRowProps) {
  const { definition, isPriority } = item
  const direction = definition.direction

  return (
    <div className="flex items-center gap-2 py-2 px-1 group">
      {/* Priority star */}
      <div className="w-3.5 flex-shrink-0">
        {isPriority && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
      </div>

      {/* Label + direction */}
      <div className="flex-1 min-w-0 flex items-center gap-1">
        <span className="text-xs text-gray-700 truncate">{definition.display_name}</span>
        {direction === 'higher_better' && (
          <ArrowUp className="h-3 w-3 text-green-500 flex-shrink-0" />
        )}
        {direction === 'higher_worse' && (
          <ArrowDown className="h-3 w-3 text-red-500 flex-shrink-0" />
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <InputResolver
          value={value}
          onChange={onChange}
          definition={definition}
        />
      </div>

      {/* Unit */}
      {definition.unit && definition.unit !== 'result' && (
        <span className="text-[10px] text-gray-400 flex-shrink-0 w-10 truncate">{definition.unit}</span>
      )}
    </div>
  )
}
