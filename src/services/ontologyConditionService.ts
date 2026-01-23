import { conditions, enhancedConditions, treatmentProtocols, conditionExercises } from '@/data/ontology-data';

// Note: Symptoms import removed due to JSON parsing issue - using conditions data only

export interface OntologyCondition {
  id: string;
  name: string;
  snomed_ct: string;
  icd10: string;
  body_region: string;
  specialty: string;
  prevalence_rank: number;
  typical_age_range: string;
  gender_ratio: string;
  chronicity: string;
  treatment_protocol: any;
}

export interface ConditionSearchResult {
  condition: OntologyCondition;
  confidence_score: number;
  clinical_reasoning: string;
}

export class OntologyConditionService {
  private static conditionsCache: Map<string, OntologyCondition> = new Map();

  static {
    this.loadConditions();
  }

  private static loadConditions() {
    Object.entries(conditions.conditions).forEach(([id, condition]) => {
      this.conditionsCache.set(id, {
        id,
        ...condition as any
      });
    });
  }

  static getConditionById(conditionId: string): OntologyCondition | null {
    return this.conditionsCache.get(conditionId) || null;
  }

  static searchConditions(query: string): ConditionSearchResult[] {
    const searchTerms = query.toLowerCase().split(' ');
    const results: ConditionSearchResult[] = [];

    for (const [id, condition] of this.conditionsCache) {
      const nameMatch = this.calculateMatchScore(condition.name.toLowerCase(), searchTerms);
      const bodyRegionMatch = this.calculateMatchScore(condition.body_region?.toLowerCase() || '', searchTerms);
      
      const totalScore = Math.max(nameMatch, bodyRegionMatch * 0.8);
      
      if (totalScore > 0.3) {
        results.push({
          condition,
          confidence_score: totalScore,
          clinical_reasoning: this.generateClinicalReasoning(condition, searchTerms)
        });
      }
    }

    return results.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 10);
  }

  static searchBySymptoms(symptoms: string[]): ConditionSearchResult[] {
    const enhancedData = enhancedConditions.enhanced_conditions || {};
    const results: ConditionSearchResult[] = [];

    for (const [id, enhanced] of Object.entries(enhancedData)) {
      const condition = this.getConditionById(id);
      if (!condition) continue;

      const symptomMatches = this.calculateSymptomMatches(symptoms, enhanced as any);
      
      if (symptomMatches.score > 0.4) {
        results.push({
          condition,
          confidence_score: symptomMatches.score,
          clinical_reasoning: symptomMatches.reasoning
        });
      }
    }

    return results.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 8);
  }

  static getConditionsByBodyRegion(bodyRegion: string): OntologyCondition[] {
    return Array.from(this.conditionsCache.values())
      .filter(condition => 
        condition.body_region?.toLowerCase().includes(bodyRegion.toLowerCase())
      )
      .sort((a, b) => a.prevalence_rank - b.prevalence_rank);
  }

  static getTreatmentProtocol(conditionId: string) {
    const condition = this.getConditionById(conditionId);
    return condition?.treatment_protocol || null;
  }

  static getConditionExercises(conditionId: string) {
    const exercises = conditionExercises.condition_exercises?.[conditionId];
    return exercises || [];
  }

  private static calculateMatchScore(text: string, searchTerms: string[]): number {
    if (!text) return 0;

    let totalScore = 0;
    for (const term of searchTerms) {
      if (text.includes(term)) {
        totalScore += term.length / text.length;
      }
    }
    return Math.min(totalScore, 1);
  }

  private static calculateSymptomMatches(symptoms: string[], enhanced: any) {
    const conditionSymptoms = enhanced.associated_symptoms || [];
    const diagnosticCriteria = enhanced.diagnostic_criteria || {};
    
    let matchCount = 0;
    let totalWeight = 0;
    const matchedSymptoms: string[] = [];

    for (const symptom of symptoms) {
      const normalizedSymptom = symptom.toLowerCase();
      
      for (const condSymptom of conditionSymptoms) {
        if (typeof condSymptom === 'string' && 
            condSymptom.toLowerCase().includes(normalizedSymptom)) {
          matchCount++;
          matchedSymptoms.push(symptom);
          totalWeight += 1;
          break;
        }
      }
    }

    const score = symptoms.length > 0 ? (matchCount / symptoms.length) * 0.7 + (totalWeight / 10) * 0.3 : 0;
    
    return {
      score,
      reasoning: `Matched ${matchCount}/${symptoms.length} symptoms: ${matchedSymptoms.join(', ')}`
    };
  }

  private static generateClinicalReasoning(condition: OntologyCondition, searchTerms: string[]): string {
    const matchedTerms = searchTerms.filter(term => 
      condition.name.toLowerCase().includes(term) || 
      condition.body_region?.toLowerCase().includes(term)
    );

    return `Condition "${condition.name}" matches search criteria: ${matchedTerms.join(', ')}. ` +
           `Common in ${condition.body_region} region, typically affects ${condition.typical_age_range} age group.`;
  }

  static getAllConditions(): OntologyCondition[] {
    return Array.from(this.conditionsCache.values())
      .sort((a, b) => a.prevalence_rank - b.prevalence_rank);
  }

  static getConditionMetadata(conditionId: string) {
    const condition = this.getConditionById(conditionId);
    if (!condition) return null;

    return {
      snomed_ct: condition.snomed_ct,
      icd10: condition.icd10,
      body_region: condition.body_region,
      specialty: condition.specialty,
      prevalence_rank: condition.prevalence_rank,
      typical_age_range: condition.typical_age_range,
      gender_ratio: condition.gender_ratio,
      chronicity: condition.chronicity
    };
  }

  /**
   * Backend compatibility helpers
   */
  static resolveBackendConditionData(backendResponse: any) {
    // Backend returns neo4j_condition_id which now contains ontology IDs
    const ontologyId = backendResponse.neo4j_condition_id;
    const condition = this.getConditionById(ontologyId);
    
    return {
      ...backendResponse,
      _resolved_condition: condition,
      _ontology_metadata: this.getConditionMetadata(ontologyId),
      _treatment_protocol: this.getTreatmentProtocol(ontologyId)
    };
  }

  static createBackendCompatiblePayload(ontologyId: string, additionalData: any = {}) {
    return {
      neo4j_condition_id: ontologyId, // Backend expects this field name
      ...additionalData
    };
  }
}