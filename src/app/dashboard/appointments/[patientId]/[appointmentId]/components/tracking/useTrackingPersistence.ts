import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { ENDPOINTS } from '@/lib/data-access/endpoints'
import { ApiMethods } from '@/lib/data-access/api-client'
import type { TrackingValue, TrackingItem, TrackingCategory } from './tracking.types'

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://healui-backend-core.onrender.com/api/v1/').replace(/\/$/, '') + '/'

type ValuesMap = Record<string, TrackingValue>

interface TrackingPersistenceReturn {
  values: ValuesMap
  setValue: (itemKey: string, val: TrackingValue) => void
  save: () => Promise<void>
  filledCount: number
  totalCount: number
  isSaving: boolean
  isLoading: boolean
  isDirty: boolean
  lastSavedAt: Date | null
}

export function useTrackingPersistence(
  visitConditionId: string,
  patientConditionId: string,
  visitId: string,
  categories: TrackingCategory[] | null,
  totalCount: number,
): TrackingPersistenceReturn {
  // Store per-condition data keyed by visitConditionId
  const storeRef = useRef<Record<string, ValuesMap>>({})
  const [values, setValues] = useState<ValuesMap>(() => storeRef.current[visitConditionId] || {})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const loadedRef = useRef<Set<string>>(new Set())

  // Sync when condition changes
  useEffect(() => {
    setValues(storeRef.current[visitConditionId] || {})
    setIsDirty(false)
    setLastSavedAt(null)
  }, [visitConditionId])

  // Load saved data from API on mount / condition change
  // 1. Try loading from this visit-condition
  // 2. If not found, prefill from the most recent visit for this patient-condition
  useEffect(() => {
    if (!visitConditionId || loadedRef.current.has(visitConditionId)) return

    let cancelled = false
    setIsLoading(true)

    const loadCurrentVisit = async () => {
      // Step 1: Check if this visit already has saved tracking data
      const url = BASE_URL + ENDPOINTS.GET_TRACKING_BY_VISIT_CONDITION(visitConditionId)
      try {
        const res = await ApiMethods.get(url)
        if (cancelled) return

        if (res.success && res.data) {
          // This visit has saved data — restore it
          const items = res.data.tracking_data?.items || {}
          const restored: ValuesMap = {}
          for (const [key, item] of Object.entries(items) as [string, any][]) {
            const val: TrackingValue = {}
            if (item.value !== undefined) val.value = item.value
            if (item.left !== undefined) val.left = item.left
            if (item.right !== undefined) val.right = item.right
            restored[key] = val
          }
          storeRef.current[visitConditionId] = restored
          setValues(restored)
          setLastSavedAt(new Date(res.data.recorded_at))
          loadedRef.current.add(visitConditionId)
          return
        }
      } catch {
        // No saved data for this visit — continue to step 2
      }

      if (cancelled) return

      // Step 2: No saved data for this visit — prefill from last visit's data
      if (!patientConditionId) {
        loadedRef.current.add(visitConditionId)
        return
      }

      try {
        const historyUrl = BASE_URL + ENDPOINTS.GET_TRACKING_HISTORY(patientConditionId)
        const historyRes = await ApiMethods.get(historyUrl)
        if (cancelled) return

        if (historyRes.success && historyRes.data && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
          // Take the most recent record (last in the ASC-sorted array)
          const lastRecord = historyRes.data[historyRes.data.length - 1]
          const items = lastRecord.tracking_data?.items || {}
          const prefilled: ValuesMap = {}
          for (const [key, item] of Object.entries(items) as [string, any][]) {
            const val: TrackingValue = {}
            if (item.value !== undefined) val.value = item.value
            if (item.left !== undefined) val.left = item.left
            if (item.right !== undefined) val.right = item.right
            prefilled[key] = val
          }
          storeRef.current[visitConditionId] = prefilled
          setValues(prefilled)
          // Mark as dirty so user knows this is prefilled and needs saving for this visit
          setIsDirty(true)
          setLastSavedAt(null) // Not saved for THIS visit yet
        }
      } catch {
        // No history available — start empty
      }

      loadedRef.current.add(visitConditionId)
    }

    loadCurrentVisit().finally(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [visitConditionId, patientConditionId])

  const setValue = useCallback((itemKey: string, val: TrackingValue) => {
    setValues(prev => {
      const next = { ...prev, [itemKey]: val }
      storeRef.current[visitConditionId] = next
      return next
    })
    setIsDirty(true)
  }, [visitConditionId])

  const filledCount = useMemo(() => {
    return Object.values(values).filter(v => {
      if (v.value !== undefined && v.value !== '' && v.value !== null) return true
      if (v.left !== undefined && v.left !== '' && v.left !== null) return true
      if (v.right !== undefined && v.right !== '' && v.right !== null) return true
      return false
    }).length
  }, [values])

  // Build items index from categories for input_type/category lookup
  const itemsIndex = useMemo(() => {
    if (!categories) return new Map<string, TrackingItem>()
    const map = new Map<string, TrackingItem>()
    for (const cat of categories) {
      for (const item of cat.items) {
        map.set(item.key, item)
      }
    }
    return map
  }, [categories])

  const save = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      // Build items payload with input_type and category
      const items: Record<string, any> = {}
      for (const [key, val] of Object.entries(values)) {
        const hasValue = (val.value !== undefined && val.value !== '' && val.value !== null)
          || (val.left !== undefined && val.left !== '' && val.left !== null)
          || (val.right !== undefined && val.right !== '' && val.right !== null)
        if (!hasValue) continue

        const def = itemsIndex.get(key)
        const entry: any = {
          input_type: def?.definition.input || 'unknown',
          category: def ? getCategoryForItem(key, categories) : 'unknown',
        }
        if (val.value !== undefined) entry.value = val.value
        if (val.left !== undefined) entry.left = val.left
        if (val.right !== undefined) entry.right = val.right
        items[key] = entry
      }

      const url = BASE_URL + ENDPOINTS.SAVE_TRACKING_RECORD()
      await ApiMethods.post(url, {
        patient_condition_id: patientConditionId,
        visit_condition_id: visitConditionId,
        visit_id: visitId,
        items,
        filled_count: filledCount,
        total_count: totalCount,
      })

      setIsDirty(false)
      setLastSavedAt(new Date())
    } finally {
      setIsSaving(false)
    }
  }, [values, visitConditionId, patientConditionId, visitId, filledCount, totalCount, isSaving, itemsIndex, categories])

  return { values, setValue, save, filledCount, totalCount, isSaving, isLoading, isDirty, lastSavedAt }
}

function getCategoryForItem(itemKey: string, categories: TrackingCategory[] | null): string {
  if (!categories) return 'unknown'
  for (const cat of categories) {
    if (cat.items.some(i => i.key === itemKey)) return cat.key
  }
  return 'unknown'
}
