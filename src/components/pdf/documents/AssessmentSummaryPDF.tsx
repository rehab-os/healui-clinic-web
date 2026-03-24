import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import '../fonts'
import { colors, spacing } from '../theme'
import ClinicHeader from '../shared/ClinicHeader'
import PageFooter from '../shared/PageFooter'

// ── Types ─────────────────────────────────────────────────────────

export interface AssessmentSummaryData {
  patient: {
    full_name: string
    date_of_birth?: string
    gender?: string
    phone?: string
  }
  clinic: {
    name: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  }
  physiotherapist: {
    full_name: string
    license_number?: string
  }
  condition: {
    condition_name: string
    chief_complaint?: string
    vas_score?: number
    urgency_level?: string
    diagnosis_status?: string
    provisional_diagnosis?: {
      condition_name: string
      source: 'DIFFERENTIAL' | 'MANUAL'
      set_at: string
    }
    clinical_dx_data?: {
      responses?: Record<string, any>
      red_flags_detected?: string[]
      selected_pain_regions?: string[]
    }
    clinical_assessments_data?: Array<{
      assessment_name: string
      category: string
      form_data: any
      findings_summary?: string
    }>
    clinical_dx_differential?: {
      conditions: Array<{
        condition_name: string
        confidence_score: number
        supporting_evidence: string[]
      }>
    }
    imaging_orders?: Array<{
      modality: string
      label: string
      indication_label: string
      urgency: string
      ordered_at: string
    }>
  }
}

// ── Styles — clean clinical report ────────────────────────────────

const t = {
  font: 'Inter',
  // Muted clinical palette
  ink: '#1F2937',       // primary text
  secondary: '#4B5563', // labels, secondary text
  muted: '#9CA3AF',     // hints, dates
  rule: '#E5E7EB',      // thin separators
  bg: '#F9FAFB',        // subtle background
  teal: '#0D9488',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  amberBorder: '#FDE68A',
  redText: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FECACA',
} as const

const s = StyleSheet.create({
  page: {
    fontFamily: t.font,
    fontSize: 9,
    paddingTop: 74,
    paddingBottom: 48,
    paddingHorizontal: 40,
    color: t.secondary,
    lineHeight: 1.5,
  },

  // ── Title block ──
  titleBar: {
    borderBottom: `1.5pt solid ${t.teal}`,
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: {
    fontFamily: t.font,
    fontWeight: 700,
    fontSize: 14,
    color: t.ink,
    letterSpacing: 0.3,
  },
  titleStatus: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 8,
    color: t.muted,
    marginTop: 3,
  },

  // ── Section labels ──
  sectionLabel: {
    fontFamily: t.font,
    fontWeight: 600,
    fontSize: 8,
    color: t.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
  },
  rule: {
    borderBottom: `0.5pt solid ${t.rule}`,
    marginBottom: 8,
  },

  // ── Patient info ──
  patientRow: {
    flexDirection: 'row' as const,
    marginBottom: 3,
  },
  patientLabel: {
    fontFamily: t.font,
    fontWeight: 500,
    fontSize: 8,
    color: t.muted,
    width: 55,
  },
  patientValue: {
    fontFamily: t.font,
    fontWeight: 500,
    fontSize: 9,
    color: t.ink,
    flex: 1,
  },

  // ── Provisional ──
  provisionalStrip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderLeft: `3pt solid ${t.amber}`,
    backgroundColor: t.amberBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  provisionalTag: {
    fontFamily: t.font,
    fontWeight: 700,
    fontSize: 7,
    color: t.amber,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginRight: 8,
  },
  provisionalName: {
    fontFamily: t.font,
    fontWeight: 600,
    fontSize: 10,
    color: '#92400E',
  },

  // ── Narrative paragraph (subjective) ──
  narrative: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 9,
    color: t.secondary,
    lineHeight: 1.6,
    marginBottom: 10,
  },

  // ── VAS inline ──
  vasInline: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 6,
  },
  vasTrack: {
    width: 80,
    height: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  vasFill: {
    height: 5,
    borderRadius: 3,
  },
  vasText: {
    fontFamily: t.font,
    fontWeight: 600,
    fontSize: 9,
  },

  // ── Red flag strip ──
  redFlagStrip: {
    borderLeft: `3pt solid ${t.redText}`,
    backgroundColor: t.redBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  redFlagLabel: {
    fontFamily: t.font,
    fontWeight: 700,
    fontSize: 7,
    color: t.redText,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  redFlagText: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 8,
    color: '#991B1B',
  },

  // ── Objective table ──
  tableRow: {
    flexDirection: 'row' as const,
    borderBottom: `0.5pt solid ${t.rule}`,
    paddingVertical: 3,
  },
  tableLabel: {
    fontFamily: t.font,
    fontWeight: 500,
    fontSize: 8,
    color: t.secondary,
    width: '45%',
  },
  tableValue: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 9,
    color: t.ink,
    width: '55%',
  },

  // ── Differential ──
  diffItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 4,
    borderBottom: `0.5pt solid ${t.rule}`,
  },
  diffRank: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 7,
    color: t.muted,
    width: 14,
  },
  diffName: {
    fontFamily: t.font,
    fontWeight: 500,
    fontSize: 9,
    color: t.ink,
    flex: 1,
  },
  diffBar: {
    width: 50,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginHorizontal: 6,
  },
  diffBarFill: {
    height: 4,
    backgroundColor: t.teal,
    borderRadius: 2,
  },
  diffPct: {
    fontFamily: t.font,
    fontWeight: 600,
    fontSize: 8,
    color: t.teal,
    width: 28,
    textAlign: 'right' as const,
  },
  diffEvidence: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 7,
    color: t.muted,
    marginLeft: 14,
    marginBottom: 3,
  },

  // ── Imaging ──
  imagingRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    borderBottom: `0.5pt solid ${t.rule}`,
    paddingVertical: 5,
  },
  imagingBadge: {
    fontFamily: t.font,
    fontWeight: 700,
    fontSize: 7,
    color: '#FFFFFF',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
    marginTop: 1,
  },
  imagingBody: {
    flex: 1,
  },
  imagingTitle: {
    fontFamily: t.font,
    fontWeight: 600,
    fontSize: 9,
    color: t.ink,
  },
  imagingDetail: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 8,
    color: t.secondary,
    marginTop: 1,
  },
  imagingMeta: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 7,
    color: t.muted,
    marginTop: 2,
  },

  // ── Signature ──
  sigBlock: {
    marginTop: 28,
    paddingTop: 12,
    borderTop: `0.5pt solid ${t.rule}`,
  },
  sigLine: {
    width: '35%',
    borderBottom: `1pt dashed ${t.muted}`,
    height: 20,
    marginBottom: 4,
  },
  sigName: {
    fontFamily: t.font,
    fontWeight: 700,
    fontSize: 10,
    color: t.ink,
  },
  sigRole: {
    fontFamily: t.font,
    fontWeight: 400,
    fontSize: 8,
    color: t.muted,
    marginTop: 1,
  },
})

// ── Helpers ───────────────────────────────────────────────────────

const tc = (s?: any): string => {
  if (!s) return ''
  if (Array.isArray(s)) return s.map(tc).join(', ')
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const fmtLoc = (loc: any): string => {
  if (!loc) return ''
  const arr = Array.isArray(loc) ? loc : [loc]
  return arr.map((l: any) => {
    if (typeof l === 'object' && l?.mainRegion) {
      const side = l.laterality && l.laterality !== 'center' ? ` (${l.laterality})` : ''
      return l.mainRegion.replace(/_/g, ' ').replace(/-/g, ' ') + side
    }
    return String(l)
  }).join(', ')
}

const vasColor = (v: number) => v <= 3 ? '#22C55E' : v <= 6 ? '#F59E0B' : '#EF4444'

const modalityColor = (m: string) => {
  const l = m.toLowerCase()
  if (l.includes('mri')) return '#0D9488'
  if (l.includes('x-ray') || l.includes('xray')) return '#3B82F6'
  if (l.includes('ct')) return '#F97316'
  if (l.includes('ultrasound')) return '#8B5CF6'
  return '#6B7280'
}

const genderLabel = (g?: string) => g === 'M' ? 'Male' : g === 'F' ? 'Female' : g || ''

// ── Build subjective narrative ────────────────────────────────────

const buildSubjectiveNarrative = (r: Record<string, any>, cc?: string): string => {
  const parts: string[] = []

  if (cc) parts.push(`Patient presents with ${cc}.`)

  const loc = fmtLoc(r.pain_location)
  if (loc) parts.push(`Pain localised to ${loc}.`)

  const onset = r.onset_nature ? tc(r.onset_nature).toLowerCase() : ''
  const duration = r.symptom_onset ? `since ${new Date(r.symptom_onset).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''
  if (onset || duration) parts.push(`Onset: ${[onset, duration].filter(Boolean).join(', ')}.`)

  const nature = r.pain_nature ? tc(r.pain_nature).toLowerCase() : ''
  if (nature) parts.push(`Pain described as ${nature}.`)

  if (r.pain_radiation) {
    const pattern = r.radiation_pattern ? ` to ${tc(r.radiation_pattern).toLowerCase()}` : ''
    parts.push(`Radiating pain reported${pattern}.`)
  }

  const agg = Array.isArray(r.aggravating_factors) ? r.aggravating_factors.join(', ') : r.aggravating_factors
  if (agg) parts.push(`Aggravated by: ${agg}.`)

  const ease = Array.isArray(r.easing_factors) ? r.easing_factors.join(', ') : r.easing_factors
  if (ease) parts.push(`Eased by: ${ease}.`)

  const beh = r.behavior_24hr || r['24h_behavior']
  if (beh) parts.push(`24-hour behaviour: ${tc(beh).toLowerCase()}.`)

  const prog = r.symptom_progression
  if (prog) parts.push(`Symptoms are ${tc(prog).toLowerCase()}.`)

  return parts.join(' ') || 'No subjective history recorded.'
}

// ── Component ─────────────────────────────────────────────────────

const AssessmentSummaryPDF: React.FC<{ data: AssessmentSummaryData }> = ({ data }) => {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const c = data.condition
  const r = c.clinical_dx_data?.responses || {}
  const redFlags = c.clinical_dx_data?.red_flags_detected || []
  const differentials = c.clinical_dx_differential?.conditions || []
  const assessments = c.clinical_assessments_data || []
  const imaging = c.imaging_orders || []

  // Objective findings — dynamic extraction
  const obsEntries = ['obs_swelling', 'obs_posture', 'obs_gait', 'obs_temperature', 'obs_deformity']
    .filter(k => r[k] && !['normal', 'none'].includes(String(r[k]).toLowerCase()))
    .map(k => ({ label: tc(k.replace('obs_', '')), value: tc(r[k]) }))

  const tendEntries = Object.entries(r)
    .filter(([k, v]) => k.startsWith('tend_') && v)
    .map(([k, v]) => ({ label: tc(k.replace('tend_', '')), value: String(v) }))

  const romEntries = Object.entries(r)
    .filter(([k, v]) => k.endsWith('_active') && v != null)
    .map(([k, v]) => ({ label: tc(k.replace('_active', '')), value: String(v) }))

  const hasObjective = obsEntries.length > 0 || tendEntries.length > 0 || romEntries.length > 0 || assessments.length > 0

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <ClinicHeader clinic={data.clinic} date={today} physiotherapist={data.physiotherapist.full_name} />

        {/* ── Title ── */}
        <View style={s.titleBar}>
          <Text style={s.title}>Assessment Summary</Text>
          <Text style={s.titleStatus}>
            {c.diagnosis_status === 'IMAGING_ORDERED'
              ? `Imaging pending · ${today}`
              : `Completed · ${today}`}
          </Text>
        </View>

        {/* ── Patient ── */}
        <View style={{ marginBottom: 10 }}>
          {[
            ['Name', data.patient.full_name],
            ['DOB', data.patient.date_of_birth],
            ['Gender', genderLabel(data.patient.gender)],
            ['Phone', data.patient.phone],
          ].filter(([, v]) => v).map(([label, value]) => (
            <View key={label as string} style={s.patientRow}>
              <Text style={s.patientLabel}>{label}</Text>
              <Text style={s.patientValue}>{value as string}</Text>
            </View>
          ))}
        </View>

        <View style={s.rule} />

        {/* ── VAS + Overview ── */}
        {c.vas_score != null && (
          <View style={s.vasInline}>
            <Text style={[s.patientLabel, { width: 55 }]}>VAS</Text>
            <View style={s.vasTrack}>
              <View style={[s.vasFill, { width: `${(c.vas_score / 10) * 100}%`, backgroundColor: vasColor(c.vas_score) }]} />
            </View>
            <Text style={[s.vasText, { color: vasColor(c.vas_score) }]}>{c.vas_score}/10</Text>
          </View>
        )}

        {/* ── Provisional Diagnosis ── */}
        {c.provisional_diagnosis && (
          <View style={s.provisionalStrip} wrap={false}>
            <Text style={s.provisionalTag}>Provisional</Text>
            <Text style={s.provisionalName}>{c.provisional_diagnosis.condition_name}</Text>
          </View>
        )}

        {/* ── Subjective ── */}
        <Text style={s.sectionLabel}>Subjective</Text>
        <Text style={s.narrative}>
          {buildSubjectiveNarrative(r, c.chief_complaint)}
        </Text>

        {/* ── Red Flags ── */}
        {redFlags.length > 0 && (
          <View style={s.redFlagStrip} wrap={false}>
            <Text style={s.redFlagLabel}>Red Flags</Text>
            <Text style={s.redFlagText}>{redFlags.map(tc).join(' · ')}</Text>
          </View>
        )}

        {/* ── Objective ── */}
        {hasObjective && (
          <>
            <Text style={s.sectionLabel}>Objective</Text>

            {obsEntries.length > 0 && (
              <View style={{ marginBottom: 6 }} wrap={false}>
                {obsEntries.map((e, i) => (
                  <View key={i} style={s.tableRow}>
                    <Text style={s.tableLabel}>{e.label}</Text>
                    <Text style={s.tableValue}>{e.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {tendEntries.length > 0 && (
              <View style={{ marginBottom: 6 }} wrap={false}>
                <Text style={[s.patientLabel, { marginBottom: 3, width: 'auto' }]}>Palpation</Text>
                {tendEntries.map((e, i) => (
                  <View key={i} style={s.tableRow}>
                    <Text style={s.tableLabel}>{e.label}</Text>
                    <Text style={s.tableValue}>Grade {e.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {romEntries.length > 0 && (
              <View style={{ marginBottom: 6 }} wrap={false}>
                <Text style={[s.patientLabel, { marginBottom: 3, width: 'auto' }]}>Range of Motion</Text>
                {romEntries.map((e, i) => (
                  <View key={i} style={s.tableRow}>
                    <Text style={s.tableLabel}>{e.label}</Text>
                    <Text style={s.tableValue}>{e.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {assessments.map((a, i) => (
              <View key={i} style={{ marginBottom: 4 }} wrap={false}>
                <Text style={[s.patientLabel, { width: 'auto', marginBottom: 2 }]}>
                  {a.assessment_name} — {a.category}
                </Text>
                {a.findings_summary && (
                  <Text style={s.narrative}>{a.findings_summary}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* ── Assessment (Differential) ── */}
        {differentials.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Assessment</Text>
            <View style={{ marginBottom: 10 }}>
              {differentials.map((d, i) => {
                const pct = Math.round(d.confidence_score * 100)
                return (
                  <View key={i} wrap={false}>
                    <View style={[s.diffItem, i === 0 ? { borderBottom: `0.5pt solid ${t.teal}` } : {}]}>
                      <Text style={s.diffRank}>{i + 1}.</Text>
                      <Text style={[s.diffName, i === 0 ? { fontWeight: 700, color: t.teal } : {}]}>{d.condition_name}</Text>
                      <View style={s.diffBar}>
                        <View style={[s.diffBarFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={s.diffPct}>{pct}%</Text>
                    </View>
                    {d.supporting_evidence?.length > 0 && (
                      <Text style={s.diffEvidence}>
                        {d.supporting_evidence.slice(0, 3).join(' · ')}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* ── Plan (Imaging) ── */}
        {imaging.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Plan — Imaging Ordered</Text>
            <View style={{ marginBottom: 10 }}>
              {imaging.map((order, i) => (
                <View key={i} style={s.imagingRow} wrap={false}>
                  <Text style={[s.imagingBadge, { backgroundColor: modalityColor(order.modality) }]}>
                    {order.modality}
                  </Text>
                  <View style={s.imagingBody}>
                    <Text style={s.imagingTitle}>{order.label}</Text>
                    <Text style={s.imagingDetail}>{order.indication_label}</Text>
                    <Text style={s.imagingMeta}>
                      {order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)}
                      {order.ordered_at ? ` · ${new Date(order.ordered_at).toLocaleDateString('en-IN')}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Signature ── */}
        <View style={s.sigBlock} wrap={false}>
          <View style={s.sigLine} />
          <Text style={s.sigName}>{data.physiotherapist.full_name}</Text>
          <Text style={s.sigRole}>Assessing Physiotherapist</Text>
          {data.physiotherapist.license_number && (
            <Text style={[s.sigRole, { color: t.teal }]}>Lic: {data.physiotherapist.license_number}</Text>
          )}
        </View>

        <PageFooter clinicName={data.clinic.name} generatedDate={today} />
      </Page>
    </Document>
  )
}

export default AssessmentSummaryPDF
