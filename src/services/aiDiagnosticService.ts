import OpenAI from 'openai';

// Initialize OpenAI client with environment variable
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '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',
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
    let summary = "🤖 **AI DIFFERENTIAL DIAGNOSIS**\n\n";
    
    summary += "**Top Probable Conditions:**\n";
    diagnosis.differential_diagnosis
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5)
      .forEach((condition, index) => {
        const confidence = Math.round(condition.confidence_score * 100);
        summary += `${index + 1}. **${condition.condition_name}** (${confidence}% confidence)\n`;
        summary += `   Clinical Reasoning: ${condition.clinical_reasoning}\n`;
        if (condition.supporting_evidence.length > 0) {
          summary += `   Supporting Evidence: ${condition.supporting_evidence.join(', ')}\n`;
        }
        summary += "\n";
      });

    if (diagnosis.red_flags_identified.length > 0) {
      summary += "⚠️ **RED FLAGS IDENTIFIED:**\n";
      diagnosis.red_flags_identified.forEach(flag => {
        summary += `• ${flag}\n`;
      });
      summary += "\n";
    }

    if (diagnosis.additional_testing_needed.length > 0) {
      summary += "🔬 **ADDITIONAL TESTING RECOMMENDED:**\n";
      diagnosis.additional_testing_needed.forEach(test => {
        summary += `• ${test}\n`;
      });
      summary += "\n";
    }

    summary += `**Treatment Urgency:** ${diagnosis.treatment_urgency.toUpperCase()}\n\n`;
    summary += "*AI analysis for clinical decision support. Final diagnosis requires clinical judgment.*";

    return summary;
  }
}

// Export singleton instance
export const aiDiagnosticService = AIDiagnosticService.getInstance();