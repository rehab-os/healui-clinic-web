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
  ClipboardList,
  ArrowRight,
  Zap,
  Link2,
  CheckCircle2,
  ArrowLeft,
  Send,
  Smartphone,
  Copy,
  Loader2,
  Mic,
  Scan,
  Printer,
  CheckCheck,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import SymptomAssessmentModal, { SymptomDxData } from '../screening/SymptomAssessmentModal';
import SmartScreeningChatbot from '../screening/SmartScreeningChatbot';
import ApiManager from '@/services/api/api.service';

// Dynamic import to avoid bundling onnxruntime-web on initial load
const VoiceClinicalDxScreen = dynamic(
  () => import('../screening/voice/VoiceClinicalDxScreen'),
  { ssr: false }
);

// ========== INTERFACES ==========

export type DiagnosisMethod = 'SYMPTOM_AND_CLINICAL' | 'CLINICAL_ONLY';
export type DiagnosisStatus = 'DRAFT' | 'SYMPTOM_DX_PENDING' | 'SYMPTOM_DX_COMPLETE' | 'CLINICAL_DX_COMPLETE' | 'COMPLETE';

export type WorkflowStep =
  | 'LAUNCHER'            // One-tap entry: Start Assessment / Send to Patient / Quick Dx / Voice Dx
  | 'SYMPTOM_DX_LINK'     // Show generated patient link
  | 'SYMPTOM_DX_FILL'     // Fill symptom assessment in-clinic
  | 'SYMPTOM_DX_COMPLETE' // Symptom assessment done
  | 'CLINICAL_DX'         // Clinical assessment
  | 'VOICE_DX'            // Voice-first clinical assessment
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
  clinicId: string;
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
  clinicId,
  onComplete,
}: AddConditionWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('LAUNCHER');
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
    if (currentStep === 'CLINICAL_DX' || currentStep === 'VOICE_DX') {
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
    setCurrentStep('LAUNCHER');
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

  const handleSelectClinicalOnly = async () => {
    setDiagnosisMethod('CLINICAL_ONLY');
    // Create draft and go directly to clinical
    const draft = await createDraftCondition('CLINICAL_ONLY', false);
    if (draft) {
      setCurrentStep('CLINICAL_DX');
    }
  };

  const handleVoiceDx = async () => {
    setDiagnosisMethod('CLINICAL_ONLY');
    const draft = await createDraftCondition('CLINICAL_ONLY', false);
    if (draft) {
      setCurrentStep('VOICE_DX');
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

  // Render one-tap launcher
  const renderLauncher = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4 space-y-3"
    >
      {/* Primary: Start Assessment (full width) */}
      <motion.button
        onClick={handleFillNow}
        disabled={isCreatingDraft}
        className="w-full group p-5 bg-white border-2 border-teal-200 rounded-xl hover:border-teal-500 hover:shadow-lg transition-all text-left disabled:opacity-50"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                Start Assessment
              </h3>
              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              SymptomDx + ClinicalDx · In-clinic
            </p>
          </div>
          {isCreatingDraft ? (
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin flex-shrink-0" />
          ) : (
            <ArrowRight className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          )}
        </div>
      </motion.button>

      {/* Secondary row: Send to Patient + Quick Dx + Voice Dx */}
      <div className="grid grid-cols-3 gap-3">
        <motion.button
          onClick={handleSendLink}
          disabled={isCreatingDraft}
          className="group p-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all text-left disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Smartphone className="w-5 h-5 text-gray-500 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">
            Send to Patient
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            WhatsApp link
          </p>
        </motion.button>

        <motion.button
          onClick={handleSelectClinicalOnly}
          disabled={isCreatingDraft}
          className="group p-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all text-left disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap className="w-5 h-5 text-gray-500 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">
            Quick Dx
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Clinical only
          </p>
        </motion.button>

        <motion.button
          onClick={handleVoiceDx}
          disabled={isCreatingDraft}
          className="group p-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all text-left disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Mic className="w-5 h-5 text-gray-500 mb-2" />
          <h3 className="text-sm font-semibold text-gray-900">
            Voice Dx
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Speak & extract
          </p>
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
        onClick={() => setCurrentStep('LAUNCHER')}
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
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-teal-900 mb-3">SymptomDx Summary</h4>
          <div className="space-y-2 text-sm">
            {symptomDxData.body_regions.length > 0 && (
              <div className="flex justify-between">
                <span className="text-teal-700">Body Regions:</span>
                <span className="font-medium text-teal-900">
                  {symptomDxData.body_regions.join(', ')}
                </span>
              </div>
            )}
            {symptomDxData.pain_level !== undefined && (
              <div className="flex justify-between">
                <span className="text-teal-700">Pain Level:</span>
                <span className="font-medium text-teal-900">
                  {symptomDxData.pain_level}/10
                </span>
              </div>
            )}
            {symptomDxData.symptom_duration && (
              <div className="flex justify-between">
                <span className="text-teal-700">Duration:</span>
                <span className="font-medium text-teal-900">
                  {symptomDxData.symptom_duration}
                </span>
              </div>
            )}
            {symptomDxData.ai_analysis?.top_conditions?.[0] && (
              <div className="flex justify-between">
                <span className="text-teal-700">AI Analysis:</span>
                <span className="font-medium text-teal-900">
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

  // Render prescription / completion screen
  const renderComplete = () => {
    const dx         = completedResult?.diagnosis;
    const payload    = completedResult?.conditionPayload;
    const imaging    = payload?.imaging_orders ?? [];
    const hasImaging = completedResult?.imagingOrdered && imaging.length > 0;
    const urgency    = payload?.urgency_level ?? completedResult?.diagnosisResult?.treatment_urgency ?? 'MODERATE';
    const complaint  = payload?.chief_complaint;

    const handlePrint = () => window.print();
    const handleCopyReferral = () => {
      const lines: string[] = [];
      lines.push(`PHYSIOTHERAPY REFERRAL / CLINICAL SUMMARY`);
      lines.push(`Patient: ${patientName || 'Patient'}`);
      lines.push(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
      lines.push('');
      if (complaint) lines.push(`Chief Complaint: ${complaint}`);
      if (dx) lines.push(`Working Diagnosis: ${dx.condition_name} (${Math.round((dx.confidence_score ?? 0) * 100)}% confidence)`);
      lines.push(`Treatment Priority: ${urgency}`);
      if (hasImaging) {
        lines.push('');
        lines.push('Imaging Requested:');
        imaging.forEach((img: any) => {
          lines.push(`  • ${img.label} — ${img.indication_label}`);
          lines.push(`    ${img.referral_text}`);
        });
      }
      navigator.clipboard.writeText(lines.join('\n'));
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="py-2"
      >
        {/* Header */}
        <div className="text-center mb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
            hasImaging ? 'bg-amber-50' : 'bg-teal-50'
          }`}>
            {hasImaging
              ? <Scan className="w-7 h-7 text-amber-500" />
              : <CheckCheck className="w-7 h-7 text-teal-600" />
            }
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {hasImaging ? 'Saved — Imaging Ordered' : 'Diagnosis Complete'}
          </h2>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {hasImaging
              ? 'Return when imaging results are ready to confirm final diagnosis'
              : 'Condition saved to patient record'}
          </p>
        </div>

        {/* Diagnosis card */}
        {dx && (
          <div className="border border-teal-200 bg-teal-50 rounded-xl p-4 mb-3">
            <p className="text-[11px] text-teal-600 uppercase tracking-wider font-semibold mb-1">
              {hasImaging ? 'Working Diagnosis' : 'Confirmed Diagnosis'}
            </p>
            <p className="text-[15px] font-semibold text-gray-900">{dx.condition_name}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {dx.confidence_score && (
                <span className="text-[12px] text-teal-700 font-mono font-semibold">
                  {Math.round(dx.confidence_score * 100)}% confidence
                </span>
              )}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                urgency === 'URGENT' || urgency === 'HIGH'
                  ? 'bg-red-100 text-red-600'
                  : urgency === 'LOW'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-amber-100 text-amber-600'
              }`}>
                {urgency} priority
              </span>
            </div>
            {complaint && (
              <p className="text-[12px] text-teal-700 mt-2 leading-relaxed border-t border-teal-200 pt-2">
                {complaint}
              </p>
            )}
          </div>
        )}

        {/* Imaging orders */}
        {hasImaging && (
          <div className="mb-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
              Imaging Requested
            </p>
            <div className="space-y-2">
              {imaging.map((img: any, i: number) => (
                <div key={i} className="border border-amber-200 bg-amber-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${
                      img.modality === 'MRI' ? 'bg-teal-600'
                      : img.modality === 'X-Ray' ? 'bg-blue-600'
                      : img.modality === 'CT' ? 'bg-orange-600'
                      : 'bg-violet-600'
                    }`}>
                      {img.modality}
                    </span>
                    <p className="text-[13px] font-medium text-gray-800">{img.label}</p>
                    {img.urgency === 'urgent' && (
                      <span className="ml-auto text-[10px] text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded">URGENT</span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-600 leading-relaxed">{img.referral_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyReferral}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Copy className="w-4 h-4" />
              Copy referral
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
          <Button onClick={handleClose} className="w-full" size="lg">
            Done
          </Button>
        </div>
      </motion.div>
    );
  };

  // Main content based on step
  const renderContent = () => {
    switch (currentStep) {
      case 'LAUNCHER':
        return renderLauncher();
      case 'SYMPTOM_DX_LINK':
        return renderPatientLink();
      case 'SYMPTOM_DX_FILL':
        return null; // Modal handles this
      case 'SYMPTOM_DX_COMPLETE':
        return renderSymptomDxComplete();
      case 'CLINICAL_DX':
        return null; // Full screen chatbot
      case 'VOICE_DX':
        return null; // Full screen voice dx
      case 'COMPLETE':
        return renderComplete();
      default:
        return null;
    }
  };

  // For voice DX step, render full screen
  if (currentStep === 'VOICE_DX' && isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <VoiceClinicalDxScreen
          patientId={patientId}
          patientName={patientName}
          conditionId={draftCondition?.id}
          clinicId={clinicId}
          onComplete={handleClinicalDxComplete}
          onClose={handleClose}
        />
      </div>
    );
  }

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
              } else {
                setCurrentStep('LAUNCHER');
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
      <Dialog open={isOpen && currentStep !== 'CLINICAL_DX' && currentStep !== 'VOICE_DX' && currentStep !== 'SYMPTOM_DX_FILL'} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Dx
                {patientName && <span className="text-gray-500 font-normal ml-2">for {patientName}</span>}
              </DialogTitle>
              <DialogDescription>
                {currentStep === 'LAUNCHER' && 'Choose how to start'}
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
          setCurrentStep('LAUNCHER');
        }}
        patientId={patientId}
        patientName={patientName}
        filledBy="PHYSIO"
        onComplete={handleSymptomDxComplete}
      />
    </>
  );
}
