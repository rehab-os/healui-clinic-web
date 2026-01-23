import OpenAI from 'openai';

// Initialize OpenAI client with environment variable
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Enable client-side usage
});

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
      console.log('🤖 Attempting OpenAI API call...');
      console.log('🔑 API Key source:', process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'Environment' : 'Hardcoded');
      console.log('🔑 API Key available:', !!openai.apiKey);
      console.log('🔑 API Key length:', openai.apiKey?.length || 0);
      console.log('📊 Conditions to analyze:', diagnosticData.available_conditions.length);
      console.log('📋 Assessment data available:', !!diagnosticData.assessment_data);
      
      // Simplified prompt for better results
      const systemPrompt = `You are an expert physiotherapist. Based on the clinical findings, rank the top 5 most likely conditions from the provided list.

Return a JSON object with this structure:
{
  "differential_diagnosis": [
    {
      "condition_id": "condition_id_from_list",
      "condition_name": "condition_name_from_list", 
      "confidence_score": 0.85,
      "supporting_evidence": ["evidence1", "evidence2"],
      "clinical_reasoning": "Brief explanation why this condition fits"
    }
  ],
  "treatment_urgency": "moderate"
}`;

      // Simplified user prompt
      const userPrompt = `Clinical Findings:
Chief Complaint: ${diagnosticData.assessment_data.clinicalFindings.chief_complaint || 'Not specified'}
Pain Data: ${JSON.stringify(diagnosticData.assessment_data.clinicalFindings.pain || {})}
Neurological: ${JSON.stringify(diagnosticData.assessment_data.clinicalFindings.neurological || {})}
Functional: ${JSON.stringify(diagnosticData.assessment_data.clinicalFindings.functional || {})}
Objective: ${JSON.stringify(diagnosticData.assessment_data.clinicalFindings.objective || {})}

Available Conditions (select from these only):
${diagnosticData.available_conditions.map(c => `${c.id}: ${c.name} (${c.body_region})`).join('\n')}

Analyze and return top 5 most likely conditions in JSON format.`;

      console.log('📤 Sending request to OpenAI...');
      
      // Test API connection first
      if (!openai.apiKey || openai.apiKey.length < 20) {
        throw new Error('Invalid OpenAI API key configuration');
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using 3.5-turbo for faster response
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      console.log('📥 Received response from OpenAI');
      const aiResponse = response.choices[0].message.content;
      console.log('🎯 Raw OpenAI Response:', aiResponse);

      if (!aiResponse) {
        throw new Error('Empty response from OpenAI');
      }

      const parsedResponse: DiagnosticResponse = JSON.parse(aiResponse);
      
      // Add defaults for missing fields
      const validatedResponse = {
        differential_diagnosis: parsedResponse.differential_diagnosis || [],
        excluded_conditions: parsedResponse.excluded_conditions || [],
        additional_testing_needed: parsedResponse.additional_testing_needed || [],
        red_flags_identified: parsedResponse.red_flags_identified || [],
        treatment_urgency: parsedResponse.treatment_urgency || 'moderate'
      };

      console.log('✅ AI Analysis Complete - Found', validatedResponse.differential_diagnosis.length, 'conditions');
      return validatedResponse;

    } catch (error: any) {
      console.error('❌ Detailed AI Error:', {
        message: error.message,
        status: error.status,
        type: error.type,
        stack: error.stack
      });
      
      // Check if it's an API key issue
      if (error.message?.includes('API key') || error.status === 401) {
        console.error('🔑 API Key Issue - Check OpenAI credentials');
      }
      
      // Enhanced fallback with conditions from the request
      const topConditions = diagnosticData.available_conditions.slice(0, 5);
      
      return {
        differential_diagnosis: topConditions.map((condition, index) => ({
          condition_id: condition.id,
          condition_name: condition.name,
          confidence_score: 0.6 - (index * 0.1), // Decreasing confidence
          supporting_evidence: ['Clinical assessment data available'],
          clinical_reasoning: `Condition in ${condition.body_region} region - requires manual clinical correlation`
        })),
        excluded_conditions: [],
        additional_testing_needed: ['Detailed clinical examination', 'Consider imaging if indicated'],
        red_flags_identified: [],
        treatment_urgency: 'moderate'
      };
    }
  }

  async analyzeClinicalFindings(
    clinicalFindings: any,
    availableConditions: any[]
  ): Promise<string[]> {
    try {
      console.log('🧠 Analyzing clinical findings for pattern recognition...');

      const prompt = `Based on these clinical findings, identify the 5 most relevant conditions from the provided list:

Clinical Findings:
${JSON.stringify(clinicalFindings, null, 2)}

Available Conditions:
${availableConditions.map(c => `${c.id}: ${c.name} (${c.body_region})`).join('\n')}

Return only an array of condition IDs (e.g., ["COND_001", "COND_025"]) that are most relevant to these clinical findings.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"condition_ids": []}');
      return result.condition_ids || [];

    } catch (error) {
      console.error('❌ Clinical analysis error:', error);
      return [];
    }
  }

  formatDiagnosticSummary(diagnosis: DiagnosticResponse): string {
    let summary = "DIFFERENTIAL DIAGNOSIS\n\n";
    
    // Treatment priority
    summary += `Treatment Priority: ${diagnosis.treatment_urgency.toUpperCase()}\n\n`;
    
    // Primary conditions - Top 5
    summary += "Primary Considerations:\n\n";
    diagnosis.differential_diagnosis
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5)
      .forEach((condition, index) => {
        const confidence = Math.round(condition.confidence_score * 100);
        summary += `${index + 1}. ${condition.condition_name} (${confidence}% likelihood)\n`;
        summary += `${condition.clinical_reasoning}\n\n`;
      });

    // Supporting evidence
    if (diagnosis.differential_diagnosis.length > 0 && diagnosis.differential_diagnosis[0].supporting_evidence.length > 0) {
      summary += "Key Clinical Findings:\n";
      diagnosis.differential_diagnosis[0].supporting_evidence.forEach(evidence => {
        summary += `• ${evidence}\n`;
      });
      summary += "\n";
    }

    // Red flags
    if (diagnosis.red_flags_identified.length > 0) {
      summary += "RED FLAGS - IMMEDIATE ATTENTION REQUIRED:\n";
      diagnosis.red_flags_identified.forEach(flag => {
        summary += `• ${flag}\n`;
      });
      summary += "\n";
    }

    // Additional testing
    if (diagnosis.additional_testing_needed.length > 0) {
      summary += "Recommended Further Assessment:\n";
      diagnosis.additional_testing_needed.forEach(test => {
        summary += `• ${test}\n`;
      });
      summary += "\n";
    }

    // Footer
    summary += "________________\n\n";
    summary += "AI-assisted clinical decision support. Clinical correlation and professional judgment required for final diagnosis and treatment planning.";

    return summary;
  }
}

// AI Assessment Recommendation Service
export const getAIAssessmentRecommendations = async (screeningData: any) => {
  try {
    console.log('🤖 Starting AI assessment recommendation process...');
    
    // Import clinical assessments data
    const assessmentsData = await import('../data/ontology-data/entities/clinical_assessments.json');
    const assessments = assessmentsData.assessments;
    
    // Filter to only assessments with input_schema (functional forms)
    // Now dynamically check for input_schema presence instead of hardcoded list
    
    // Prepare assessment list for AI - only include assessments with working forms
    const availableAssessments = Object.entries(assessments)
      .filter(([id, assessment]: [string, any]) => assessment.input_schema && assessment.input_schema.primary_fields)
      .map(([id, assessment]: [string, any]) => ({
        id,
        name: assessment.name,
        type: assessment.type,
        body_regions: assessment.body_regions,
        purpose: assessment.purpose
      }));
    
    console.log(`📋 Found ${availableAssessments.length} assessments with input_schema (from ${Object.keys(assessments).length} total)`);
    
    // Prepare screening data
    const clinicalFindings = {
      chief_complaint: screeningData?.responses?.chief_complaint || 'Not specified',
      pain_details: {
        location: screeningData?.responses?.pain_location,
        intensity: screeningData?.responses?.vas_score,
        nature: screeningData?.responses?.pain_nature,
        timing: screeningData?.responses?.pain_timing
      },
      functional_limitations: {
        activities_affected: screeningData?.responses?.activities_affected,
        adl_scores: screeningData?.responses?.adl_scoring
      },
      physical_findings: {
        swelling: screeningData?.responses?.swelling_assessment,
        tenderness: screeningData?.responses?.tenderness_assessment,
        gait: screeningData?.responses?.gait_analysis
      },
      completion_percentage: screeningData?.completionPercentage || 0
    };

    const prompt = `As a physiotherapy expert, recommend relevant clinical assessment tests based on the patient's screening responses.

PATIENT SCREENING DATA:
${JSON.stringify(clinicalFindings, null, 2)}

AVAILABLE CLINICAL ASSESSMENTS:
${JSON.stringify(availableAssessments, null, 2)}

INSTRUCTIONS:
1. Analyze the patient's screening responses
2. Recommend ONLY the most relevant clinical assessment tests (no minimum, no maximum - just what's truly needed)
3. Provide relevance score (0-100%) and clinical reasoning for each recommendation
4. Consider body region, symptoms, and functional limitations

Return a JSON response in this exact format:
{
  "recommended_assessments": [
    {
      "assessment_id": "ASSESS_XXX",
      "name": "Test Name",
      "relevance_score": 85,
      "reasoning": "Clinical reasoning for why this test is needed",
      "estimated_priority": "high|medium|low"
    }
  ],
  "total_recommended": 3,
  "assessment_rationale": "Overall reasoning for the recommended assessment strategy"
}

Focus on quality over quantity - only recommend tests that will provide actionable clinical information.`;

    console.log('📤 Sending request to OpenAI for assessment recommendations...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Using same model as differential diagnosis
      messages: [
        {
          role: 'system',
          content: 'You are an expert physiotherapist AI specializing in clinical assessment selection. Provide evidence-based recommendations for relevant assessment tests.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
      // Removed response_format to match differential diagnosis approach
    });

    console.log('📥 Received response from OpenAI for assessments');

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    // Parse AI response - handle potential JSON parsing errors
    let aiResponse;
    try {
      aiResponse = JSON.parse(aiContent);
      console.log('🎯 Parsed AI Assessment Recommendations:', aiResponse);
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, attempting to extract JSON from response...');
      // Try to extract JSON from response if it's wrapped in text
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Transform to our format
    const recommendations = aiResponse.recommended_assessments.map((rec: any) => ({
      assessment_id: rec.assessment_id,
      name: rec.name,
      relevance_score: rec.relevance_score,
      reasoning: rec.reasoning,
      category: availableAssessments.find(a => a.id === rec.assessment_id)?.type?.replace('_', ' ') || 'Clinical Assessment',
      estimated_time: estimateTestTime(rec.assessment_id)
    }));

    return {
      success: true,
      recommendations,
      total_recommended: aiResponse.total_recommended,
      rationale: aiResponse.assessment_rationale
    };

  } catch (error) {
    console.error('❌ Error in AI assessment recommendation:', error);
    return {
      success: false,
      error: error.message,
      recommendations: []
    };
  }
};

// Helper function to estimate test time
const estimateTestTime = (assessmentId: string): string => {
  const timeMap: { [key: string]: string } = {
    'ASSESS_001': '3-5 minutes', // Lachman Test
    'ASSESS_010': '2-3 minutes', // Straight Leg Raise
    'ASSESS_056': '5-7 minutes', // Range of Motion
    'ASSESS_025': '3-4 minutes', // Hawkins-Kennedy
    'ASSESS_020': '4-6 minutes'  // Deep Tendon Reflexes
  };
  return timeMap[assessmentId] || '3-5 minutes';
};

// Export singleton instance
export const aiDiagnosticService = AIDiagnosticService.getInstance();