// Clinical Insights Types - Mirror backend DTOs

export enum ClinicalInsightType {
  OBSERVATION = 'OBSERVATION',
  PROGRESS = 'PROGRESS',
  SETBACK = 'SETBACK',
  MILESTONE = 'MILESTONE',
  PATIENT_FEEDBACK = 'PATIENT_FEEDBACK',
  PAIN_ASSESSMENT = 'PAIN_ASSESSMENT',
  ROM_ASSESSMENT = 'ROM_ASSESSMENT',
  FUNCTIONAL_ASSESSMENT = 'FUNCTIONAL_ASSESSMENT',
}

// ========== CREATE DTO ==========
export interface AddClinicalInsightDto {
  insight_text: string;
  insight_type?: ClinicalInsightType;
  visit_id?: string;
  visit_condition_id?: string;
  current_phase?: string;
  current_goals?: string[];
  pain_level?: number; // 0-10
  rom_measurements?: Record<string, number>;
  functional_status?: string;
  patient_compliance?: string;
  other_notes?: string;
}

// ========== UPDATE DTO ==========
export interface UpdateClinicalInsightDto {
  insight_text?: string;
  insight_type?: ClinicalInsightType;
  current_phase?: string;
  current_goals?: string[];
  context_metadata?: Record<string, any>;
}

// ========== RESPONSE DTO ==========
export interface ClinicalInsightResponseDto {
  id: string;
  patient_condition_id: string;
  visit_id?: string;
  visit_condition_id?: string;
  insight_text: string;
  insight_type: ClinicalInsightType;
  current_phase?: string;
  current_goals?: string[];
  context_metadata?: Record<string, any>;
  used_in_protocol_generation: boolean;
  generated_protocol_id?: string;
  protocol_generated_at?: Date | string;
  created_by: string;
  created_at: Date | string;
  ai_metadata?: Record<string, any>;
}

// ========== LIST RESPONSE DTO ==========
export interface ClinicalInsightsListResponseDto {
  insights: ClinicalInsightResponseDto[];
  total: number;
  limit?: number;
  offset?: number;
}

// ========== GENERATE TREATMENT FROM INSIGHTS DTO ==========
export interface GenerateTreatmentFromInsightsDto {
  clinical_insight_ids: string[];
  selected_phase?: string;
  selected_goals?: string[];
  additional_context?: string;
  create_new_version?: boolean;
}

// ========== MARK AS USED DTO ==========
export interface MarkInsightAsUsedDto {
  generated_protocol_id: string;
}
