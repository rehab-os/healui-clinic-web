/**
 * Mock Question Data for Testing
 *
 * These represent the different question types used in the screening chatbot
 */

export const mockQuestions = {
  // Multi-choice question (checkboxes, multiple selections)
  multi_choice: {
    id: 'aggravating_factors',
    type: 'multi_choice' as const,
    question: 'What makes your knee pain worse? Check all that apply.',
    options: [
      { value: 'walking', label: 'Walking' },
      { value: 'stairs_up', label: 'Going up stairs' },
      { value: 'stairs_down', label: 'Going down stairs' },
      { value: 'squatting', label: 'Squatting' },
      { value: 'kneeling', label: 'Kneeling' },
      { value: 'running', label: 'Running' },
    ],
  },

  // Checklist question (similar to multi_choice)
  checklist: {
    id: 'relieving_factors',
    type: 'checklist' as const,
    question: 'What helps reduce your knee pain? Check all that apply.',
    options: [
      { value: 'rest', label: 'Rest' },
      { value: 'ice', label: 'Ice' },
      { value: 'elevation', label: 'Elevation' },
      { value: 'straightening', label: 'Straightening the knee' },
      { value: 'medication', label: 'Pain medication' },
    ],
  },

  // Yes/No question
  yes_no: {
    id: 'pain_radiation',
    type: 'yes_no' as const,
    question: 'Does your pain travel or spread to other areas?',
  },

  // Single choice (radio buttons)
  single_choice: {
    id: 'onset_nature',
    type: 'single_choice' as const,
    question: 'How did your pain start?',
    options: [
      { value: 'sudden', label: 'Sudden onset (acute injury)' },
      { value: 'gradual', label: 'Gradual onset (no specific injury)' },
      { value: 'unknown', label: 'Unknown / Cannot remember' },
    ],
  },

  // Slider (VAS pain scale)
  slider: {
    id: 'vas_score',
    type: 'slider' as const,
    question: 'On a scale of 0-10, how would you rate your pain right now?',
    min: 0,
    max: 10,
  },

  // Text input
  text: {
    id: 'chief_complaint',
    type: 'text' as const,
    question: 'Please describe your main concern or complaint.',
    placeholder: 'Describe in detail...',
  },

  // Red flags (checkboxes with warning)
  red_flags: {
    id: 'red_flag_screening',
    type: 'red_flags' as const,
    question: 'Do you have any of the following? (Red flag screening)',
    options: [
      { value: 'fever', label: 'Fever or infection signs' },
      { value: 'unexplained_weight_loss', label: 'Unexplained weight loss' },
      { value: 'night_pain', label: 'Severe night pain that wakes you' },
      { value: 'trauma', label: 'Recent significant trauma' },
      { value: 'none', label: 'None of the above' },
    ],
  },

  // Observational (checkboxes for clinical observations)
  observational: {
    id: 'gait_analysis',
    type: 'observational' as const,
    question: 'Observe gait pattern:',
    options: [
      { value: 'antalgic', label: 'Antalgic gait' },
      { value: 'flexed_knee', label: 'Knee held flexed' },
      { value: 'stiff_knee', label: 'Stiff knee gait' },
      { value: 'normal', label: 'Normal gait' },
    ],
  },
}

// Helper to get a mock question by type
export const getMockQuestion = (type: keyof typeof mockQuestions) => {
  return mockQuestions[type]
}

// Mock question options array for InlineClinicalQuestion
export const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]
