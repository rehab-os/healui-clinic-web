import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize, spacing } from '../theme'
import InfoRow from './InfoRow'

const styles = StyleSheet.create({
  patientName: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 16,
    color: colors.gray900,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  subsectionTitle: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body,
    color: colors.gray700,
    marginTop: 8,
    marginBottom: 4,
  },
  listItem: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray600,
    marginBottom: 2,
    paddingLeft: 8,
  },
  allergyBox: {
    backgroundColor: colors.amberLight,
    border: `0.5pt solid ${colors.amberBorder}`,
    borderRadius: 3,
    padding: 6,
    marginTop: 4,
  },
  allergyItem: {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: fontSize.body,
    color: colors.gray700,
    marginBottom: 2,
  },
})

interface PatientInfoCardProps {
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
}

const calculateAge = (dob: string): string => {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} years`
}

const genderLabel = (g?: string) =>
  g === 'M' ? 'Male' : g === 'F' ? 'Female' : g || 'N/A'

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient }) => (
  <View>
    <Text style={styles.patientName}>{patient.full_name}</Text>
    <View style={styles.grid}>
      <View style={styles.column}>
        <InfoRow label="Age" value={patient.date_of_birth ? calculateAge(patient.date_of_birth) : undefined} />
        <InfoRow label="Gender" value={genderLabel(patient.gender)} />
      </View>
      <View style={styles.column}>
        <InfoRow label="Phone" value={patient.phone} />
        <InfoRow label="Email" value={patient.email} />
      </View>
    </View>

    {patient.medical_history && patient.medical_history.length > 0 && (
      <View>
        <Text style={styles.subsectionTitle}>Medical History</Text>
        {patient.medical_history.map((item, i) => (
          <Text key={i} style={styles.listItem}>- {item}</Text>
        ))}
      </View>
    )}

    {patient.allergies && patient.allergies.length > 0 && (
      <View style={styles.allergyBox}>
        <Text style={[styles.subsectionTitle, { marginTop: 0 }]}>Allergies</Text>
        {patient.allergies.map((item, i) => (
          <Text key={i} style={styles.allergyItem}>! {item}</Text>
        ))}
      </View>
    )}

    {patient.current_medications && patient.current_medications.length > 0 && (
      <View>
        <Text style={styles.subsectionTitle}>Current Medications</Text>
        {patient.current_medications.map((item, i) => (
          <Text key={i} style={styles.listItem}>- {item}</Text>
        ))}
      </View>
    )}
  </View>
)

export default PatientInfoCard
