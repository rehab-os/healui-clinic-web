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
import DiagnosisResultMode from './DiagnosisResultMode';
import ConditionConfirmMode from './ConditionConfirmMode';
import type { DiagnosticResponse } from '@/services/ai/diagnostic.service';

type VoiceMode = 'IDLE' | 'RECORDING' | 'GAPS' | 'REVIEW' | 'ANALYSIS' | 'DIAGNOSIS' | 'CONFIRM';
type ActiveVoiceMode = Exclude<VoiceMode, 'IDLE'>;

// Ordered steps for progress indicator (excludes IDLE and RECORDING)
const STEPS: VoiceMode[] = ['GAPS', 'REVIEW', 'ANALYSIS', 'DIAGNOSIS', 'CONFIRM'];

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

  const [analysisAnswers, setAnalysisAnswers] = useState<Record<string, any>>({});
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosticResponse | null>(null);

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

  // ANALYSIS → DIAGNOSIS
  const handleAnalysisComplete = useCallback((answers: Record<string, any>) => {
    setAnalysisAnswers(answers);
    setMode('DIAGNOSIS');
  }, []);

  const handleAnalysisSkip = useCallback(() => {
    setAnalysisAnswers({});
    setMode('DIAGNOSIS');
  }, []);

  // DIAGNOSIS → CONFIRM
  const handleConditionSelected = useCallback((condition: any, result: DiagnosticResponse) => {
    setSelectedCondition(condition);
    setDiagnosisResult(result);
    setMode('CONFIRM');
  }, []);

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
      case 'GAPS': onClose(); break;
      case 'REVIEW': setMode('GAPS'); break;
      case 'ANALYSIS': setMode('REVIEW'); break;
      case 'DIAGNOSIS': setMode('ANALYSIS'); break;
      case 'CONFIRM': setMode('DIAGNOSIS'); break;
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
        <div className={`flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 ${
          isDarkMode ? 'border-white/[0.06] bg-[#0a0a0a]' : 'border-gray-100 bg-white'
        }`}>
          <button
            onClick={handleBack}
            className={`flex items-center gap-1 text-sm ${isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white/50' : 'text-gray-900'}`}>
              Voice ClinicalDx
              {patientName && (
                <span className={isDarkMode ? 'text-white/25 font-normal ml-2' : 'text-gray-500 font-normal ml-2'}>
                  for {patientName}
                </span>
              )}
            </h3>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`rounded-full transition-all duration-300 ${
                  mode === step
                    ? isDarkMode ? 'w-2 h-2 bg-white/60' : 'w-2 h-2 bg-teal-500'
                    : STEPS.indexOf(mode) > i
                    ? isDarkMode ? 'w-1.5 h-1.5 bg-white/25' : 'w-1.5 h-1.5 bg-teal-300'
                    : isDarkMode ? 'w-1.5 h-1.5 bg-white/[0.08]' : 'w-1.5 h-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
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

          {mode === 'DIAGNOSIS' && (
            <motion.div key="diagnosis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
              <DiagnosisResultMode
                extractedFields={voice.extractedFields}
                gapAnswers={{ ...gapAnswers, ...analysisAnswers }}
                completedAssessments={[]}
                onConditionSelected={handleConditionSelected}
                onBack={() => setMode('ANALYSIS')}
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
