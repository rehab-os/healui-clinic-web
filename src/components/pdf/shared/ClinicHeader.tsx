import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize } from '../theme'

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    paddingHorizontal: 40,
    paddingTop: 14,
    backgroundColor: colors.gray50,
    borderBottom: `0.5pt solid ${colors.gray300}`,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clinicName: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: fontSize.clinicName,
    color: colors.gray900,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray500,
    marginTop: 2,
  },
  contactBlock: {
    alignItems: 'flex-end',
  },
  contactText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.tiny,
    color: colors.gray500,
    marginBottom: 1,
  },
  dateBadge: {
    backgroundColor: colors.teal,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 3,
  },
  dateBadgeText: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.small,
    color: colors.white,
  },
})

interface ClinicHeaderProps {
  clinic: {
    name: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    email?: string
  }
  date: string
  physiotherapist?: string
}

const ClinicHeader: React.FC<ClinicHeaderProps> = ({ clinic, date, physiotherapist }) => {
  const addressParts = [clinic.address, [clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(', ')].filter(Boolean)

  return (
    <View style={styles.header} fixed>
      <View style={styles.row}>
        <View>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          <Text style={styles.subtitle}>Clinical Assessment &amp; Treatment Report</Text>
        </View>
        <View style={styles.contactBlock}>
          {addressParts.map((line, i) => (
            <Text key={i} style={styles.contactText}>{line}</Text>
          ))}
          {clinic.phone && <Text style={styles.contactText}>{clinic.phone}</Text>}
          {clinic.email && <Text style={styles.contactText}>{clinic.email}</Text>}
          {physiotherapist && <Text style={styles.contactText}>PT: {physiotherapist}</Text>}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{date}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ClinicHeader
