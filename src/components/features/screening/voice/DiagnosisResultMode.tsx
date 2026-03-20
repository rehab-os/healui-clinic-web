'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiDiagnosticService, type DiagnosticResponse } from '@/services/ai/diagnostic.service';
import { buildDiagnosticPayload } from '@/services/ai/voice-diagnostic-payload';

interface DiagnosisResultModeProps {
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  completedAssessments: any[];
  onConditionSelected: (condition: any, diagnosisResult: DiagnosticResponse) => void;
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
  onBack,
}: DiagnosisResultModeProps) {
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosticResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(0);

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

  const handleConfirm = () => {
    if (!selectedCondition || !diagnosisResult) return;
    setIsProcessing(true);
    onConditionSelected(selectedCondition, diagnosisResult);
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
              <p className="text-xs text-red-600 mt-1">
                {redFlagsDetected.map((f: string) => f.replace(/_/g, ' ')).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Context line */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
          <div className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
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
              const isSelected = selectedCondition?.condition_id === condition.condition_id;
              const confidence = Math.round(condition.confidence_score * 100);

              return (
                <motion.button
                  key={condition.condition_id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.2 }}
                  onClick={() => setSelectedCondition(condition)}
                  disabled={isProcessing}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    isSelected
                      ? 'bg-teal-50 border-l-2 border-l-teal-500'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {condition.condition_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold tabular-nums ${
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
                      className="text-xs text-gray-600 mt-2 ml-6"
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
                        <p key={i} className="text-xs text-gray-500">• {ev}</p>
                      ))}
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
        </div>

        {/* Additional testing */}
        {diagnosisResult.additional_testing_needed?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Additional testing recommended:</p>
            {diagnosisResult.additional_testing_needed.map((test, i) => (
              <p key={i} className="text-xs text-gray-500">• {test}</p>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {selectedCondition && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              Selected: <strong>{selectedCondition.condition_name}</strong>
            </span>
            <button
              onClick={() => setSelectedCondition(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        )}
        <Button
          onClick={handleConfirm}
          disabled={!selectedCondition || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? 'Saving...' : 'Confirm Diagnosis'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
