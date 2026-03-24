import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import '../fonts'
import { colors, fontSize, spacing } from '../theme'
import ClinicHeader from '../shared/ClinicHeader'
import PageFooter from '../shared/PageFooter'
import SectionHeader from '../shared/SectionHeader'
import InfoRow from '../shared/InfoRow'

// ── Types ─────────────────────────────────────────────────────────

export interface ImagingReferralData {
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
  condition_name: string
  chief_complaint?: string
  imagingOrders: Array<{
    modality: string
    label: string
    indication_label: string
    referral_text: string
    urgency: string
    ordered_at: string
  }>
}

// ── Styles ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: fontSize.body,
    paddingTop: 75,
    paddingBottom: 50,
    paddingHorizontal: 40,
    color: colors.gray700,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 18,
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: spacing.section,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.large,
  },
  dateText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray600,
  },
  orderCard: {
    border: `1pt solid ${colors.gray300}`,
    borderRadius: 4,
    marginBottom: spacing.medium,
    overflow: 'hidden',
  },
  orderHeader: {
    backgroundColor: colors.gray50,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `0.5pt solid ${colors.gray300}`,
  },
  orderModality: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: fontSize.body + 1,
    color: colors.gray900,
  },
  urgencyBadge: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.tiny,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgencyRoutine: {
    backgroundColor: colors.gray100,
    color: colors.gray600,
  },
  urgencyUrgent: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  urgencyEmergency: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  orderBody: {
    padding: 10,
  },
  orderLabel: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body,
    color: colors.gray800,
    marginBottom: 4,
  },
  orderIndication: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray600,
    marginBottom: 8,
  },
  referralText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray700,
    lineHeight: 1.5,
    backgroundColor: colors.gray50,
    padding: 8,
    borderRadius: 3,
  },
  clinicalContext: {
    marginTop: spacing.medium,
  },
  patientInstruction: {
    marginTop: spacing.section,
    padding: 10,
    backgroundColor: colors.gray50,
    border: `0.5pt solid ${colors.gray300}`,
    borderRadius: 4,
  },
  instructionTitle: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body,
    color: colors.gray700,
    marginBottom: 4,
  },
  instructionText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray600,
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 16,
    borderTop: `1pt solid ${colors.gray200}`,
  },
  signatureLine: {
    width: '50%',
    borderBottom: `1pt dashed ${colors.gray400}`,
    height: 30,
    marginBottom: 4,
  },
  sigName: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: fontSize.body + 1,
    color: colors.gray900,
  },
  sigTitle: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray500,
    marginTop: 2,
  },
  sigLicense: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: fontSize.small,
    color: colors.teal,
    marginTop: 2,
  },
})

// ── Component ─────────────────────────────────────────────────────

const ImagingReferralPDF: React.FC<{ data: ImagingReferralData }> = ({ data }) => {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const genderLabel = (g?: string) =>
    g === 'M' ? 'Male' : g === 'F' ? 'Female' : g || undefined

  const urgencyStyle = (u: string) => {
    if (u === 'emergency') return s.urgencyEmergency
    if (u === 'urgent') return s.urgencyUrgent
    return s.urgencyRoutine
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <ClinicHeader
          clinic={data.clinic}
          date={today}
          physiotherapist={data.physiotherapist.full_name}
        />

        <Text style={s.title}>IMAGING REFERRAL</Text>
        <Text style={s.subtitle}>Physiotherapy Diagnostic Imaging Request</Text>

        <View style={s.dateRow}>
          <Text style={s.dateText}>Date: {today}</Text>
          <Text style={s.dateText}>Ref: IMR-{Date.now().toString(36).toUpperCase()}</Text>
        </View>

        {/* Patient Info */}
        <SectionHeader title="PATIENT INFORMATION" />
        <View style={{ marginTop: spacing.small }}>
          <InfoRow label="Patient Name" value={data.patient.full_name} labelWidth={100} />
          <InfoRow label="Date of Birth" value={data.patient.date_of_birth} labelWidth={100} />
          <InfoRow label="Gender" value={genderLabel(data.patient.gender)} labelWidth={100} />
          <InfoRow label="Phone" value={data.patient.phone} labelWidth={100} />
        </View>

        {/* Clinical Context */}
        <SectionHeader title="CLINICAL CONTEXT" />
        <View style={[s.clinicalContext, { marginTop: spacing.small }]}>
          <InfoRow label="Working Dx" value={data.condition_name} labelWidth={100} />
          {data.chief_complaint && (
            <InfoRow label="Complaint" value={data.chief_complaint} labelWidth={100} />
          )}
        </View>

        {/* Imaging Orders */}
        <SectionHeader title="IMAGING REQUESTED" />
        {data.imagingOrders.map((order, i) => (
          <View key={i} style={s.orderCard} wrap={false}>
            <View style={s.orderHeader}>
              <Text style={s.orderModality}>{order.modality}</Text>
              <Text style={[s.urgencyBadge, urgencyStyle(order.urgency)]}>{order.urgency}</Text>
            </View>
            <View style={s.orderBody}>
              <Text style={s.orderLabel}>{order.label}</Text>
              <Text style={s.orderIndication}>{order.indication_label}</Text>
              <Text style={s.referralText}>{order.referral_text}</Text>
            </View>
          </View>
        ))}

        {/* Patient Instruction */}
        <View style={s.patientInstruction} wrap={false}>
          <Text style={s.instructionTitle}>Patient Instructions</Text>
          <Text style={s.instructionText}>
            Please present this referral letter at your diagnostic imaging centre.
            Share the results with your treating physiotherapist as soon as they
            are available to complete your assessment.
          </Text>
        </View>

        {/* Referring Therapist */}
        <View style={s.signatureSection} wrap={false}>
          <View style={s.signatureLine} />
          <Text style={s.sigName}>{data.physiotherapist.full_name}</Text>
          <Text style={s.sigTitle}>Referring Physiotherapist</Text>
          {data.physiotherapist.license_number && (
            <Text style={s.sigLicense}>Lic: {data.physiotherapist.license_number}</Text>
          )}
          {data.clinic.phone && (
            <Text style={s.sigTitle}>Contact: {data.clinic.phone}</Text>
          )}
        </View>

        <PageFooter clinicName={data.clinic.name} generatedDate={today} />
      </Page>
    </Document>
  )
}

export default ImagingReferralPDF
