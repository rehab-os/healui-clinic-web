import { useState, useEffect } from 'react'
import { ENDPOINTS } from '@/lib/data-access/endpoints'
import { ApiMethods } from '@/lib/data-access/api-client'

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://healui-backend-core.onrender.com/api/v1/').replace(/\/$/, '') + '/'

export interface ChartDataPoint {
  visit_date: string
  visit_number: number
  pain_score: number | null
  prom_scores?: Record<string, number | Record<string, number>>
  items: Record<string, {
    value?: number | string | boolean
    left?: number | string
    right?: number | string
  }>
}

export interface TrackingChartData {
  patient_condition_id: string
  condition_name: string
  total_visits: number
  data_points: ChartDataPoint[]
}

export function useTrackingHistory(patientConditionId: string | null) {
  const [chartData, setChartData] = useState<TrackingChartData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!patientConditionId) {
      setChartData(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const url = BASE_URL + ENDPOINTS.GET_TRACKING_CHART_DATA(patientConditionId)
    ApiMethods.get(url)
      .then((res) => {
        if (cancelled) return
        if (res.success && res.data) {
          setChartData(res.data)
        } else {
          setChartData(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load tracking history')
          setChartData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [patientConditionId, refreshKey])

  const refetch = () => setRefreshKey(k => k + 1)

  return { chartData, isLoading, error, refetch }
}
