// Quick test to check what ChatbotAssessmentBuilder actually returns

// Mock data structure
const selectedCondition = {
  condition_id: "COND_001",
  clinical_reasoning: "Test diagnosis",
  condition: {
    snomed_ct: "123456",
    icd10: "M79.3",
    body_region: "shoulder",
    specialty: "orthopedic"
  }
};

const assessmentData = {
  assessment_id: "test_123",
  assessment_type: 'CHATBOT_COMPREHENSIVE',
  assessment_date: new Date().toISOString(),
  assessment_duration_minutes: 10,
  clinical_parameters: {},
  red_flags: {
    flags_present: [],
    assessment_notes: "",
    urgency_level: 'LOW'
  },
  functional_baseline: {
    adl_scores: {},
    adl_average: 100,
    work_impact: "none",
    sport_impact: "none", 
    primary_goals: []
  },
  raw_responses: {
    chatbot_session: {
      responses: {
        condition_classification: "ACUTE"
      }
    }
  }
};

// Simulate the createConditionWithAssessment method
function createConditionWithAssessment(patientId, selectedCondition, assessmentData) {
  const conditionType = assessmentData.raw_responses?.chatbot_session?.responses?.condition_classification || 'ACUTE';
  const ontologyId = selectedCondition.condition_id || selectedCondition.id;
  
  return {
    neo4j_condition_id: ontologyId,
    description: `AI-assisted diagnosis: ${selectedCondition.clinical_reasoning || selectedCondition.name}`,
    condition_type: conditionType,
    onset_date: new Date().toISOString(),
    
    initial_assessment_data: assessmentData,
    assessment_method: 'CHATBOT'
  };
}

const result = createConditionWithAssessment("patient_123", selectedCondition, assessmentData);

console.log("Generated payload:");
console.log(JSON.stringify(result, null, 2));

// Check for problematic fields
if (result._internal_ontology_id) {
  console.log("❌ Found _internal_ontology_id");
} else {
  console.log("✅ No _internal_ontology_id");
}

if (result._internal_metadata) {
  console.log("❌ Found _internal_metadata");
} else {
  console.log("✅ No _internal_metadata");
}