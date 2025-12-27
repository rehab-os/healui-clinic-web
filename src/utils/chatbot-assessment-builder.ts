import { AssessmentSession, QuestionTemplate } from '@/services/physioDecisionEngine';
import { OntologyConditionService, ConditionSearchResult } from '@/services/ontologyConditionService';

export interface FrontendAssessmentData {
  // Assessment Metadata
  assessment_id: string;
  assessment_type: 'CHATBOT_COMPREHENSIVE' | 'MANUAL_SCREENING' | 'QUICK_ADD';
  assessment_date: string;
  assessment_duration_minutes: number;
  clinician_id?: string;
  
  // Assessment Results
  clinical_parameters: {
    [parameter_name: string]: {
      value: any;
      confidence?: number;
      method: 'PATIENT_REPORTED' | 'CLINICIAN_ASSESSED' | 'AI_DERIVED';
      timestamp: string;
    };
  };
  
  // Diagnosis Process
  differential_diagnosis?: {
    ai_generated: any[];
    clinician_notes?: string;
    selected_primary: string;
    confidence_score?: number;
  };
  
  // Red Flags & Safety
  red_flags: {
    flags_present: string[];
    assessment_notes: string;
    urgency_level: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  };
  
  // Functional Assessment
  functional_baseline: {
    adl_scores: { [activity: string]: number };
    adl_average: number;
    work_impact: string;
    sport_impact: string;
    primary_goals: string[];
  };
  
  // Raw Data Archive
  raw_responses: {
    chatbot_session?: any;
    screening_form?: any;
    manual_notes?: string;
  };
}

export class ChatbotAssessmentBuilder {
  /**
   * Derive condition type from onset date
   */
  static deriveConditionTypeFromOnset(onsetDate: string): 'ACUTE' | 'SUBACUTE' | 'CHRONIC' {
    if (!onsetDate) return 'ACUTE';
    
    const daysSinceOnset = Math.floor((Date.now() - new Date(onsetDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOnset <= 42) return 'ACUTE';        // 0-6 weeks
    if (daysSinceOnset <= 84) return 'SUBACUTE';     // 6-12 weeks  
    return 'CHRONIC';                                 // >12 weeks
  }

  /**
   * Get condition duration description
   */
  static getConditionDurationDescription(onsetDate: string): string {
    if (!onsetDate) return 'Duration unknown';
    
    const daysSinceOnset = Math.floor((Date.now() - new Date(onsetDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOnset === 0) return 'Started today';
    if (daysSinceOnset === 1) return '1 day ago';
    if (daysSinceOnset < 7) return `${daysSinceOnset} days ago`;
    if (daysSinceOnset < 14) return '1 week ago';
    if (daysSinceOnset < 42) return `${Math.floor(daysSinceOnset / 7)} weeks ago`;
    if (daysSinceOnset < 84) return `${Math.floor(daysSinceOnset / 30)} months ago`;
    return `${Math.floor(daysSinceOnset / 365)} year(s) ago`;
  }

  /**
   * Build comprehensive assessment data from chatbot session
   */
  static buildFromChatbotSession(
    session: AssessmentSession,
    diagnosisResults: any,
    selectedDiagnosis: any,
    sessionStartTime: Date
  ): FrontendAssessmentData {
    const sessionDurationMinutes = Math.round((Date.now() - sessionStartTime.getTime()) / (1000 * 60));

    return {
      // Assessment Metadata
      assessment_id: `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assessment_type: 'CHATBOT_COMPREHENSIVE',
      assessment_date: new Date().toISOString(),
      assessment_duration_minutes: sessionDurationMinutes,
      
      // Clinical Parameters
      clinical_parameters: this.extractClinicalParameters(session),
      
      // Diagnosis Process
      differential_diagnosis: {
        ai_generated: diagnosisResults?.differential_diagnosis || [],
        selected_primary: selectedDiagnosis.condition_id,
        confidence_score: selectedDiagnosis.confidence_score,
        clinician_notes: `Selected from AI recommendations based on clinical assessment`
      },
      
      // Red Flags & Safety
      red_flags: this.extractRedFlags(session),
      
      // Functional Assessment
      functional_baseline: this.extractFunctionalBaseline(session),
      
      // Raw Data Archive
      raw_responses: {
        chatbot_session: {
          sessionId: session.sessionId,
          responses: session.responses,
          clinicalFindings: session.clinicalFindings,
          completionPercentage: session.completionPercentage
        }
      }
    };
  }

  /**
   * Extract clinical parameters from session
   */
  private static extractClinicalParameters(session: AssessmentSession) {
    const parameters: any = {};
    const timestamp = new Date().toISOString();

    // Pain Assessment
    if (session.clinicalFindings?.pain) {
      if (session.clinicalFindings.pain.vas_score !== undefined) {
        parameters.vas_score = {
          value: session.clinicalFindings.pain.vas_score,
          method: 'PATIENT_REPORTED',
          timestamp
        };
      }

      if (session.clinicalFindings.pain.location) {
        parameters.body_region = {
          value: session.clinicalFindings.pain.location,
          method: 'PATIENT_REPORTED',
          timestamp
        };
      }

      if (session.clinicalFindings.pain.nature) {
        parameters.pain_nature = {
          value: session.clinicalFindings.pain.nature,
          method: 'PATIENT_REPORTED',
          timestamp
        };
      }
    }

    // Chief Complaint
    if (session.responses?.chief_complaint) {
      parameters.chief_complaint = {
        value: session.responses.chief_complaint,
        method: 'PATIENT_REPORTED',
        timestamp
      };
    }

    // Neurological Assessment
    if (session.clinicalFindings?.neurological) {
      parameters.neurological_findings = {
        value: session.clinicalFindings.neurological,
        method: 'PATIENT_REPORTED',
        timestamp
      };
    }

    // Range of Motion
    if (session.clinicalFindings?.range_of_motion) {
      parameters.range_of_motion = {
        value: session.clinicalFindings.range_of_motion,
        method: 'PATIENT_REPORTED',
        timestamp
      };
    }

    // Motor Assessment
    if (session.clinicalFindings?.motor) {
      parameters.motor_assessment = {
        value: session.clinicalFindings.motor,
        method: 'PATIENT_REPORTED',
        timestamp
      };
    }

    // Objective Findings
    if (session.clinicalFindings?.objective) {
      parameters.objective_findings = {
        value: session.clinicalFindings.objective,
        method: 'CLINICIAN_ASSESSED',
        timestamp
      };
    }

    // Add session responses as parameters
    Object.entries(session.responses || {}).forEach(([key, value]) => {
      if (value && !parameters[key]) {
        parameters[key] = {
          value,
          method: 'PATIENT_REPORTED',
          timestamp
        };
      }
    });

    return parameters;
  }

  /**
   * Extract red flags from session
   */
  private static extractRedFlags(session: AssessmentSession) {
    const redFlags: string[] = [];
    let urgencyLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT' = 'LOW';
    let assessmentNotes = '';

    // Check for red flags in responses
    if (session.responses?.red_flag_screening) {
      const redFlagResponses = session.responses.red_flag_screening;
      
      // Map common red flag responses
      if (redFlagResponses.night_pain === 'yes') redFlags.push('night_pain');
      if (redFlagResponses.weight_loss === 'yes') redFlags.push('weight_loss');
      if (redFlagResponses.fever === 'yes') redFlags.push('fever');
      if (redFlagResponses.neurological === 'yes') redFlags.push('neurological');
      if (redFlagResponses.bladder_bowel === 'yes') redFlags.push('bladder_bowel');
      if (redFlagResponses.trauma === 'yes') redFlags.push('trauma');
      if (redFlagResponses.cancer_history === 'yes') redFlags.push('cancer_history');
    }

    // Determine urgency based on red flags and pain level
    if (redFlags.length > 2) {
      urgencyLevel = 'URGENT';
      assessmentNotes = `Multiple red flags identified: ${redFlags.join(', ')}`;
    } else if (redFlags.length > 0) {
      urgencyLevel = 'HIGH';
      assessmentNotes = `Red flags present: ${redFlags.join(', ')}`;
    } else if (session.clinicalFindings?.pain?.vas_score >= 8) {
      urgencyLevel = 'HIGH';
      assessmentNotes = 'High pain level (8+/10) requires prompt attention';
    } else if (session.clinicalFindings?.pain?.vas_score >= 6) {
      urgencyLevel = 'MODERATE';
      assessmentNotes = 'Moderate to severe pain reported';
    }

    return {
      flags_present: redFlags,
      assessment_notes: assessmentNotes,
      urgency_level: urgencyLevel
    };
  }

  /**
   * Extract functional baseline from session
   */
  private static extractFunctionalBaseline(session: AssessmentSession) {
    const functionalData = session.clinicalFindings?.functional || {};
    
    return {
      adl_scores: functionalData.adl_scores || {},
      adl_average: functionalData.adl_average || 100,
      work_impact: session.responses?.work_limitations || 'none',
      sport_impact: session.responses?.sport_limitations || 'none',
      primary_goals: session.responses?.treatment_goals ? [session.responses.treatment_goals] : []
    };
  }

  /**
   * Create condition DTO with assessment data
   */
  static createConditionWithAssessment(
    patientId: string,
    selectedCondition: any,
    assessmentData: FrontendAssessmentData
  ) {
    // Get onset date from assessment responses
    const onsetDate = assessmentData.raw_responses?.chatbot_session?.responses?.symptom_onset;
    
    // Derive condition type from onset date
    const conditionType = onsetDate ? 
      this.deriveConditionTypeFromOnset(onsetDate) : 
      'ACUTE';
    
    // Map ontology_condition_id to neo4j_condition_id for backend compatibility
    const ontologyId = selectedCondition.condition_id || selectedCondition.id;
    
    // Create enhanced description with onset information
    const durationDescription = onsetDate ? this.getConditionDurationDescription(onsetDate) : '';
    const onsetNature = assessmentData.raw_responses?.chatbot_session?.responses?.onset_nature || '';
    const progression = assessmentData.raw_responses?.chatbot_session?.responses?.symptom_progression || '';
    
    let description = `AI-assisted diagnosis: ${selectedCondition.clinical_reasoning || selectedCondition.name}`;
    if (durationDescription) {
      description += ` (${durationDescription})`;
    }
    if (onsetNature && onsetNature !== 'unknown') {
      description += ` - ${onsetNature.replace('_', ' ')} onset`;
    }
    if (progression) {
      description += `, symptoms ${progression.replace('_', ' ')}`;
    }
    
    return {
      neo4j_condition_id: ontologyId, // Backend expects this field name
      description,
      condition_type: conditionType,
      onset_date: onsetDate || new Date().toISOString(),
      
      // Assessment data
      initial_assessment_data: assessmentData,
      assessment_method: 'CHATBOT' as const
    };
  }

  /**
   * Search conditions using ontology data
   */
  static searchOntologyConditions(query: string): ConditionSearchResult[] {
    return OntologyConditionService.searchConditions(query);
  }

  /**
   * Search conditions by symptoms using ontology data
   */
  static searchConditionsBySymptoms(symptoms: string[]): ConditionSearchResult[] {
    return OntologyConditionService.searchBySymptoms(symptoms);
  }

  /**
   * Get condition details from ontology
   */
  static getConditionDetails(conditionId: string) {
    const condition = OntologyConditionService.getConditionById(conditionId);
    const treatmentProtocol = OntologyConditionService.getTreatmentProtocol(conditionId);
    const exercises = OntologyConditionService.getConditionExercises(conditionId);
    
    return {
      condition,
      treatmentProtocol,
      exercises,
      metadata: OntologyConditionService.getConditionMetadata(conditionId)
    };
  }
}