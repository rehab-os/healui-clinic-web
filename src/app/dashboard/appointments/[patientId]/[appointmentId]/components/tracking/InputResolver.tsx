'use client'

import React from 'react'
import type { TrackingInputProps, InputType } from './tracking.types'
import NumericInput from './inputs/NumericInput'
import BilateralNumericInput from './inputs/BilateralNumericInput'
import SelectInput from './inputs/SelectInput'
import SelectPNInput from './inputs/SelectPNInput'
import ScaleInput from './inputs/ScaleInput'
import MMTGradeInput from './inputs/MMTGradeInput'
import ToggleInput from './inputs/ToggleInput'
import TimerInput from './inputs/TimerInput'
import QuestionnaireInput from './inputs/QuestionnaireInput'
import TextInput from './inputs/TextInput'

const INPUT_MAP: Record<InputType, React.ComponentType<TrackingInputProps>> = {
  numeric: NumericInput,
  numeric_bilateral: BilateralNumericInput,
  select: SelectInput,
  select_pn: SelectPNInput,
  scale_0_3: ScaleInput,
  scale_0_5: ScaleInput,
  scale_0_10: ScaleInput,
  mmt_grade: MMTGradeInput,
  toggle: ToggleInput,
  timer: TimerInput,
  questionnaire: QuestionnaireInput,
  text: TextInput,
  slider: ScaleInput,
}

export default function InputResolver(props: TrackingInputProps) {
  const Component = INPUT_MAP[props.definition.input]
  if (!Component) {
    return <span className="text-xs text-gray-400 italic">Unsupported</span>
  }
  return <Component {...props} />
}
