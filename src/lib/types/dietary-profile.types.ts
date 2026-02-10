// Dietary Profile Types - Mirror backend DTOs

export enum ContraIndicationSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL',
}

export enum ContraindicationType {
  FOOD = 'FOOD',
  SUPPLEMENT = 'SUPPLEMENT',
  EXERCISE = 'EXERCISE',
  MODALITY = 'MODALITY',
  MEDICATION = 'MEDICATION',
  OTHER = 'OTHER',
}

export enum RecommendationCategory {
  ANTI_INFLAMMATORY = 'ANTI_INFLAMMATORY',
  PROTEIN = 'PROTEIN',
  HYDRATION = 'HYDRATION',
  VITAMINS = 'VITAMINS',
  OTHER = 'OTHER',
}

export enum RecommendationSource {
  CONDITION_DEFAULT = 'CONDITION_DEFAULT',
  AI_GENERATED = 'AI_GENERATED',
  PHYSIO_ADDED = 'PHYSIO_ADDED',
}

// ========== NESTED DTOs ==========
export interface DietaryRecommendationDto {
  item: string;
  quantity?: string;
  frequency?: string;
  timing?: string;
  reason: string;
  category?: RecommendationCategory;
  source?: RecommendationSource;
}

export interface AddContraindicationDto {
  item: string;
  type: ContraindicationType;
  reason: string;
  severity: ContraIndicationSeverity;
  source?: string;
}

export interface PatientPreferencesDto {
  dietary_restrictions?: string[];
  allergies?: string[];
  cultural_preferences?: string[];
  meal_frequency?: string;
  cooking_capability?: string;
}

// ========== GENERATE DTO ==========
export interface GenerateDietaryProfileDto {
  active_condition_ids: string[];
  patient_preferences?: PatientPreferencesDto;
  use_ai?: boolean;
}

// ========== UPDATE DTO ==========
export interface UpdateDietaryProfileDto {
  recommended_foods?: DietaryRecommendationDto[];
  foods_to_avoid?: DietaryRecommendationDto[];
  supplements?: DietaryRecommendationDto[];
  dietary_notes?: string;
  hydration_guidelines?: string;
  general_guidelines?: string;
  patient_preferences?: PatientPreferencesDto;
}

// ========== RESPONSE DTO ==========
export interface PatientDietaryProfileResponseDto {
  id: string;
  patient_id?: string;
  patient_user_id?: string;
  active_conditions_considered?: Array<{
    condition_id: string;
    condition_name: string;
    patient_condition_id: string;
  }>;
  last_generated_at?: Date | string;
  recommended_foods?: DietaryRecommendationDto[];
  foods_to_avoid?: DietaryRecommendationDto[];
  supplements?: DietaryRecommendationDto[];
  contraindications?: any[];
  dietary_notes?: string;
  hydration_guidelines?: string;
  general_guidelines?: string;
  patient_preferences?: any;
  ai_generated: boolean;
  ai_metadata?: any;
  created_at: Date | string;
  updated_at: Date | string;
}

// ========== ALL CONTRAINDICATIONS RESPONSE DTO ==========
export interface AllContraindicationsResponseDto {
  condition_based: any[];
  patient_specific: any[];
  all: any[];
}
