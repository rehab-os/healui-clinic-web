import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { colors, fontSize } from '../theme'

interface Exercise {
  exercise_name: string
  exercise_description?: string
  custom_sets: number
  custom_reps: number
  custom_duration_seconds: number
  frequency?: string
}

interface ExerciseTableProps {
  exercises: Exercise[]
  headerColor?: string
  defaultFrequency?: string
}

const makeStyles = (headerBg: string) =>
  StyleSheet.create({
    table: {
      marginTop: 4,
      borderRadius: 3,
      overflow: 'hidden',
      border: `0.5pt solid ${colors.gray200}`,
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: headerBg,
      paddingVertical: 5,
      paddingHorizontal: 6,
    },
    headerCell: {
      fontFamily: 'Inter',
      fontWeight: 600,
      fontSize: fontSize.small,
      color: colors.white,
    },
    row: {
      flexDirection: 'row',
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderBottom: `0.5pt solid ${colors.gray200}`,
    },
    rowAlt: {
      backgroundColor: colors.gray50,
    },
    cell: {
      fontFamily: 'Inter',
      fontWeight: 400,
      fontSize: fontSize.small,
      color: colors.gray700,
    },
    cellBold: {
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: fontSize.small,
      color: colors.gray900,
    },
    colName: { width: '36%' },
    colSets: { width: '12%', textAlign: 'center' },
    colReps: { width: '12%', textAlign: 'center' },
    colDuration: { width: '16%', textAlign: 'center' },
    colFreq: { width: '24%', textAlign: 'center' },
  })

const ExerciseTable: React.FC<ExerciseTableProps> = ({
  exercises,
  headerColor = colors.teal,
  defaultFrequency = 'Daily',
}) => {
  const s = makeStyles(headerColor)

  return (
    <View style={s.table} wrap={false}>
      <View style={s.headerRow}>
        <Text style={[s.headerCell, s.colName]}>Exercise</Text>
        <Text style={[s.headerCell, s.colSets]}>Sets</Text>
        <Text style={[s.headerCell, s.colReps]}>Reps</Text>
        <Text style={[s.headerCell, s.colDuration]}>Duration</Text>
        <Text style={[s.headerCell, s.colFreq]}>Frequency</Text>
      </View>
      {exercises.map((ex, i) => (
        <View key={i} style={[s.row, i % 2 === 1 ? s.rowAlt : undefined]}>
          <Text style={[s.cellBold, s.colName]}>{ex.exercise_name}</Text>
          <Text style={[s.cell, s.colSets]}>{ex.custom_sets}</Text>
          <Text style={[s.cell, s.colReps]}>{ex.custom_reps}</Text>
          <Text style={[s.cell, s.colDuration]}>{ex.custom_duration_seconds}s</Text>
          <Text style={[s.cell, s.colFreq]}>{ex.frequency || defaultFrequency}</Text>
        </View>
      ))}
    </View>
  )
}

export default ExerciseTable
