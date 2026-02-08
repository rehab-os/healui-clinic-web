'use client';

import { useState, useCallback } from 'react';

export interface AssessmentFlowState {
  showAssessmentHub: boolean;
  showDirectAssessment: boolean;
  selectedAssessments: any[];
  completedAssessments: any[];
  currentAssessmentIndex: number;
}

export const useAssessmentFlow = (addBotMessage: (msg: string) => void) => {
  const [showAssessmentHub, setShowAssessmentHub] = useState(false);
  const [showDirectAssessment, setShowDirectAssessment] = useState(false);
  const [selectedAssessments, setSelectedAssessments] = useState<any[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<any[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);

  // Start the assessment hub
  const startAssessmentHub = useCallback(() => {
    setShowAssessmentHub(true);
  }, []);

  // Handle starting recommended assessments
  const handleStartRecommended = useCallback(
    (assessments: any[]) => {
      if (!assessments || assessments.length === 0) {
        addBotMessage('No assessments were selected. Proceeding to diagnosis...');
        return null; // Signal to proceed to diagnosis
      }

      setSelectedAssessments(assessments);
      setCurrentAssessmentIndex(0);
      setShowAssessmentHub(false);

      addBotMessage(
        `Starting ${assessments.length} clinical assessments. Assessment 1 of ${assessments.length}: ${assessments[0].name}`
      );

      setTimeout(() => {
        setShowDirectAssessment(true);
      }, 500);

      return 'assessments_started';
    },
    [addBotMessage]
  );

  // Handle choosing custom assessments
  const handleChooseCustom = useCallback(() => {
    setShowAssessmentHub(false);
    addBotMessage('Custom assessment selection not yet implemented. Proceeding to diagnosis...');
    return null; // Signal to proceed to diagnosis
  }, [addBotMessage]);

  // Handle skipping all assessments
  const handleSkipAllAssessments = useCallback(() => {
    setShowAssessmentHub(false);
    addBotMessage('Skipping clinical assessments. Generating diagnosis based on screening data...');
    return null; // Signal to proceed to diagnosis
  }, [addBotMessage]);

  // Handle assessment form submission
  const handleDirectAssessmentSubmit = useCallback(
    (assessmentId: string, formData: any) => {
      // Add to completed assessments
      const assessment = selectedAssessments[currentAssessmentIndex];
      setCompletedAssessments((prev) => [
        ...prev,
        {
          assessment_id: assessmentId,
          assessment_name: assessment?.name || assessmentId,
          form_data: formData,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Check if more assessments remain
      if (currentAssessmentIndex < selectedAssessments.length - 1) {
        const nextIndex = currentAssessmentIndex + 1;
        setCurrentAssessmentIndex(nextIndex);
        addBotMessage(
          `Assessment ${nextIndex + 1} of ${selectedAssessments.length}: ${selectedAssessments[nextIndex].name}`
        );
        return 'next_assessment';
      } else {
        // All assessments completed
        setShowDirectAssessment(false);
        addBotMessage(
          `Clinical assessments completed! ${completedAssessments.length + 1} tests documented. Generating enhanced AI diagnosis...`
        );
        return 'all_complete';
      }
    },
    [selectedAssessments, currentAssessmentIndex, completedAssessments, addBotMessage]
  );

  // Handle skipping current assessment
  const handleDirectAssessmentSkip = useCallback(() => {
    if (currentAssessmentIndex < selectedAssessments.length - 1) {
      const nextIndex = currentAssessmentIndex + 1;
      setCurrentAssessmentIndex(nextIndex);
      addBotMessage(
        `Skipped. Assessment ${nextIndex + 1} of ${selectedAssessments.length}: ${selectedAssessments[nextIndex].name}`
      );
      return 'next_assessment';
    } else {
      setShowDirectAssessment(false);
      addBotMessage(
        `Clinical assessments completed! ${completedAssessments.length} tests documented. Generating enhanced AI diagnosis...`
      );
      return 'all_complete';
    }
  }, [selectedAssessments, currentAssessmentIndex, completedAssessments, addBotMessage]);

  return {
    // State
    showAssessmentHub,
    showDirectAssessment,
    selectedAssessments,
    completedAssessments,
    currentAssessmentIndex,

    // Actions
    startAssessmentHub,
    handleStartRecommended,
    handleChooseCustom,
    handleSkipAllAssessments,
    handleDirectAssessmentSubmit,
    handleDirectAssessmentSkip,
  };
};
