// Ontology Data Index
// This file provides easy access to all the local ontology data

export { default as conditions } from './entities/conditions.json'
export { default as symptoms } from './entities/symptoms.json'
export { default as redFlags } from './clinical-safety/red-flags.json'
export { default as contraindications } from './clinical-safety/contraindications.json'
export { default as exercises } from './entities/exercises.json'
export { default as equipment } from './entities/equipment.json'
export { default as treatmentProtocols } from './protocols/treatment-protocols.json'
export { default as conditionExercises } from './relationships/condition-exercises.json'

// Enhanced Bayesian data for AI recommendations
export { default as enhancedConditions } from './bayesian/sample_enhanced_conditions.json'
export { default as enhancedSymptoms } from './bayesian/sample_enhanced_symptoms.json'
export { default as decisionTrees } from './bayesian/sample_enhanced_decision_trees.json'

// Clinical reasoning
export { default as predictionRules } from './clinical-reasoning/prediction-rules.json'

// Metadata about the ontology
export const ONTOLOGY_METADATA = {
  version: '2.0.0',
  totalConditions: 200,
  lastUpdated: '2024-10-29',
  dataSource: 'physio-ontology-engine',
  description: 'Comprehensive physiotherapy knowledge base with 200 conditions, symptoms, exercises, and treatment protocols'
}

// Quick stats function
export const getOntologyStats = () => {
  return {
    ...ONTOLOGY_METADATA,
    // These would be computed dynamically in a real implementation
    estimatedConditions: 200,
    estimatedExercises: 500,
    estimatedProtocols: 150
  }
}