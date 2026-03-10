const OPTIMISTIC_PREFIX = '_optimistic_'

let counter = 0

export function createOptimisticId(): string {
  return `${OPTIMISTIC_PREFIX}${Date.now()}_${++counter}`
}

export function isOptimisticItem(item: { id: string }): boolean {
  return item.id.startsWith(OPTIMISTIC_PREFIX)
}
