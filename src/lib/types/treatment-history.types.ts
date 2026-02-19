// Treatment History Types - Mirror backend DTOs

export enum TreatmentChangeType {
  INITIAL_CREATION = 'INITIAL_CREATION',
  AI_GENERATED_FROM_INSIGHTS = 'AI_GENERATED_FROM_INSIGHTS',
  MANUAL_UPDATE = 'MANUAL_UPDATE',
  PHASE_PROGRESSION = 'PHASE_PROGRESSION',
  GOAL_ADJUSTMENT = 'GOAL_ADJUSTMENT',
  EXERCISE_MODIFICATION = 'EXERCISE_MODIFICATION',
  MODALITY_CHANGE = 'MODALITY_CHANGE',
  PATIENT_REQUEST = 'PATIENT_REQUEST',
  ADVERSE_REACTION = 'ADVERSE_REACTION',
}

// ========== CREATE DTO ==========
export interface LogTreatmentChangeDto {
  patient_condition_id: string;
  visit_condition_id?: string;
  treatment_protocol_id: string;
  change_type: TreatmentChangeType;
  version: number;
  changes_made?: any;
  change_reason?: string;
  clinical_insights_used?: string[];
  clinical_rationale?: string;
  ai_training_data?: any;
}

// ========== RESPONSE DTO ==========
export interface TreatmentHistoryResponseDto {
  id: string;
  patient_condition_id: string;
  visit_condition_id?: string;
  treatment_protocol_id: string;
  change_type: TreatmentChangeType;
  version: number;
  changes_made?: any;
  change_reason?: string;
  clinical_insights_used?: string[];
  clinical_rationale?: string;
  created_by: string;
  created_at: Date | string;
  ai_training_data?: any;
  creator?: {
    id: string;
    name: string;
    email?: string;
  };
}

// ========== LIST RESPONSE DTO ==========
export interface TreatmentHistoryListResponseDto {
  history: TreatmentHistoryResponseDto[];
  total: number;
  currentVersion?: number;
}

// ========== COMPARE VERSIONS DTO ==========
export interface CompareVersionsResponseDto {
  current: {
    id: string;
    version: number;
    created_at: Date | string;
  };
  previous: {
    id: string;
    version: number;
    created_at: Date | string;
  };
  differences: {
    exercises_added?: any[];
    exercises_removed?: any[];
    exercises_modified?: any[];
    modalities_added?: any[];
    modalities_removed?: any[];
    modalities_modified?: any[];
    manual_therapy_changes?: any[];
    phase_change?: {
      from: string;
      to: string;
    };
    goals_added?: string[];
    goals_removed?: string[];
    other_changes?: string;
  };
  change_summary?: string;
}

// ========== LOG USER MODIFICATIONS DTO ==========
export interface LogUserModificationsDto {
  exercises_added?: string[];
  exercises_removed?: string[];
  exercises_modified?: any[];
  modalities_changed?: any[];
  other_changes?: string;
  modification_reason?: string;
}
