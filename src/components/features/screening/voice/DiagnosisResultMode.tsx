'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronRight, ArrowRight, Scan, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiDiagnosticService, type DiagnosticResponse } from '@/services/ai/diagnostic.service';
import { buildDiagnosticPayload } from '@/services/ai/voice-diagnostic-payload';

interface DiagnosisResultModeProps {
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  completedAssessments: any[];
  onConditionSelected: (conditions: any[], diagnosisResult: DiagnosticResponse) => void;
  onSkipToImaging: (diagnosisResult: DiagnosticResponse, provisionalDx?: { condition_name: string; condition_id?: string | null; source: 'DIFFERENTIAL' | 'MANUAL' }) => void;
  onBack: () => void;
}

const ANALYZING_PHRASES = [
  'Analyzing clinical findings...',
  'Evaluating differential patterns...',
  'Cross-referencing evidence...',
  'Generating diagnosis...',
];

export default function DiagnosisResultMode({
  extractedFields,
  gapAnswers,
  completedAssessments,
  onConditionSelected,
  onSkipToImaging,
  onBack,
}: DiagnosisResultModeProps) {
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosticResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConditions, setSelectedConditions] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [manualDxInput, setManualDxInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const merged = { ...extractedFields, ...gapAnswers };

  // Cycle through analyzing phrases
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % ANALYZING_PHRASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch diagnosis on mount
  useEffect(() => {
    (async () => {
      try {
        const payload = await buildDiagnosticPayload(extractedFields, gapAnswers, completedAssessments);
        const result = await aiDiagnosticService.getDifferentialDiagnosis(payload);
        setDiagnosisResult(result);
      } catch (err: any) {
        setError(err?.message || 'Failed to generate diagnosis');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive context for display
  const redFlagsDetected = (() => {
    const flags = merged.red_flag_screening;
    if (!Array.isArray(flags)) return [];
    return flags.filter((f: string) => f !== 'none');
  })();

  const locationStr = (() => {
    const loc = merged.pain_location;
    if (!loc) return null;
    const locations = Array.isArray(loc) ? loc : [loc];
    return locations.map((l: any) => {
      if (typeof l === 'object' && l?.mainRegion) {
        const side = l.laterality && l.laterality !== 'center' ? ` (${l.laterality})` : '';
        return l.mainRegion.replace(/-/g, ' ') + side;
      }
      return String(l).replace(/_/g, ' ');
    }).join(', ');
  })();

  const chronicity = (() => {
    if (!merged.symptom_onset) return null;
    const days = Math.floor((Date.now() - new Date(merged.symptom_onset).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 42) return 'ACUTE';
    if (days <= 84) return 'SUBACUTE';
    return 'CHRONIC';
  })();

  const toggleCondition = (condition: any) => {
    setSelectedConditions(prev => {
      const exists = prev.find(c => c.condition_id === condition.condition_id);
      if (exists) return prev.filter(c => c.condition_id !== condition.condition_id);
      return [...prev, condition];
    });
  };

  const handleConfirm = () => {
    if (selectedConditions.length === 0 || !diagnosisResult) return;
    setIsProcessing(true);
    onConditionSelected(selectedConditions, diagnosisResult);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gray-600"
          >
            {ANALYZING_PHRASES[phraseIndex]}
          </motion.p>
        </div>
      </div>
    );
  }

  if (error || !diagnosisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-sm text-red-600 mb-4">{error || 'No diagnosis generated'}</p>
        <Button variant="ghost" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const conditions = diagnosisResult.differential_diagnosis || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Red flags alert */}
        {redFlagsDetected.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">Red Flags Detected</p>
              <p className="text-[13px] text-red-600 mt-1">
                {redFlagsDetected.map((f: string) => f.replace(/_/g, ' ')).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Context line */}
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          {chronicity && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${
              chronicity === 'ACUTE' ? 'bg-blue-100 text-blue-700' :
              chronicity === 'SUBACUTE' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {chronicity}
            </span>
          )}
          {merged.vas_score != null && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${
              merged.vas_score >= 7 ? 'bg-red-100 text-red-700' :
              merged.vas_score >= 4 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              VAS {merged.vas_score}/10
            </span>
          )}
          {locationStr && (
            <span className="text-gray-500 capitalize">{locationStr}</span>
          )}
          {merged.symptom_progression && (
            <span className={`text-gray-500 ${
              merged.symptom_progression === 'getting_worse' ? 'text-red-500' :
              merged.symptom_progression === 'getting_better' ? 'text-green-600' : ''
            }`}>
              {merged.symptom_progression.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Urgency */}
        {diagnosisResult.treatment_urgency && diagnosisResult.treatment_urgency !== 'moderate' && (
          <div className={`text-[13px] font-medium px-3 py-1.5 rounded-lg ${
            diagnosisResult.treatment_urgency === 'urgent' || diagnosisResult.treatment_urgency === 'high'
              ? 'bg-red-50 text-red-700'
              : 'bg-amber-50 text-amber-700'
          }`}>
            Treatment priority: {diagnosisResult.treatment_urgency.toUpperCase()}
          </div>
        )}

        {/* Differential diagnosis heading */}
        <h3 className="text-sm font-semibold text-gray-700">Differential Diagnosis</h3>

        {/* Condition list */}
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {conditions
            .sort((a, b) => b.confidence_score - a.confidence_score)
            .map((condition, idx) => {
              const isSelected = selectedConditions.some(c => c.condition_id === condition.condition_id);
              const selectionIndex = selectedConditions.findIndex(c => c.condition_id === condition.condition_id);
              const isPrimary = selectionIndex === 0;
              const confidence = Math.round(condition.confidence_score * 100);

              return (
                <motion.div
                  key={condition.condition_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.2 }}
                  onClick={() => !isProcessing && toggleCondition(condition)}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left px-4 py-4 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 border-l-[4px] border-l-teal-500'
                      : 'hover:bg-gray-50 border-l-[4px] border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md border-2 border-gray-300 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {condition.condition_name}
                      </span>
                      {isSelected && isPrimary && selectedConditions.length > 1 && (
                        <span className="text-[10px] font-semibold text-teal-600 bg-white px-1.5 py-0.5 rounded border border-teal-200 flex-shrink-0">
                          Primary
                        </span>
                      )}
                      {isSelected && !isPrimary && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConditions(prev => {
                              const without = prev.filter(c => c.condition_id !== condition.condition_id);
                              return [condition, ...without];
                            });
                          }}
                          className="text-[10px] text-gray-400 hover:text-teal-600 px-1.5 py-0.5 rounded hover:bg-white transition-colors flex-shrink-0 cursor-pointer border border-transparent hover:border-teal-200"
                        >
                          Set as Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[13px] font-semibold tabular-nums font-mono ${
                        confidence >= 70 ? 'text-teal-600' :
                        confidence >= 40 ? 'text-amber-600' :
                        'text-gray-500'
                      }`}>
                        {confidence}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                  {/* Show reasoning when selected */}
                  {isSelected && condition.clinical_reasoning && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[13px] text-gray-600 mt-2 ml-6"
                    >
                      {condition.clinical_reasoning}
                    </motion.p>
                  )}
                  {isSelected && condition.supporting_evidence?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 ml-6 space-y-0.5"
                    >
                      {condition.supporting_evidence.map((ev: string, i: number) => (
                        <p key={i} className="text-[13px] text-gray-500">• {ev}</p>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
        </div>

        {/* Additional testing */}
        {diagnosisResult.additional_testing_needed?.length > 0 && (
          <div className="mt-3">
            <p className="text-[13px] font-medium text-gray-500 mb-1">Additional testing recommended:</p>
            {diagnosisResult.additional_testing_needed.map((test, i) => (
              <p key={i} className="text-[13px] text-gray-500">• {test}</p>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {selectedConditions.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-gray-500">
              {selectedConditions.length} condition{selectedConditions.length > 1 ? 's' : ''} selected
              {selectedConditions.length > 0 && (
                <span className="text-teal-600 ml-1">
                  (Primary: {selectedConditions[0]?.condition_name})
                </span>
              )}
            </span>
            <button
              onClick={() => setSelectedConditions([])}
              className="text-[13px] text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        )}
        <Button
          onClick={handleConfirm}
          disabled={selectedConditions.length === 0 || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? 'Saving...' : selectedConditions.length > 1 ? `Confirm ${selectedConditions.length} Conditions` : 'Confirm Diagnosis'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        {diagnosisResult && (
          <>
            {/* Manual provisional diagnosis input */}
            {showManualInput && selectedConditions.length === 0 && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={manualDxInput}
                  onChange={(e) => setManualDxInput(e.target.value)}
                  placeholder="Type provisional diagnosis…"
                  className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
                  autoFocus
                />
                <button onClick={() => { setShowManualInput(false); setManualDxInput(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (selectedConditions.length > 0) {
                  onSkipToImaging(diagnosisResult, {
                    condition_name: selectedConditions[0].condition_name,
                    condition_id: selectedConditions[0].condition_id,
                    source: 'DIFFERENTIAL',
                  });
                } else if (manualDxInput.trim()) {
                  // Use manual entry
                  onSkipToImaging(diagnosisResult, {
                    condition_name: manualDxInput.trim(),
                    condition_id: null,
                    source: 'MANUAL',
                  });
                } else if (!showManualInput) {
                  // Show manual input option
                  setShowManualInput(true);
                } else {
                  // Proceed without provisional (still allowed)
                  onSkipToImaging(diagnosisResult);
                }
              }}
              disabled={isProcessing}
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              size="lg"
            >
              <Scan className="w-4 h-4 mr-2" />
              {selectedConditions.length > 0
                ? `Order Imaging (provisional: ${selectedConditions[0].condition_name})`
                : manualDxInput.trim()
                  ? `Order Imaging (provisional: ${manualDxInput.trim()})`
                  : showManualInput
                    ? 'Skip Provisional & Order Imaging'
                    : 'Order Imaging'}
            </Button>
            {!showManualInput && selectedConditions.length === 0 && (
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full text-center text-[12px] text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-1"
              >
                <PenLine className="w-3 h-3" />
                Enter provisional diagnosis manually
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
