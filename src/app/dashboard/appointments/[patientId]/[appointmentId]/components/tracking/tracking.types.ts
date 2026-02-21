// ── Tracking data types ─────────────────────────────────────

export type InputType =
  | 'numeric'
  | 'numeric_bilateral'
  | 'select'
  | 'select_pn'
  | 'scale_0_3'
  | 'scale_0_5'
  | 'scale_0_10'
  | 'mmt_grade'
  | 'toggle'
  | 'timer'
  | 'questionnaire'
  | 'text'
  | 'slider'

export type Direction = 'higher_better' | 'higher_worse'

export interface TrackingItemDefinition {
  display_name: string
  type: string
  input: InputType
  unit: string | null
  bilateral: boolean
  min?: number
  max?: number
  direction?: Direction
  labels?: Record<string, string>
  options?: string[]
  score_range?: [number, number]
  prom_file?: string
}

export interface TrackingItem {
  key: string
  isPriority: boolean
  definition: TrackingItemDefinition
}

export interface TrackingCategory {
  key: string
  displayName: string
  items: TrackingItem[]
}

export interface ConditionTracking {
  categories: TrackingCategory[]
}

// ── Form state types ────────────────────────────────────────

export interface TrackingValue {
  value?: number | string | boolean
  left?: number | string
  right?: number | string
}

// ── Input component props ───────────────────────────────────

export interface TrackingInputProps {
  value: TrackingValue | undefined
  onChange: (value: TrackingValue) => void
  definition: TrackingItemDefinition
  disabled?: boolean
  itemKey?: string
}
