// Condition-aware components for appointment details
export { default as VisitConditionContext } from './VisitConditionContext';
export { default as ConditionProtocolCard } from './ConditionProtocolCard';
export { default as ConditionNotesTab } from './ConditionNotesTab';
export { default as ConditionProgressIndicator } from './ConditionProgressIndicator';

// Re-export types for convenience
export type { 
  VisitCondition, 
  PatientCondition, 
  Neo4jCondition, 
  ConditionProtocol,
  ConditionExercise,
  ConditionModality,
  ConditionGoal,
  ConditionNote,
  ConditionAwareNoteData
} from '../../types/condition-types';