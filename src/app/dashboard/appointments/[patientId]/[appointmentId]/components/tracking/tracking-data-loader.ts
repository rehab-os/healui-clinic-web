import conditionTrackingData from '@/data/conditions/condition-tracking.json'
import trackingItemDefinitions from '@/data/conditions/tracking-item-definitions.json'
import type { ConditionTracking, TrackingCategory, TrackingItem, TrackingItemDefinition } from './tracking.types'

type ConditionTrackingMap = Record<string, Record<string, string[]>>
type ItemDefinitionsMap = Record<string, TrackingItemDefinition>

const conditionMap = conditionTrackingData as ConditionTrackingMap
const definitionsMap = trackingItemDefinitions as unknown as ItemDefinitionsMap

// Strip trailing body-region suffix like "(ankle)" or "(shoulder)" that gets
// appended to condition_name in the DB but doesn't exist in tracking keys
const BODY_REGION_SUFFIX = /\s*\(\w[\w_]*\)\s*$/

function normalizeConditionName(name: string): string {
  // Only strip if the base name (without suffix) exists in the tracking map
  const stripped = name.replace(BODY_REGION_SUFFIX, '')
  if (stripped !== name && stripped in conditionMap) return stripped
  return name
}

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  essential: 'Essential',
  function: 'Function',
  rom: 'ROM',
  strength: 'Strength',
  measurements: 'Measurements',
  special_tests: 'Special Tests',
}

function parseItemKey(rawKey: string): { key: string; isPriority: boolean } {
  const isPriority = rawKey.endsWith('*')
  const key = isPriority ? rawKey.slice(0, -1) : rawKey
  return { key, isPriority }
}

export function getTrackingForCondition(conditionName: string): ConditionTracking | null {
  const conditionData = conditionMap[conditionName] || conditionMap[normalizeConditionName(conditionName)]
  if (!conditionData) return null

  const categories: TrackingCategory[] = []

  for (const [categoryKey, rawItems] of Object.entries(conditionData)) {
    if (!rawItems || rawItems.length === 0) continue

    const items: TrackingItem[] = []
    for (const rawKey of rawItems) {
      const { key, isPriority } = parseItemKey(rawKey)
      const definition = definitionsMap[key]
      if (!definition) continue
      items.push({ key, isPriority, definition })
    }

    if (items.length === 0) continue

    // Sort: priority first, then alphabetical by display name
    items.sort((a, b) => {
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1
      return a.definition.display_name.localeCompare(b.definition.display_name)
    })

    categories.push({
      key: categoryKey,
      displayName: CATEGORY_DISPLAY_NAMES[categoryKey] || categoryKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      items,
    })
  }

  if (categories.length === 0) return null
  return { categories }
}
