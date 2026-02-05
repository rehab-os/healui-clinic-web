'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Stethoscope,
  ClipboardList,
  ArrowRight,
  Zap,
  Users,
  Link2,
  CheckCircle2,
  ArrowLeft,
  Send,
  Smartphone,
  Copy,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import SymptomAssessmentModal, { SymptomDxData } from './SymptomAssessmentModal';
import SmartScreeningChatbot from './SmartScreeningChatbot';
import ApiManager from '@/services/api';

// ========== INTERFACES ==========

export type DiagnosisMethod = 'SYMPTOM_AND_CLINICAL' | 'CLINICAL_ONLY';
export type DiagnosisStatus = 'DRAFT' | 'SYMPTOM_DX_PENDING' | 'SYMPTOM_DX_COMPLETE' | 'CLINICAL_DX_COMPLETE' | 'COMPLETE';

export type WorkflowStep =
  | 'SELECTION'           // Choose Full Assessment or Clinical Only
  | 'SYMPTOM_DX_CHOICE'   // Choose Fill Now or Send Link
  | 'SYMPTOM_DX_LINK'     // Show generated patient link
  | 'SYMPTOM_DX_FILL'     // Fill symptom assessment in-clinic
  | 'SYMPTOM_DX_COMPLETE' // Symptom assessment done
  | 'CLINICAL_DX'         // Clinical assessment
  | 'COMPLETE';           // All done

interface DraftCondition {
  id: string;
  patient_link_token?: string;
  diagnosis_status: DiagnosisStatus;
}

interface AddConditionWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  onComplete?: (result: any) => void;
}

// ========== HELPER: Generate Token ==========
const generateLinkToken = () => {
  return `dx_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};

// ========== MAIN COMPONENT ==========

export default function AddConditionWorkflow({
  isOpen,
  onClose,
  patientId,
  patientName,
  onComplete,
}: AddConditionWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('SELECTION');
  const [diagnosisMethod, setDiagnosisMethod] = useState<DiagnosisMethod | null>(null);
  const [symptomDxData, setSymptomDxData] = useState<SymptomDxData | null>(null);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [completedResult, setCompletedResult] = useState<any>(null);

  // Draft condition state
  const [draftCondition, setDraftCondition] = useState<DraftCondition | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [patientLink, setPatientLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    if (currentStep === 'CLINICAL_DX') {
      if (window.confirm('Are you sure you want to close? Your assessment progress will be lost.')) {
        resetWorkflow();
        onClose();
      }
    } else {
      resetWorkflow();
      onClose();
    }
  }, [currentStep, onClose]);

  const resetWorkflow = () => {
    setCurrentStep('SELECTION');
    setDiagnosisMethod(null);
    setSymptomDxData(null);
    setShowSymptomModal(false);
    setCompletedResult(null);
    setDraftCondition(null);
    setPatientLink(null);
    setLinkCopied(false);
  };

  // Create draft condition in backend
  const createDraftCondition = async (method: DiagnosisMethod, generateLink: boolean = false): Promise<DraftCondition | null> => {
    setIsCreatingDraft(true);
    try {
      const linkToken = generateLink ? generateLinkToken() : undefined;
      const linkExpiry = generateLink
        ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
        : undefined;

      const payload = {
        condition_name: `Pending Diagnosis - ${Date.now()}`,
        diagnosis_method: method,
        diagnosis_status: generateLink ? 'SYMPTOM_DX_PENDING' : 'DRAFT',
        patient_link_token: linkToken,
        patient_link_expires_at: linkExpiry,
        symptom_dx_completed: false,
        clinical_dx_completed: false,
      };

      const response = await ApiManager.createPatientCondition(patientId, payload);

      if (response.success && response.data) {
        const draft: DraftCondition = {
          id: response.data.id,
          patient_link_token: linkToken,
          diagnosis_status: payload.diagnosis_status as DiagnosisStatus,
        };
        setDraftCondition(draft);

        if (linkToken) {
          // Generate the patient-facing URL
          const baseUrl = window.location.origin;
          setPatientLink(`${baseUrl}/patient-symptom-dx/${linkToken}`);
        }

        return draft;
      }
      return null;
    } catch (error) {
      console.error('Failed to create draft condition:', error);
      return null;
    } finally {
      setIsCreatingDraft(false);
    }
  };

  // Update draft with SymptomDx data
  const saveSymptomDxData = async (data: SymptomDxData) => {
    if (!draftCondition) return false;

    try {
      const payload = {
        symptom_dx_data: data,
        symptom_dx_completed: true,
        symptom_dx_completed_at: new Date().toISOString(),
        symptom_dx_filled_by: data.filled_by,
        diagnosis_status: 'SYMPTOM_DX_COMPLETE',
        // Also populate legacy fields
        chief_complaint: data.chief_complaint,
        vas_score: data.pain_level,
        primary_body_region: data.body_regions?.[0],
      };

      await ApiManager.updatePatientCondition(patientId, draftCondition.id, payload);
      return true;
    } catch (error) {
      console.error('Failed to save SymptomDx data:', error);
      return false;
    }
  };

  // Handle pathway selection
  const handleSelectFullAssessment = () => {
    setDiagnosisMethod('SYMPTOM_AND_CLINICAL');
    setCurrentStep('SYMPTOM_DX_CHOICE');
  };

  const handleSelectClinicalOnly = async () => {
    setDiagnosisMethod('CLINICAL_ONLY');
    // Create draft and go directly to clinical
    const draft = await createDraftCondition('CLINICAL_ONLY', false);
    if (draft) {
      setCurrentStep('CLINICAL_DX');
    }
  };

  // Handle SymptomDx choice
  const handleFillNow = async () => {
    // Step 1: Create draft (diagnostic window)
    const draft = await createDraftCondition('SYMPTOM_AND_CLINICAL', false);
    if (draft) {
      // Step 2: Open SymptomDx modal
      setShowSymptomModal(true);
      setCurrentStep('SYMPTOM_DX_FILL');
    }
  };

  const handleSendLink = async () => {
    const draft = await createDraftCondition('SYMPTOM_AND_CLINICAL', true);
    if (draft) {
      setCurrentStep('SYMPTOM_DX_LINK');
    }
  };

  // Handle symptom assessment completion
  const handleSymptomDxComplete = async (data: SymptomDxData) => {
    console.log('Symptom assessment completed:', data);
    setSymptomDxData(data);
    setShowSymptomModal(false);

    // Step 2: Save SymptomDx data to the draft
    const saved = await saveSymptomDxData(data);
    if (saved) {
      setCurrentStep('SYMPTOM_DX_COMPLETE');
    } else {
      // Still proceed even if save failed - data is in state
      console.error('Failed to save SymptomDx to backend');
      setCurrentStep('SYMPTOM_DX_COMPLETE');
    }
  };

  // Proceed to clinical assessment
  const handleProceedToClinical = () => {
    setCurrentStep('CLINICAL_DX');
  };

  // Handle clinical assessment completion
  const handleClinicalDxComplete = (result: any) => {
    console.log('Clinical assessment completed:', result);
    setCompletedResult(result);
    setCurrentStep('COMPLETE');

    if (onComplete) {
      onComplete({
        draftConditionId: draftCondition?.id,
        diagnosisMethod,
        symptomDxData,
        clinicalResult: result,
      });
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (patientLink) {
      await navigator.clipboard.writeText(patientLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Render pathway selection
  const renderPathwaySelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4"
    >
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Choose Assessment Pathway
        </h2>
        <p className="text-gray-600">
          How would you like to diagnose this patient?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Assessment Option */}
        <motion.button
          onClick={handleSelectFullAssessment}
          className="relative group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-lg transition-all text-left"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              Recommended
            </span>
          </div>

          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-emerald-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Full Dx
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            SymptomDx + ClinicalDx for comprehensive diagnosis
          </p>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Users className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Patient or physio fills symptoms</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Send className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Can send link via WhatsApp</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Most comprehensive data</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-600">
                Start Full Dx
              </span>
              <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.button>

        {/* Clinical Only Option */}
        <motion.button
          onClick={handleSelectClinicalOnly}
          disabled={isCreatingDraft}
          className="relative group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all text-left disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <Stethoscope className="w-7 h-7 text-gray-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Quick Dx
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            ClinicalDx only - skip symptom history
          </p>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Zap className="w-4 h-4 mr-2 text-gray-400" />
              <span>Faster workflow</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Stethoscope className="w-4 h-4 mr-2 text-gray-400" />
              <span>Physio-only mode</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" />
              <span>Good for follow-ups</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {isCreatingDraft ? 'Creating...' : 'Start Quick Dx'}
              </span>
              {isCreatingDraft ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );

  // Render SymptomDx choice (Fill Now vs Send Link)
  const renderSymptomDxChoice = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentStep('SELECTION')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          How to collect symptoms?
        </h2>
        <p className="text-gray-600">
          Choose how you want to gather the patient's symptom information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fill Now Option */}
        <motion.button
          onClick={handleFillNow}
          disabled={isCreatingDraft}
          className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-blue-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Fill Now
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Physio fills the symptom assessment with the patient in-clinic
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-blue-600">
              {isCreatingDraft ? 'Creating...' : 'Start Assessment'}
            </span>
            {isCreatingDraft ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            )}
          </div>
        </motion.button>

        {/* Send Link Option */}
        <motion.button
          onClick={handleSendLink}
          disabled={isCreatingDraft}
          className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all text-left disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
            <Smartphone className="w-7 h-7 text-green-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Send Patient Link
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate a link and send to patient via WhatsApp
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-green-600">
              {isCreatingDraft ? 'Generating...' : 'Generate Link'}
            </span>
            {isCreatingDraft ? (
              <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            ) : (
              <Link2 className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
            )}
          </div>
        </motion.button>
      </div>
    </motion.div>
  );

  // Render patient link screen
  const renderPatientLink = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentStep('SYMPTOM_DX_CHOICE')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Link2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Patient Link Ready
        </h2>
        <p className="text-gray-600">
          Send this link to the patient via WhatsApp
        </p>
      </div>

      {/* Link Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <code className="text-sm text-gray-700 break-all flex-1">
            {patientLink}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex-shrink-0"
          >
            {linkCopied ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>1. Send the link to the patient via WhatsApp</li>
          <li>2. Patient fills their symptom assessment</li>
          <li>3. Data is automatically saved to this diagnosis</li>
          <li>4. Continue with clinical assessment when ready</li>
        </ul>
        <p className="text-xs text-blue-500 mt-2">
          Link expires in 48 hours
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            // Open WhatsApp with pre-filled message
            const message = encodeURIComponent(
              `Hi${patientName ? ` ${patientName}` : ''}! Please complete your symptom assessment before your appointment: ${patientLink}`
            );
            window.open(`https://wa.me/?text=${message}`, '_blank');
          }}
        >
          <Send className="w-4 h-4 mr-2" />
          Open WhatsApp
        </Button>
        <Button
          className="flex-1"
          onClick={handleProceedToClinical}
        >
          Continue to Clinical Dx
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500 mt-4">
        You can continue with Clinical Dx now or wait for the patient to complete their assessment
      </p>
    </motion.div>
  );

  // Render symptom DX complete screen
  const renderSymptomDxComplete = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          SymptomDx Complete
        </h2>
        <p className="text-gray-600">
          {symptomDxData?.questions_asked} questions answered and saved. Ready for ClinicalDx.
        </p>
      </div>

      {/* Summary of symptom assessment */}
      {symptomDxData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-emerald-900 mb-3">SymptomDx Summary</h4>
          <div className="space-y-2 text-sm">
            {symptomDxData.body_regions.length > 0 && (
              <div className="flex justify-between">
                <span className="text-emerald-700">Body Regions:</span>
                <span className="font-medium text-emerald-900">
                  {symptomDxData.body_regions.join(', ')}
                </span>
              </div>
            )}
            {symptomDxData.pain_level !== undefined && (
              <div className="flex justify-between">
                <span className="text-emerald-700">Pain Level:</span>
                <span className="font-medium text-emerald-900">
                  {symptomDxData.pain_level}/10
                </span>
              </div>
            )}
            {symptomDxData.symptom_duration && (
              <div className="flex justify-between">
                <span className="text-emerald-700">Duration:</span>
                <span className="font-medium text-emerald-900">
                  {symptomDxData.symptom_duration}
                </span>
              </div>
            )}
            {symptomDxData.ai_analysis?.top_conditions?.[0] && (
              <div className="flex justify-between">
                <span className="text-emerald-700">AI Analysis:</span>
                <span className="font-medium text-emerald-900">
                  {symptomDxData.ai_analysis.top_conditions[0].condition_name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <Button onClick={handleProceedToClinical} className="w-full" size="lg">
        Continue to ClinicalDx
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  );

  // Render completion screen
  const renderComplete = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Dx Complete!
        </h2>
        <p className="text-gray-600">
          The condition has been diagnosed and saved.
        </p>
      </div>

      {completedResult?.diagnosis && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-green-900 mb-2">Diagnosis</h4>
          <p className="text-green-800 font-semibold">
            {completedResult.diagnosis.condition_name}
          </p>
          {completedResult.diagnosis.confidence_score && (
            <p className="text-sm text-green-700 mt-1">
              Confidence: {Math.round(completedResult.diagnosis.confidence_score * 100)}%
            </p>
          )}
        </div>
      )}

      <Button onClick={handleClose} className="w-full" size="lg">
        Done
      </Button>
    </motion.div>
  );

  // Main content based on step
  const renderContent = () => {
    switch (currentStep) {
      case 'SELECTION':
        return renderPathwaySelection();
      case 'SYMPTOM_DX_CHOICE':
        return renderSymptomDxChoice();
      case 'SYMPTOM_DX_LINK':
        return renderPatientLink();
      case 'SYMPTOM_DX_FILL':
        return null; // Modal handles this
      case 'SYMPTOM_DX_COMPLETE':
        return renderSymptomDxComplete();
      case 'CLINICAL_DX':
        return null; // Full screen chatbot
      case 'COMPLETE':
        return renderComplete();
      default:
        return null;
    }
  };

  // For clinical assessment step, render full screen
  if (currentStep === 'CLINICAL_DX' && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (diagnosisMethod === 'SYMPTOM_AND_CLINICAL' && symptomDxData) {
                setCurrentStep('SYMPTOM_DX_COMPLETE');
              } else if (diagnosisMethod === 'SYMPTOM_AND_CLINICAL') {
                setCurrentStep('SYMPTOM_DX_CHOICE');
              } else {
                setCurrentStep('SELECTION');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <SmartScreeningChatbot
          patientId={patientId}
          patientName={patientName}
          symptomDxData={symptomDxData}
          diagnosisMethod={diagnosisMethod}
          draftConditionId={draftCondition?.id}
          onComplete={handleClinicalDxComplete}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <>
      <Dialog open={isOpen && currentStep !== 'CLINICAL_DX' && currentStep !== 'SYMPTOM_DX_FILL'} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="sm:max-w-2xl"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Dx
                {patientName && <span className="text-gray-500 font-normal ml-2">for {patientName}</span>}
              </DialogTitle>
              <DialogDescription>
                {currentStep === 'SELECTION' && 'Choose diagnosis pathway'}
                {currentStep === 'SYMPTOM_DX_CHOICE' && 'How to collect symptoms?'}
                {currentStep === 'SYMPTOM_DX_LINK' && 'Patient link generated'}
                {currentStep === 'SYMPTOM_DX_COMPLETE' && 'SymptomDx saved'}
                {currentStep === 'COMPLETE' && 'Diagnosis complete'}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Symptom Assessment Modal */}
      <SymptomAssessmentModal
        isOpen={showSymptomModal}
        onClose={() => {
          setShowSymptomModal(false);
          setCurrentStep('SYMPTOM_DX_CHOICE');
        }}
        patientId={patientId}
        patientName={patientName}
        filledBy="PHYSIO"
        onComplete={handleSymptomDxComplete}
      />
    </>
  );
}
