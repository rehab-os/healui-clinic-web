'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Info, RefreshCw, Loader2,
  FileText, Pill, Sparkles
} from 'lucide-react';
import ApiManager from '../../services/api';

interface NutritionSuggestionsProps {
  patientData: {
    age: number;
    gender: string;
    allergies?: string[];
    currentMedications?: string[];
    medicalHistory?: string;
    chiefComplaints?: string[];
    recentNotes?: string | string[];
    visitHistory?: any[];
  };
  className?: string;
  onDataChange?: (data: NutritionData | null) => void;
}

interface NutritionData {
  bloodTests?: {
    test: string;
    reason: string;
  }[];
  recommendedFoods: {
    category: string;
    items: string[];
    reason: string;
  }[];
  avoidFoods: {
    item: string;
    reason: string;
  }[];
  mealPlan: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  hydration: string;
  supplements: {
    name: string;
    dosage: string;
    reason: string;
  }[];
  generalGuidelines: string[];
  generalAdvice?: {
    advice: string;
    reason: string;
  }[];
  precautions?: {
    precaution: string;
    reason: string;
  }[];
}

export default function NutritionSuggestions({ patientData, className, onDataChange }: NutritionSuggestionsProps) {
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNutritionSuggestions();
  }, []);

  const fetchNutritionSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare recent notes and visit history information
      const recentNotesStr = Array.isArray(patientData.recentNotes) 
        ? patientData.recentNotes.join('\n') 
        : patientData.recentNotes || '';
      
      const visitHistorySummary = patientData.visitHistory?.map((visit, index) => 
        `Visit ${index + 1}: ${visit.visit_type || 'General'} - ${visit.chief_complaint || 'No complaint'} - ${visit.scheduled_date || 'No date'}`
      ).join('\n') || 'No visit history';

      // Prepare the prompt for OpenAI
      const prompt = `As a specialized physiotherapy nutritionist, analyze this patient's condition and provide targeted nutrition recommendations for FAST RECOVERY.

Patient Profile:
- Age: ${patientData.age} years
- Gender: ${patientData.gender}
- Allergies: ${patientData.allergies?.join(', ') || 'None reported'}
- Current Medications: ${patientData.currentMedications?.join(', ') || 'None'}
- Medical History: ${patientData.medicalHistory || 'Not provided'}
- Chief Complaints: ${patientData.chiefComplaints?.join(', ') || 'None'}

Recent Clinical Notes:
${recentNotesStr || 'No recent clinical notes available'}

Recent Visit History:
${visitHistorySummary}

IMPORTANT INSTRUCTIONS:
1. Focus ONLY on nutrition that accelerates healing and recovery for their specific condition
2. For EACH recommendation, explain HOW it specifically helps their condition and speeds recovery
3. Prioritize anti-inflammatory foods, tissue repair nutrients, and pain-reducing foods
4. Consider their musculoskeletal issues, pain points, and mobility challenges
5. Recommend supplements only if they directly aid recovery (with specific mechanisms)
6. Recommend blood tests that can identify deficiencies affecting their recovery
7. Avoid generic advice - be specific to their physiotherapy needs

INCLUDE these sections with the exact format:

bloodTests array:
{
  "test": "Test Name",
  "reason": "How this test helps monitor/improve their specific condition and recovery"
}

generalAdvice array:
{
  "advice": "Specific lifestyle advice",
  "reason": "Why this advice helps their recovery and condition"
}

precautions array:
{
  "precaution": "Specific thing to avoid or be careful about",
  "reason": "Why this precaution is important for their condition"
}

For recommendedFoods categories, use: "Anti-inflammatory Foods", "Tissue Repair Foods", "Pain Management Foods", "Bone & Joint Health", "Muscle Recovery Foods"

For each food item, format the reason as: "Contains [nutrient] which [specific benefit for their condition]"

For supplements, explain the exact mechanism: "[Supplement] - helps [specific recovery process] by [mechanism]"

For blood tests, explain: "Identifies [deficiency/marker] which affects [specific aspect of their condition/recovery]"

For general advice, focus on: posture tips, exercise modifications, sleep recommendations, stress management
For precautions, focus on: activities to avoid, foods that worsen inflammation, lifestyle factors that slow recovery`;

      const response = await ApiManager.generateNutritionPlan({ prompt });
      
      if (response.success && response.data) {
        setNutritionData(response.data);
        onDataChange?.(response.data);
      } else {
        setError('Failed to generate nutrition suggestions');
      }
    } catch (err) {
      console.error('Error fetching nutrition suggestions:', err);
      setError('Failed to load nutrition recommendations');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className={`space-y-3 ${className || ''}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-healui-physio mr-2" />
          <p className="text-xs text-gray-600">AI Agent analyzing nutrition needs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-3 ${className || ''}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <p className="text-xs font-medium">{error}</p>
        </div>
        <button
          onClick={fetchNutritionSuggestions}
          className="flex items-center space-x-1 text-xs text-healui-physio hover:text-healui-primary"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!nutritionData) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-600">
          <Sparkles className="h-3.5 w-3.5 mr-1 text-healui-physio" />
          <span className="font-medium">Nutrition AI Agent Recommendations</span>
        </div>
        <button
          onClick={fetchNutritionSuggestions}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Blood Tests Recommendations */}
      {nutritionData.bloodTests && nutritionData.bloodTests.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <h4 className="text-xs font-semibold text-yellow-900 mb-2 flex items-center">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Recommended Blood Tests
          </h4>
          <div className="space-y-2">
            {nutritionData.bloodTests.map((test, index) => (
              <div key={index} className="text-xs border-b border-yellow-100 last:border-0 pb-2 last:pb-0">
                <div className="text-yellow-900 font-medium">• {test.test}</div>
                <div className="text-yellow-800 ml-3 mt-0.5">
                  <span className="font-medium">Why for your condition: </span>
                  {test.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Foods for Recovery */}
      {nutritionData.recommendedFoods && nutritionData.recommendedFoods.length > 0 && (
        <div className="space-y-2">
          {nutritionData.recommendedFoods.map((category, index) => (
            <div key={index} className="bg-green-50 rounded-lg p-3 border border-green-200">
              <h4 className="text-xs font-semibold text-green-900 mb-1.5">
                {category.category}
              </h4>
              <div className="space-y-1">
                {category.items.map((item, idx) => (
                  <div key={idx} className="text-xs text-green-800">• {item}</div>
                ))}
              </div>
              {category.reason && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Why: </span>
                    {category.reason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Foods to Avoid */}
      {nutritionData.avoidFoods && nutritionData.avoidFoods.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <h4 className="text-xs font-semibold text-red-900 mb-2 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Foods to Avoid for Faster Recovery
          </h4>
          <div className="space-y-2">
            {nutritionData.avoidFoods.map((food, index) => (
              <div key={index} className="text-xs">
                <div className="text-red-800 font-medium">• {food.item}</div>
                {food.reason && (
                  <div className="text-red-700 ml-3 mt-0.5 italic">
                    Impact: {food.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplements */}
      {nutritionData.supplements && nutritionData.supplements.length > 0 && (
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <h4 className="text-xs font-semibold text-purple-900 mb-2 flex items-center">
            <Pill className="h-3.5 w-3.5 mr-1.5" />
            Recovery-Enhancing Supplements
          </h4>
          <div className="space-y-2">
            {nutritionData.supplements.map((supplement, index) => (
              <div key={index} className="text-xs border-b border-purple-100 last:border-0 pb-2 last:pb-0">
                <div className="text-purple-800 font-medium">
                  • {supplement.name}
                  {supplement.dosage && (
                    <span className="text-purple-700 font-normal"> - {supplement.dosage}</span>
                  )}
                </div>
                {supplement.reason && (
                  <div className="text-purple-700 ml-3 mt-0.5">
                    <span className="font-medium">Recovery benefit: </span>
                    {supplement.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hydration Guidelines */}
      {nutritionData.hydration && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="text-xs font-semibold text-blue-900 mb-1 flex items-center">
            <Info className="h-3.5 w-3.5 mr-1.5" />
            Hydration for Tissue Recovery
          </h4>
          <p className="text-xs text-blue-800">{nutritionData.hydration}</p>
        </div>
      )}

      {/* General Dietary Guidelines */}
      {nutritionData.generalGuidelines && nutritionData.generalGuidelines.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">
            Key Recovery Guidelines
          </h4>
          <div className="space-y-1">
            {nutritionData.generalGuidelines.map((guideline, index) => (
              <div key={index} className="text-xs text-gray-700">• {guideline}</div>
            ))}
          </div>
        </div>
      )}

      {/* General Recovery Advice */}
      {nutritionData.generalAdvice && nutritionData.generalAdvice.length > 0 && (
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <h4 className="text-xs font-semibold text-emerald-900 mb-2 flex items-center">
            <Info className="h-3.5 w-3.5 mr-1.5" />
            General Recovery Advice
          </h4>
          <div className="space-y-2">
            {nutritionData.generalAdvice.map((item, index) => (
              <div key={index} className="text-xs border-b border-emerald-100 last:border-0 pb-2 last:pb-0">
                <div className="text-emerald-800 font-medium">• {item.advice}</div>
                <div className="text-emerald-700 ml-3 mt-0.5">
                  <span className="font-medium">Why: </span>
                  {item.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Precautions & Things to Avoid */}
      {nutritionData.precautions && nutritionData.precautions.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <h4 className="text-xs font-semibold text-orange-900 mb-2 flex items-center">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Important Precautions
          </h4>
          <div className="space-y-2">
            {nutritionData.precautions.map((item, index) => (
              <div key={index} className="text-xs border-b border-orange-100 last:border-0 pb-2 last:pb-0">
                <div className="text-orange-800 font-medium">• {item.precaution}</div>
                <div className="text-orange-700 ml-3 mt-0.5">
                  <span className="font-medium">Why important: </span>
                  {item.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 italic">
          Recovery-focused recommendations by AI. Consult your physiotherapist before making dietary changes.
        </p>
      </div>
    </div>
  );
}