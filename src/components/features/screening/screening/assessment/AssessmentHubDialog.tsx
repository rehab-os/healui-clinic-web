'use client';

import React from 'react';
import AssessmentRecommendationHub from '@/components/features/assessments/AssessmentRecommendationHub';
import AssessmentFormBuilder from '@/components/features/assessments/AssessmentFormBuilder';

interface AssessmentHubDialogProps {
  // Hub props
  isHubOpen: boolean;
  onHubClose: () => void;
  screeningData: {
    responses: Record<string, any>;
    selectedRegions: any[];
    redFlags: string[];
    collectedData: Record<string, any>;
  };
  onStartRecommended: (assessments: any[]) => void;
  onChooseCustom: () => void;
  onSkipAll: () => void;

  // Form props
  isFormOpen: boolean;
  onFormClose: () => void;
  selectedAssessments: any[];
  currentAssessmentIndex: number;
  onAssessmentSubmit: (assessmentId: string, formData: any) => void;
  onAssessmentSkip: () => void;
}

/**
 * AssessmentHubDialog
 *
 * Manages the clinical assessment workflow dialog.
 * Shows recommendation hub first, then assessment forms.
 */
export const AssessmentHubDialog: React.FC<AssessmentHubDialogProps> = ({
  isHubOpen,
  onHubClose,
  screeningData,
  onStartRecommended,
  onChooseCustom,
  onSkipAll,
  isFormOpen,
  onFormClose,
  selectedAssessments,
  currentAssessmentIndex,
  onAssessmentSubmit,
  onAssessmentSkip,
}) => {
  return (
    <>
      {/* Assessment Recommendation Hub */}
      <AssessmentRecommendationHub
        isOpen={isHubOpen}
        onClose={onHubClose}
        screeningData={screeningData}
        onStartRecommended={onStartRecommended}
        onChooseCustom={onChooseCustom}
        onSkipAll={onSkipAll}
      />

      {/* Assessment Form Builder */}
      {selectedAssessments.length > 0 && (
        <AssessmentFormBuilder
          isOpen={isFormOpen}
          onClose={onFormClose}
          assessmentId={selectedAssessments[currentAssessmentIndex]?.assessment_id || ''}
          onSubmit={onAssessmentSubmit}
          onNext={() => {}}
          onSkip={onAssessmentSkip}
          currentIndex={currentAssessmentIndex}
          totalAssessments={selectedAssessments.length}
        />
      )}
    </>
  );
};
