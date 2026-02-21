'use client'

import React from 'react'
import type { TrackingItem, TrackingValue } from './tracking.types'
import TrackingItemRow from './TrackingItemRow'

interface TrackingCategoryTabProps {
  items: TrackingItem[]
  values: Record<string, TrackingValue>
  onValueChange: (itemKey: string, value: TrackingValue) => void
}

export default function TrackingCategoryTab({ items, values, onValueChange }: TrackingCategoryTabProps) {
  return (
    <div className="divide-y divide-gray-100">
      {items.map(item => (
        <TrackingItemRow
          key={item.key}
          item={item}
          value={values[item.key]}
          onChange={(val) => onValueChange(item.key, val)}
        />
      ))}
    </div>
  )
}
