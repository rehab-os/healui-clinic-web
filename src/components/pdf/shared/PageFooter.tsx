import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize } from '../theme'

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    paddingHorizontal: 40,
    borderTop: `0.5pt solid ${colors.gray300}`,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  text: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: fontSize.tiny,
    color: colors.gray400,
  },
  confidential: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 6,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: 2,
  },
})

interface PageFooterProps {
  clinicName: string
  generatedDate: string
}

const PageFooter: React.FC<PageFooterProps> = ({ clinicName, generatedDate }) => (
  <View style={styles.footer} fixed>
    <View style={styles.row}>
      <Text style={styles.text}>{clinicName} | Generated {generatedDate}</Text>
      <Text style={styles.text} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
    <Text style={styles.confidential}>
      CONFIDENTIAL MEDICAL DOCUMENT - This report contains protected health information.
    </Text>
  </View>
)

export default PageFooter
