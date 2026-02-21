import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import '../fonts'
import { colors, fontSize, spacing } from '../theme'
import ClinicHeader from '../shared/ClinicHeader'
import PageFooter from '../shared/PageFooter'
import SectionHeader from '../shared/SectionHeader'
import PatientInfoCard from '../shared/PatientInfoCard'
import ExerciseTable from '../shared/ExerciseTable'
import InfoRow from '../shared/InfoRow'

// ── Types ─────────────────────────────────────────────────────────

export interface ClinicalReportData {
  patient: {
    full_name: string
    date_of_birth?: string
    gender?: string
    phone?: string
    email?: string
    allergies?: string[]
    current_medications?: string[]
    medical_history?: string[]
  }
  appointment: {
    scheduled_date: string
    scheduled_time: string
    visit_type: string
    status: string
    chief_complaint?: string
  }
  clinic: {
    name: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    email?: string
  }
  physiotherapist: {
    full_name: string
    license_number?: string
  }
  visitConditions: Array<{
    id: string
    condition_name: string
    body_region?: string
    treatment_focus?: string
    chief_complaint?: string
    condition?: { status: string }
  }>
  clinicalInsights?: Array<{
    insight_text: string
    insight_type: string
    pain_level?: number
    rom_measurements?: Record<string, number>
    functional_status?: string
    current_goals?: string[]
    created_at: string
  }>
  protocols: Record<string, {
    home?: ProtocolData
    clinical?: ProtocolData
  }>
  dietaryProfile?: {
    recommended_foods?: Array<{ item: string; quantity?: string; frequency?: string; reason: string }>
    foods_to_avoid?: Array<{ item: string; reason: string }>
    supplements?: Array<{ item: string; quantity?: string; frequency?: string; reason: string }>
    hydration_guidelines?: string
    general_guidelines?: string
  }
  contraindications?: Array<{ item: string; type: string; reason: string; severity: string }>
}

interface ProtocolData {
  protocol_title: string
  goals?: string[]
  exercises?: Array<{
    exercise_name: string
    exercise_description?: string
    custom_sets: number
    custom_reps: number
    custom_duration_seconds: number
    frequency?: string
  }>
  program_duration_weeks?: number
}

// ── Styles ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: fontSize.body,
    color: colors.gray700,
    paddingTop: spacing.page.top,
    paddingBottom: spacing.page.bottom,
    paddingHorizontal: spacing.page.left,
  },
  // Visit details
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
    color: colors.gray700,
    fontStyle: 'italic',
  },
  // Clinical insights
  insightBox: {
    backgroundColor: colors.gray50,
    borderRadius: 3,
    padding: 8,
    marginBottom: 6,
    border: `0.5pt solid ${colors.gray200}`,
  },
  insightType: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.small,
    color: colors.teal,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  insightText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray700,
  },
  insightMeta: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: 3,
  },
  // Condition
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
  protocolTitle: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body + 1,
    color: colors.gray900,
    marginTop: 8,
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
  // Nutrition
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
  // Subsection label (e.g. "Home Exercise Protocol")
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
})

// ── Helpers ───────────────────────────────────────────────────────

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return d
  }
}

const formatVisitType = (t: string) => t.replace(/_/g, ' ')

// ── Protocol section ─────────────────────────────────────────────

const ProtocolSection: React.FC<{
  label: string
  protocol: ProtocolData
  headerColor: string
  defaultFrequency: string
}> = ({ label, protocol, headerColor, defaultFrequency }) => (
  <View wrap={false}>
    <Text style={s.subsectionLabel}>{label}</Text>
    <Text style={s.protocolTitle}>{protocol.protocol_title}</Text>
    {protocol.program_duration_weeks && (
      <Text style={s.protocolMeta}>Duration: {protocol.program_duration_weeks} weeks</Text>
    )}
    {protocol.goals && protocol.goals.length > 0 && (
      <View>
        <Text style={s.goalLabel}>Treatment Goals:</Text>
        {protocol.goals.map((g, i) => (
          <Text key={i} style={s.goalItem}>- {g}</Text>
        ))}
      </View>
    )}
    {protocol.exercises && protocol.exercises.length > 0 && (
      <ExerciseTable
        exercises={protocol.exercises}
        headerColor={headerColor}
        defaultFrequency={defaultFrequency}
      />
    )}
  </View>
)

// ── Nutrition table helper ───────────────────────────────────────

const NutritionItemTable: React.FC<{
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

// ── Main Document ─────────────────────────────────────────────────

const ClinicalReportPDF: React.FC<{ data: ClinicalReportData }> = ({ data }) => {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const shortDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Document
      title="Clinical Assessment Report"
      author={data.clinic.name}
      subject={`Report for ${data.patient.full_name}`}
      creator="HealUI EMR System"
    >
      <Page size="A4" style={s.page}>
        {/* Fixed header & footer */}
        <ClinicHeader
          clinic={data.clinic}
          date={shortDate}
          physiotherapist={data.physiotherapist.full_name}
        />
        <PageFooter clinicName={data.clinic.name} generatedDate={generatedDate} />

        {/* 1. Patient Information */}
        <SectionHeader title="PATIENT INFORMATION" />
        <PatientInfoCard patient={data.patient} />

        {/* 2. Visit Details */}
        <SectionHeader title="VISIT DETAILS" />
        <View style={s.visitGrid}>
          <View style={s.visitCol}>
            <InfoRow label="Visit Date" value={formatDate(data.appointment.scheduled_date)} />
            <InfoRow label="Visit Time" value={data.appointment.scheduled_time} />
          </View>
          <View style={s.visitCol}>
            <InfoRow label="Visit Type" value={formatVisitType(data.appointment.visit_type)} />
            <InfoRow label="Status" value={formatVisitType(data.appointment.status)} />
          </View>
        </View>
        {data.appointment.chief_complaint && (
          <View style={s.chiefComplaintBox}>
            <Text style={s.chiefComplaintLabel}>Chief Complaint</Text>
            <Text style={s.chiefComplaintText}>"{data.appointment.chief_complaint}"</Text>
          </View>
        )}

        {/* 3. Clinical Assessment */}
        {data.clinicalInsights && data.clinicalInsights.length > 0 && (
          <View>
            <SectionHeader title="CLINICAL ASSESSMENT" />
            {data.clinicalInsights.map((insight, i) => (
              <View key={i} style={s.insightBox} wrap={false}>
                <Text style={s.insightType}>{insight.insight_type.replace(/_/g, ' ')}</Text>
                <Text style={s.insightText}>{insight.insight_text}</Text>
                {insight.pain_level !== undefined && (
                  <Text style={s.insightMeta}>Pain Level: {insight.pain_level}/10</Text>
                )}
                {insight.functional_status && (
                  <Text style={s.insightMeta}>Functional Status: {insight.functional_status}</Text>
                )}
                {insight.current_goals && insight.current_goals.length > 0 && (
                  <View>
                    <Text style={s.goalLabel}>Goals:</Text>
                    {insight.current_goals.map((g, gi) => (
                      <Text key={gi} style={s.goalItem}>- {g}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 4. Conditions & Treatment Plan */}
        <SectionHeader title="CONDITIONS & TREATMENT PLAN" />
        {data.visitConditions.map((vc, idx) => {
          const protocols = data.protocols[vc.id]
          return (
            <View key={vc.id}>
              <View style={s.conditionHeader} wrap={false}>
                <Text style={s.conditionName}>
                  {idx + 1}. {vc.condition_name}
                </Text>
                {vc.condition?.status && (
                  <Text style={s.conditionBadge}>{vc.condition.status}</Text>
                )}
              </View>
              {vc.body_region && (
                <Text style={s.conditionDetail}>Body Region: {vc.body_region}</Text>
              )}
              {vc.chief_complaint && (
                <Text style={[s.conditionDetail, { fontStyle: 'italic' }]}>
                  "{vc.chief_complaint}"
                </Text>
              )}

              {protocols?.home && (
                <ProtocolSection
                  label="Home Exercise Protocol"
                  protocol={protocols.home}
                  headerColor={colors.teal}
                  defaultFrequency="Daily"
                />
              )}
              {protocols?.clinical && (
                <ProtocolSection
                  label="Clinical Protocol"
                  protocol={protocols.clinical}
                  headerColor={colors.purple}
                  defaultFrequency="Per session"
                />
              )}
            </View>
          )
        })}

        {/* 5. Nutrition & Dietary Guidelines */}
        {data.dietaryProfile && (
          <View>
            <SectionHeader title="NUTRITION & DIETARY GUIDELINES" />

            {data.dietaryProfile.recommended_foods && data.dietaryProfile.recommended_foods.length > 0 && (
              <NutritionItemTable
                title="Recommended Foods"
                items={data.dietaryProfile.recommended_foods}
                headerBg={colors.emerald}
                columns="full"
              />
            )}

            {data.dietaryProfile.foods_to_avoid && data.dietaryProfile.foods_to_avoid.length > 0 && (
              <NutritionItemTable
                title="Foods to Avoid"
                items={data.dietaryProfile.foods_to_avoid.map(f => ({ ...f, quantity: undefined, frequency: undefined }))}
                headerBg={colors.red}
                columns="simple"
              />
            )}

            {data.dietaryProfile.supplements && data.dietaryProfile.supplements.length > 0 && (
              <NutritionItemTable
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

        {/* 6. Contraindications */}
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
      </Page>
    </Document>
  )
}

export default ClinicalReportPDF
