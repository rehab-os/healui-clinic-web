// Maps tracking item keys to PROM filenames in src/data/conditions/proms/
const ITEM_KEY_TO_PROM_FILE: Record<string, string> = {
  spadi: 'spadi',
  ndi: 'ndi',
  ndi_score: 'ndi',
  neck_disability_index: 'ndi',
  odi_score: 'odi',
  oswestry: 'odi',
  quick_dash: 'quickdash',
  lefs: 'lefs',
  lefs_score: 'lefs',
  koos: 'koos',
  koos_score: 'koos',
  koos_pf: 'koos',
  prtee: 'prtee',
  hoos_score: 'hoos',
  nprs: 'nprs',
  ikdc_score: 'ikdc',
  visa_a: 'visaa',
  visa_p: 'visap',
  womac_score: 'womac',
  prwe: 'prwe',
  rmdq: 'rmdq',
  rmdq_score: 'rmdq',
  sf_36_physical_function: 'sf36',
  sf_36_score: 'sf36',
  sgrq: 'sgrq',
  srs_22: 'srs22',
  srs_22_score: 'srs22',
  tsk_11: 'tsk',
  tegner_activity_scale: 'tegner',
  haq_di: 'haqdi',
  headache_impact_test: 'hit6',
  hit_6: 'hit6',
  lysholm_score: 'lysholm',
  pfdi_20: 'pfdi20',
  wosi: 'wosi',
  qualeffo: 'qualeffo41',
  // newly wired items
  abc_scale: 'abc',
  ases: 'ases',
  barthel_index: 'barthel',
  bctq: 'bctq',
  berg_balance_scale: 'berg',
  cait: 'cait',
  dash: 'dash',
  dhi: 'dhi',
  eq_5d: 'eq5d',
  faam: 'faam',
  fim: 'fim',
  fiq: 'fiq',
  fsfi: 'fsfi',
  lymqol: 'lymqol',
  pain_catastrophizing_scale: 'pcs',
  pcs: 'pcs',
  ffi: 'ffi',
  fhsq: 'fhsq',
}

// Dynamic imports for each PROM file
const PROM_IMPORTS: Record<string, () => Promise<any>> = {
  spadi: () => import('@/data/conditions/proms/spadi.json'),
  ndi: () => import('@/data/conditions/proms/ndi.json'),
  odi: () => import('@/data/conditions/proms/odi.json'),
  quickdash: () => import('@/data/conditions/proms/quickdash.json'),
  lefs: () => import('@/data/conditions/proms/lefs.json'),
  koos: () => import('@/data/conditions/proms/koos.json'),
  prtee: () => import('@/data/conditions/proms/prtee.json'),
  hoos: () => import('@/data/conditions/proms/hoos.json'),
  nprs: () => import('@/data/conditions/proms/nprs.json'),
  ikdc: () => import('@/data/conditions/proms/ikdc.json'),
  visaa: () => import('@/data/conditions/proms/visaa.json'),
  visap: () => import('@/data/conditions/proms/visap.json'),
  womac: () => import('@/data/conditions/proms/womac.json'),
  prwe: () => import('@/data/conditions/proms/prwe.json'),
  rmdq: () => import('@/data/conditions/proms/rmdq.json'),
  sf36: () => import('@/data/conditions/proms/sf36.json'),
  sgrq: () => import('@/data/conditions/proms/sgrq.json'),
  srs22: () => import('@/data/conditions/proms/srs22.json'),
  tsk: () => import('@/data/conditions/proms/tsk.json'),
  tegner: () => import('@/data/conditions/proms/tegner.json'),
  haqdi: () => import('@/data/conditions/proms/haqdi.json'),
  hit6: () => import('@/data/conditions/proms/hit6.json'),
  lysholm: () => import('@/data/conditions/proms/lysholm.json'),
  pfdi20: () => import('@/data/conditions/proms/pfdi20.json'),
  wosi: () => import('@/data/conditions/proms/wosi.json'),
  qualeffo41: () => import('@/data/conditions/proms/qualeffo41.json'),
  dash: () => import('@/data/conditions/proms/dash.json'),
  ases: () => import('@/data/conditions/proms/ases.json'),
  abc: () => import('@/data/conditions/proms/abc.json'),
  barthel: () => import('@/data/conditions/proms/barthel.json'),
  bctq: () => import('@/data/conditions/proms/bctq.json'),
  berg: () => import('@/data/conditions/proms/berg.json'),
  cait: () => import('@/data/conditions/proms/cait.json'),
  constant: () => import('@/data/conditions/proms/constant.json'),
  cpaq: () => import('@/data/conditions/proms/cpaq.json'),
  dhi: () => import('@/data/conditions/proms/dhi.json'),
  dsq: () => import('@/data/conditions/proms/dsq.json'),
  eq5d: () => import('@/data/conditions/proms/eq5d.json'),
  faam: () => import('@/data/conditions/proms/faam.json'),
  fim: () => import('@/data/conditions/proms/fim.json'),
  fiq: () => import('@/data/conditions/proms/fiq.json'),
  fsfi: () => import('@/data/conditions/proms/fsfi.json'),
  jfls: () => import('@/data/conditions/proms/jfls.json'),
  lymqol: () => import('@/data/conditions/proms/lymqol.json'),
  pcs: () => import('@/data/conditions/proms/pcs.json'),
  ffi: () => import('@/data/conditions/proms/ffi.json'),
  fhsq: () => import('@/data/conditions/proms/fhsq.json'),
}

export interface PROMQuestion {
  id: string
  question: string
  ui_component: 'slider' | 'single_choice'
  required?: boolean
  order: number
  min?: number
  max?: number
  step?: number
  labels?: Record<string, string>
  options?: { value: string; label: string; score: number }[]
}

export interface PROMSection {
  id: string
  title: string
  description?: string
  subscale?: string
  questions: PROMQuestion[]
}

export interface PROMData {
  prom_id: string
  full_name: string
  total_items: number
  estimated_time_minutes: number
  description: string
  instructions: string
  scoring: {
    method: string
    subscales?: { id: string; name: string; items: number; calculation: string }[]
    total_score: {
      min: number
      max: number
      calculation: string
      interpretation: Record<string, string>
      higher_is_worse: boolean
      mcid?: number
    }
  }
  sections: PROMSection[]
}

export function getPromFileKey(itemKey: string): string | null {
  return ITEM_KEY_TO_PROM_FILE[itemKey] || null
}

export async function loadPROM(itemKey: string): Promise<PROMData | null> {
  const fileKey = ITEM_KEY_TO_PROM_FILE[itemKey]
  if (!fileKey) return null
  const importFn = PROM_IMPORTS[fileKey]
  if (!importFn) return null
  try {
    const module = await importFn()
    return (module.default || module) as PROMData
  } catch {
    return null
  }
}

export function hasQuestionnaire(itemKey: string): boolean {
  return itemKey in ITEM_KEY_TO_PROM_FILE
}
