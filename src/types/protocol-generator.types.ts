// Legacy request format - for backward compatibility
export interface ProtocolGenerationRequest {
  patientId: string;
  conditionId: string;
  planType: 'home' | 'clinical';
  visitId?: string;
  preferences?: {
    duration?: number; // weeks
    intensity?: 'low' | 'moderate' | 'high';
    frequency?: number; // sessions per week
  };
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
  preferences?: {
    duration?: number; // weeks
    intensity?: 'low' | 'moderate' | 'high';
    frequency?: number; // sessions per week
  };
}

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

export interface ModalityProtocol {
  modalityName: string;
  parameters: string;
  duration: string;
  frequency: string;
  applicationMethod: string;
  clinicalSupervisionRequired: boolean;
}

export interface ManualTherapyProtocol {
  technique: string;
  frequency: string;
  sessionDuration: string;
  clinicalOnly: boolean;
  expectedOutcome: string;
}

export interface TreatmentPhase {
  phaseName: string;
  durationWeeks: number;
  primaryGoals: string[];
  exercises: ExerciseProtocol[];
  modalities: ModalityProtocol[];
  manualTherapy: ManualTherapyProtocol[];
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

export type ProtocolGenerationStep = 'selection' | 'generating' | 'results';

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