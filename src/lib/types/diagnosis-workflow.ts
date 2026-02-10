/**
 * Dual Diagnosis Workflow Types
 * Used across SymptomDx (Symptom Assessment) and ClinicalDx (Clinical Screening) components
 */

// ========== SYMPTOM ASSESSMENT (SymptomDx) ==========

export interface SymptomDxResponse {
  question_id: string;
  question_text: string;
  question_type: string;
  answer: any;
  timestamp: string;
}

export interface SymptomDxAIAnalysis {
  top_conditions: {
    condition_id: string;
    condition_name: string;
    probability: number;
  }[];
  confidence: number;
  red_flags_detected: string[];
  recommendations: string[];
}

export interface SymptomDxData {
  session_id: string;
  started_at: string;
  completed_at: string;
  filled_by: 'PATIENT' | 'PHYSIO';
  filled_by_user_id?: string;
  responses: SymptomDxResponse[];
  ai_analysis?: SymptomDxAIAnalysis;
  body_regions: string[];
  symptom_duration?: string;
  pain_level?: number;
  chief_complaint?: string;
  questions_asked: number;
  completion_percentage: number;
}

// ========== CLINICAL SCREENING (ClinicalDx) ==========

export interface ReferralFinding {
  source: string;
  region: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  supporting_responses: string[];
}

export interface ClinicalDxData {
  session_id: string;
  started_at: string;
  completed_at: string;
  responses: Record<string, any>;
  activated_pathways: string[];
  skipped_sections: string[];
  red_flags_detected: string[];
  referral_findings: ReferralFinding[];
  selected_pain_regions: string[];
  completion_percentage: number;
}

export interface ClinicalAssessmentResult {
  assessment_id: string;
  assessment_name: string;
  category: string;
  relevance_score?: number;
  completed_at: string;
  form_data: Record<string, any>;
  findings_summary?: string;
  clinical_notes?: string;
}

// ========== DIFFERENTIAL DIAGNOSIS ==========

export interface DifferentialDiagnosisCondition {
  condition_id: string;
  condition_name: string;
  confidence_score: number;
  supporting_evidence: string[];
  clinical_reasoning: string;
}

export interface ExcludedCondition {
  condition_id: string;
  condition_name?: string;
  reason_for_exclusion: string;
}

export interface DifferentialDiagnosis {
  generated_at: string;
  ai_model_used?: string;
  conditions: DifferentialDiagnosisCondition[];
  excluded_conditions?: ExcludedCondition[];
  additional_testing_recommended?: string[];
  treatment_urgency: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  raw_ai_response?: any;
}

// ========== FINAL DIAGNOSIS ==========

export interface FinalDiagnosisData {
  selected_condition_id: string;
  selected_condition_name: string;
  selection_method: 'AI_SUGGESTED' | 'MANUAL_SEARCH' | 'QUICK_ADD';
  ai_confidence_score?: number;
  clinician_notes?: string;
  confirmed_at: string;
  confirmed_by_user_id?: string;
}

// ========== WORKFLOW ==========

export type DiagnosisMethod = 'SYMPTOM_AND_CLINICAL' | 'CLINICAL_ONLY';
export type SymptomDxFilledBy = 'PATIENT' | 'PHYSIO';

export type WorkflowStep =
  | 'SELECTION'
  | 'SYMPTOM_DX'
  | 'SYMPTOM_DX_COMPLETE'
  | 'CLINICAL_DX'
  | 'COMPLETE';

// ========== COMPLETE CONDITION PAYLOAD ==========

export interface DualDiagnosisConditionPayload {
  // Basic condition info
  condition_id: string;
  neo4j_condition_id?: string;

  // Diagnosis method
  diagnosis_method: DiagnosisMethod;

  // SymptomDx data
  symptom_dx_data?: SymptomDxData | null;
  symptom_dx_completed?: boolean;
  symptom_dx_completed_at?: string | null;
  symptom_dx_filled_by?: SymptomDxFilledBy | null;

  // ClinicalDx data
  clinical_dx_data?: ClinicalDxData | null;
  clinical_dx_completed?: boolean;
  clinical_dx_completed_at?: string | null;

  // Clinical assessments
  clinical_assessments_data?: ClinicalAssessmentResult[];

  // Differential diagnosis
  clinical_dx_differential?: DifferentialDiagnosis | null;

  // Final diagnosis
  final_diagnosis?: FinalDiagnosisData | null;

  // Existing fields for backwards compatibility
  chief_complaint?: string;
  vas_score?: number;
  primary_body_region?: string;
  pain_present?: boolean;
  assessment_method?: 'CHATBOT' | 'SCREENING' | 'MANUAL';
  urgency_level?: string;

  // Red flags
  night_pain?: boolean;
  unexplained_weight_loss?: boolean;
  neurological_symptoms?: boolean;
  recent_trauma?: boolean;
  bladder_bowel_changes?: boolean;
}
