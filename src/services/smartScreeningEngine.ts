/**
 * Smart Screening Engine - Full Questionnaire (matching PhysioDecisionEngine)
 * All 35+ questions with pathway-based conditional logic
 * Includes referral pattern screening for source vs site differentiation
 */

import { aiDiagnosticService, DiagnosticResponse } from './aiDiagnosticService';
import {
  getReferralQuestions,
  evaluateReferralResponses,
  getClinicalNote,
  normalizeRegion,
  getRedFlagQuestionIds,
  ReferralQuestion
} from '../data/referralPatterns';
import {
  getRegionConfig,
  getAggravatingFactors,
  getRelievingFactors,
  getFunctionalLimitations,
  getRomMovements,
  getMmtMuscleGroups,
  getGaitObservations,
  getPostureObservations,
  getRadiationPatterns,
  getTightnessAssessment,
  getBalanceAssessment,
  getRelevantReflexes,
  getRelevantDermatomes,
  getRelevantMyotomes,
  hasRegionConfig,
  QuestionOption as RegionQuestionOption,
  ReflexConfig
} from '../data/regionConfigs';

// ==================== Types ====================

export type QuestionType =
  | 'text' | 'date' | 'yes_no' | 'single_choice' | 'multi_choice'
  | 'checklist' | 'slider' | 'body_map' | 'tenderness_map'
  | 'measurement' | 'rom_measurement' | 'mmt_testing' | 'scale_grid' | 'observational'
  | 'red_flags';

export interface QuestionOption {
  value: string;
  label: string;
  requiresText?: boolean;
}

export interface ScreeningQuestion {
  id: string;
  type: QuestionType;
  question: string;
  placeholder?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  labels?: Record<number, string>;
  multiple?: boolean;
  validation?: (input: any) => boolean;
}

export interface ReferralFinding {
  sourceRegion: string;
  implication: string;
  isRedFlag: boolean;
}

export interface ScreeningSession {
  id: string;
  patientId: string;
  responses: Record<string, any>;
  currentStepId: string;
  activatedPathways: Set<string>;
  skippedSections: Set<string>;
  questionQueue: string[];
  completionPercentage: number;
  startTime: Date;
  redFlagsDetected: string[];
  // Referral pattern tracking
  selectedPainRegions: string[];
  referralScreeningResponses: Record<string, string>;
  identifiedReferralSources: ReferralFinding[];
}

export interface DiagnosisResult {
  success: boolean;
  diagnosis?: DiagnosticResponse;
  clinicalSummary?: string;
  error?: string;
}

export enum PathwayType {
  PAIN = 'pain',
  MOTOR = 'motor',
  SENSORY = 'sensory',
  MOBILITY = 'mobility',
  BALANCE = 'balance',
  INFLAMMATION = 'inflammation',
  OBJECTIVE = 'objective',
  FUNCTIONAL = 'functional',
  NEUROLOGICAL = 'neurological'
}

// ==================== Body Regions for Body Map (with laterality) ====================

export const BODY_REGIONS = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'shoulder_left', label: 'Left Shoulder' },
  { id: 'shoulder_right', label: 'Right Shoulder' },
  { id: 'shoulder_both', label: 'Both Shoulders' },
  { id: 'upper_back', label: 'Upper Back' },
  { id: 'lower_back', label: 'Lower Back' },
  { id: 'arm_left', label: 'Left Arm' },
  { id: 'arm_right', label: 'Right Arm' },
  { id: 'elbow_left', label: 'Left Elbow' },
  { id: 'elbow_right', label: 'Right Elbow' },
  { id: 'wrist_left', label: 'Left Wrist' },
  { id: 'wrist_right', label: 'Right Wrist' },
  { id: 'hand_left', label: 'Left Hand' },
  { id: 'hand_right', label: 'Right Hand' },
  { id: 'hip_left', label: 'Left Hip' },
  { id: 'hip_right', label: 'Right Hip' },
  { id: 'hip_both', label: 'Both Hips' },
  { id: 'thigh_left', label: 'Left Thigh' },
  { id: 'thigh_right', label: 'Right Thigh' },
  { id: 'knee_left', label: 'Left Knee' },
  { id: 'knee_right', label: 'Right Knee' },
  { id: 'knee_both', label: 'Both Knees' },
  { id: 'leg_left', label: 'Left Lower Leg' },
  { id: 'leg_right', label: 'Right Lower Leg' },
  { id: 'ankle_left', label: 'Left Ankle' },
  { id: 'ankle_right', label: 'Right Ankle' },
  { id: 'foot_left', label: 'Left Foot' },
  { id: 'foot_right', label: 'Right Foot' }
];

// ==================== Red Flag Options ====================

export const RED_FLAG_OPTIONS = [
  { id: 'unexplained_weight_loss', label: 'Unexplained weight loss', emoji: '⚖️', severity: 'high' },
  { id: 'night_sweats', label: 'Night sweats or fever', emoji: '🌙', severity: 'high' },
  { id: 'bowel_bladder', label: 'Bowel or bladder dysfunction', emoji: '🚽', severity: 'critical' },
  { id: 'saddle_anesthesia', label: 'Numbness in groin/saddle area', emoji: '🔴', severity: 'critical' },
  { id: 'progressive_weakness', label: 'Progressive weakness in legs', emoji: '🦵', severity: 'high' },
  { id: 'bilateral_symptoms', label: 'Bilateral leg symptoms', emoji: '🦶', severity: 'moderate' },
  { id: 'constant_pain', label: 'Constant pain not relieved by rest', emoji: '😰', severity: 'moderate' },
  { id: 'history_cancer', label: 'History of cancer', emoji: '🏥', severity: 'high' },
  { id: 'recent_trauma', label: 'Recent significant trauma', emoji: '💥', severity: 'moderate' },
  { id: 'steroid_use', label: 'Long-term steroid use', emoji: '💊', severity: 'moderate' }
];

// ==================== ICF (International Classification of Functioning) Code Mappings ====================
// Based on WHO ICF classification for physiotherapy documentation
export const ICF_CODES: Record<string, { code: string; category: string; description: string }> = {
  // Body Functions (b)
  pain_screening: { code: 'b280', category: 'Body Functions', description: 'Sensation of pain' },
  pain_location: { code: 'b2801', category: 'Body Functions', description: 'Pain in body part' },
  vas_score: { code: 'b2800', category: 'Body Functions', description: 'Generalized pain' },
  pain_nature: { code: 'b2802', category: 'Body Functions', description: 'Pain quality' },
  pain_radiation: { code: 'b2803', category: 'Body Functions', description: 'Radiating pain' },
  behavior_24hr: { code: 'b2804', category: 'Body Functions', description: 'Pain pattern' },
  morning_stiffness_duration: { code: 'b7800', category: 'Body Functions', description: 'Sensation of muscle stiffness' },

  // Sensory functions
  sensation_screening: { code: 'b265', category: 'Body Functions', description: 'Touch function' },
  sensation_type: { code: 'b270', category: 'Body Functions', description: 'Sensory functions related to temperature and other stimuli' },

  // Neuromusculoskeletal functions
  weakness_screening: { code: 'b730', category: 'Body Functions', description: 'Muscle power functions' },
  weakness_location: { code: 'b7300', category: 'Body Functions', description: 'Power of isolated muscles and muscle groups' },
  mobility_screening: { code: 'b710', category: 'Body Functions', description: 'Mobility of joint functions' },
  mobility_limitations: { code: 'b7100', category: 'Body Functions', description: 'Mobility of a single joint' },

  // Activities and Participation (d)
  functional_impact: { code: 'd230', category: 'Activities', description: 'Carrying out daily routine' },
  aggravating_factors: { code: 'd4', category: 'Activities', description: 'Mobility activities' },
  relieving_factors: { code: 'd4', category: 'Activities', description: 'Mobility activities' },

  // Specific activities
  chief_complaint: { code: 'd570', category: 'Activities', description: 'Looking after ones health' },
  symptom_onset: { code: 'b130', category: 'Body Functions', description: 'Energy and drive functions (time course)' },
  symptom_progression: { code: 'b130', category: 'Body Functions', description: 'Energy and drive functions (progression)' },

  // Red flags - Body structures/functions at risk
  red_flag_screening: { code: 'b299', category: 'Body Functions', description: 'Sensory functions and pain, unspecified (red flags)' },

  // Environmental factors
  previous_episodes: { code: 'e580', category: 'Environment', description: 'Health services, systems and policies (history)' },
};

// Alias for backward compatibility
export type ScreeningStep = ScreeningQuestion;

// ==================== All Questions (matching PhysioDecisionEngine) ====================

export const QUESTION_TEMPLATES: Record<string, ScreeningQuestion> = {
  // ========== INITIAL ASSESSMENT ==========
  chief_complaint: {
    id: 'chief_complaint',
    type: 'text',
    question: "What is the patient's main concern today? Describe their primary symptoms or functional limitations.",
    placeholder: "e.g., not able to walk, severe back pain, weakness in right arm...",
    validation: (input: string) => input.length > 2
  },

  symptom_onset: {
    id: 'symptom_onset',
    type: 'date',
    question: "When did your symptoms first start? This helps us understand if this is an acute, subacute, or chronic condition.",
    placeholder: "Select the date when symptoms began"
  },

  onset_nature: {
    id: 'onset_nature',
    type: 'single_choice',
    question: "How did your symptoms begin?",
    options: [
      { value: 'sudden', label: 'Sudden onset (immediate)' },
      { value: 'gradual', label: 'Gradual onset (over days/weeks)' },
      { value: 'after_injury', label: 'After a specific injury or event' },
      { value: 'unknown', label: 'Not sure/Cannot remember' }
    ]
  },

  symptom_progression: {
    id: 'symptom_progression',
    type: 'single_choice',
    question: "Since symptoms started, are they:",
    options: [
      { value: 'getting_worse', label: 'Getting worse' },
      { value: 'getting_better', label: 'Getting better' },
      { value: 'staying_same', label: 'Staying about the same' },
      { value: 'fluctuating', label: 'Going up and down' }
    ]
  },

  previous_episodes: {
    id: 'previous_episodes',
    type: 'yes_no',
    question: "Have you experienced this problem before?"
  },

  previous_episode_comparison: {
    id: 'previous_episode_comparison',
    type: 'single_choice',
    question: "Compared to your previous episode(s), this time the symptoms are:",
    options: [
      { value: 'same', label: 'Similar to before' },
      { value: 'worse', label: 'Worse than before' },
      { value: 'different_location', label: 'In a different location' },
      { value: 'different_type', label: 'Different type of symptoms' }
    ]
  },

  // ========== RED FLAG SCREENING (CRITICAL - Asked Early) ==========
  red_flag_screening: {
    id: 'red_flag_screening',
    type: 'red_flags',
    question: "Do you have any of the following warning signs? Select all that apply (or skip if none).",
    options: [
      { value: 'unexplained_weight_loss', label: 'Unexplained weight loss (>10% in 6 months)' },
      { value: 'night_sweats_fever', label: 'Night sweats or unexplained fever' },
      { value: 'bowel_bladder', label: 'New bowel or bladder problems' },
      { value: 'saddle_numbness', label: 'Numbness in groin/saddle area' },
      { value: 'progressive_weakness', label: 'Progressive weakness in legs' },
      { value: 'bilateral_leg_symptoms', label: 'Symptoms in both legs' },
      { value: 'constant_unrelenting_pain', label: 'Constant pain not relieved by any position' },
      { value: 'history_cancer', label: 'History of cancer' },
      { value: 'recent_trauma', label: 'Recent significant injury/trauma' },
      { value: 'long_term_steroids', label: 'Long-term steroid use' },
      { value: 'iv_drug_use', label: 'IV drug use' },
      { value: 'immunosuppressed', label: 'Weakened immune system' }
    ]
  },

  // ========== PATHWAY SCREENING ==========
  pain_screening: {
    id: 'pain_screening',
    type: 'yes_no',
    question: "Does the patient have any pain or discomfort?"
  },

  weakness_screening: {
    id: 'weakness_screening',
    type: 'yes_no',
    question: "Does the patient report any weakness or strength difficulties?"
  },

  sensation_screening: {
    id: 'sensation_screening',
    type: 'yes_no',
    question: "Does the patient have any numbness, tingling, or sensation changes?"
  },

  mobility_screening: {
    id: 'mobility_screening',
    type: 'yes_no',
    question: "Does the patient have any movement or mobility limitations?"
  },

  // ========== PAIN PATHWAY ==========
  pain_location: {
    id: 'pain_location',
    type: 'body_map',
    question: "Where exactly do you feel the pain? You can select multiple areas.",
    multiple: true
  },

  pain_nature: {
    id: 'pain_nature',
    type: 'multi_choice',
    question: "How would you describe your pain? Select all that apply.",
    options: [
      { value: 'sharp', label: 'Sharp/Stabbing' },
      { value: 'dull', label: 'Dull/Aching' },
      { value: 'burning', label: 'Burning' },
      { value: 'throbbing', label: 'Throbbing' },
      { value: 'cramping', label: 'Cramping' },
      { value: 'other', label: 'Other', requiresText: true }
    ]
  },

  // ========== PAIN RADIATION ==========
  pain_radiation: {
    id: 'pain_radiation',
    type: 'yes_no',
    question: "Does your pain travel or spread to other areas?"
  },

  radiation_pattern: {
    id: 'radiation_pattern',
    type: 'single_choice',
    question: "How does your pain spread?",
    options: [
      { value: 'down_arm', label: 'Down the arm towards hand/fingers' },
      { value: 'down_leg', label: 'Down the leg towards foot/toes' },
      { value: 'across_back', label: 'Across the back' },
      { value: 'around_chest', label: 'Around the chest/ribcage' },
      { value: 'up_to_head', label: 'Up towards the head' },
      { value: 'other_pattern', label: 'Other pattern' }
    ]
  },

  // ========== 24-HOUR BEHAVIOR PATTERN ==========
  behavior_24hr: {
    id: 'behavior_24hr',
    type: 'single_choice',
    question: "When is your pain typically at its WORST during the day?",
    options: [
      { value: 'morning_stiff', label: 'First thing in the morning (stiff/painful on waking)' },
      { value: 'morning_improves', label: 'Morning but improves as I move around' },
      { value: 'end_of_day', label: 'End of the day (worse after activities)' },
      { value: 'night_pain', label: 'At night (wakes me from sleep)' },
      { value: 'constant', label: 'Constant throughout the day' },
      { value: 'variable', label: 'Varies unpredictably' }
    ]
  },

  morning_stiffness_duration: {
    id: 'morning_stiffness_duration',
    type: 'single_choice',
    question: "How long does your morning stiffness last?",
    options: [
      { value: 'less_15min', label: 'Less than 15 minutes' },
      { value: '15_30min', label: '15-30 minutes' },
      { value: '30_60min', label: '30-60 minutes' },
      { value: 'more_60min', label: 'More than 60 minutes' },
      { value: 'all_day', label: 'Most of the day' }
    ]
  },

  night_pain_details: {
    id: 'night_pain_details',
    type: 'single_choice',
    question: "Tell us more about your night pain:",
    options: [
      { value: 'cant_sleep', label: "Can't fall asleep due to pain" },
      { value: 'wakes_up', label: 'Pain wakes me up from sleep' },
      { value: 'position_dependent', label: 'Only in certain sleeping positions' },
      { value: 'constant_night', label: 'Constant regardless of position' }
    ]
  },

  vas_score: {
    id: 'vas_score',
    type: 'slider',
    question: "On a scale of 0-10, how would you rate your pain right now?",
    min: 0,
    max: 10,
    labels: {
      0: 'No Pain',
      5: 'Moderate',
      10: 'Worst Possible'
    }
  },

  pain_timing: {
    id: 'pain_timing',
    type: 'single_choice',
    question: "When do you experience this pain?",
    options: [
      { value: 'constant', label: 'Constant' },
      { value: 'intermittent', label: 'Intermittent' },
      { value: 'morning', label: 'Morning' },
      { value: 'evening', label: 'Evening/Night' },
      { value: 'activity', label: 'During activity' },
      { value: 'rest', label: 'At rest' }
    ]
  },

  pain_movement: {
    id: 'pain_movement',
    type: 'single_choice',
    question: "How does movement affect your pain?",
    options: [
      { value: 'increases', label: 'Pain increases with movement' },
      { value: 'decreases', label: 'Pain decreases with movement' },
      { value: 'no_change', label: 'No change with movement' },
      { value: 'varies', label: 'Depends on the movement' }
    ]
  },

  aggravating_factors: {
    id: 'aggravating_factors',
    type: 'checklist',
    question: "What makes your pain worse? Check all that apply.",
    options: [
      { value: 'bending_forward', label: 'Bending forward' },
      { value: 'bending_backward', label: 'Bending backward' },
      { value: 'twisting', label: 'Twisting' },
      { value: 'lifting', label: 'Lifting' },
      { value: 'walking', label: 'Walking' },
      { value: 'sitting', label: 'Sitting' },
      { value: 'standing', label: 'Standing' },
      { value: 'lying', label: 'Lying down' },
      { value: 'stairs', label: 'Stairs' },
      { value: 'overhead', label: 'Reaching overhead' }
    ]
  },

  relieving_factors: {
    id: 'relieving_factors',
    type: 'checklist',
    question: "What helps reduce your pain? Check all that apply.",
    options: [
      { value: 'rest', label: 'Rest' },
      { value: 'ice', label: 'Ice' },
      { value: 'heat', label: 'Heat' },
      { value: 'medication', label: 'Medication' },
      { value: 'position', label: 'Specific positions' },
      { value: 'movement', label: 'Gentle movement' },
      { value: 'nothing', label: 'Nothing helps' }
    ]
  },

  // ========== MOTOR PATHWAY ==========
  weakness_location: {
    id: 'weakness_location',
    type: 'multi_choice',
    question: "Where do you feel weak or have difficulty with strength?",
    options: [
      { value: 'upper_limb', label: 'Upper limb (arms/hands)' },
      { value: 'lower_limb', label: 'Lower limb (legs/feet)' },
      { value: 'core', label: 'Core/Trunk' },
      { value: 'general', label: 'General/whole body' }
    ]
  },

  // ========== SENSORY PATHWAY ==========
  sensation_type: {
    id: 'sensation_type',
    type: 'multi_choice',
    question: "What kind of sensation changes are you experiencing?",
    options: [
      { value: 'numbness', label: 'Numbness' },
      { value: 'tingling', label: 'Tingling/Pins and needles' },
      { value: 'burning', label: 'Burning' },
      { value: 'hypersensitive', label: 'Hypersensitivity' },
      { value: 'complete_loss', label: 'Complete loss of feeling' }
    ]
  },

  // ========== FUNCTIONAL IMPACT ==========
  functional_impact: {
    id: 'functional_impact',
    type: 'checklist',
    question: "What activities are difficult due to your condition? Check all that apply.",
    options: [
      { value: 'dressing', label: 'Getting dressed' },
      { value: 'walking', label: 'Walking 10 minutes' },
      { value: 'stairs', label: 'Climbing stairs' },
      { value: 'lifting', label: 'Carrying groceries' },
      { value: 'work', label: 'Work activities' },
      { value: 'recreation', label: 'Recreational activities' },
      { value: 'sleeping', label: 'Sleeping' }
    ]
  },

  // ========== OBJECTIVE ASSESSMENTS ==========
  tenderness_assessment: {
    id: 'tenderness_assessment',
    type: 'tenderness_map',
    question: "Palpate the affected area and rate tenderness at each point (0=no pain, 3=severe).",
    options: [
      { value: '0', label: 'No tenderness' },
      { value: '1', label: 'Mild tenderness' },
      { value: '2', label: 'Moderate tenderness' },
      { value: '3', label: 'Severe tenderness' }
    ]
  },

  swelling_assessment: {
    id: 'swelling_assessment',
    type: 'single_choice',
    question: "Is there visible swelling in the affected area?",
    options: [
      { value: 'absent', label: 'No swelling' },
      { value: 'mild', label: 'Mild swelling' },
      { value: 'moderate', label: 'Moderate swelling' },
      { value: 'severe', label: 'Severe swelling' }
    ]
  },

  girth_measurement: {
    id: 'girth_measurement',
    type: 'measurement',
    question: "Measure girth at affected areas (in cm).",
    placeholder: "Enter measurements in cm"
  },

  sensations_assessment: {
    id: 'sensations_assessment',
    type: 'multi_choice',
    question: "Test sensation changes in the affected area:",
    options: [
      { value: 'normal', label: 'Normal sensation' },
      { value: 'reduced', label: 'Reduced sensation' },
      { value: 'absent', label: 'Absent sensation' },
      { value: 'hypersensitive', label: 'Hypersensitive' },
      { value: 'allodynia', label: 'Allodynia (pain to light touch)' }
    ]
  },

  dermatome_assessment: {
    id: 'dermatome_assessment',
    type: 'multi_choice',
    question: "Test dermatomes - which areas show sensation changes?",
    options: [
      { value: 'C5', label: 'C5 (outer shoulder)' },
      { value: 'C6', label: 'C6 (thumb side)' },
      { value: 'C7', label: 'C7 (middle finger)' },
      { value: 'C8', label: 'C8 (little finger)' },
      { value: 'L4', label: 'L4 (medial leg)' },
      { value: 'L5', label: 'L5 (dorsal foot)' },
      { value: 'S1', label: 'S1 (lateral foot)' }
    ]
  },

  myotome_assessment: {
    id: 'myotome_assessment',
    type: 'mmt_testing',
    question: "Test myotomes - rate muscle strength (0-5 scale):",
    options: [
      { value: 'C5', label: 'C5 (shoulder abduction)' },
      { value: 'C6', label: 'C6 (elbow flexion)' },
      { value: 'C7', label: 'C7 (elbow extension)' },
      { value: 'C8', label: 'C8 (finger flexion)' },
      { value: 'L4', label: 'L4 (ankle dorsiflexion)' },
      { value: 'L5', label: 'L5 (big toe extension)' },
      { value: 'S1', label: 'S1 (plantar flexion)' }
    ]
  },

  reflex_testing: {
    id: 'reflex_testing',
    type: 'scale_grid',
    question: "Test deep tendon reflexes (0=absent, 1=reduced, 2=normal, 3=brisk, 4=clonus):",
    options: [
      { value: 'biceps', label: 'Biceps (C5-C6)' },
      { value: 'triceps', label: 'Triceps (C7)' },
      { value: 'patellar', label: 'Patellar (L3-L4)' },
      { value: 'achilles', label: 'Achilles (S1)' }
    ]
  },

  active_rom: {
    id: 'active_rom',
    type: 'rom_measurement',
    question: "Measure active range of motion (degrees):",
    placeholder: "Enter ROM measurements"
  },

  passive_rom: {
    id: 'passive_rom',
    type: 'rom_measurement',
    question: "Measure passive range of motion (degrees):",
    placeholder: "Enter ROM measurements"
  },

  mmt_assessment: {
    id: 'mmt_assessment',
    type: 'mmt_testing',
    question: "Manual Muscle Testing - rate strength (0-5 Oxford scale):",
    options: [
      { value: '0', label: '0 - No contraction' },
      { value: '1', label: '1 - Flicker of contraction' },
      { value: '2', label: '2 - Movement with gravity eliminated' },
      { value: '3', label: '3 - Movement against gravity' },
      { value: '4', label: '4 - Movement against resistance' },
      { value: '5', label: '5 - Normal strength' }
    ]
  },

  tightness_assessment: {
    id: 'tightness_assessment',
    type: 'multi_choice',
    question: "Assess muscle tightness:",
    options: [
      { value: 'hip_flexors', label: 'Hip flexors (Thomas test)' },
      { value: 'hamstrings', label: 'Hamstrings (SLR for flexibility)' },
      { value: 'ITB', label: 'IT Band (Ober test)' },
      { value: 'gastrocnemius', label: 'Gastrocnemius' },
      { value: 'pectorals', label: 'Pectorals' },
      { value: 'upper_trap', label: 'Upper trapezius' }
    ]
  },

  gait_analysis: {
    id: 'gait_analysis',
    type: 'observational',
    question: "Observe gait pattern:",
    options: [
      { value: 'normal', label: 'Normal gait pattern' },
      { value: 'antalgic', label: 'Antalgic (pain-avoiding)' },
      { value: 'trendelenburg', label: 'Trendelenburg gait' },
      { value: 'foot_drop', label: 'Foot drop pattern' },
      { value: 'circumduction', label: 'Circumduction' },
      { value: 'limp', label: 'General limp' }
    ]
  },

  posture_assessment: {
    id: 'posture_assessment',
    type: 'observational',
    question: "Assess posture:",
    options: [
      { value: 'forward_head', label: 'Forward head posture' },
      { value: 'rounded_shoulders', label: 'Rounded shoulders' },
      { value: 'increased_kyphosis', label: 'Increased thoracic kyphosis' },
      { value: 'increased_lordosis', label: 'Increased lumbar lordosis' },
      { value: 'scoliosis', label: 'Scoliosis' },
      { value: 'pelvic_tilt', label: 'Pelvic tilt' },
      { value: 'normal', label: 'Normal posture' }
    ]
  },

  balance_assessment: {
    id: 'balance_assessment',
    type: 'observational',
    question: "Assess balance and stability:",
    options: [
      { value: 'normal', label: 'Normal balance' },
      { value: 'unsteady', label: 'Unsteady on feet' },
      { value: 'support_needed', label: 'Requires support' },
      { value: 'falls_risk', label: 'High falls risk' },
      { value: 'romberg_positive', label: 'Romberg test positive' }
    ]
  },

  adl_scoring: {
    id: 'adl_scoring',
    type: 'scale_grid',
    question: "Rate patient's ability in activities of daily living (0=unable, 10=independent):",
    options: [
      { value: 'dressing', label: 'Dressing' },
      { value: 'bathing', label: 'Bathing' },
      { value: 'walking', label: 'Walking' },
      { value: 'stairs', label: 'Climbing stairs' },
      { value: 'lifting', label: 'Lifting objects' },
      { value: 'work_tasks', label: 'Work-related tasks' },
      { value: 'recreation', label: 'Recreational activities' }
    ]
  },

  mobility_limitations: {
    id: 'mobility_limitations',
    type: 'checklist',
    question: "What mobility limitations are you experiencing?",
    options: [
      { value: 'walking', label: 'Walking difficulties' },
      { value: 'stairs', label: 'Climbing stairs' },
      { value: 'standing', label: 'Standing up' },
      { value: 'bending', label: 'Bending over' },
      { value: 'reaching', label: 'Reaching overhead' },
      { value: 'turning', label: 'Turning/twisting' }
    ]
  },

  condition_classification: {
    id: 'condition_classification',
    type: 'single_choice',
    question: "Based on the assessment, how would you classify this condition?",
    options: [
      { value: 'ACUTE', label: 'Acute (< 6 weeks duration)' },
      { value: 'CHRONIC', label: 'Chronic (> 12 weeks duration)' },
      { value: 'RECURRING', label: 'Recurring/Episodic condition' }
    ]
  },

};

// ==================== Smart Screening Engine Class ====================

export class SmartScreeningEngine {
  private session: ScreeningSession;
  private questionTemplates: Record<string, ScreeningQuestion>;

  constructor(patientId: string) {
    this.session = {
      id: `screening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      responses: {},
      currentStepId: 'chief_complaint',
      activatedPathways: new Set(),
      skippedSections: new Set(),
      questionQueue: [],
      completionPercentage: 0,
      startTime: new Date(),
      redFlagsDetected: [],
      // Referral pattern tracking
      selectedPainRegions: [],
      referralScreeningResponses: {},
      identifiedReferralSources: []
    };
    this.questionTemplates = { ...QUESTION_TEMPLATES };
  }

  getCurrentQuestion(): ScreeningQuestion | null {
    if (this.session.currentStepId && this.questionTemplates[this.session.currentStepId]) {
      const question = { ...this.questionTemplates[this.session.currentStepId] };

      // Apply region-specific options if we have a selected pain region
      return this.applyRegionSpecificOptions(question);
    }
    return null;
  }

  /**
   * Get a specific question by ID - useful for AI-driven question flow
   */
  getQuestionById(questionId: string): ScreeningQuestion | null {
    if (this.questionTemplates[questionId]) {
      const question = { ...this.questionTemplates[questionId] };
      return this.applyRegionSpecificOptions(question);
    }
    return null;
  }

  /**
   * Set the current step to a specific question ID - for AI flow navigation
   */
  setCurrentStep(questionId: string): boolean {
    if (this.questionTemplates[questionId]) {
      this.session.currentStepId = questionId;
      return true;
    }
    return false;
  }

  /**
   * Combine options from multiple regions, removing duplicates
   * Adds "None" at start and "Other" at end for flexibility
   */
  private combineRegionOptions(
    regions: string[],
    getter: (region: string) => RegionQuestionOption[],
    options: { addNone?: boolean; addOther?: boolean; noneLabel?: string } = {}
  ): QuestionOption[] {
    const { addNone = false, addOther = true, noneLabel = 'None of the above' } = options;
    const seenValues = new Set<string>();
    const combinedOptions: QuestionOption[] = [];

    // Add "None" option at the start if requested
    if (addNone) {
      combinedOptions.push({ value: 'none', label: noneLabel });
    }

    regions.forEach(region => {
      if (hasRegionConfig(region)) {
        const regionOptions = getter(region);
        regionOptions.forEach(opt => {
          if (!seenValues.has(opt.value)) {
            seenValues.add(opt.value);
            combinedOptions.push({ value: opt.value, label: opt.label });
          }
        });
      }
    });

    // Add "Other" option at the end for flexibility
    if (addOther && combinedOptions.length > (addNone ? 1 : 0)) {
      combinedOptions.push({ value: 'other', label: 'Other' });
    }

    return combinedOptions;
  }

  /**
   * Apply region-specific options to questions based on selected pain location
   * This makes questions like aggravating factors, ROM, MMT dynamic per region
   */
  private applyRegionSpecificOptions(question: ScreeningQuestion): ScreeningQuestion {
    const regions = this.session.selectedPainRegions;

    // If no pain region selected yet, return question as-is
    if (regions.length === 0) {
      return question;
    }

    // Get primary region for labeling
    const primaryRegion = regions[0];
    if (!hasRegionConfig(primaryRegion)) {
      return question;
    }

    const regionConfig = getRegionConfig(primaryRegion);
    const regionLabel = regions.length === 1
      ? (regionConfig?.label || primaryRegion.replace(/-/g, ' '))
      : 'affected areas';

    // Map question IDs to their getters and custom question text
    const regionQuestionConfig: Record<string, {
      getter: (region: string) => RegionQuestionOption[];
      questionOverride: string;
    }> = {
      'radiation_pattern': {
        getter: getRadiationPatterns,
        questionOverride: `Where does your ${regionLabel.toLowerCase()} pain spread to?`
      },
      'aggravating_factors': {
        getter: getAggravatingFactors,
        questionOverride: `What makes your ${regionLabel.toLowerCase()} pain worse? Check all that apply.`
      },
      'relieving_factors': {
        getter: getRelievingFactors,
        questionOverride: `What helps reduce your ${regionLabel.toLowerCase()} pain? Check all that apply.`
      },
      'functional_impact': {
        getter: getFunctionalLimitations,
        questionOverride: `What activities are difficult due to your ${regionLabel.toLowerCase()} condition? Check all that apply.`
      },
      'active_rom': {
        getter: getRomMovements,
        questionOverride: `Measure active range of motion for ${regionLabel.toLowerCase()} (degrees):`
      },
      'passive_rom': {
        getter: getRomMovements,
        questionOverride: `Measure passive range of motion for ${regionLabel.toLowerCase()} (degrees):`
      },
      'mmt_assessment': {
        getter: getMmtMuscleGroups,
        questionOverride: `Manual Muscle Testing for ${regionLabel} - rate strength (0-5 Oxford scale):`
      },
      'gait_analysis': {
        getter: getGaitObservations,
        questionOverride: `Observe gait pattern (${regionLabel.toLowerCase()} relevant findings):`
      },
      'posture_assessment': {
        getter: getPostureObservations,
        questionOverride: `Assess posture (${regionLabel.toLowerCase()} relevant findings):`
      },
      'tightness_assessment': {
        getter: getTightnessAssessment,
        questionOverride: `Assess muscle tightness for ${regionLabel.toLowerCase()}:`
      },
      'weakness_location': {
        getter: getMmtMuscleGroups,
        questionOverride: `Which ${regionLabel.toLowerCase()} muscles feel weak? Select all that apply.`
      },
      'mobility_limitations': {
        getter: getFunctionalLimitations,
        questionOverride: `What ${regionLabel.toLowerCase()} mobility limitations are you experiencing?`
      },
      'balance_assessment': {
        getter: getBalanceAssessment,
        questionOverride: `Assess balance related to ${regionLabel.toLowerCase()} condition:`
      }
    };

    const config = regionQuestionConfig[question.id];
    if (config) {
      // Determine if this question needs a "None" option
      const questionsWithNone = [
        'aggravating_factors', 'relieving_factors', 'functional_impact',
        'weakness_location', 'mobility_limitations'
      ];
      const needsNone = questionsWithNone.includes(question.id);
      const noneLabels: Record<string, string> = {
        'aggravating_factors': 'Nothing makes it worse',
        'relieving_factors': 'Nothing helps',
        'functional_impact': 'No functional limitations',
        'weakness_location': 'No weakness',
        'mobility_limitations': 'No mobility limitations'
      };

      // Combine options from all selected regions
      const combinedOptions = this.combineRegionOptions(regions, config.getter, {
        addNone: needsNone,
        addOther: true,
        noneLabel: noneLabels[question.id]
      });
      if (combinedOptions.length > 0) {
        question.options = combinedOptions;
        question.question = config.questionOverride;
      }
    }

    // Questions that only need region-specific question TEXT (not options)
    const textOnlyOverrides: Record<string, string> = {
      'sensation_type': `What kind of sensation changes are you experiencing in your ${regionLabel.toLowerCase()}?`,
      'sensations_assessment': `Test sensation in the ${regionLabel.toLowerCase()} area:`,
      'swelling_assessment': `Is there visible swelling in the ${regionLabel.toLowerCase()}?`,
      'tenderness_assessment': `Mark areas of tenderness around the ${regionLabel.toLowerCase()}:`
    };

    if (textOnlyOverrides[question.id]) {
      question.question = textOnlyOverrides[question.id];
    }

    // Special handling for dermatome assessment - combine dermatomes from all regions
    if (question.id === 'dermatome_assessment') {
      const allDermatomes = new Set<string>();
      regions.forEach(region => {
        if (hasRegionConfig(region)) {
          getRelevantDermatomes(region).forEach(d => allDermatomes.add(d));
        }
      });

      if (allDermatomes.size > 0) {
        // Sort dermatomes anatomically (C before T before L before S)
        const sortedDermatomes = Array.from(allDermatomes).sort((a, b) => {
          const order: Record<string, number> = { 'C': 1, 'T': 2, 'L': 3, 'S': 4 };
          const aPrefix = a.charAt(0);
          const bPrefix = b.charAt(0);
          if (aPrefix !== bPrefix) {
            return (order[aPrefix] || 5) - (order[bPrefix] || 5);
          }
          return parseInt(a.slice(1)) - parseInt(b.slice(1));
        });

        question.options = sortedDermatomes.map(d => ({
          value: d,
          label: `${d} dermatome`
        }));
        question.question = `Test dermatomes relevant to ${regionLabel.toLowerCase()} - which areas show sensation changes?`;
      }
    }

    // Special handling for myotome assessment - combine myotomes from all regions
    if (question.id === 'myotome_assessment') {
      const seenLevels = new Set<string>();
      const allMyotomes: { level: string; muscle: string; action: string }[] = [];

      regions.forEach(region => {
        if (hasRegionConfig(region)) {
          getRelevantMyotomes(region).forEach(m => {
            if (!seenLevels.has(m.level)) {
              seenLevels.add(m.level);
              allMyotomes.push(m);
            }
          });
        }
      });

      if (allMyotomes.length > 0) {
        // Sort myotomes anatomically
        allMyotomes.sort((a, b) => {
          const order: Record<string, number> = { 'C': 1, 'T': 2, 'L': 3, 'S': 4 };
          const aPrefix = a.level.charAt(0);
          const bPrefix = b.level.charAt(0);
          if (aPrefix !== bPrefix) {
            return (order[aPrefix] || 5) - (order[bPrefix] || 5);
          }
          // Handle compound levels like "T1-T12"
          const aNum = parseInt(a.level.split('-')[0].slice(1));
          const bNum = parseInt(b.level.split('-')[0].slice(1));
          return aNum - bNum;
        });

        question.options = allMyotomes.map(m => ({
          value: m.level,
          label: `${m.level} - ${m.muscle} (${m.action})`
        }));
        question.question = `Test myotomes relevant to ${regionLabel.toLowerCase()} - rate muscle strength (0-5 scale):`;
      }
    }

    // Special handling for reflex testing - show only relevant reflexes
    if (question.id === 'reflex_testing') {
      const seenReflexes = new Set<string>();
      const allReflexes: ReflexConfig[] = [];

      regions.forEach(region => {
        if (hasRegionConfig(region)) {
          getRelevantReflexes(region).forEach(r => {
            if (!seenReflexes.has(r.reflex)) {
              seenReflexes.add(r.reflex);
              allReflexes.push(r);
            }
          });
        }
      });

      if (allReflexes.length > 0) {
        question.options = allReflexes.map(r => ({
          value: r.reflex.toLowerCase().replace(/ /g, '_'),
          label: `${r.reflex} (${r.nerve} - ${r.level})`
        }));
        question.question = `Test reflexes relevant to ${regionLabel.toLowerCase()}:`;
      }
    }

    return question;
  }

  // Alias for backward compatibility
  getCurrentStep(): ScreeningQuestion | null {
    return this.getCurrentQuestion();
  }

  // Check if urgent referral is needed based on red flags
  requiresUrgentReferral(): boolean {
    this.checkRedFlags();
    return this.session.redFlagsDetected.length > 0;
  }

  // Create condition payload for saving to database
  createConditionPayload(condition: any): any {
    return {
      condition_id: condition.condition_id,
      condition_name: condition.condition_name,
      confidence_score: condition.confidence_score,
      clinical_reasoning: condition.clinical_reasoning,
      assessment_data: this.session.responses,
      screening_session_id: this.session.id
    };
  }

  async processResponse(questionId: string, response: any): Promise<string | null> {
    this.session.responses[questionId] = response;

    const nextSteps = this.determineNextSteps(questionId, response);
    const newSteps = nextSteps.filter(
      step => !this.session.responses[step] && !this.session.skippedSections.has(step)
    );
    this.session.questionQueue.push(...newSteps);

    this.updateCompletionPercentage();

    // Process queue
    let attempts = 0;
    const maxAttempts = 10;
    while (this.session.questionQueue.length > 0 && attempts < maxAttempts) {
      attempts++;
      const nextQuestionId = this.session.questionQueue.shift()!;

      if (!this.session.skippedSections.has(nextQuestionId) &&
          !this.session.responses[nextQuestionId]) {
        this.session.currentStepId = nextQuestionId;
        return nextQuestionId;
      }
    }

    // Check for remaining mandatory questions
    const mandatoryQuestion = this.getNextMandatoryQuestion();
    if (mandatoryQuestion &&
        !this.session.responses[mandatoryQuestion] &&
        !this.session.skippedSections.has(mandatoryQuestion)) {
      this.session.currentStepId = mandatoryQuestion;
      return mandatoryQuestion;
    }

    return null; // Assessment complete
  }

  private determineNextSteps(questionId: string, response: any): string[] {
    const steps: string[] = [];

    switch (questionId) {
      // ========== INITIAL FLOW ==========
      case 'chief_complaint':
        this.analyzeChiefComplaint(response);
        // First ask if patient has pain BEFORE pain assessment
        steps.push('pain_screening');
        break;

      case 'previous_episodes':
        // Conditional: Only ask comparison if they had previous episodes
        if (response === 'yes') {
          steps.push('previous_episode_comparison');
        }
        // Note: red_flag_screening is now pushed in the pain_location flow
        break;

      case 'red_flag_screening':
        // Store red flags and proceed to other pathway screenings
        if (Array.isArray(response) && response.length > 0) {
          this.session.redFlagsDetected = response;
        }
        // Continue to other pathway screenings
        steps.push('weakness_screening');
        break;

      // Pain screening gates the entire pain assessment section
      case 'pain_screening':
        if (response === 'yes') {
          // Activate PAIN pathway and proceed with pain assessment
          this.session.activatedPathways.add(PathwayType.PAIN);
          steps.push('pain_location');
          // Note: pain_location will then trigger the full pain assessment flow
        } else {
          // No pain - skip all pain questions and go to other screenings
          steps.push('weakness_screening');
        }
        break;

      case 'weakness_screening':
        if (response === 'yes') {
          this.session.activatedPathways.add(PathwayType.MOTOR);
          steps.push('weakness_location');
        }
        steps.push('sensation_screening');
        break;

      case 'sensation_screening':
        if (response === 'yes') {
          this.session.activatedPathways.add(PathwayType.SENSORY);
          this.session.activatedPathways.add(PathwayType.NEUROLOGICAL);
          steps.push('sensation_type');
        }
        steps.push('mobility_screening');
        break;

      case 'mobility_screening':
        if (response === 'yes') {
          this.session.activatedPathways.add(PathwayType.MOBILITY);
          steps.push('mobility_limitations');
        }
        steps.push('functional_impact');
        steps.push(...this.getDetailedAssessmentSequence());
        break;

      // ========== PAIN PATHWAY DETAILS ==========
      case 'pain_location':
        // Extract region names from body map response
        const regions = this.extractRegionsFromBodyMapResponse(response);
        this.session.selectedPainRegions = regions;

        // GROUP 1: Timeline questions (clubbed together)
        steps.push('symptom_onset', 'onset_nature', 'symptom_progression', 'previous_episodes');

        // GROUP 2: Pain characteristics (clubbed together)
        steps.push('vas_score', 'pain_nature');

        // GROUP 3: Red flag screening (safety-critical)
        steps.push('red_flag_screening');

        // GROUP 4: Region-specific referral screening
        const referralQuestions = this.generateReferralScreeningQuestions(regions);
        referralQuestions.forEach(q => {
          this.questionTemplates[q.id] = q;
          steps.push(q.id);
        });

        // GROUP 5: Pain behavior and aggravating/relieving factors
        steps.push('pain_radiation', 'aggravating_factors', 'relieving_factors');
        break;

      case 'pain_radiation':
        // Conditional: Only ask radiation pattern if pain radiates
        if (response === 'yes') {
          steps.push('radiation_pattern');
        }
        // vas_score is now asked earlier in the flow (after pain_location)
        break;

      case 'vas_score':
        // Always ask 24-hour behavior for pain patients
        steps.push('behavior_24hr');
        steps.push(...this.determinePainDepth(parseInt(response)));
        break;

      case 'behavior_24hr':
        // Conditional follow-ups based on 24-hour pattern
        if (response === 'morning_stiff' || response === 'morning_improves') {
          steps.push('morning_stiffness_duration');
        }
        if (response === 'night_pain') {
          steps.push('night_pain_details');
          // Night pain is a red flag indicator
          if (!this.session.redFlagsDetected.includes('night_pain')) {
            this.session.redFlagsDetected.push('night_pain_wakes_sleep');
          }
        }
        break;

      case 'pain_movement':
        if (response === 'increases') steps.push('aggravating_factors');
        if (response === 'decreases') steps.push('relieving_factors');
        if (response === 'varies') steps.push('aggravating_factors', 'relieving_factors');
        break;

      // ========== MOTOR PATHWAY ==========
      case 'weakness_location':
        // Note: mmt_assessment and active_rom moved to getDetailedAssessmentSequence
        // which is called AFTER mobility_screening to ensure proper question order
        break;

      // ========== SENSORY PATHWAY ==========
      case 'sensation_type':
        if (Array.isArray(response)) {
          if (response.includes('numbness') || response.includes('tingling')) {
            steps.push('dermatome_assessment', 'myotome_assessment', 'reflex_testing');
          }
          // Burning/hypersensitivity also suggests neuropathic component
          if (response.includes('burning') || response.includes('hypersensitive')) {
            if (!this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
              this.session.activatedPathways.add(PathwayType.NEUROLOGICAL);
            }
          }
        }
        break;

      // ========== OBJECTIVE ASSESSMENTS ==========
      case 'tenderness_assessment':
        if (this.hasTraumaIndicators()) {
          steps.push('swelling_assessment');
        }
        break;

      case 'swelling_assessment':
        if (response !== 'absent') {
          steps.push('girth_measurement');
        }
        break;

      default:
        // Store referral screening responses (questions dynamically added from referralPatterns)
        if (this.isReferralScreeningQuestion(questionId)) {
          this.session.referralScreeningResponses[questionId] = response;

          // Check if this is a red flag referral question with positive response
          if (response === 'yes') {
            const redFlagQuestionIds = getRedFlagQuestionIds();
            if (redFlagQuestionIds.includes(questionId)) {
              // Add to red flags detected
              const redFlagMessage = this.getRedFlagMessageForQuestion(questionId);
              if (redFlagMessage && !this.session.redFlagsDetected.includes(redFlagMessage)) {
                this.session.redFlagsDetected.push(redFlagMessage);
              }
            }
          }
        }
        break;
    }

    return steps;
  }

  private analyzeChiefComplaint(complaint: string): void {
    const text = complaint.toLowerCase();

    const painKeywords = ['pain', 'hurt', 'ache', 'sore', 'burning', 'sharp', 'throbbing'];
    const weaknessKeywords = ['weak', 'weakness', 'strength', 'cant lift', 'difficulty'];
    const sensoryKeywords = ['numb', 'numbness', 'tingling', 'pins and needles', 'sensation'];
    const mobilityKeywords = ['stiff', 'stiffness', 'tight', 'cant move', 'restricted', 'frozen'];
    const balanceKeywords = ['balance', 'fall', 'falling', 'unsteady', 'dizzy'];

    if (painKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.PAIN);
    }
    if (weaknessKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.MOTOR);
    }
    if (sensoryKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.SENSORY);
    }
    if (mobilityKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.MOBILITY);
    }
    if (balanceKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.BALANCE);
    }

    this.session.activatedPathways.add(PathwayType.OBJECTIVE);
    this.session.activatedPathways.add(PathwayType.FUNCTIONAL);
  }

  // ==================== REFERRAL PATTERN SCREENING METHODS ====================

  /**
   * Extract region names from body map response
   * Handles both flat array format and structured format from BodyMapSelector
   * Uses normalizeRegion for consistent region naming
   */
  private extractRegionsFromBodyMapResponse(response: any): string[] {
    const regions: Set<string> = new Set();

    // Handle structured response from BodyMapSelector
    if (response?.detailed && Array.isArray(response.detailed)) {
      response.detailed.forEach((selection: any) => {
        if (selection.mainRegion) {
          // Use centralised normalizeRegion for consistency
          const regionName = normalizeRegion(selection.mainRegion);
          regions.add(regionName);
        }
      });
    }

    // Handle flat array format
    if (Array.isArray(response)) {
      response.forEach((item: any) => {
        if (typeof item === 'string') {
          // Extract base region from strings like 'shoulder_left', 'knee_right'
          const baseRegion = item.toLowerCase().replace(/_left|_right|_both/g, '');
          regions.add(normalizeRegion(baseRegion));
        } else if (item?.mainRegion) {
          regions.add(normalizeRegion(item.mainRegion));
        }
      });
    }

    // Handle regions array within response
    if (response?.regions && Array.isArray(response.regions)) {
      response.regions.forEach((region: string) => {
        const baseRegion = region.toLowerCase().replace(/_left|_right|_both/g, '');
        regions.add(normalizeRegion(baseRegion));
      });
    }

    return Array.from(regions);
  }

  /**
   * Generate referral screening questions based on selected pain regions
   * Returns 2-3 key questions per region
   */
  private generateReferralScreeningQuestions(regions: string[]): ScreeningQuestion[] {
    const questions: ScreeningQuestion[] = [];
    const addedQuestionIds = new Set<string>();

    regions.forEach(region => {
      const referralQuestions = getReferralQuestions(region);

      referralQuestions.forEach(rq => {
        if (!addedQuestionIds.has(rq.id)) {
          addedQuestionIds.add(rq.id);

          // Convert to engine format (all are yes_no)
          questions.push({
            id: rq.id,
            type: 'yes_no',
            question: rq.question
          });
        }
      });
    });

    return questions;
  }

  /**
   * Check if a question ID is a referral screening question
   */
  private isReferralScreeningQuestion(questionId: string): boolean {
    // Check against all possible referral question IDs
    const referralPrefixes = [
      'shoulder_', 'elbow_', 'forearm_', 'wrist_', 'hand_',
      'lb_', 'hip_', 'thigh_', 'knee_', 'calf_', 'ankle_', 'foot_',
      'neck_', 'headache_', 'chest_', 'thoracic_', 'abdomen_'
    ];
    return referralPrefixes.some(prefix => questionId.startsWith(prefix));
  }

  /**
   * Get red flag message for a specific question ID
   */
  private getRedFlagMessageForQuestion(questionId: string): string | null {
    const redFlagMessages: Record<string, string> = {
      'calf_swelling': 'Unilateral calf swelling - DVT must be ruled out. Urgent vascular assessment required.'
    };
    return redFlagMessages[questionId] || null;
  }

  /**
   * Evaluate referral screening responses and identify potential source regions
   */
  private evaluateReferralScreening(): void {
    const regions = this.session.selectedPainRegions;
    const findings: ReferralFinding[] = [];

    regions.forEach(region => {
      // Use normalizeRegion for consistent matching
      const normalizedRegion = normalizeRegion(region);
      const results = evaluateReferralResponses(normalizedRegion, this.session.referralScreeningResponses);

      results.forEach(result => {
        // Avoid duplicates
        const exists = findings.some(
          f => f.sourceRegion === result.sourceRegion && f.implication === result.implication
        );
        if (!exists) {
          findings.push({
            sourceRegion: result.sourceRegion,
            implication: result.implication,
            isRedFlag: result.isRedFlag
          });
        }
      });
    });

    this.session.identifiedReferralSources = findings;
  }

  /**
   * Get identified referral sources for display
   */
  getIdentifiedReferralSources(): ReferralFinding[] {
    // Evaluate before returning
    this.evaluateReferralScreening();
    return this.session.identifiedReferralSources;
  }

  /**
   * Get the selected pain regions
   */
  getSelectedPainRegions(): string[] {
    return this.session.selectedPainRegions;
  }

  /**
   * Get region config for a specific region (for UI access)
   */
  getRegionConfigForUI(region?: string) {
    const targetRegion = region || this.session.selectedPainRegions[0];
    if (!targetRegion) return null;
    return getRegionConfig(targetRegion);
  }

  private determinePainDepth(vasScore: number): string[] {
    if (vasScore <= 3) {
      return ['pain_movement', 'functional_impact'];
    } else if (vasScore <= 6) {
      return ['pain_nature', 'pain_timing', 'pain_movement'];
    } else {
      return ['pain_nature', 'pain_timing', 'pain_movement', 'aggravating_factors', 'relieving_factors'];
    }
  }

  private getDetailedAssessmentSequence(): string[] {
    const assessments: string[] = [];

    if (this.session.activatedPathways.has(PathwayType.PAIN)) {
      assessments.push('tenderness_assessment');
    }

    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      assessments.push('mmt_assessment', 'active_rom');
    }

    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
      assessments.push('dermatome_assessment', 'myotome_assessment', 'reflex_testing');
    }

    assessments.push('swelling_assessment', 'posture_assessment', 'gait_analysis', 'adl_scoring');
    assessments.push('condition_classification');

    return assessments;
  }

  private getNextMandatoryQuestion(): string | null {
    const sequence = [
      // Initial Assessment
      'chief_complaint',
      'symptom_onset',
      'onset_nature',
      'symptom_progression',
      'previous_episodes',
      // Red Flag Screening (CRITICAL - early in flow)
      'red_flag_screening',
      // Pathway Screening
      'pain_screening',
      'weakness_screening',
      'sensation_screening',
      'mobility_screening',
      // Pain Pathway (conditional)
      ...(this.session.activatedPathways.has(PathwayType.PAIN) ? [
        'pain_location',
        'pain_nature',
        'pain_radiation',
        'vas_score',
        'behavior_24hr',
        'pain_timing',
        'pain_movement',
        'tenderness_assessment'
      ] : []),
      // Motor Pathway (conditional)
      ...(this.session.activatedPathways.has(PathwayType.MOTOR) ? [
        'weakness_location', 'mmt_assessment', 'active_rom'
      ] : []),
      // Sensory Pathway (conditional)
      ...(this.session.activatedPathways.has(PathwayType.SENSORY) ? [
        'sensation_type', 'sensations_assessment', 'dermatome_assessment'
      ] : []),
      // Neurological (conditional)
      ...(this.session.activatedPathways.has(PathwayType.NEUROLOGICAL) ? [
        'myotome_assessment', 'reflex_testing'
      ] : []),
      // Objective Assessments
      'swelling_assessment',
      'posture_assessment',
      'gait_analysis',
      // Functional
      'functional_impact',
      'adl_scoring',
      // Final Classification
      'condition_classification'
    ];

    for (const questionId of sequence) {
      if (!this.session.responses[questionId] &&
          !this.session.skippedSections.has(questionId) &&
          this.questionTemplates[questionId]) {
        return questionId;
      }
    }

    return null;
  }

  private hasTraumaIndicators(): boolean {
    const complaint = this.session.responses['chief_complaint']?.toLowerCase() || '';
    return complaint.includes('injury') ||
           complaint.includes('trauma') ||
           complaint.includes('fell') ||
           complaint.includes('twisted') ||
           complaint.includes('sprained');
  }

  private updateCompletionPercentage(): void {
    const totalQuestions = this.getRelevantQuestionCount();
    const answeredQuestions = Object.keys(this.session.responses).length;
    this.session.completionPercentage = totalQuestions > 0 ?
      Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  }

  private getRelevantQuestionCount(): number {
    let count = 5; // Base questions

    if (this.session.activatedPathways.has(PathwayType.PAIN)) count += 7;
    if (this.session.activatedPathways.has(PathwayType.MOTOR)) count += 3;
    if (this.session.activatedPathways.has(PathwayType.SENSORY)) count += 3;
    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) count += 3;

    count += 6; // Objective assessments

    return count;
  }

  getSession(): ScreeningSession & { currentStepIndex: number } {
    return {
      ...this.session,
      activatedPathways: new Set(this.session.activatedPathways),
      skippedSections: new Set(this.session.skippedSections),
      currentStepIndex: Object.keys(this.session.responses).length
    };
  }

  getCurrentStepIndex(): number {
    return Object.keys(this.session.responses).length;
  }

  getTotalSteps(): number {
    return this.getRelevantQuestionCount();
  }

  getProgress(): number {
    return this.session.completionPercentage;
  }

  checkRedFlags(): string[] {
    const redFlags: string[] = [];
    const responses = this.session.responses;

    // Check explicit red flag screening responses
    const screenedFlags = responses['red_flag_screening'];
    if (Array.isArray(screenedFlags) && screenedFlags.length > 0) {
      const flagLabels: Record<string, string> = {
        'unexplained_weight_loss': 'Unexplained weight loss - screen for malignancy',
        'night_sweats_fever': 'Night sweats/fever - screen for infection/malignancy',
        'bowel_bladder': 'Bowel/bladder dysfunction - CAUDA EQUINA ALERT',
        'saddle_numbness': 'Saddle anesthesia - CAUDA EQUINA ALERT',
        'progressive_weakness': 'Progressive leg weakness - urgent neurological evaluation',
        'bilateral_leg_symptoms': 'Bilateral symptoms - central pathology concern',
        'constant_unrelenting_pain': 'Constant unrelenting pain - serious pathology screen',
        'history_cancer': 'History of cancer - screen for metastatic disease',
        'recent_trauma': 'Recent trauma - fracture/instability screen',
        'long_term_steroids': 'Long-term steroids - osteoporosis/fracture risk',
        'iv_drug_use': 'IV drug use - infection risk (discitis/osteomyelitis)',
        'immunosuppressed': 'Immunosuppression - infection/atypical presentation risk'
      };

      screenedFlags.forEach((flag: string) => {
        if (flagLabels[flag]) {
          redFlags.push(flagLabels[flag]);
        }
      });
    }

    // Check derived red flags from other responses
    if (responses['pain_timing'] === 'constant' && responses['vas_score'] > 8) {
      redFlags.push('Severe constant pain (VAS >8) - requires evaluation');
    }

    if (responses['sensation_type']?.includes('complete_loss')) {
      redFlags.push('Complete sensory loss - neurological evaluation required');
    }

    // Night pain that wakes from sleep
    if (responses['behavior_24hr'] === 'night_pain') {
      redFlags.push('Night pain waking from sleep - screen for serious pathology');
    }

    if (responses['night_pain_details'] === 'constant_night') {
      redFlags.push('Constant night pain regardless of position - urgent evaluation');
    }

    // Morning stiffness >60 min suggests inflammatory condition
    if (responses['morning_stiffness_duration'] === 'more_60min' ||
        responses['morning_stiffness_duration'] === 'all_day') {
      redFlags.push('Prolonged morning stiffness (>60min) - inflammatory condition likely');
    }

    // Check chief complaint for keywords
    const complaint = responses['chief_complaint']?.toLowerCase() || '';
    if (complaint.includes('bowel') || complaint.includes('bladder') ||
        complaint.includes('incontinence') || complaint.includes('retention')) {
      if (!redFlags.some(f => f.includes('CAUDA EQUINA'))) {
        redFlags.push('Bowel/bladder mentioned - CAUDA EQUINA screen required');
      }
    }

    // Progressive symptoms with weakness
    if (responses['symptom_progression'] === 'getting_worse' &&
        responses['weakness_screening'] === 'yes') {
      redFlags.push('Progressive weakness - urgent neurological assessment');
    }

    this.session.redFlagsDetected = redFlags;
    return redFlags;
  }

  // Helper to format value for display
  private formatResponseValue(value: any): string {
    if (value === null || value === undefined || value === '') return '';

    if (Array.isArray(value)) {
      return value.map((v: any) => {
        if (typeof v === 'string') return v.replace(/_/g, ' ');
        if (typeof v === 'object') return v?.slug?.replace(/_/g, ' ') || v?.name?.replace(/_/g, ' ') || String(v);
        return String(v);
      }).filter(Boolean).join(', ');
    }

    if (typeof value === 'object') {
      return value?.slug?.replace(/_/g, ' ') || value?.name?.replace(/_/g, ' ') || '';
    }

    if (typeof value === 'string') {
      return value.replace(/_/g, ' ');
    }

    return String(value);
  }

  // Helper to get ICF code string
  private getICFCode(questionId: string): string {
    const icf = ICF_CODES[questionId];
    return icf ? `[ICF ${icf.code}]` : '';
  }

  generateClinicalSummary(): string {
    const r = this.session.responses;
    let summary = '';

    // ==================== HEADER ====================
    summary += `════════════════════════════════════════════════════════════════\n`;
    summary += `                    CLINICAL ASSESSMENT REPORT\n`;
    summary += `════════════════════════════════════════════════════════════════\n\n`;

    // ==================== RED FLAGS (PRIORITY) ====================
    this.checkRedFlags();
    if (this.session.redFlagsDetected.length > 0) {
      summary += `⚠️  RED FLAGS IDENTIFIED ${this.getICFCode('red_flag_screening')}\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;
      this.session.redFlagsDetected.forEach(flag => {
        summary += `  ● ${this.formatResponseValue(flag)}\n`;
      });
      summary += `\n`;
    }

    // ==================== CHIEF COMPLAINT ====================
    if (r.chief_complaint) {
      summary += `CHIEF COMPLAINT ${this.getICFCode('chief_complaint')}\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;
      summary += `${r.chief_complaint}\n\n`;
    }

    // ==================== HISTORY / TIMELINE ====================
    summary += `HISTORY & TIMELINE\n`;
    summary += `────────────────────────────────────────────────────────────────\n`;

    if (r.symptom_onset) {
      const daysSince = Math.floor((Date.now() - new Date(r.symptom_onset).getTime()) / (1000 * 60 * 60 * 24));
      const chronicity = daysSince <= 42 ? 'Acute' : daysSince <= 84 ? 'Subacute' : 'Chronic';
      summary += `  Onset:              ${new Date(r.symptom_onset).toLocaleDateString()} (${daysSince} days - ${chronicity}) ${this.getICFCode('symptom_onset')}\n`;
    }
    if (r.onset_nature) {
      summary += `  Onset Type:         ${this.formatResponseValue(r.onset_nature)}\n`;
    }
    if (r.symptom_progression) {
      summary += `  Progression:        ${this.formatResponseValue(r.symptom_progression)} ${this.getICFCode('symptom_progression')}\n`;
    }
    if (r.previous_episodes) {
      summary += `  Previous Episodes:  ${r.previous_episodes === 'yes' ? 'Yes' : 'No'} ${this.getICFCode('previous_episodes')}\n`;
      if (r.previous_episodes === 'yes' && r.previous_episode_comparison) {
        summary += `  Comparison:         ${this.formatResponseValue(r.previous_episode_comparison)}\n`;
      }
    }

    // Classification
    if (r.condition_classification) {
      summary += `  Classification:     ${r.condition_classification.toUpperCase()}\n`;
    }
    summary += `\n`;

    // ==================== PAIN ASSESSMENT ====================
    if (r.pain_screening === 'yes' || this.session.activatedPathways.has(PathwayType.PAIN)) {
      summary += `PAIN ASSESSMENT ${this.getICFCode('pain_screening')}\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;

      if (r.pain_screening) {
        summary += `  Has Pain:           ${r.pain_screening === 'yes' ? 'Yes' : 'No'} ${this.getICFCode('pain_screening')}\n`;
      }
      if (r.pain_location) {
        summary += `  Location:           ${this.formatResponseValue(r.pain_location)} ${this.getICFCode('pain_location')}\n`;
      }
      if (r.vas_score !== undefined) {
        const severity = r.vas_score >= 7 ? '(Severe)' : r.vas_score >= 4 ? '(Moderate)' : '(Mild)';
        summary += `  VAS Score:          ${r.vas_score}/10 ${severity} ${this.getICFCode('vas_score')}\n`;
      }
      if (r.pain_nature) {
        summary += `  Pain Nature:        ${this.formatResponseValue(r.pain_nature)} ${this.getICFCode('pain_nature')}\n`;
      }
      if (r.pain_radiation) {
        summary += `  Radiation:          ${r.pain_radiation === 'yes' ? 'Yes' : 'No'} ${this.getICFCode('pain_radiation')}\n`;
        if (r.pain_radiation === 'yes' && r.radiation_pattern) {
          summary += `  Radiation Pattern:  ${this.formatResponseValue(r.radiation_pattern)}\n`;
        }
      }
      if (r.pain_timing) {
        summary += `  Timing:             ${this.formatResponseValue(r.pain_timing)}\n`;
      }
      if (r.pain_movement) {
        summary += `  Movement Response:  ${this.formatResponseValue(r.pain_movement)}\n`;
      }
      summary += `\n`;
    }

    // ==================== 24-HOUR PATTERN ====================
    if (r.behavior_24hr) {
      summary += `24-HOUR BEHAVIOR PATTERN ${this.getICFCode('behavior_24hr')}\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;

      const behaviorLabels: Record<string, string> = {
        'morning_stiff': 'Worst in morning (stiffness) - INFLAMMATORY?',
        'morning_improves': 'Morning pain, improves with movement - MECHANICAL',
        'end_of_day': 'Worse at end of day - MECHANICAL',
        'night_pain': 'Night pain (wakes from sleep) - INVESTIGATE',
        'constant': 'Constant throughout day - INFLAMMATORY/SERIOUS',
        'variable': 'Variable/unpredictable'
      };
      summary += `  Pattern:            ${behaviorLabels[r.behavior_24hr] || this.formatResponseValue(r.behavior_24hr)}\n`;

      if (r.morning_stiffness_duration) {
        const durationLabels: Record<string, string> = {
          'less_15min': '<15 minutes (mechanical)',
          '15_30min': '15-30 minutes',
          '30_60min': '30-60 minutes (inflammatory?)',
          'more_60min': '>60 minutes (INFLAMMATORY)',
          'all_day': 'Most of day (INFLAMMATORY)'
        };
        summary += `  Morning Stiffness:  ${durationLabels[r.morning_stiffness_duration] || r.morning_stiffness_duration} ${this.getICFCode('morning_stiffness_duration')}\n`;
      }
      if (r.night_pain_details) {
        summary += `  Night Pain Detail:  ${this.formatResponseValue(r.night_pain_details)}\n`;
      }
      summary += `\n`;
    }

    // ==================== MODIFYING FACTORS ====================
    if (r.aggravating_factors || r.relieving_factors) {
      summary += `MODIFYING FACTORS ${this.getICFCode('aggravating_factors')}\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;
      if (r.aggravating_factors) {
        summary += `  Aggravating:        ${this.formatResponseValue(r.aggravating_factors)}\n`;
      }
      if (r.relieving_factors) {
        summary += `  Relieving:          ${this.formatResponseValue(r.relieving_factors)}\n`;
      }
      summary += `\n`;
    }

    // ==================== NEUROLOGICAL / SENSORY ====================
    if (r.weakness_screening || r.sensation_screening ||
        this.session.activatedPathways.has(PathwayType.NEUROLOGICAL) ||
        this.session.activatedPathways.has(PathwayType.SENSORY) ||
        this.session.activatedPathways.has(PathwayType.MOTOR)) {

      summary += `NEUROLOGICAL SCREENING\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;

      if (r.weakness_screening) {
        summary += `  Weakness Present:   ${r.weakness_screening === 'yes' ? 'Yes' : 'No'} ${this.getICFCode('weakness_screening')}\n`;
      }
      if (r.weakness_location) {
        summary += `  Weakness Location:  ${this.formatResponseValue(r.weakness_location)} ${this.getICFCode('weakness_location')}\n`;
      }
      if (r.sensation_screening) {
        summary += `  Sensation Changes:  ${r.sensation_screening === 'yes' ? 'Yes' : 'No'} ${this.getICFCode('sensation_screening')}\n`;
      }
      if (r.sensation_type) {
        summary += `  Sensation Type:     ${this.formatResponseValue(r.sensation_type)} ${this.getICFCode('sensation_type')}\n`;
      }
      if (r.dermatome_assessment) {
        summary += `  Dermatomes:         ${this.formatResponseValue(r.dermatome_assessment)}\n`;
      }
      summary += `\n`;
    }

    // ==================== MOBILITY ====================
    if (r.mobility_screening || this.session.activatedPathways.has(PathwayType.MOBILITY)) {
      summary += `MOBILITY ASSESSMENT ${this.getICFCode('mobility_screening')}\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;

      if (r.mobility_screening) {
        summary += `  Mobility Issues:    ${r.mobility_screening === 'yes' ? 'Yes' : 'No'}\n`;
      }
      if (r.mobility_limitations) {
        summary += `  Limitations:        ${this.formatResponseValue(r.mobility_limitations)} ${this.getICFCode('mobility_limitations')}\n`;
      }
      summary += `\n`;
    }

    // ==================== FUNCTIONAL IMPACT ====================
    if (r.functional_impact) {
      summary += `FUNCTIONAL IMPACT ${this.getICFCode('functional_impact')}\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;
      summary += `  Affected Activities: ${this.formatResponseValue(r.functional_impact)}\n\n`;
    }

    // ==================== REFERRAL SCREENING ====================
    this.evaluateReferralScreening();
    if (this.session.identifiedReferralSources.length > 0) {
      summary += `REFERRAL SCREENING (Source vs Site Analysis)\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;
      summary += `  Pain Site:          ${this.session.selectedPainRegions.map(r => r.replace(/_/g, ' ')).join(', ')}\n`;
      summary += `  Potential Sources:\n`;

      this.session.identifiedReferralSources.forEach(source => {
        const isUrgent = source.sourceRegion.toLowerCase().includes('cardiac') ||
          source.sourceRegion.toLowerCase().includes('gallbladder') ||
          source.sourceRegion.toLowerCase().includes('vascular');
        const marker = isUrgent ? '⚠️' : '  ';
        summary += `  ${marker} ${source.sourceRegion.toUpperCase().padEnd(15)} ${source.implication}\n`;
      });

      // Clinical notes
      this.session.selectedPainRegions.forEach(region => {
        const note = getClinicalNote(region);
        if (note) {
          summary += `\n  Clinical Note (${region}): ${note}\n`;
        }
      });
      summary += `\n`;
    }

    // ==================== ALL OTHER RESPONSES ====================
    // Show any responses not already displayed above
    const displayedKeys = new Set([
      'chief_complaint', 'symptom_onset', 'onset_nature', 'symptom_progression',
      'previous_episodes', 'previous_episode_comparison', 'condition_classification',
      'pain_screening', 'pain_location', 'vas_score', 'pain_nature', 'pain_radiation',
      'radiation_pattern', 'pain_timing', 'pain_movement', 'behavior_24hr',
      'morning_stiffness_duration', 'night_pain_details', 'aggravating_factors',
      'relieving_factors', 'weakness_screening', 'weakness_location', 'sensation_screening',
      'sensation_type', 'dermatome_assessment', 'mobility_screening', 'mobility_limitations',
      'functional_impact', 'red_flag_screening'
    ]);

    const otherResponses = Object.entries(r).filter(([key]) => !displayedKeys.has(key));
    if (otherResponses.length > 0) {
      summary += `ADDITIONAL DATA COLLECTED\n`;
      summary += `────────────────────────────────────────────────────────────────\n`;
      otherResponses.forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const icfCode = this.getICFCode(key);
          summary += `  ${label.padEnd(20)} ${this.formatResponseValue(value)} ${icfCode}\n`;
        }
      });
      summary += `\n`;
    }

    // ==================== FOOTER ====================
    summary += `════════════════════════════════════════════════════════════════\n`;
    summary += `Generated: ${new Date().toLocaleString()}\n`;
    summary += `ICF = International Classification of Functioning (WHO)\n`;
    summary += `════════════════════════════════════════════════════════════════\n`;

    return summary;
  }

  async prepareDiagnosticPayload(): Promise<any> {
    const r = this.session.responses;

    // Calculate chronicity from onset date
    let chronicity = 'unknown';
    if (r.symptom_onset) {
      const daysSince = Math.floor((Date.now() - new Date(r.symptom_onset).getTime()) / (1000 * 60 * 60 * 24));
      chronicity = daysSince <= 42 ? 'acute' : daysSince <= 84 ? 'subacute' : 'chronic';
    }

    // Determine if inflammatory pattern
    const inflammatoryIndicators = [
      r.morning_stiffness_duration === 'more_60min',
      r.morning_stiffness_duration === 'all_day',
      r.behavior_24hr === 'morning_stiff'
    ].filter(Boolean).length;

    let availableConditions: any[] = [];
    try {
      const conditionsData = await import('../../database/conditions_for_agent.json');
      availableConditions = conditionsData.conditions || [];

      if (r.pain_location) {
        const locations = Array.isArray(r.pain_location) ? r.pain_location : [r.pain_location];
        const regionMap: Record<string, string[]> = {
          'lower_back': ['lumbar_spine', 'lumbar'],
          'upper_back': ['thoracic_spine', 'thoracic'],
          'neck': ['cervical_spine', 'cervical'],
          'shoulder_left': ['shoulder'],
          'shoulder_right': ['shoulder'],
          'shoulder_both': ['shoulder'],
          'knee_left': ['knee'],
          'knee_right': ['knee'],
          'knee_both': ['knee'],
          'hip_left': ['hip'],
          'hip_right': ['hip'],
          'hip_both': ['hip'],
          'ankle_left': ['ankle'],
          'ankle_right': ['ankle'],
          'wrist_left': ['wrist'],
          'wrist_right': ['wrist'],
          'elbow_left': ['elbow'],
          'elbow_right': ['elbow']
        };

        const targetRegions: string[] = [];
        locations.forEach((loc: any) => {
          // Handle both string values and objects (from body map)
          const locString = typeof loc === 'string' ? loc : (loc?.slug || loc?.id || loc?.name || '');
          if (locString && typeof locString === 'string') {
            const mapped = regionMap[locString.toLowerCase()];
            if (mapped) targetRegions.push(...mapped);
          }
        });

        if (targetRegions.length > 0) {
          availableConditions = availableConditions.filter((c: any) =>
            targetRegions.some(region => c.body_region?.toLowerCase().includes(region))
          );
        }
      }

      availableConditions = availableConditions.slice(0, 50);
    } catch (error) {
      console.error('Failed to load conditions:', error);
    }

    // Ensure red flags are evaluated
    this.checkRedFlags();

    return {
      assessment_data: {
        clinicalFindings: {
          chief_complaint: r.chief_complaint,
          history: {
            onset_date: r.symptom_onset,
            chronicity: chronicity,
            onset_nature: r.onset_nature,
            progression: r.symptom_progression,
            previous_episodes: r.previous_episodes,
            episode_comparison: r.previous_episode_comparison
          },
          pain: {
            location: r.pain_location,
            nature: r.pain_nature,
            vas_score: r.vas_score,
            radiation: r.pain_radiation,
            radiation_pattern: r.radiation_pattern,
            timing: r.pain_timing,
            movement_relation: r.pain_movement,
            aggravating_factors: r.aggravating_factors,
            relieving_factors: r.relieving_factors
          },
          behavior_pattern: {
            worst_time: r.behavior_24hr,
            morning_stiffness_duration: r.morning_stiffness_duration,
            night_pain_details: r.night_pain_details,
            inflammatory_pattern: inflammatoryIndicators >= 2
          },
          motor: {
            weakness_screening: r.weakness_screening,
            weakness_location: r.weakness_location,
            mmt: r.mmt_assessment
          },
          sensory: {
            sensation_screening: r.sensation_screening,
            sensation_type: r.sensation_type,
            dermatomes: r.dermatome_assessment,
            reflexes: r.reflex_testing
          },
          functional: {
            impact: r.functional_impact,
            mobility_limitations: r.mobility_limitations,
            adl_scores: r.adl_scoring
          },
          objective: {
            swelling: r.swelling_assessment,
            tenderness: r.tenderness_assessment,
            posture: r.posture_assessment,
            gait: r.gait_analysis
          },
          red_flags: {
            screened: r.red_flag_screening || [],
            detected: this.session.redFlagsDetected,
            requires_urgent_referral: this.session.redFlagsDetected.some(
              f => f.includes('CAUDA EQUINA') || f.includes('urgent') || f.includes('ALERT')
            )
          }
        },
        activated_pathways: Array.from(this.session.activatedPathways),
        condition_classification: r.condition_classification,
        // Include referral pattern findings for better diagnosis
        referral_screening: {
          pain_regions: this.session.selectedPainRegions,
          identified_sources: this.session.identifiedReferralSources.map(s => ({
            source_region: s.sourceRegion,
            implication: s.implication
          })),
          consider_source_vs_site: this.session.identifiedReferralSources.length > 0
        }
      },
      available_conditions: availableConditions.map((c: any) => ({
        id: c.id,
        name: c.name,
        body_region: c.body_region,
        specialty: c.specialty || 'musculoskeletal'
      })),
      request_type: 'differential_diagnosis',
      max_conditions: 5,
      confidence_threshold: 0.3
    };
  }

  async getDiagnosis(): Promise<DiagnosisResult> {
    try {
      const payload = await this.prepareDiagnosticPayload();
      console.log('Requesting AI diagnosis...');

      const diagnosis = await aiDiagnosticService.getDifferentialDiagnosis(payload);

      return {
        success: true,
        diagnosis,
        clinicalSummary: this.generateClinicalSummary()
      };
    } catch (error: any) {
      console.error('Diagnosis error:', error);
      return {
        success: false,
        error: error.message,
        clinicalSummary: this.generateClinicalSummary()
      };
    }
  }

  reset(): void {
    this.session = {
      id: `screening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId: this.session.patientId,
      responses: {},
      currentStepId: 'chief_complaint',
      activatedPathways: new Set(),
      skippedSections: new Set(),
      questionQueue: [],
      completionPercentage: 0,
      startTime: new Date(),
      redFlagsDetected: [],
      // Reset referral pattern tracking
      selectedPainRegions: [],
      referralScreeningResponses: {},
      identifiedReferralSources: []
    };
    // Reset question templates to original (remove dynamically added referral questions)
    this.questionTemplates = { ...QUESTION_TEMPLATES };
  }
}

export default SmartScreeningEngine;
