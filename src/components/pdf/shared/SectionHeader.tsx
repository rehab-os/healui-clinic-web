import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize, spacing } from '../theme'

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.section,
    marginBottom: spacing.small,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barMain: {
    backgroundColor: colors.teal,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flex: 3,
  },
  barFade: {
    backgroundColor: colors.tealLight,
    flex: 1,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: fontSize.sectionHeader,
    color: colors.white,
    letterSpacing: 0.8,
  },
})

interface SectionHeaderProps {
  title: string
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View style={styles.container} wrap={false}>
    <View style={styles.bar}>
      <View style={styles.barMain}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.barFade} />
    </View>
  </View>
)

export default SectionHeader
