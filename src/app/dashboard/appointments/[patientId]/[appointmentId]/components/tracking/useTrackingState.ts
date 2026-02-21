import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { TrackingValue } from './tracking.types'

type ValuesMap = Record<string, TrackingValue>

export function useTrackingState(visitConditionId: string, totalCount: number) {
  // Store per-condition data keyed by visitConditionId
  const storeRef = useRef<Record<string, ValuesMap>>({})
  const [values, setValues] = useState<ValuesMap>(() => storeRef.current[visitConditionId] || {})

  // Sync when condition changes
  useEffect(() => {
    setValues(storeRef.current[visitConditionId] || {})
  }, [visitConditionId])

  const setValue = useCallback((itemKey: string, val: TrackingValue) => {
    setValues(prev => {
      const next = { ...prev, [itemKey]: val }
      storeRef.current[visitConditionId] = next
      return next
    })
  }, [visitConditionId])

  const filledCount = useMemo(() => {
    return Object.values(values).filter(v => {
      if (v.value !== undefined && v.value !== '' && v.value !== null) return true
      if (v.left !== undefined && v.left !== '' && v.left !== null) return true
      if (v.right !== undefined && v.right !== '' && v.right !== null) return true
      return false
    }).length
  }, [values])

  return { values, setValue, filledCount, totalCount }
}
