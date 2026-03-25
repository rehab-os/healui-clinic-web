'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceClinicalDx } from '@/hooks/useVoiceClinicalDx';
import { ClinicalDxVoiceService } from '@/services/api/clinical-dx-voice.service';
import RecordingMode from './RecordingMode';
import GapQuestionsMode from './GapQuestionsMode';
import ReviewMode from './ReviewMode';
import AnalysisMode from './AnalysisMode';
import ImagingMode from './ImagingMode';
import ADLMode from './ADLMode';
import type { ADLData } from './ADLMode';
import DiagnosisResultMode from './DiagnosisResultMode';
import ConditionConfirmMode from './ConditionConfirmMode';
import { useAppSelector } from '@/store/hooks';
import ApiManager from '@/services/api/api.service';
import { toast } from 'sonner';
import type { DiagnosticResponse } from '@/services/ai/diagnostic.service';

type VoiceMode = 'IDLE' | 'RECORDING' | 'GAPS' | 'REVIEW' | 'ANALYSIS' | 'ADL' | 'IMAGING' | 'DIAGNOSIS' | 'CONFIRM';
type ActiveVoiceMode = Exclude<VoiceMode, 'IDLE'>;

// Ordered steps for progress indicator (excludes IDLE and RECORDING)
// Imaging comes AFTER diagnosis — physio needs to see differential first before deciding on scans
const STEPS: VoiceMode[] = ['GAPS', 'REVIEW', 'ANALYSIS', 'ADL', 'DIAGNOSIS', 'IMAGING', 'CONFIRM'];

const STEP_LABELS: Partial<Record<VoiceMode, string>> = {
  GAPS:      'Gaps',
  REVIEW:    'Review',
  ANALYSIS:  'Examination',
  ADL:       'Outcome',
  DIAGNOSIS: 'Diagnosis',
  IMAGING:   'Imaging',
  CONFIRM:   'Confirm',
};

interface GapQuestion {
  id: string;
  type: string;
  question: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  reason: string;
}

interface VoiceClinicalDxScreenProps {
  patientId: string;
  patientName?: string;
  conditionId?: string;
  clinicId: string;
  onComplete: (clinicalDxData: any) => void;
  onClose: () => void;
}

export default function VoiceClinicalDxScreen({
  patientId,
  patientName,
  conditionId,
  clinicId,
  onComplete,
  onClose,
}: VoiceClinicalDxScreenProps) {
  const [mode, setMode] = useState<VoiceMode>('IDLE');
  const [gapData, setGapData] = useState<{
    mandatory: GapQuestion[];
    recommended: GapQuestion[];
    optional: GapQuestion[];
    autoFilled: Record<string, { value: any; confidence: number; reason: string }>;
  } | null>(null);
  const [gapAnswers, setGapAnswers] = useState<Record<string, any>>({});
  const [isLoadingGaps, setIsLoadingGaps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analysisAnswers, setAnalysisAnswers]   = useState<Record<string, any>>({});
  const [imagingRequests, setImagingRequests]   = useState<any[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [diagnosisResult, setDiagnosisResult]   = useState<DiagnosticResponse | null>(null);
  const [adlData, setAdlData]                   = useState<ADLData | null>(null);
  const [isImagingOnlyPath, setIsImagingOnlyPath] = useState(false);

  const { userData } = useAppSelector(state => state.user);

  const voice = useVoiceClinicalDx({
    clinicId,
    patientId,
    conditionId,
    onError: (err) => setError(err),
  });

  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const hasAutoStarted = useRef(false);

  // Auto-start recording on mount — no IDLE screen needed
  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;

    (async () => {
      try {
        setMode('RECORDING');
        await voice.startRecording();
      } catch (err: any) {
        setError(err?.message || 'Failed to start recording');
        setMode('IDLE'); // Fall back to error screen
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetryRecording = async () => {
    setError(null);
    try {
      setMode('RECORDING');
      await voice.startRecording();
    } catch (err: any) {
      setError(err?.message || 'Failed to start recording');
      setMode('IDLE');
    }
  };

  // RECORDING → GAPS
  const handleStopRecording = useCallback(async () => {
    setMode('GAPS');
    setIsLoadingGaps(true);

    const v = voiceRef.current;
    await v.stopRecording();
    const latest = voiceRef.current;

    if (!latest.sessionId) {
      setError('No active session. Please try recording again.');
      setIsLoadingGaps(false);
      return;
    }

    try {
      const result = await ClinicalDxVoiceService.getGapQuestions(
        latest.sessionId,
        latest.extractedFields,
        latest.extractedFields.pain_location,
      );
      if (result?.data) {
        setGapData({
          mandatory: result.data.mandatory || [],
          recommended: result.data.recommended || [],
          optional: result.data.optional || [],
          autoFilled: result.data.auto_filled || {},
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load gap questions');
    } finally {
      setIsLoadingGaps(false);
    }
  }, []);

  // GAPS → REVIEW
  const handleGapComplete = useCallback((answers: Record<string, any>) => {
    setGapAnswers(answers);
    setMode('REVIEW');
  }, []);

  // REVIEW → ANALYSIS
  const handleReviewContinue = useCallback(() => {
    setMode('ANALYSIS');
  }, []);

  // ANALYSIS → ADL (examination complete, now capture functional impact)
  const handleAnalysisComplete = useCallback((answers: Record<string, any>) => {
    setAnalysisAnswers(answers);
    setMode('ADL');
  }, []);

  const handleAnalysisSkip = useCallback(() => {
    setAnalysisAnswers({});
    setMode('ADL');
  }, []);

  // ADL → DIAGNOSIS
  const handleADLComplete = useCallback((data: ADLData) => {
    setAdlData(data);
    setMode('DIAGNOSIS');
  }, []);

  const handleADLSkip = useCallback(() => {
    setAdlData(null);
    setMode('DIAGNOSIS');
  }, []);

  // DIAGNOSIS → IMAGING (physio has seen differential, now decides on scans)
  const handleConditionSelected = useCallback((condition: any, result: DiagnosticResponse) => {
    setSelectedCondition(condition);
    setDiagnosisResult(result);
    setMode('IMAGING');
  }, []);

  const [provisionalDx, setProvisionalDx] = useState<{ condition_name: string; condition_id?: string | null; source: 'DIFFERENTIAL' | 'MANUAL' } | null>(null);

  // DIAGNOSIS → IMAGING (physio skips diagnosis, wants imaging first)
  const handleSkipToImaging = useCallback((result: DiagnosticResponse, provisional?: { condition_name: string; condition_id?: string | null; source: 'DIFFERENTIAL' | 'MANUAL' }) => {
    setSelectedCondition(null);
    setDiagnosisResult(result);
    setProvisionalDx(provisional || null);
    setIsImagingOnlyPath(true);
    setMode('IMAGING');
  }, []);

  // IMAGING → CONFIRM (no imaging ordered — physio is confident, proceed to confirm)
  const handleImagingSkip = useCallback(() => {
    setImagingRequests([]);
    if (isImagingOnlyPath) {
      // Imaging-only path but physio skipped imaging too — go back to diagnosis
      setMode('DIAGNOSIS');
      setIsImagingOnlyPath(false);
    } else {
      setMode('CONFIRM');
    }
  }, [isImagingOnlyPath]);

  // IMAGING → save as IMAGING_ORDERED and close session
  // Physio selected imaging — cannot confirm diagnosis until results are back
  const handleImagingComplete = useCallback(async (requests: any[]) => {
    if (isImagingOnlyPath && diagnosisResult) {
      // Path B: Save directly — no CONFIRM step
      const merged = { ...voice.extractedFields, ...gapAnswers, ...analysisAnswers };
      const topCondition = diagnosisResult.differential_diagnosis?.[0];

      const imagingOrders = requests.map((req: any) => ({
        modality: req.modality,
        label: req.label,
        patient_label: req.patient_label,
        indication_label: req.indication_label,
        referral_text: req.referral_text,
        urgency: req.urgency,
        ordered_at: new Date().toISOString(),
        status: 'ORDERED' as const,
        ordered_by_user_id: userData?.user_id || null,
      }));

      const conditionPayload = {
        condition_id: null,
        condition_name: null,
        diagnosis_method: 'CLINICAL_ONLY',
        clinical_dx_data: {
          session_id: voice.sessionId || `voice_${Date.now()}`,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          responses: merged,
          source: 'voice_clinical_dx',
        },
        clinical_dx_completed: true,
        clinical_dx_completed_at: new Date().toISOString(),
        clinical_dx_differential: {
          generated_at: new Date().toISOString(),
          conditions: diagnosisResult.differential_diagnosis?.map((d: any) => ({
            condition_id: d.condition_id,
            condition_name: d.condition_name,
            confidence_score: d.confidence_score,
            supporting_evidence: d.supporting_evidence || [],
            clinical_reasoning: d.clinical_reasoning || '',
          })) || [],
          treatment_urgency: diagnosisResult.treatment_urgency || 'MODERATE',
        },
        final_diagnosis: null,
        provisional_diagnosis: {
          condition_name: provisionalDx?.condition_name || topCondition?.condition_name || 'Pending Diagnosis',
          condition_id: provisionalDx?.condition_id || topCondition?.condition_id || null,
          source: provisionalDx?.source || 'DIFFERENTIAL',
          set_at: new Date().toISOString(),
          set_by_user_id: userData?.user_id || null,
        },
        adl_data: adlData || null,
        imaging_orders: imagingOrders,
        diagnosis_status: 'IMAGING_ORDERED',
        chief_complaint: merged.chief_complaint || null,
        vas_score: merged.vas_score ?? null,
        urgency_level: diagnosisResult.treatment_urgency?.toUpperCase() || 'MODERATE',
      };

      try {
        if (conditionId) {
          await ApiManager.updatePatientCondition(patientId, conditionId, conditionPayload);
        } else {
          await ApiManager.createPatientCondition(patientId, conditionPayload as any);
        }
        toast.success('Imaging ordered', { description: 'Assessment saved. Resume after imaging results.' });
        onComplete(conditionPayload);
      } catch (err: any) {
        toast.error('Failed to save', { description: err.message || 'Please try again.' });
      }
      return;
    }

    // Path A: Normal flow — go to CONFIRM
    setImagingRequests(requests);
    setMode('CONFIRM');
  }, [isImagingOnlyPath, diagnosisResult, voice, gapAnswers, analysisAnswers, adlData, userData, patientId, conditionId, onComplete, provisionalDx]);

  // CONFIRM → done
  const handleConfirmComplete = useCallback((result: any) => {
    onComplete(result);
  }, [onComplete]);

  // Back navigation
  const handleBack = () => {
    switch (mode) {
      case 'RECORDING':
        if (window.confirm('Stop recording and discard?')) {
          voice.stopRecording();
          onClose();
        }
        break;
      case 'GAPS':
        if (window.confirm('Leave assessment? Your recording data will be lost.')) onClose();
        break;
      case 'REVIEW':    setMode('GAPS');      break;
      case 'ANALYSIS':  setMode('REVIEW');    break;
      case 'ADL':       setMode('ANALYSIS');  break;
      case 'DIAGNOSIS': setMode('ADL');       break;
      case 'IMAGING':   setMode('DIAGNOSIS'); setIsImagingOnlyPath(false); break;
      case 'CONFIRM':   setMode('IMAGING');   break;
      default: onClose();
    }
  };

  const isDarkMode = false;
  const isRecording = mode === 'RECORDING';

  // IDLE = error fallback only (normal flow auto-starts recording)
  if (mode === 'IDLE') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8">
        <div className="text-center max-w-sm">
          {error ? (
            <>
              <p className="text-[13px] text-red-500 mb-6 leading-relaxed">{error}</p>
              <button
                onClick={handleRetryRecording}
                disabled={voice.isProcessing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {voice.isProcessing ? 'Starting...' : 'Retry'}
              </button>
              <button
                onClick={onClose}
                className="block mx-auto mt-3 text-[11px] text-gray-300 hover:text-gray-400 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 border border-gray-200 border-t-gray-500 rounded-full animate-spin mb-3" />
              <p className="text-[12px] text-gray-400">Starting voice assessment...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      {/* Top bar — hidden during recording (RecordingMode has its own) */}
      {!isRecording && (
        <>
          <div className={`flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 ${
            isDarkMode ? 'border-white/[0.06] bg-[#0a0a0a]' : 'border-gray-100 bg-white'
          }`}>
            <button
              onClick={handleBack}
              className={`flex items-center gap-1.5 py-2 px-2 -ml-2 rounded-lg min-h-[44px] text-sm ${isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-800 truncate">
                {patientName ? (
                  <>Voice Dx <span className="text-gray-400 font-normal">— {patientName}</span></>
                ) : 'Voice ClinicalDx'}
              </h3>
            </div>
          </div>

          {/* Segmented step progress bar */}
          {STEPS.includes(mode as any) && (
            <div className={`flex gap-1.5 px-4 pt-2 pb-2.5 border-b flex-shrink-0 ${
              isDarkMode ? 'border-white/[0.04] bg-[#0a0a0a]' : 'border-gray-50 bg-white'
            }`}>
              {STEPS.map((step, idx) => {
                const currentIdx = STEPS.indexOf(mode as any);
                const isDone = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-[3px] w-full rounded-full transition-all duration-300 ${
                      isDone ? 'bg-teal-500' : isCurrent ? 'bg-teal-400' : 'bg-gray-200'
                    }`} />
                    <span className={`text-[9px] leading-none tracking-wide ${
                      isCurrent ? 'text-teal-600 font-semibold' : isDone ? 'text-teal-400' : 'text-gray-300'
                    }`}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Mode content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'RECORDING' && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <RecordingMode
                volumeLevel={voice.volumeLevel}
                isProcessing={voice.isProcessing}
                transcript={voice.transcript}
                extractedFields={voice.extractedFields}
                fieldConfidence={voice.fieldConfidence}
                fieldsCaptured={voice.fieldsCaptured}
                totalFields={voice.totalFields}
                elapsedMs={voice.elapsedMs}
                onStop={handleStopRecording}
              />
            </motion.div>
          )}

          {mode === 'GAPS' && (
            <motion.div key="gaps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              {isLoadingGaps ? (
                <div className="flex items-center justify-center h-full bg-white">
                  <div className="text-center">
                    <div className="w-6 h-6 border border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[12px] text-gray-400">Analyzing gaps...</p>
                  </div>
                </div>
              ) : gapData ? (
                <GapQuestionsMode
                  mandatory={gapData.mandatory}
                  recommended={gapData.recommended}
                  optional={gapData.optional}
                  autoFilled={gapData.autoFilled}
                  onComplete={handleGapComplete}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-white">
                  <p className="text-[12px] text-red-500">{error || 'Failed to load gap questions'}</p>
                </div>
              )}
            </motion.div>
          )}

          {mode === 'REVIEW' && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <ReviewMode
                extractedFields={voice.extractedFields}
                fieldConfidence={voice.fieldConfidence}
                gapAnswers={gapAnswers}
                transcript={voice.transcript}
                onFinalize={handleReviewContinue}
                onBack={() => setMode('GAPS')}
              />
            </motion.div>
          )}

          {mode === 'ANALYSIS' && (
            <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <AnalysisMode
                extractedFields={voice.extractedFields}
                gapAnswers={gapAnswers}
                onComplete={handleAnalysisComplete}
                onSkip={handleAnalysisSkip}
              />
            </motion.div>
          )}

          {mode === 'ADL' && (
            <motion.div key="adl" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <ADLMode
                extractedFields={voice.extractedFields}
                analysisAnswers={analysisAnswers}
                onComplete={handleADLComplete}
                onSkip={handleADLSkip}
              />
            </motion.div>
          )}

          {mode === 'DIAGNOSIS' && (
            <motion.div key="diagnosis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <DiagnosisResultMode
                extractedFields={voice.extractedFields}
                gapAnswers={{ ...gapAnswers, ...analysisAnswers }}
                completedAssessments={[]}
                onConditionSelected={handleConditionSelected}
                onSkipToImaging={handleSkipToImaging}
                onBack={() => setMode('ANALYSIS')}
              />
            </motion.div>
          )}

          {mode === 'IMAGING' && diagnosisResult && (
            <motion.div key="imaging" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <ImagingMode
                extractedFields={voice.extractedFields}
                analysisAnswers={analysisAnswers}
                diagnosisConfidence={
                  selectedCondition?.confidence_score
                  ?? diagnosisResult.differential_diagnosis?.[0]?.confidence_score
                  ?? 0.5
                }
                topDifferential={
                  diagnosisResult.differential_diagnosis?.slice(0, 3).map((d: any) => ({
                    condition_name: d.condition_name,
                    confidence: d.confidence_score,
                  })) ?? []
                }
                onRequestImaging={handleImagingComplete}
                onSkip={handleImagingSkip}
              />
            </motion.div>
          )}

          {mode === 'CONFIRM' && selectedCondition && diagnosisResult && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <ConditionConfirmMode
                selectedCondition={selectedCondition}
                diagnosisResult={diagnosisResult}
                extractedFields={voice.extractedFields}
                gapAnswers={{ ...gapAnswers, ...analysisAnswers }}
                completedAssessments={[]}
                imagingRequests={imagingRequests}
                adlData={adlData}
                patientId={patientId}
                sessionId={voice.sessionId}
                draftConditionId={conditionId}
                onComplete={handleConfirmComplete}
                onBack={() => setMode('DIAGNOSIS')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error toast */}
      {error && (mode as VoiceMode) !== 'IDLE' && mode !== 'RECORDING' && (
        <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
