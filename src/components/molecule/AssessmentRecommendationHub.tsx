'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAIAssessmentRecommendations } from '../../services/aiDiagnosticService';

interface AssessmentRecommendation {
  assessment_id: string;
  name: string;
  relevance_score: number;
  reasoning: string;
  category: string;
  estimated_time: string;
}

interface AssessmentRecommendationHubProps {
  isOpen: boolean;
  onClose: () => void;
  screeningData: any;
  onStartRecommended: (assessments: AssessmentRecommendation[]) => void;
  onChooseCustom: () => void;
  onSkipAll: () => void;
}

const AssessmentRecommendationHub: React.FC<AssessmentRecommendationHubProps> = ({
  isOpen,
  onClose,
  screeningData,
  onStartRecommended,
  onChooseCustom,
  onSkipAll
}) => {
  const [recommendations, setRecommendations] = useState<AssessmentRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && screeningData) {
      generateRecommendations();
    }
  }, [isOpen, screeningData]);

  const generateRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🤖 Generating AI-powered assessment recommendations...');
      
      // Call AI assessment recommendation service
      const aiRecommendations = await getAIAssessmentRecommendations(screeningData);
      
      if (aiRecommendations.success) {
        console.log('✅ AI Assessment Recommendations received:', aiRecommendations.recommendations);
        setRecommendations(aiRecommendations.recommendations);
      } else {
        console.log('⚠️ AI Assessment failed, using fallback recommendations');
        // Fallback to simple recommendations
        const fallbackRecommendations: AssessmentRecommendation[] = [
          {
            assessment_id: 'ASSESS_056',
            name: 'Range of Motion Assessment',
            relevance_score: 85,
            reasoning: 'Basic movement assessment recommended for all patients',
            category: 'Mobility',
            estimated_time: '5-7 minutes'
          }
        ];
        setRecommendations(fallbackRecommendations);
      }
    } catch (err) {
      setError('Failed to generate assessment recommendations');
      console.error('Assessment recommendation error:', err);
      
      // Fallback recommendations on error
      const fallbackRecommendations: AssessmentRecommendation[] = [
        {
          assessment_id: 'ASSESS_056',
          name: 'Range of Motion Assessment',
          relevance_score: 85,
          reasoning: 'Basic movement assessment recommended',
          category: 'Mobility',
          estimated_time: '5-7 minutes'
        }
      ];
      setRecommendations(fallbackRecommendations);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getRelevanceIcon = (score: number) => {
    if (score >= 90) return '🎯';
    if (score >= 80) return '💡';
    return '📋';
  };

  if (!isOpen) {
    console.log('🔧 AssessmentRecommendationHub: isOpen is false, returning null');
    return null;
  }

  console.log('🔧 AssessmentRecommendationHub: Rendering modal with isOpen =', isOpen);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                📊 Screening Complete!
              </h2>
              <p className="text-teal-100 mt-2">
                Based on your responses, we recommend these clinical assessments
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-teal-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">🤖 AI analyzing your screening responses...</p>
                <p className="text-sm text-gray-500 mt-2">Generating personalized assessment recommendations</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">❌ {error}</div>
              <button 
                onClick={generateRecommendations}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* AI Recommendations Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  🤖 AI RECOMMENDED ({recommendations.length})
                </h3>
                
                <div className="space-y-4">
                  {recommendations.map((assessment, index) => (
                    <div 
                      key={assessment.assessment_id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getRelevanceIcon(assessment.relevance_score)}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-lg">
                              {assessment.name}
                            </h4>
                            <p className="text-sm text-gray-600">{assessment.category}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRelevanceColor(assessment.relevance_score)}`}>
                            {assessment.relevance_score}% relevance
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{assessment.estimated_time}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        <span className="font-medium">Clinical Reasoning:</span> {assessment.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => onStartRecommended(recommendations)}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  ▶️ Start Recommended Assessments
                  <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    {recommendations.reduce((total, assessment) => {
                      const timeMatch = assessment.estimated_time.match(/(\d+)/);
                      return total + (timeMatch ? parseInt(timeMatch[1]) : 5);
                    }, 0)} min total
                  </span>
                </button>
                
                <button
                  onClick={onChooseCustom}
                  className="flex-1 bg-white text-teal-600 px-6 py-4 rounded-xl font-semibold text-lg border-2 border-teal-600 hover:bg-teal-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  🔍 Choose Custom Assessments
                </button>
                
                <button
                  onClick={onSkipAll}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  ⏭️ Skip to Diagnosis
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> These assessments will provide objective data to enhance the AI diagnosis accuracy. 
                  You can always add more assessments during the process or skip any that seem unnecessary.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default AssessmentRecommendationHub;