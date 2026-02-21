import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize } from '../theme'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: 600,
    fontSize: fontSize.body,
    color: colors.gray700,
    width: 90,
  },
  value: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.body,
    color: colors.gray600,
    flex: 1,
  },
})

interface InfoRowProps {
  label: string
  value: string | undefined | null
  labelWidth?: number
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, labelWidth }) => (
  <View style={styles.row}>
    <Text style={[styles.label, labelWidth ? { width: labelWidth } : undefined]}>{label}</Text>
    <Text style={styles.value}>{value || 'N/A'}</Text>
  </View>
)

export default InfoRow
