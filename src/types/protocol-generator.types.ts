// Legacy request format - for backward compatibility
export interface ProtocolGenerationRequest {
  patientId: string;
  conditionId: string;
  planType: 'home' | 'clinical';
  visitId?: string;
  preferences?: ProtocolPreferences;
}

// New direct request format - with all data included
export interface DirectProtocolGenerationRequest {
  patient: {
    fullName: string;
    age: number;
    gender: string;
    occupation?: string;
    activityLevel?: string;
    medicalHistory?: any;
    previousSurgeries?: any;
    medications?: any;
    chronicConditions?: any;
  };
  patientCondition: {
    name: string;
    severity?: string;
    painLevel?: number;
    functionalLimitations?: any;
    redFlags?: any;
    differentialDiagnosis?: any;
    initialAssessment?: any;
    description?: string;
    onsetDate?: string;
    chiefComplaint?: string;
  };
  staticCondition: {
    conditionName: string;
    exercises: string[];
    modalities: any[];
    manualTherapy: string[];
    contraindications: any;
    redFlags: any;
    yellowFlags: string[];
    specialTests: any;
    outcomeMeasures: any;
    prognosisTimeline?: any;
    icd10Codes?: any;
    cptCodes?: string[];
  };
  planType: 'home' | 'clinical';
  preferences?: ProtocolPreferences;
}

// Extended static condition data for customization
export interface StaticConditionForCustomization {
  conditionName: string;
  allExercises: StaticExercise[];
  allModalities: StaticModality[];
  allManualTherapy: StaticManualTherapy[];
  contraindications: any;
  redFlags: any;
  yellowFlags: string[];
  specialTests: any;
  outcomeMeasures: any;
  prognosisTimeline?: any;
  icd10Codes?: any;
  cptCodes?: string[];
}

// Static data structures for customization
export interface StaticExercise {
  id: string;
  name: string;
  category: string;
  bodyRegion: string;
  description: string;
  instructions: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  contraindications: string[];
  indications: string[];
  evidenceLevel: string;
  isUsedByAI?: boolean;
}

export interface StaticModality {
  id: string;
  name: string;
  category: string;
  description: string;
  indications: string[];
  contraindications: string[];
  parameters: {
    intensity?: string;
    duration?: string;
    frequency?: string;
  };
  clinicalSupervisionRequired: boolean;
  evidenceLevel: string;
  isUsedByAI?: boolean;
}

export interface StaticManualTherapy {
  id: string;
  name: string;
  technique: string;
  category: string;
  description: string;
  indications: string[];
  contraindications: string[];
  parameters: {
    frequency?: string;
    sessionDuration?: string;
    intensity?: string;
  };
  clinicalSupervisionRequired: boolean;
  evidenceLevel: string;
  isUsedByAI?: boolean;
}

// Legacy interface for backward compatibility
export interface ExerciseProtocol {
  exerciseName: string;
  instructions: string;
  frequency: string;
  sets: number;
  repetitions: string;
  holdDuration: string;
  equipment: string[];
  progressionCues: string;
  safetyNotes: string;
}

// New editable exercise structure
export interface EditableExercise {
  exerciseId: string;
  name: string;
  category: string; // 'strength' | 'mobility' | 'endurance' | 'balance'
  bodyRegion: string;
  parameters: {
    sets: number;
    reps: string; // "12-15" or "10"
    hold?: number; // seconds
    rest?: number; // seconds between sets
    frequency: number; // sessions per week
    intensity: 'low' | 'moderate' | 'high';
    progression: string; // "increase weight weekly"
  };
  equipment: string[];
  isEnabled: boolean;
  reasoning: {
    indication: string;
    biomechanics: string;
    evidence: string;
    clinicalRationale: string;
  };
  contraindications: string[];
  modifications: string[];
  progressions: string[];
}

// Legacy interface for backward compatibility
export interface ModalityProtocol {
  modalityName: string;
  parameters: string;
  duration: string;
  frequency: string;
  applicationMethod: string;
  clinicalSupervisionRequired: boolean;
}

// New editable modality structure
export interface EditableModality {
  modalityId: string;
  name: string;
  category: string; // 'thermal' | 'electrical' | 'mechanical' | 'manual'
  parameters: {
    intensity: string;
    duration: number; // minutes
    frequency: number; // per week
    progression: string;
  };
  isEnabled: boolean;
  clinicalSupervisionRequired: boolean;
  reasoning: {
    indication: string;
    mechanism: string;
    evidence: string;
    expectedOutcome: string;
  };
  contraindications: string[];
  precautions: string[];
}

export interface ManualTherapyProtocol {
  technique: string;
  frequency: string;
  sessionDuration: string;
  clinicalOnly: boolean;
  expectedOutcome: string;
}

// Legacy interface for backward compatibility
export interface TreatmentPhase {
  phaseName: string;
  durationWeeks: number;
  primaryGoals: string[];
  exercises: ExerciseProtocol[];
  modalities: ModalityProtocol[];
  manualTherapy: ManualTherapyProtocol[];
}

// New editable treatment phase structure
export interface EditableTreatmentPhase {
  phaseId: string;
  phaseNumber: number;
  name: string;
  duration: number; // weeks
  goals: string[];
  exercises: EditableExercise[];
  modalities: EditableModality[];
  manualTherapy: EditableManualTherapy[];
  isExpanded: boolean;
  reasoning: {
    clinicalRationale: string;
    expectedOutcomes: string[];
    progressionCriteria: string[];
  };
}

// New manual therapy structure
export interface EditableManualTherapy {
  techniqueId: string;
  name: string;
  category: string; // 'mobilization' | 'manipulation' | 'soft_tissue' | 'neural'
  parameters: {
    frequency: number; // per week
    sessionDuration: number; // minutes
    intensity: 'gentle' | 'moderate' | 'aggressive';
    progression: string;
  };
  isEnabled: boolean;
  clinicalSupervisionRequired: boolean;
  reasoning: {
    indication: string;
    biomechanics: string;
    evidence: string;
    expectedOutcome: string;
  };
  contraindications: string[];
  precautions: string[];
}

export interface ProgressionMilestone {
  week: number;
  milestones: string[];
  exerciseProgression: string;
  reassessmentCriteria: string[];
  nextPhaseReadiness: string;
}

export interface SafetyAssessment {
  redFlagsIdentified: string[];
  contraindications: string[];
  specialPrecautions: string[];
  emergencyReferralNeeded: boolean;
}

export interface ProtocolMetadata {
  patientName: string;
  conditionName: string;
  planType: string;
  totalDurationWeeks: number;
  generatedDateTime: string;
  safetyStatus: 'SAFE' | 'RED_FLAGS_PRESENT' | 'CONTRAINDICATED';
  aiConfidenceScore: number;
}

export interface HomeManagementPlan {
  dailyRoutine: string[];
  equipmentShopping: string[];
  painManagement: string[];
  activityModifications: string[];
  progressSelfMonitoring: string;
  whenToSeekHelp: string[];
}

export interface PatientEducation {
  conditionExplanation: string;
  healingTimeline: string;
  anatomyBasics: string;
  lifestyleFactors: string;
}

export interface OccupationalConsiderations {
  workplaceErgonomics: string;
  returnToWorkTimeline: string;
  jobDemandAnalysis: string;
}

export interface GeneratedProtocol {
  protocolMetadata: ProtocolMetadata;
  safetyAssessment: SafetyAssessment;
  treatmentPhases: TreatmentPhase[];
  homeManagement: HomeManagementPlan;
  patientEducation: PatientEducation;
  progressionPlan: ProgressionMilestone[];
  occupationalConsiderations: OccupationalConsiderations;
}

export interface ProtocolGenerationResponse {
  success: boolean;
  data: GeneratedProtocol;
  message: string;
}

export interface StructuredProtocolGenerationResponse {
  success: boolean;
  data: EditableProtocol;
  message: string;
}

export type ProtocolGenerationStep = 'selection' | 'configuration' | 'generating' | 'results' | 'customization';

export interface ProtocolGeneratorState {
  isOpen: boolean;
  step: ProtocolGenerationStep;
  selectedPlanTypes: ('home' | 'clinical')[];
  homeProtocol?: GeneratedProtocol;
  clinicalProtocol?: GeneratedProtocol;
  loading: boolean;
  error?: string;
  patientId?: string;
  conditionId?: string;
  conditionName?: string;
}

// Clinical configuration for protocol generation
export interface ProtocolPreferences {
  // Essential Clinical Configuration
  primaryFocus: 'pain_relief' | 'function' | 'performance';
  progressionApproach: 'conservative' | 'standard' | 'aggressive';
  patientEngagement: 'high_motivation' | 'moderate' | 'needs_simple';
  programDuration: 4 | 6 | 8 | 12; // weeks
  
  // Delivery Method
  setting: 'home' | 'clinic';
}

// Safety warning interfaces
export interface RedFlag {
  flag: string;
  severity: 'immediate' | 'urgent' | 'moderate';
  action: string;
  educationText: string; // for patient education
  clinicalGuidance: string; // for clinician guidance
}

export interface ContraindicationWarning {
  intervention: string;
  reason: string;
  severity: 'absolute' | 'relative';
  alternatives: string[];
  educationText: string;
}

export interface SafetyAssessmentEnhanced extends SafetyAssessment {
  redFlagDetails: RedFlag[];
  contraindicationDetails: ContraindicationWarning[];
  educationalContent: {
    homeManagement: string[];
    warningSignsHome: string[];
    warningSignsClinical: string[];
    emergencyContacts: string[];
  };
}

// Essential preference options - only what affects protocol generation
export const PREFERENCE_OPTIONS = {
  EQUIPMENT: [
    { value: 'resistance_bands', label: 'Resistance Bands', category: 'strength' },
    { value: 'dumbbells', label: 'Dumbbells/Weights', category: 'strength' },
    { value: 'exercise_ball', label: 'Exercise Ball', category: 'stability' },
    { value: 'balance_pad', label: 'Balance Pad', category: 'balance' },
    { value: 'foam_roller', label: 'Foam Roller', category: 'mobility' },
    { value: 'none', label: 'No Equipment Available', category: 'bodyweight' }
  ],
  
  PROGRESSION_STYLES: [
    { value: 'conservative', label: 'Conservative', description: 'Slower progression, prioritizing safety and comfort' },
    { value: 'standard', label: 'Standard', description: 'Evidence-based progression following normal timelines' },
    { value: 'accelerated', label: 'Accelerated', description: 'Faster progression for motivated, low-risk patients' }
  ],
  
  EDUCATION_PRIORITIES: [
    { value: 'self_management', label: 'Self-Management', description: 'Focus on independent pain/symptom management' },
    { value: 'ergonomics', label: 'Ergonomics', description: 'Workplace and daily activity positioning' },
    { value: 'prevention', label: 'Prevention', description: 'Strategies to prevent re-injury' },
    { value: 'exercise_adherence', label: 'Exercise Adherence', description: 'Building consistent exercise habits' }
  ]
} as const;

// New editable protocol structure
export interface EditableProtocol {
  protocolMetadata: ProtocolMetadata;
  safetyAssessment: SafetyAssessmentEnhanced;
  treatmentPhases: EditableTreatmentPhase[];
  preferences: ProtocolPreferences;
  clinicalNotes?: string;
  patientEducation: PatientEducation;
  progressionPlan: ProgressionMilestone[];
  occupationalConsiderations: OccupationalConsiderations;
}

// ============================================
// Manual Entry Types for Protocol Logging
// ============================================

export type ProtocolLoggingType = 'exercise' | 'modality' | 'manual_therapy';

// Manual exercise form data
export interface ManualExerciseFormData {
  exerciseName: string;
  instructions: string;
  frequency: string;
  sets: number;
  repetitions: string;
  holdDuration: string;
  equipment: string[];
  progressionCues: string;
  safetyNotes: string;
}

// Manual modality form data
export interface ManualModalityFormData {
  modalityName: string;
  parameters: string;
  duration: string;
  frequency: string;
  applicationMethod: string;
  clinicalSupervisionRequired: boolean;
}

// Manual therapy form data
export interface ManualTherapyFormData {
  technique: string;
  frequency: string;
  sessionDuration: string;
  clinicalOnly: boolean;
  expectedOutcome: string;
}

// API request for logging manual addition
export interface CreateProtocolLoggingRequest {
  patientId: string;
  conditionId: string;
  conditionName: string;
  visitId?: string;
  type: ProtocolLoggingType;
  protocolType: 'home' | 'clinical';
  treatmentPhaseName: string;
  treatmentPhaseIndex: number;
  itemName: string;
  itemData: ManualExerciseFormData | ManualModalityFormData | ManualTherapyFormData;
}

// Response from protocol logging API
export interface ProtocolLoggingResponse {
  id: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  conditionId: string;
  conditionName: string;
  visitId?: string;
  physioId: string;
  physioName: string;
  type: ProtocolLoggingType;
  protocolType: 'home' | 'clinical';
  treatmentPhaseName: string;
  treatmentPhaseIndex: number;
  itemName: string;
  itemData: Record<string, unknown>;
  createdAt: string;
}