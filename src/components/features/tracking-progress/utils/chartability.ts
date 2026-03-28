import type { InputType, Direction } from '@/app/dashboard/appointments/[patientId]/[appointmentId]/components/tracking/tracking.types'

export type ChartType =
  | 'line'           // Numeric trend (single value)
  | 'bilateral'      // Dual L/R lines
  | 'radar'          // PROM subscale radar
  | 'timeline'       // Positive/Negative dot timeline
  | 'step'           // MMT grade / categorical step
  | 'none'           // Not chartable (text)

/**
 * Determine the appropriate chart type for a tracking item
 * based on its input type and direction.
 *
 * @param hasBilateralData - optional flag: if the actual stored data has left/right values
 *   (e.g., VAS promoted to bilateral for bilateral conditions), use bilateral chart
 */
export function getChartType(
  inputType: InputType,
  bilateral: boolean,
  direction?: Direction,
  hasBilateralData?: boolean,
): ChartType {
  // Bilateral numeric items get dual-line chart
  // Also: items with actual L/R data (VAS on bilateral conditions)
  if (bilateral || inputType === 'numeric_bilateral' || hasBilateralData) {
    return 'bilateral'
  }

  // Line-chartable: all numeric inputs with a direction
  switch (inputType) {
    case 'numeric':
    case 'slider':
    case 'scale_0_3':
    case 'scale_0_5':
    case 'scale_0_10':
    case 'timer':
      return 'line'

    case 'questionnaire':
      return 'line' // PROM total scores chart as line; radar handled separately

    case 'select_pn':
    case 'toggle':
      return 'timeline'

    case 'select':
    case 'mmt_grade':
      return 'step'

    case 'text':
      return 'none'

    default:
      return 'none'
  }
}

/**
 * Check if a PROM has subscales (for radar chart overlay)
 */
export function hasSubscales(promScores: any): boolean {
  if (!promScores || typeof promScores !== 'object') return false
  // If any value is itself an object with multiple keys, it has subscales
  return typeof promScores === 'object' && !Array.isArray(promScores)
    && Object.values(promScores).some(v => typeof v === 'object' && v !== null)
}

/**
 * Check if the Y-axis should be reversed (improvement goes up visually)
 */
export function shouldReverseYAxis(direction?: Direction): boolean {
  return direction === 'higher_worse'
}
