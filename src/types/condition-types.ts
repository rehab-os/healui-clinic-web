// Condition-aware types for appointment details page
export interface VisitCondition {
  id: string;
  visit_id: string;
  patient_condition_id: string;
  treatment_focus: 'PRIMARY' | 'SECONDARY' | 'MAINTENANCE';
  chief_complaint?: string;
  severity_scale?: number;
  created_at: string;
  updated_at: string;
  patient_condition: PatientCondition;
}

export interface PatientCondition {
  id: string;
  patient_id: string;
  condition_id: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC' | 'MONITORING';
  description?: string;
  diagnosed_date?: string;
  severity?: string;
  created_at: string;
  updated_at: string;
  neo4j_condition?: Neo4jCondition;
}

export interface Neo4jCondition {
  id: string;
  name: string;
  description?: string;
  body_region?: string;
  category?: string;
  icd_code?: string;
  severity_levels?: string[];
  common_symptoms?: string[];
  treatment_approaches?: string[];
}

export interface ConditionProtocol {
  id: string;
  condition_id: string;
  name: string;
  description?: string;
  phase?: string;
  duration_weeks?: number;
  frequency_per_week?: number;
  exercises?: ConditionExercise[];
  modalities?: ConditionModality[];
  goals?: ConditionGoal[];
}

export interface ConditionExercise {
  id: string;
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  frequency?: string;
  progression?: string;
}

export interface ConditionModality {
  id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  intensity?: string;
  frequency?: string;
}

export interface ConditionGoal {
  id: string;
  description: string;
  target_date?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED';
}

export interface ConditionNote {
  id: string;
  note_id: string;
  condition_id?: string;
  content_section?: string;
  relevance_score?: number;
}

export interface ConditionAwareNoteData {
  note_id: string;
  condition_associations: ConditionNote[];
  unassociated_content?: string;
}