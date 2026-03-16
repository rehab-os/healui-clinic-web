import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize } from '../theme'

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.gray50,
    borderBottom: `0.5pt solid ${colors.gray300}`,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  clinicLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  clinicTextBlock: {
    flex: 1,
  },
  clinicName: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: fontSize.clinicName,
    color: colors.gray900,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clinicAddress: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.tiny,
    color: colors.gray500,
    marginTop: 2,
  },
  clinicContact: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.tiny,
    color: colors.gray500,
    marginTop: 1,
  },
  rightBlock: {
    alignItems: 'flex-end',
  },
  dateBadge: {
    backgroundColor: colors.teal,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateBadgeText: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.small,
    color: colors.white,
  },
  regText: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.tiny,
    color: colors.gray400,
    marginTop: 3,
  },
  // Tx branding bar
  txBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  txSymbol: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 16,
    color: colors.teal,
  },
  txDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.gray300,
  },
  txTitle: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.sectionHeader,
    color: colors.gray700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
})

interface TxPlanHeaderProps {
  clinic: {
    name: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    email?: string
    registration_number?: string
  }
  clinicLogoBase64: string | null
  date: string
}

const TxPlanHeader: React.FC<TxPlanHeaderProps> = ({ clinic, clinicLogoBase64, date }) => {
  const addressParts = [
    clinic.address,
    [clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(', '),
  ].filter(Boolean)

  const contactParts = [
    clinic.phone ? `Ph: ${clinic.phone}` : null,
    clinic.email,
  ].filter(Boolean)

  return (
    <View style={styles.header} fixed>
      <View style={styles.topRow}>
        <View style={styles.leftBlock}>
          {clinicLogoBase64 && (
            <Image style={styles.clinicLogo} src={clinicLogoBase64} />
          )}
          <View style={styles.clinicTextBlock}>
            <Text style={styles.clinicName}>{clinic.name}</Text>
            {addressParts.map((line, i) => (
              <Text key={i} style={styles.clinicAddress}>{line}</Text>
            ))}
            {contactParts.length > 0 && (
              <Text style={styles.clinicContact}>{contactParts.join(' | ')}</Text>
            )}
          </View>
        </View>
        <View style={styles.rightBlock}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{date}</Text>
          </View>
          {clinic.registration_number && (
            <Text style={styles.regText}>Reg: {clinic.registration_number}</Text>
          )}
        </View>
      </View>
      <View style={styles.txBar}>
        <Text style={styles.txSymbol}>Tx</Text>
        <View style={styles.txDivider} />
        <Text style={styles.txTitle}>Physiotherapy Treatment Plan</Text>
      </View>
    </View>
  )
}

export default TxPlanHeader
