'use client';

import React, { useState, useEffect } from 'react';
import { 
  Apple, Coffee, Fish, Salad, Beef, Milk, 
  AlertCircle, Info, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Check, X
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
    recentNotes?: string;
  };
}

interface NutritionData {
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
}

const foodIcons: Record<string, React.ReactNode> = {
  'Proteins': <Beef className="h-5 w-5" />,
  'Dairy': <Milk className="h-5 w-5" />,
  'Fruits': <Apple className="h-5 w-5" />,
  'Vegetables': <Salad className="h-5 w-5" />,
  'Fish & Seafood': <Fish className="h-5 w-5" />,
  'Beverages': <Coffee className="h-5 w-5" />
};

export default function NutritionSuggestions({ patientData }: NutritionSuggestionsProps) {
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recommended: true,
    avoid: false,
    mealPlan: false,
    supplements: false,
    guidelines: false
  });

  useEffect(() => {
    fetchNutritionSuggestions();
  }, []);

  const fetchNutritionSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare the prompt for OpenAI
      const prompt = `Based on the following patient information, provide detailed nutrition recommendations for optimal recovery and health:

Patient Information:
- Age: ${patientData.age} years
- Gender: ${patientData.gender}
- Allergies: ${patientData.allergies?.join(', ') || 'None reported'}
- Current Medications: ${patientData.currentMedications?.join(', ') || 'None'}
- Medical History: ${patientData.medicalHistory || 'Not provided'}
- Recent Chief Complaints: ${patientData.chiefComplaints?.join(', ') || 'None'}

Please provide:
1. Recommended foods by category with reasons
2. Foods to avoid with specific reasons
3. Sample meal plan (breakfast, lunch, dinner, snacks)
4. Hydration recommendations
5. Supplement suggestions if needed
6. General dietary guidelines

Format the response as JSON with the following structure:
{
  "recommendedFoods": [
    {
      "category": "Category Name",
      "items": ["item1", "item2"],
      "reason": "Why these are beneficial"
    }
  ],
  "avoidFoods": [
    {
      "item": "Food item",
      "reason": "Why to avoid"
    }
  ],
  "mealPlan": {
    "breakfast": ["item1", "item2"],
    "lunch": ["item1", "item2"],
    "dinner": ["item1", "item2"],
    "snacks": ["item1", "item2"]
  },
  "hydration": "Specific hydration advice",
  "supplements": [
    {
      "name": "Supplement name",
      "dosage": "Recommended dosage",
      "reason": "Why it's recommended"
    }
  ],
  "generalGuidelines": ["guideline1", "guideline2"]
}`;

      const response = await ApiManager.generateNutritionPlan({ prompt });
      
      if (response.success && response.data) {
        setNutritionData(response.data);
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-healui-physio mb-4" />
          <p className="text-sm text-gray-600">Generating personalized nutrition recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          onClick={fetchNutritionSuggestions}
          className="flex items-center space-x-2 text-sm text-healui-physio hover:text-healui-primary"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (!nutritionData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-text-dark flex items-center">
          <Apple className="h-5 w-5 mr-2 text-healui-physio" />
          Nutrition & Diet Recommendations
        </h3>
        <button
          onClick={fetchNutritionSuggestions}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Recommended Foods */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('recommended')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h4 className="font-medium text-gray-900 flex items-center">
            <Check className="h-4 w-4 mr-2 text-green-600" />
            Recommended Foods
          </h4>
          {expandedSections.recommended ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.recommended && (
          <div className="px-4 py-3 border-t border-gray-200 space-y-4">
            {nutritionData.recommendedFoods.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  {foodIcons[category.category] || <Apple className="h-5 w-5" />}
                  <h5 className="font-medium text-gray-800">{category.category}</h5>
                </div>
                <div className="ml-7">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {category.items.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 italic">{category.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Foods to Avoid */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('avoid')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h4 className="font-medium text-gray-900 flex items-center">
            <X className="h-4 w-4 mr-2 text-red-600" />
            Foods to Avoid
          </h4>
          {expandedSections.avoid ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.avoid && (
          <div className="px-4 py-3 border-t border-gray-200 space-y-3">
            {nutritionData.avoidFoods.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                  {item.item}
                </span>
                <p className="text-sm text-gray-600 flex-1">{item.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal Plan */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('mealPlan')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h4 className="font-medium text-gray-900">Sample Meal Plan</h4>
          {expandedSections.mealPlan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.mealPlan && (
          <div className="px-4 py-3 border-t border-gray-200 space-y-4">
            {Object.entries(nutritionData.mealPlan).map(([meal, items]) => (
              <div key={meal}>
                <h5 className="font-medium text-gray-800 capitalize mb-2">{meal}</h5>
                <div className="flex flex-wrap gap-2">
                  {items.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-healui-physio/10 text-healui-physio rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hydration */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Hydration Guidelines</h4>
        <p className="text-sm text-blue-800">{nutritionData.hydration}</p>
      </div>

      {/* Supplements */}
      {nutritionData.supplements.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('supplements')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-medium text-gray-900">Recommended Supplements</h4>
            {expandedSections.supplements ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.supplements && (
            <div className="px-4 py-3 border-t border-gray-200 space-y-3">
              {nutritionData.supplements.map((supplement, index) => (
                <div key={index} className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-medium text-purple-900">{supplement.name}</h5>
                    <span className="text-sm text-purple-700">{supplement.dosage}</span>
                  </div>
                  <p className="text-sm text-purple-800">{supplement.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* General Guidelines */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('guidelines')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h4 className="font-medium text-gray-900 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            General Dietary Guidelines
          </h4>
          {expandedSections.guidelines ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {expandedSections.guidelines && (
          <div className="px-4 py-3 border-t border-gray-200">
            <ul className="space-y-2">
              {nutritionData.generalGuidelines.map((guideline, index) => (
                <li key={index} className="flex items-start">
                  <span className="block w-1.5 h-1.5 rounded-full bg-healui-physio mt-1.5 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{guideline}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Important Note</p>
            <p className="text-xs text-amber-700 mt-1">
              These recommendations are AI-generated based on the patient's profile. 
              Always consult with a qualified nutritionist or healthcare provider before making significant dietary changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}