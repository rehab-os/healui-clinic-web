'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AssessmentFormBuilder from './AssessmentFormBuilder';

interface QueuedAssessment {
  assessment_id: string;
  name: string;
  relevance_score?: number;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  form_data?: any;
  timestamp?: string;
}

interface AssessmentQueueProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssessments: any[];
  onAllComplete: (completedAssessments: any[]) => void;
  screeningData: any;
}

const AssessmentQueue: React.FC<AssessmentQueueProps> = ({
  isOpen,
  onClose,
  initialAssessments,
  onAllComplete,
  screeningData
}) => {
  const [assessmentQueue, setAssessmentQueue] = useState<QueuedAssessment[]>([]);

  // Initialize queue when initialAssessments changes
  useEffect(() => {
    console.log('🔧 AssessmentQueue: Initializing with assessments:', initialAssessments);
    if (initialAssessments && initialAssessments.length > 0) {
      const queue = initialAssessments.map(assessment => ({
        assessment_id: assessment.assessment_id,
        name: assessment.name,
        relevance_score: assessment.relevance_score,
        category: assessment.category || 'Clinical Assessment',
        status: 'pending' as const
      }));
      console.log('🔧 AssessmentQueue: Created queue:', queue);
      setAssessmentQueue(queue);
    }
  }, [initialAssessments]);
  
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [completedAssessments, setCompletedAssessments] = useState<any[]>([]);

  const currentAssessment = assessmentQueue[currentAssessmentIndex];
  const completedCount = assessmentQueue.filter(a => a.status === 'completed').length;
  const totalCount = assessmentQueue.length;

  const handleStartAssessments = () => {
    console.log('🔧 handleStartAssessments called');
    console.log('🔧 assessmentQueue.length:', assessmentQueue.length);
    console.log('🔧 assessmentQueue:', assessmentQueue);
    
    if (assessmentQueue.length > 0) {
      console.log('🔧 Setting currentAssessmentIndex to 0');
      setCurrentAssessmentIndex(0);
      console.log('🔧 Setting showAssessmentForm to true');
      setShowAssessmentForm(true);
      console.log('🔧 Updating assessment status to in_progress');
      updateAssessmentStatus(0, 'in_progress');
      console.log('🔧 Current assessment will be:', assessmentQueue[0]);
    } else {
      console.error('❌ No assessments in queue!');
    }
  };

  const updateAssessmentStatus = (index: number, status: QueuedAssessment['status']) => {
    setAssessmentQueue(prev => prev.map((assessment, i) => 
      i === index ? { ...assessment, status } : assessment
    ));
  };

  const handleAssessmentSubmit = (assessmentId: string, formData: any) => {
    // Add to completed assessments
    setCompletedAssessments(prev => [...prev, formData]);
    
    // Update queue status
    updateAssessmentStatus(currentAssessmentIndex, 'completed');
    
    // Move to next assessment or complete
    if (currentAssessmentIndex < assessmentQueue.length - 1) {
      setCurrentAssessmentIndex(currentAssessmentIndex + 1);
      updateAssessmentStatus(currentAssessmentIndex + 1, 'in_progress');
    } else {
      // All assessments completed
      handleAllComplete();
    }
  };

  const handleSkipAssessment = () => {
    updateAssessmentStatus(currentAssessmentIndex, 'skipped');
    
    if (currentAssessmentIndex < assessmentQueue.length - 1) {
      setCurrentAssessmentIndex(currentAssessmentIndex + 1);
      updateAssessmentStatus(currentAssessmentIndex + 1, 'in_progress');
    } else {
      handleAllComplete();
    }
  };

  const handleNextAssessment = () => {
    if (currentAssessmentIndex < assessmentQueue.length - 1) {
      setCurrentAssessmentIndex(currentAssessmentIndex + 1);
      updateAssessmentStatus(currentAssessmentIndex + 1, 'in_progress');
    } else {
      handleAllComplete();
    }
  };

  const handleAllComplete = () => {
    setShowAssessmentForm(false);
    onAllComplete(completedAssessments);
  };

  const getStatusIcon = (status: QueuedAssessment['status']) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'skipped': return '⏭️';
      default: return '📋';
    }
  };

  const getStatusColor = (status: QueuedAssessment['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100 animate-pulse';
      case 'skipped': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) {
    console.log('🔧 AssessmentQueue: isOpen is false, returning null');
    return null;
  }

  console.log('🔧 AssessmentQueue: Rendering with:', { 
    isOpen, 
    queueLength: assessmentQueue.length,
    initialAssessmentsLength: initialAssessments.length,
    assessmentQueue: assessmentQueue,
    showAssessmentForm: showAssessmentForm
  });

  const modalContent = (
    <>
      {/* Queue Management Interface */}
      {!showAssessmentForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 99999,
            pointerEvents: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    🔬 Clinical Assessment Queue
                  </h2>
                  <p className="text-purple-100 mt-2">
                    {totalCount} assessment{totalCount !== 1 ? 's' : ''} ready to execute
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{completedCount}/{totalCount} completed</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Assessment Queue List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <div className="space-y-4">
                {assessmentQueue.map((assessment, index) => (
                  <div
                    key={assessment.assessment_id}
                    className={`border rounded-xl p-4 transition-all ${
                      assessment.status === 'in_progress' 
                        ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{getStatusIcon(assessment.status)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {index + 1}. {assessment.name}
                          </h4>
                          <p className="text-sm text-gray-600">{assessment.category}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                          {assessment.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {assessment.relevance_score && (
                          <p className="text-xs text-gray-500 mt-1">
                            {assessment.relevance_score}% relevance
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {assessment.status === 'in_progress' && (
                      <div className="mt-3 p-3 bg-blue-100 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800 font-medium">
                          🎯 Currently active - Ready for execution
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartAssessments}
                  disabled={completedCount === totalCount}
                  className={`flex-1 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                    completedCount === totalCount
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {completedCount === totalCount ? '🎉 All Assessments Complete' : '▶️ Start Assessment Queue'}
                </button>
                
                {completedCount === totalCount && (
                  <button
                    onClick={handleAllComplete}
                    className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    🔬 View Enhanced Diagnosis
                  </button>
                )}
                
                <button
                  onClick={() => handleAllComplete()}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all"
                >
                  ⏭️ Skip Remaining & Proceed
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Tip:</strong> You can skip individual assessments during execution or complete all now for the most comprehensive AI diagnosis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );

  // Render the Assessment Form as a separate portal when needed
  console.log('🔧 AssessmentFormBuilder rendering check:', {
    showAssessmentForm,
    currentAssessment,
    currentAssessmentIndex,
    assessmentId: currentAssessment?.assessment_id
  });

  const assessmentFormContent = showAssessmentForm && currentAssessment && (
    <AssessmentFormBuilder
      isOpen={showAssessmentForm}
      onClose={() => {
        console.log('🔧 AssessmentFormBuilder onClose called');
        setShowAssessmentForm(false);
      }}
      assessmentId={currentAssessment.assessment_id}
      onSubmit={handleAssessmentSubmit}
      onNext={handleNextAssessment}
      onSkip={handleSkipAssessment}
      currentIndex={currentAssessmentIndex}
      totalAssessments={totalCount}
    />
  );

  return typeof window !== 'undefined' ? (
    <>
      {createPortal(modalContent, document.body)}
      {assessmentFormContent}
    </>
  ) : (
    <>
      {modalContent}
      {assessmentFormContent}
    </>
  );
};

export default AssessmentQueue;