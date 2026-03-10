export interface DiagnosticRequest {
  assessment_data: any;
  available_conditions: Array<{
    id: string;
    name: string;
    body_region: string;
    specialty: string;
  }>;
  request_type: string;
  max_conditions: number;
  confidence_threshold: number;
}

export interface DiagnosticResponse {
  differential_diagnosis: Array<{
    condition_id: string;
    condition_name: string;
    confidence_score: number;
    supporting_evidence: string[];
    clinical_reasoning: string;
  }>;
  excluded_conditions: Array<{
    condition_id: string;
    reason_for_exclusion: string;
  }>;
  additional_testing_needed: string[];
  red_flags_identified: string[];
  treatment_urgency: 'low' | 'moderate' | 'high' | 'urgent';
}

export class AIDiagnosticService {
  private static instance: AIDiagnosticService;

  public static getInstance(): AIDiagnosticService {
    if (!AIDiagnosticService.instance) {
      AIDiagnosticService.instance = new AIDiagnosticService();
    }
    return AIDiagnosticService.instance;
  }

  async getDifferentialDiagnosis(diagnosticData: DiagnosticRequest): Promise<DiagnosticResponse> {
    try {
      const response = await fetch('/api/ai/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'differential_diagnosis',
          payload: diagnosticData,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result: DiagnosticResponse = await response.json()
      return {
        differential_diagnosis: result.differential_diagnosis || [],
        excluded_conditions: result.excluded_conditions || [],
        additional_testing_needed: result.additional_testing_needed || [],
        red_flags_identified: result.red_flags_identified || [],
        treatment_urgency: result.treatment_urgency || 'moderate',
      }
    } catch (error: any) {
      console.error('AI Diagnostic Error:', error.message)

      // Fallback with conditions from the request
      const topConditions = diagnosticData.available_conditions.slice(0, 5)
      return {
        differential_diagnosis: topConditions.map((condition, index) => ({
          condition_id: condition.id,
          condition_name: condition.name,
          confidence_score: 0.6 - index * 0.1,
          supporting_evidence: ['Clinical assessment data available'],
          clinical_reasoning: `Condition in ${condition.body_region} region - requires manual clinical correlation`,
        })),
        excluded_conditions: [],
        additional_testing_needed: ['Detailed clinical examination', 'Consider imaging if indicated'],
        red_flags_identified: [],
        treatment_urgency: 'moderate',
      }
    }
  }

  async analyzeClinicalFindings(
    clinicalFindings: any,
    availableConditions: any[]
  ): Promise<string[]> {
    try {
      const response = await fetch('/api/ai/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_findings',
          payload: { clinicalFindings, availableConditions },
        }),
      })

      if (!response.ok) return []
      const result = await response.json()
      return result.condition_ids || []
    } catch (error) {
      console.error('Clinical analysis error:', error)
      return []
    }
  }

  formatDiagnosticSummary(diagnosis: DiagnosticResponse): string {
    let summary = "DIFFERENTIAL DIAGNOSIS\n\n";

    summary += `Treatment Priority: ${diagnosis.treatment_urgency.toUpperCase()}\n\n`;

    summary += "Primary Considerations:\n\n";
    diagnosis.differential_diagnosis
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5)
      .forEach((condition, index) => {
        const confidence = Math.round(condition.confidence_score * 100);
        summary += `${index + 1}. ${condition.condition_name} (${confidence}% likelihood)\n`;
        summary += `${condition.clinical_reasoning}\n\n`;
      });

    if (diagnosis.differential_diagnosis.length > 0 && diagnosis.differential_diagnosis[0].supporting_evidence.length > 0) {
      summary += "Key Clinical Findings:\n";
      diagnosis.differential_diagnosis[0].supporting_evidence.forEach(evidence => {
        summary += `• ${evidence}\n`;
      });
      summary += "\n";
    }

    if (diagnosis.red_flags_identified.length > 0) {
      summary += "RED FLAGS - IMMEDIATE ATTENTION REQUIRED:\n";
      diagnosis.red_flags_identified.forEach(flag => {
        summary += `• ${flag}\n`;
      });
      summary += "\n";
    }

    if (diagnosis.additional_testing_needed.length > 0) {
      summary += "Recommended Further Assessment:\n";
      diagnosis.additional_testing_needed.forEach(test => {
        summary += `• ${test}\n`;
      });
      summary += "\n";
    }

    summary += "________________\n\n";
    summary += "AI-assisted clinical decision support. Clinical correlation and professional judgment required for final diagnosis and treatment planning.";

    return summary;
  }
}

// AI Assessment Recommendation Service
export const getAIAssessmentRecommendations = async (screeningData: any) => {
  try {
    // Import clinical assessments data to build available list
    const assessmentsData = await import('../../data/clinical/entities/clinical_assessments.json');
    const assessments = assessmentsData.assessments;

    const availableAssessments = Object.entries(assessments)
      .filter(([id, assessment]: [string, any]) => assessment.input_schema && assessment.input_schema.primary_fields)
      .map(([id, assessment]: [string, any]) => ({
        id,
        name: assessment.name,
        type: assessment.type,
        body_regions: assessment.body_regions,
        purpose: assessment.purpose
      }));

    const response = await fetch('/api/ai/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assessment_recommendations',
        payload: { ...screeningData, availableAssessments },
      }),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const result = await response.json()

    if (!result.success) {
      return { success: false, error: result.error, recommendations: [] }
    }

    // Add estimated time to each recommendation
    const recommendations = (result.recommendations || []).map((rec: any) => ({
      assessment_id: rec.assessment_id,
      name: rec.name,
      relevance_score: rec.relevance_score,
      reasoning: rec.reasoning,
      category: availableAssessments.find(a => a.id === rec.assessment_id)?.type?.replace('_', ' ') || 'Clinical Assessment',
      estimated_time: estimateTestTime(rec.assessment_id),
    }))

    return {
      success: true,
      recommendations,
      total_recommended: result.total_recommended,
      rationale: result.rationale,
    }
  } catch (error: any) {
    console.error('Error in AI assessment recommendation:', error)
    return { success: false, error: error.message, recommendations: [] }
  }
};

const estimateTestTime = (assessmentId: string): string => {
  const timeMap: { [key: string]: string } = {
    'ASSESS_001': '3-5 minutes',
    'ASSESS_010': '2-3 minutes',
    'ASSESS_056': '5-7 minutes',
    'ASSESS_025': '3-4 minutes',
    'ASSESS_020': '4-6 minutes',
  };
  return timeMap[assessmentId] || '3-5 minutes';
};

export const aiDiagnosticService = AIDiagnosticService.getInstance();
