import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { action, payload } = body

    if (action === 'differential_diagnosis') {
      return handleDifferentialDiagnosis(payload)
    } else if (action === 'assessment_recommendations') {
      return handleAssessmentRecommendations(payload)
    } else if (action === 'analyze_findings') {
      return handleAnalyzeFindings(payload)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('AI diagnostic route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleDifferentialDiagnosis(diagnosticData: any) {
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
}`

  const userPrompt = `Clinical Findings:
Chief Complaint: ${diagnosticData.assessment_data?.clinicalFindings?.chief_complaint || 'Not specified'}
Pain Data: ${JSON.stringify(diagnosticData.assessment_data?.clinicalFindings?.pain || {})}
Neurological: ${JSON.stringify(diagnosticData.assessment_data?.clinicalFindings?.neurological || {})}
Functional: ${JSON.stringify(diagnosticData.assessment_data?.clinicalFindings?.functional || {})}
Objective: ${JSON.stringify(diagnosticData.assessment_data?.clinicalFindings?.objective || {})}

Available Conditions (select from these only):
${(diagnosticData.available_conditions || []).map((c: any) => `${c.id}: ${c.name} (${c.body_region})`).join('\n')}

Analyze and return top 5 most likely conditions in JSON format.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const aiResponse = response.choices[0].message.content
    if (!aiResponse) throw new Error('Empty response from OpenAI')

    const parsed = JSON.parse(aiResponse)
    return NextResponse.json({
      differential_diagnosis: parsed.differential_diagnosis || [],
      excluded_conditions: parsed.excluded_conditions || [],
      additional_testing_needed: parsed.additional_testing_needed || [],
      red_flags_identified: parsed.red_flags_identified || [],
      treatment_urgency: parsed.treatment_urgency || 'moderate',
    })
  } catch (error: any) {
    console.error('Differential diagnosis error:', error)
    // Fallback with top conditions from the request
    const topConditions = (diagnosticData.available_conditions || []).slice(0, 5)
    return NextResponse.json({
      differential_diagnosis: topConditions.map((condition: any, index: number) => ({
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
    })
  }
}

async function handleAssessmentRecommendations(screeningData: any) {
  const clinicalFindings = {
    chief_complaint: screeningData?.responses?.chief_complaint || 'Not specified',
    pain_details: {
      location: screeningData?.responses?.pain_location,
      intensity: screeningData?.responses?.vas_score,
      nature: screeningData?.responses?.pain_nature,
      timing: screeningData?.responses?.pain_timing,
    },
    functional_limitations: {
      activities_affected: screeningData?.responses?.activities_affected,
      adl_scores: screeningData?.responses?.adl_scoring,
    },
    physical_findings: {
      swelling: screeningData?.responses?.swelling_assessment,
      tenderness: screeningData?.responses?.tenderness_assessment,
      gait: screeningData?.responses?.gait_analysis,
    },
    completion_percentage: screeningData?.completionPercentage || 0,
  }

  const availableAssessments = screeningData?.availableAssessments || []

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

Focus on quality over quantity - only recommend tests that will provide actionable clinical information.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert physiotherapist AI specializing in clinical assessment selection. Provide evidence-based recommendations for relevant assessment tests.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const aiContent = response.choices[0]?.message?.content
    if (!aiContent) throw new Error('No content in AI response')

    let aiResponse
    try {
      aiResponse = JSON.parse(aiContent)
    } catch {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    return NextResponse.json({
      success: true,
      recommendations: aiResponse.recommended_assessments || [],
      total_recommended: aiResponse.total_recommended,
      rationale: aiResponse.assessment_rationale,
    })
  } catch (error: any) {
    console.error('Assessment recommendations error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      recommendations: [],
    })
  }
}

async function handleAnalyzeFindings(payload: any) {
  const { clinicalFindings, availableConditions } = payload

  try {
    const prompt = `Based on these clinical findings, identify the 5 most relevant conditions from the provided list:

Clinical Findings:
${JSON.stringify(clinicalFindings, null, 2)}

Available Conditions:
${(availableConditions || []).map((c: any) => `${c.id}: ${c.name} (${c.body_region})`).join('\n')}

Return only a JSON object with an array of condition IDs (e.g., {"condition_ids": ["COND_001", "COND_025"]}) that are most relevant to these clinical findings.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{"condition_ids": []}')
    return NextResponse.json({ condition_ids: result.condition_ids || [] })
  } catch (error: any) {
    console.error('Analyze findings error:', error)
    return NextResponse.json({ condition_ids: [] })
  }
}
