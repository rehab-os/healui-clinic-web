import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import '../fonts'
import { colors, fontSize, spacing } from '../theme'
import TxPlanHeader from '../shared/TxPlanHeader'
import PageFooter from '../shared/PageFooter'
import SectionHeader from '../shared/SectionHeader'
import PatientInfoCard from '../shared/PatientInfoCard'
import ExerciseTable from '../shared/ExerciseTable'
import InfoRow from '../shared/InfoRow'
import TherapistSignatureBlock from '../shared/TherapistSignatureBlock'
import type { TxPlanData, TxProtocolData, TxProtocolPhase, TxProtocolExercise } from './types'

// ── Props ────────────────────────────────────────────────────────

interface TxPlanPDFProps {
  data: TxPlanData
  signatureBase64: string | null
  clinicLogoBase64: string | null
}

// ── Styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: fontSize.body,
    color: colors.gray700,
    paddingTop: 100,          // room for fixed header (taller than clinical report)
    paddingBottom: spacing.page.bottom,
    paddingHorizontal: spacing.page.left,
  },
  // Visit summary
  visitGrid: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  visitCol: { flex: 1 },
  chiefComplaintBox: {
    backgroundColor: colors.amberLight,
    border: `0.5pt solid ${colors.amberBorder}`,
    borderRadius: 3,
    padding: 8,
    marginTop: 6,
  },
  chiefComplaintLabel: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.small,
    color: colors.gray700,
    marginBottom: 3,
  },
  chiefComplaintText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray600,
  },
  // Condition header
  conditionHeader: {
    backgroundColor: colors.teal,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  conditionName: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: fontSize.heading,
    color: colors.white,
  },
  conditionBadge: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.tiny,
    color: colors.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  conditionDetail: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray600,
    marginTop: 4,
    paddingLeft: 4,
  },
  // Protocol
  subsectionLabel: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body + 1,
    color: colors.gray700,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  protocolTitle: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body + 1,
    color: colors.gray900,
    marginTop: 2,
    marginBottom: 2,
  },
  protocolMeta: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray500,
    marginBottom: 4,
  },
  goalLabel: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.small,
    color: colors.gray700,
    marginTop: 4,
    marginBottom: 2,
  },
  goalItem: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray600,
    paddingLeft: 8,
    marginBottom: 1,
  },
  // Nutrition tables
  nutritionTable: {
    marginTop: 4,
    borderRadius: 3,
    overflow: 'hidden',
    border: `0.5pt solid ${colors.gray200}`,
  },
  nutritionHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  nutritionRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `0.5pt solid ${colors.gray200}`,
  },
  nutritionRowAlt: {
    backgroundColor: colors.gray50,
  },
  nutritionHeaderCell: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.small,
    color: colors.white,
  },
  nutritionCell: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray700,
  },
  nutritionCellBold: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: fontSize.small,
    color: colors.gray900,
  },
  colItem: { width: '26%' },
  colQty: { width: '16%' },
  colFreq: { width: '16%' },
  colReason: { width: '42%' },
  colAvoidItem: { width: '30%' },
  colAvoidReason: { width: '70%' },
  // Guidelines
  guidelineBox: {
    backgroundColor: colors.gray50,
    borderRadius: 3,
    padding: 8,
    marginTop: 6,
  },
  guidelineLabel: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.small,
    color: colors.gray700,
    marginBottom: 3,
  },
  guidelineText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray600,
  },
  // Contraindications
  contraTable: {
    marginTop: 4,
    borderRadius: 3,
    overflow: 'hidden',
    border: `0.5pt solid ${colors.amberBorder}`,
  },
  contraHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.amber,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  contraRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `0.5pt solid ${colors.gray200}`,
    backgroundColor: colors.amberLight,
  },
  colContraItem: { width: '24%' },
  colContraType: { width: '16%' },
  colContraSev: { width: '16%' },
  colContraReason: { width: '44%' },
  // Phase
  phaseContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  phaseName: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body + 1,
    color: colors.gray900,
  },
  phaseDuration: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: fontSize.small,
    color: colors.gray500,
  },
  phaseGoalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  phaseGoalTag: {
    backgroundColor: colors.tealLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  phaseGoalText: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: fontSize.tiny,
    color: colors.teal,
  },
  // Modality & Manual Therapy tables
  modalityTable: {
    marginTop: 4,
    borderRadius: 3,
    overflow: 'hidden',
    border: `0.5pt solid ${colors.gray200}`,
  },
  modalityHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: colors.amber,
  },
  mtHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: colors.tealDark,
  },
  modalityRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `0.5pt solid ${colors.gray200}`,
  },
  colModalName: { width: '40%' },
  colModalDuration: { width: '25%' },
  colModalFreq: { width: '35%' },
  colMtTechnique: { width: '36%' },
  colMtFreq: { width: '32%' },
  colMtDuration: { width: '32%' },
  emptyPhaseText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray400,
    paddingLeft: 4,
    marginBottom: 4,
  },
  // Notes
  notesBox: {
    backgroundColor: '#F5F3FF',
    padding: 10,
    borderRadius: 3,
    borderLeft: `3pt solid ${colors.purple}`,
    marginTop: 4,
  },
  notesText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray700,
  },
  // Disclaimer
  disclaimer: {
    marginTop: 16,
    paddingTop: 8,
    borderTop: `0.5pt solid ${colors.gray200}`,
  },
  disclaimerText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 6,
    color: colors.gray400,
    textAlign: 'center',
  },
})

// ── Helpers ──────────────────────────────────────────────────────

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return d
  }
}

const formatVisitType = (t: string) =>
  t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ── Phase-grouped exercise helper ────────────────────────────────

function groupExercisesByPhase(
  exercises: TxProtocolExercise[],
  phases: TxProtocolPhase[],
): Array<{ phase: TxProtocolPhase | null; exercises: TxProtocolExercise[] }> {
  if (phases.length === 0) {
    return [{ phase: null, exercises }]
  }
  return phases.map((phase, phaseIdx) => ({
    phase,
    exercises: exercises.filter(ex => {
      const idx = ex.order_index ?? 0
      return Math.floor(idx / 100) === phaseIdx
    }),
  }))
}

// ── Protocol Section (with phases, modalities, manual therapy) ───

const ProtocolBlock: React.FC<{
  label: string
  protocol: TxProtocolData
  headerColor: string
  defaultFrequency: string
}> = ({ label, protocol, headerColor, defaultFrequency }) => {
  const exercises = protocol.exercises || []
  const phases = protocol.treatment_phases || []
  const modalities = protocol.modalities || []
  const manualTherapy = protocol.manual_therapy || []
  const phaseGroups = groupExercisesByPhase(exercises, phases)

  return (
    <View>
      <Text style={s.subsectionLabel}>{label}</Text>
      <Text style={s.protocolTitle}>{protocol.protocol_title}</Text>
      {protocol.program_duration_weeks != null && (
        <Text style={s.protocolMeta}>Duration: {protocol.program_duration_weeks} weeks</Text>
      )}

      {/* Top-level goals (only if no phases — otherwise goals are per-phase) */}
      {phases.length === 0 && protocol.goals && protocol.goals.length > 0 && (
        <View>
          <Text style={s.goalLabel}>Treatment Goals:</Text>
          {protocol.goals.map((g, i) => (
            <Text key={i} style={s.goalItem}>- {g}</Text>
          ))}
        </View>
      )}

      {/* Phase-grouped exercises */}
      {phaseGroups.map((group, gi) => (
        <View key={gi} style={s.phaseContainer}>
          {group.phase && (
            <View wrap={false}>
              <View style={s.phaseHeader}>
                <Text style={s.phaseName}>{group.phase.phaseName}</Text>
                <Text style={s.phaseDuration}>{group.phase.durationWeeks}w</Text>
              </View>
              {group.phase.goals && group.phase.goals.length > 0 && (
                <View style={s.phaseGoalRow}>
                  {group.phase.goals.map((g, gIdx) => (
                    <View key={gIdx} style={s.phaseGoalTag}>
                      <Text style={s.phaseGoalText}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          {group.exercises.length > 0 ? (
            <ExerciseTable
              exercises={group.exercises}
              headerColor={headerColor}
              defaultFrequency={defaultFrequency}
            />
          ) : group.phase ? (
            <Text style={s.emptyPhaseText}>No exercises in this phase</Text>
          ) : null}
        </View>
      ))}

      {/* Modalities */}
      {modalities.length > 0 && (
        <View wrap={false}>
          <Text style={s.subsectionLabel}>Modalities</Text>
          <View style={s.modalityTable}>
            <View style={s.modalityHeaderRow}>
              <Text style={[s.nutritionHeaderCell, s.colModalName]}>Modality</Text>
              <Text style={[s.nutritionHeaderCell, s.colModalDuration]}>Duration</Text>
              <Text style={[s.nutritionHeaderCell, s.colModalFreq]}>Frequency</Text>
            </View>
            {modalities.map((mod, mi) => (
              <View key={mi} style={[s.modalityRow, mi % 2 === 1 ? s.nutritionRowAlt : undefined]}>
                <Text style={[s.nutritionCellBold, s.colModalName]}>{mod.modalityName}</Text>
                <Text style={[s.nutritionCell, s.colModalDuration]}>{mod.duration}</Text>
                <Text style={[s.nutritionCell, s.colModalFreq]}>{mod.frequency}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Manual Therapy */}
      {manualTherapy.length > 0 && (
        <View wrap={false}>
          <Text style={s.subsectionLabel}>Manual Therapy</Text>
          <View style={s.modalityTable}>
            <View style={s.mtHeaderRow}>
              <Text style={[s.nutritionHeaderCell, s.colMtTechnique]}>Technique</Text>
              <Text style={[s.nutritionHeaderCell, s.colMtFreq]}>Frequency</Text>
              <Text style={[s.nutritionHeaderCell, s.colMtDuration]}>Duration</Text>
            </View>
            {manualTherapy.map((mt, mi) => (
              <View key={mi} style={[s.modalityRow, mi % 2 === 1 ? s.nutritionRowAlt : undefined]}>
                <Text style={[s.nutritionCellBold, s.colMtTechnique]}>{mt.technique}</Text>
                <Text style={[s.nutritionCell, s.colMtFreq]}>{mt.frequency}</Text>
                <Text style={[s.nutritionCell, s.colMtDuration]}>{mt.sessionDuration}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

// ── Nutrition Table ──────────────────────────────────────────────

const NutritionTable: React.FC<{
  items: Array<{ item: string; quantity?: string; frequency?: string; reason: string }>
  headerBg: string
  columns: 'full' | 'simple'
  title: string
}> = ({ items, headerBg, columns, title }) => (
  <View wrap={false}>
    <Text style={s.subsectionLabel}>{title}</Text>
    <View style={s.nutritionTable}>
      <View style={[s.nutritionHeaderRow, { backgroundColor: headerBg }]}>
        {columns === 'full' ? (
          <>
            <Text style={[s.nutritionHeaderCell, s.colItem]}>Item</Text>
            <Text style={[s.nutritionHeaderCell, s.colQty]}>Quantity</Text>
            <Text style={[s.nutritionHeaderCell, s.colFreq]}>Frequency</Text>
            <Text style={[s.nutritionHeaderCell, s.colReason]}>Reason</Text>
          </>
        ) : (
          <>
            <Text style={[s.nutritionHeaderCell, s.colAvoidItem]}>Item</Text>
            <Text style={[s.nutritionHeaderCell, s.colAvoidReason]}>Reason</Text>
          </>
        )}
      </View>
      {items.map((item, i) => (
        <View key={i} style={[s.nutritionRow, i % 2 === 1 ? s.nutritionRowAlt : undefined]}>
          {columns === 'full' ? (
            <>
              <Text style={[s.nutritionCellBold, s.colItem]}>{item.item}</Text>
              <Text style={[s.nutritionCell, s.colQty]}>{item.quantity || '-'}</Text>
              <Text style={[s.nutritionCell, s.colFreq]}>{item.frequency || '-'}</Text>
              <Text style={[s.nutritionCell, s.colReason]}>{item.reason}</Text>
            </>
          ) : (
            <>
              <Text style={[s.nutritionCellBold, s.colAvoidItem]}>{item.item}</Text>
              <Text style={[s.nutritionCell, s.colAvoidReason]}>{item.reason}</Text>
            </>
          )}
        </View>
      ))}
    </View>
  </View>
)

// ── Main Document ────────────────────────────────────────────────

const TxPlanPDF: React.FC<TxPlanPDFProps> = ({ data, signatureBase64, clinicLogoBase64 }) => {
  const shortDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Document
      title={`Tx - ${data.patient.full_name}`}
      author={data.clinic.name}
      subject={`Treatment Plan for ${data.patient.full_name}`}
      creator="HealUI Clinical Platform"
    >
      <Page size="A4" style={s.page}>
        {/* Fixed header */}
        <TxPlanHeader
          clinic={data.clinic}
          clinicLogoBase64={clinicLogoBase64}
          date={shortDate}
        />

        {/* Fixed footer */}
        <PageFooter clinicName={data.clinic.name} generatedDate={data.generatedDate} />

        {/* 1. Patient Information */}
        <SectionHeader title="PATIENT INFORMATION" />
        <PatientInfoCard patient={data.patient} />

        {/* 2. Visit Summary */}
        <SectionHeader title="VISIT SUMMARY" />
        <View style={s.visitGrid}>
          <View style={s.visitCol}>
            <InfoRow label="Visit Date" value={formatDate(data.visit.date)} />
            {data.visit.time && <InfoRow label="Time" value={data.visit.time} />}
          </View>
          <View style={s.visitCol}>
            {data.visit.visit_type && (
              <InfoRow label="Visit Type" value={formatVisitType(data.visit.visit_type)} />
            )}
          </View>
        </View>
        {data.visit.chief_complaint && (
          <View style={s.chiefComplaintBox}>
            <Text style={s.chiefComplaintLabel}>Chief Complaint</Text>
            <Text style={s.chiefComplaintText}>"{data.visit.chief_complaint}"</Text>
          </View>
        )}

        {/* 3. Conditions & Treatment Protocols */}
        {data.conditions.length > 0 && (
          <View>
            <SectionHeader title="CONDITIONS & TREATMENT PLAN" />
            {data.conditions.map((cond, idx) => {
              const protocol = data.protocols.find(
                p => p.condition_name === cond.condition_name,
              )
              return (
                <View key={idx}>
                  <View style={s.conditionHeader} wrap={false}>
                    <Text style={s.conditionName}>
                      {idx + 1}. {cond.condition_name}
                    </Text>
                    {cond.status && (
                      <Text style={s.conditionBadge}>{cond.status}</Text>
                    )}
                  </View>
                  {cond.body_region && (
                    <Text style={s.conditionDetail}>Body Region: {cond.body_region}</Text>
                  )}
                  {cond.chief_complaint && (
                    <Text style={s.conditionDetail}>
                      "{cond.chief_complaint}"
                    </Text>
                  )}

                  {protocol?.home && (
                    <ProtocolBlock
                      label="Home Exercise Protocol"
                      protocol={protocol.home}
                      headerColor={colors.teal}
                      defaultFrequency="Daily"
                    />
                  )}
                  {protocol?.clinical && (
                    <ProtocolBlock
                      label="Clinical Protocol"
                      protocol={protocol.clinical}
                      headerColor={colors.purple}
                      defaultFrequency="Per session"
                    />
                  )}
                </View>
              )
            })}
          </View>
        )}

        {/* 4. Nutrition & Dietary Guidelines */}
        {data.dietaryProfile && (
          <View>
            <SectionHeader title="NUTRITION & DIETARY GUIDELINES" />

            {data.dietaryProfile.recommended_foods && data.dietaryProfile.recommended_foods.length > 0 && (
              <NutritionTable
                title="Recommended Foods"
                items={data.dietaryProfile.recommended_foods}
                headerBg={colors.emerald}
                columns="full"
              />
            )}

            {data.dietaryProfile.foods_to_avoid && data.dietaryProfile.foods_to_avoid.length > 0 && (
              <NutritionTable
                title="Foods to Avoid"
                items={data.dietaryProfile.foods_to_avoid.map(f => ({
                  ...f,
                  quantity: undefined,
                  frequency: undefined,
                }))}
                headerBg={colors.red}
                columns="simple"
              />
            )}

            {data.dietaryProfile.supplements && data.dietaryProfile.supplements.length > 0 && (
              <NutritionTable
                title="Recommended Supplements"
                items={data.dietaryProfile.supplements}
                headerBg={colors.purple}
                columns="full"
              />
            )}

            {data.dietaryProfile.general_guidelines && (
              <View style={s.guidelineBox}>
                <Text style={s.guidelineLabel}>General Guidelines</Text>
                <Text style={s.guidelineText}>{data.dietaryProfile.general_guidelines}</Text>
              </View>
            )}

            {data.dietaryProfile.hydration_guidelines && (
              <View style={s.guidelineBox}>
                <Text style={s.guidelineLabel}>Hydration Guidelines</Text>
                <Text style={s.guidelineText}>{data.dietaryProfile.hydration_guidelines}</Text>
              </View>
            )}
          </View>
        )}

        {/* 5. Contraindications */}
        {data.contraindications && data.contraindications.length > 0 && (
          <View>
            <SectionHeader title="CONTRAINDICATIONS & PRECAUTIONS" />
            <View style={s.contraTable}>
              <View style={s.contraHeaderRow}>
                <Text style={[s.nutritionHeaderCell, s.colContraItem]}>Item</Text>
                <Text style={[s.nutritionHeaderCell, s.colContraType]}>Type</Text>
                <Text style={[s.nutritionHeaderCell, s.colContraSev]}>Severity</Text>
                <Text style={[s.nutritionHeaderCell, s.colContraReason]}>Reason</Text>
              </View>
              {data.contraindications.map((c, i) => (
                <View key={i} style={s.contraRow}>
                  <Text style={[s.nutritionCellBold, s.colContraItem]}>{c.item}</Text>
                  <Text style={[s.nutritionCell, s.colContraType]}>{c.type}</Text>
                  <Text style={[s.nutritionCell, s.colContraSev]}>{c.severity}</Text>
                  <Text style={[s.nutritionCell, s.colContraReason]}>{c.reason}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Additional Notes */}
        {data.notes && (
          <View>
            <SectionHeader title="ADDITIONAL NOTES" />
            <View style={s.notesBox}>
              <Text style={s.notesText}>{data.notes}</Text>
            </View>
          </View>
        )}

        {/* 7. Therapist Signature */}
        <TherapistSignatureBlock
          therapist={data.therapist}
          signatureBase64={signatureBase64}
        />

        {/* 8. Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            This treatment plan is personalised for {data.patient.full_name} and should be followed under professional guidance.
            Do not share this document with unauthorised individuals. For queries, contact the clinic directly.
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default TxPlanPDF
