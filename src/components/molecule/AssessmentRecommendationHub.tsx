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

interface ClinicalAssessment {
  name: string;
  type: string;
  body_regions: string[];
  purpose: string;
  description: string;
  category?: string;
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
  const [availableAssessments, setAvailableAssessments] = useState<Record<string, ClinicalAssessment>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAssessments, setSelectedAssessments] = useState<AssessmentRecommendation[]>([]);

  useEffect(() => {
    if (isOpen && screeningData) {
      generateRecommendations();
      loadClinicalAssessments();
    }
  }, [isOpen, screeningData]);

  useEffect(() => {
    setSelectedAssessments(recommendations);
  }, [recommendations]);

  const loadClinicalAssessments = async () => {
    try {
      const response = await import('../../data/ontology-data/entities/clinical_assessments.json');
      setAvailableAssessments(response.assessments);
    } catch (error) {
      console.error('Failed to load clinical assessments:', error);
    }
  };

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

  const removeAssessment = (assessmentId: string) => {
    setSelectedAssessments(prev => prev.filter(a => a.assessment_id !== assessmentId));
  };

  const addAssessment = (assessmentId: string, assessment: ClinicalAssessment) => {
    const newAssessment: AssessmentRecommendation = {
      assessment_id: assessmentId,
      name: assessment.name,
      relevance_score: 75, // Default relevance score for manually added assessments
      reasoning: `Manually added - ${assessment.purpose}`,
      category: assessment.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      estimated_time: '5-10 minutes' // Default time estimate
    };
    setSelectedAssessments(prev => [...prev, newAssessment]);
  };

  const filteredAssessments = Object.entries(availableAssessments).filter(([id, assessment]) => {
    const isAlreadySelected = selectedAssessments.some(sa => sa.assessment_id === id);
    
    const matchesSearch = searchTerm === '' || 
      assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.body_regions.some(region => region.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' ||
      assessment.type.toLowerCase().includes(selectedFilter.toLowerCase()) ||
      assessment.body_regions.some(region => region.toLowerCase().includes(selectedFilter.toLowerCase()));
    
    return !isAlreadySelected && matchesSearch && matchesFilter;
  });

  if (!isOpen) {
    console.log('🔧 AssessmentRecommendationHub: isOpen is false, returning null');
    return null;
  }

  console.log('🔧 AssessmentRecommendationHub: Rendering modal with isOpen =', isOpen);

  const modalContent = (
    <div 
      className="fixed inset-0 bg-white z-[99999]"
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
      <div className="h-full w-full flex flex-col overflow-hidden">
        
        {/* Fullscreen Professional Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                🎯 Screening Complete
              </h2>
              <p className="text-gray-600 mt-2 text-lg">
                Customize your clinical assessment selection from our comprehensive database
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              {/* Left Column - Selected Assessments */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Selected Clinical Assessments
                  </h3>
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-lg font-medium">
                    {selectedAssessments.length} tests
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4">
                  {selectedAssessments.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-xl">No assessments selected</p>
                      <p className="text-lg mt-2">Search and add assessments from the clinical database →</p>
                    </div>
                  ) : (
                    selectedAssessments.map((assessment, index) => (
                    <div 
                      key={assessment.assessment_id}
                      className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg mb-2">
                            {assessment.name}
                          </h4>
                          <div className="flex items-center gap-6 text-base text-gray-600 mb-3">
                            <span className="bg-gray-100 px-3 py-1 rounded-full">{assessment.category}</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {assessment.estimated_time}
                            </span>
                            <span className="text-blue-600 font-semibold">{assessment.relevance_score}% match</span>
                          </div>
                          <p className="text-base text-gray-700 leading-relaxed">
                            {assessment.reasoning}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAssessment(assessment.assessment_id)}
                          className="ml-4 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title="Remove assessment"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Right Column - Assessment Database Search */}
              <div className="flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Clinical Assessment Database
                  </h3>
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-medium">
                    {Object.keys(availableAssessments).length} available
                  </span>
                </div>

                {/* Enhanced Search with Clear Button */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, purpose, body region, or assessment type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-sm"
                    />
                    <svg className="absolute left-4 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-3 w-5 h-5 text-gray-400 hover:text-gray-600"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {[
                      { key: 'all', label: 'All', count: Object.keys(availableAssessments).length },
                      { key: 'ligament_stability', label: 'Ligament Tests', count: 0 },
                      { key: 'range_of_motion', label: 'ROM Tests', count: 0 },
                      { key: 'special_tests', label: 'Special Tests', count: 0 },
                      { key: 'neurological', label: 'Neurological', count: 0 },
                      { key: 'muscle_testing', label: 'Muscle Tests', count: 0 },
                      { key: 'functional', label: 'Functional', count: 0 },
                      { key: 'shoulder', label: 'Shoulder', count: 0 },
                      { key: 'knee', label: 'Knee', count: 0 },
                      { key: 'spine', label: 'Spine', count: 0 },
                      { key: 'hip', label: 'Hip', count: 0 },
                      { key: 'ankle', label: 'Ankle', count: 0 },
                      { key: 'wrist', label: 'Wrist/Hand', count: 0 }
                    ].map(filter => {
                      const isActive = selectedFilter === filter.key;
                      const assessmentCount = filter.key === 'all' ? 
                        filteredAssessments.length : 
                        filteredAssessments.filter(([id, assessment]) => 
                          assessment.type.includes(filter.key) || 
                          assessment.body_regions.some(region => region.includes(filter.key))
                        ).length;
                      
                      return (
                        <button
                          key={filter.key}
                          onClick={() => setSelectedFilter(filter.key)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {filter.label}
                          <span className={`ml-1 text-xs ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                            ({assessmentCount})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Assessment Results with Improved Scrolling */}
                <div className="flex-1 min-h-0">
                  <div className="h-full overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {filteredAssessments.length === 0 && (searchTerm !== '' || selectedFilter !== 'all') ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg">No assessments found</p>
                        <p className="text-sm mt-1">Try different search terms or filters</p>
                      </div>
                    ) : filteredAssessments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg">Start searching</p>
                        <p className="text-sm mt-1">Use search or filters to find assessments</p>
                      </div>
                    ) : (
                      <>
                        {filteredAssessments.slice(0, 56).map(([id, assessment]) => (
                          <div
                            key={id}
                            className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                                  {assessment.name}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1 flex-wrap">
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                                    {assessment.type.replace(/_/g, ' ')}
                                  </span>
                                  {assessment.body_regions.slice(0, 2).map(region => (
                                    <span key={region} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                      {region}
                                    </span>
                                  ))}
                                  {assessment.body_regions.length > 2 && (
                                    <span className="text-gray-500 text-xs">+{assessment.body_regions.length - 2}</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700 leading-tight line-clamp-2">
                                  {assessment.purpose}
                                </p>
                              </div>
                              <button
                                onClick={() => addAssessment(id, assessment)}
                                className="flex-shrink-0 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                title={`Add ${assessment.name}`}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredAssessments.length > 56 && (
                          <div className="text-center py-3 text-gray-500 border-t border-gray-200 mt-2">
                            <p className="text-sm">Showing first 56 of {filteredAssessments.length} assessments</p>
                            <p className="text-xs mt-1">Refine your search or filters to see more specific results</p>
                          </div>
                        )}
                        {filteredAssessments.length > 0 && filteredAssessments.length <= 56 && (
                          <div className="text-center py-3 text-gray-500 border-t border-gray-200 mt-2">
                            <p className="text-sm">{filteredAssessments.length} assessments found</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Bottom Action Bar */}
          <div className="border-t border-gray-200 bg-white px-8 py-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-gray-600">
                  <span className="text-2xl font-bold text-gray-900">{selectedAssessments.length}</span>
                  <span className="text-lg ml-2">assessments selected</span>
                </div>
                <div className="text-gray-600">
                  <span className="text-2xl font-bold text-blue-600">
                    {selectedAssessments.reduce((total, assessment) => {
                      const timeMatch = assessment.estimated_time.match(/(\d+)/);
                      return total + (timeMatch ? parseInt(timeMatch[1]) : 5);
                    }, 0)}
                  </span>
                  <span className="text-lg ml-2">minutes estimated</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={onChooseCustom}
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-lg font-medium"
                >
                  Choose Different Tests
                </button>
                
                <button
                  onClick={onSkipAll}
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-lg font-medium"
                >
                  Skip to Diagnosis
                </button>

                <button
                  onClick={() => onStartRecommended(selectedAssessments)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  disabled={selectedAssessments.length === 0}
                >
                  Start Selected Assessments
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default AssessmentRecommendationHub;