import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize } from '../theme'

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingTop: 16,
    borderTop: `1pt solid ${colors.gray200}`,
  },
  grid: {
    flexDirection: 'row',
    gap: 40,
  },
  leftCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  signatureImage: {
    height: 36,
    marginBottom: 4,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    height: 36,
    marginBottom: 4,
    borderBottom: `1pt dashed ${colors.gray400}`,
    width: '80%',
  },
  therapistName: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: fontSize.body + 1,
    color: colors.gray900,
  },
  qualifications: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray600,
    marginTop: 1,
  },
  licenseNumber: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: fontSize.small,
    color: colors.teal,
    marginTop: 2,
  },
  specializations: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.tiny,
    color: colors.gray500,
    marginTop: 2,
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray500,
    marginTop: 4,
  },
  patientLine: {
    height: 24,
    borderBottom: `1pt solid ${colors.gray300}`,
    width: '80%',
    marginBottom: 4,
  },
  dateLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  dateLabel: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.small,
    color: colors.gray500,
  },
  dateBlank: {
    width: 120,
    borderBottom: `1pt solid ${colors.gray300}`,
  },
})

const SPECIALIZATION_LABELS: Record<string, string> = {
  ORTHOPEDIC: 'Orthopaedic',
  NEUROLOGICAL: 'Neurological',
  PEDIATRIC: 'Paediatric',
  GERIATRIC: 'Geriatric',
  SPORTS: 'Sports',
  CARDIAC: 'Cardiac',
  PULMONARY: 'Pulmonary',
  WOMEN_HEALTH: "Women's Health",
  PAIN_MANAGEMENT: 'Pain Management',
  REHABILITATION: 'Rehabilitation',
}

interface TherapistSignatureBlockProps {
  therapist: {
    full_name: string
    license_number?: string
    qualifications: string[]
    specializations: string[]
    phone?: string
    email?: string
  }
  signatureBase64: string | null
}

const TherapistSignatureBlock: React.FC<TherapistSignatureBlockProps> = ({
  therapist,
  signatureBase64,
}) => {
  const qualStr = therapist.qualifications.length > 0
    ? therapist.qualifications.join(', ')
    : null

  const specStr = therapist.specializations.length > 0
    ? therapist.specializations
        .map(s => SPECIALIZATION_LABELS[s] || s)
        .join(', ')
    : null

  return (
    <View style={styles.container} wrap={false}>
      <View style={styles.grid}>
        {/* Therapist signature side */}
        <View style={styles.leftCol}>
          {signatureBase64 ? (
            <Image style={styles.signatureImage} src={signatureBase64} />
          ) : (
            <View style={styles.signaturePlaceholder} />
          )}
          <Text style={styles.therapistName}>{therapist.full_name}</Text>
          {qualStr && <Text style={styles.qualifications}>{qualStr}</Text>}
          {therapist.license_number && (
            <Text style={styles.licenseNumber}>Lic: {therapist.license_number}</Text>
          )}
          {specStr && <Text style={styles.specializations}>{specStr}</Text>}
          <Text style={styles.label}>Treating Physiotherapist</Text>
        </View>

        {/* Patient acknowledgement side */}
        <View style={styles.rightCol}>
          <View style={styles.patientLine} />
          <Text style={styles.label}>Patient / Guardian Signature</Text>
          <View style={styles.dateLine}>
            <Text style={styles.dateLabel}>Date:</Text>
            <View style={styles.dateBlank} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default TherapistSignatureBlock
