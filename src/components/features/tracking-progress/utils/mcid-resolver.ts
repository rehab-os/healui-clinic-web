import metricsData from '@/data/clinical/entities/metrics.json'

interface MCIDResult {
  mcid: number | null
  mdc: number | null
  source: 'metrics' | 'hardcoded' | null
}

// Well-established MCIDs for common pain scales
const HARDCODED_MCIDS: Record<string, { mcid: number; mdc: number }> = {
  vas: { mcid: 2.0, mdc: 2.5 },
  nprs: { mcid: 2.0, mdc: 2.5 },
}

// Build a lookup map from metrics.json: acronym (lowercase) → scoring
const metricsMap = new Map<string, { mcid: number; mdc: number }>()
const metrics = (metricsData as any).metrics
for (const key of Object.keys(metrics)) {
  const metric = metrics[key]
  if (metric.acronym && metric.scoring?.mcid) {
    metricsMap.set(metric.acronym.toLowerCase(), {
      mcid: metric.scoring.mcid,
      mdc: metric.scoring.mdc || metric.scoring.mcid,
    })
  }
}

/**
 * Resolve MCID and MDC for a tracking item key.
 * Sources checked in order:
 * 1. Hardcoded values for VAS/NPRS
 * 2. metrics.json lookup by acronym
 */
export function resolveMCID(itemKey: string): MCIDResult {
  const key = itemKey.toLowerCase()

  // Check hardcoded
  if (HARDCODED_MCIDS[key]) {
    return {
      mcid: HARDCODED_MCIDS[key].mcid,
      mdc: HARDCODED_MCIDS[key].mdc,
      source: 'hardcoded',
    }
  }

  // Check metrics.json by acronym
  const metric = metricsMap.get(key)
  if (metric) {
    return {
      mcid: metric.mcid,
      mdc: metric.mdc,
      source: 'metrics',
    }
  }

  return { mcid: null, mdc: null, source: null }
}

/**
 * Compute RAG status for a tracking item
 */
export type RAGStatus = 'green' | 'amber' | 'red' | 'neutral'

export function computeRAG(
  baseline: number,
  current: number,
  direction: 'higher_better' | 'higher_worse' | undefined,
  mcid: number | null,
): RAGStatus {
  if (direction === undefined) return 'neutral'

  // Calculate change in the "improvement" direction
  const change = direction === 'higher_better'
    ? current - baseline
    : baseline - current

  if (mcid !== null) {
    if (change >= mcid) return 'green'
    if (change >= 0) return 'amber'
    return 'red'
  }

  // No MCID: use 20% threshold
  const percentChange = baseline !== 0 ? (change / Math.abs(baseline)) * 100 : 0
  if (percentChange >= 20) return 'green'
  if (percentChange >= 0) return 'amber'
  return 'red'
}
