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
        
        {/* Clean Professional Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Screening Complete
              </h2>
              <p className="text-gray-600 mt-1">
                Recommended clinical assessments based on patient responses
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing screening responses...</p>
                <p className="text-sm text-gray-500 mt-2">Generating assessment recommendations</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">{error}</div>
              <button 
                onClick={generateRecommendations}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Clean Recommendations Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recommended Clinical Assessments
                  </h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {recommendations.length} tests
                  </span>
                </div>
                
                <div className="space-y-3">
                  {recommendations.map((assessment, index) => (
                    <div 
                      key={assessment.assessment_id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-base mb-1">
                            {assessment.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>{assessment.category}</span>
                            <span>{assessment.estimated_time}</span>
                            <span className="text-blue-600 font-medium">{assessment.relevance_score}% match</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {assessment.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear Action Hierarchy */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                {/* Primary Action */}
                <button
                  onClick={() => onStartRecommended(recommendations)}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-medium text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
                >
                  Start Recommended Assessments
                  <span className="bg-blue-500 px-2 py-1 rounded text-sm">
                    {recommendations.reduce((total, assessment) => {
                      const timeMatch = assessment.estimated_time.match(/(\d+)/);
                      return total + (timeMatch ? parseInt(timeMatch[1]) : 5);
                    }, 0)} min
                  </span>
                </button>
                
                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onChooseCustom}
                    className="bg-white text-gray-700 px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Choose Different Tests
                  </button>
                  
                  <button
                    onClick={onSkipAll}
                    className="bg-white text-gray-700 px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Skip to Diagnosis
                  </button>
                </div>
              </div>

              {/* Professional Note */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> These assessments provide objective data to enhance diagnostic accuracy. 
                  Additional tests can be added during the assessment process if needed.
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