'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ClipboardList, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import { AIBubbleLoader } from '@/components/ui/AIBubbleLoader';
import { getRecommendedPROMs } from '@/services/ai/diagnostic.service';
import promRegistry from '@/data/conditions/proms/prom_registry.json';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ADLData {
  selected_prom: string;
  prom_name: string;
  total_score: number;
  percentage: number;
  interpretation: string;
  answers: Record<string, number>;
  completed_at: string;
  // Backward compat
  affected_activities: Array<{ activity: string; label: string; severity: 'MILD' | 'MODERATE' | 'SEVERE' }>;
  functional_limitation_level: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  work_affected: boolean;
  sleep_affected: boolean;
}

interface ADLModeProps {
  extractedFields: Record<string, any>;
  analysisAnswers: Record<string, any>;
  onComplete: (adlData: ADLData) => void;
  onSkip: () => void;
}

interface PromEntry {
  prom_id: string;
  full_name: string;
  body_region: string;
  conditions: string[];
  items: number;
  estimated_minutes: number;
  file: string;
  status: string;
}

interface PromQuestion {
  id: string;
  question: string;
  ui_component: string;
  required: boolean;
  order: number;
  options: Array<{ value: string; label: string; score: number }>;
}

interface PromData {
  prom_id: string;
  full_name: string;
  description: string;
  instructions: string;
  total_items: number;
  scoring: {
    method: string;
    total_score: {
      min: number;
      max: number;
      calculation: string;
      percentage_calculation?: string;
      interpretation: Record<string, string>;
      higher_is_worse: boolean;
    };
  };
  sections: Array<{
    id: string;
    title: string;
    description: string;
    questions: PromQuestion[];
  }>;
}

type Phase = 'SELECTION' | 'QUESTIONNAIRE' | 'DONE';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REGION_ALIAS: Record<string, string[]> = {
  'lower-back': ['Spine - Lumbar', 'Spine', 'General'],
  'lumbar': ['Spine - Lumbar', 'Spine', 'General'],
  'lower_back': ['Spine - Lumbar', 'Spine', 'General'],
  'lumbar_spine': ['Spine - Lumbar', 'Spine', 'General'],
  'neck': ['Spine - Cervical', 'Spine', 'General'],
  'cervical': ['Spine - Cervical', 'Spine', 'General'],
  'cervical_spine': ['Spine - Cervical', 'Spine', 'General'],
  'thoracic': ['Spine - Thoracic', 'Spine', 'General'],
  'thoracic_spine': ['Spine - Thoracic', 'Spine', 'General'],
  'shoulder': ['Upper Extremity - Shoulder', 'Upper Extremity - General', 'General'],
  'elbow': ['Upper Extremity - Elbow', 'Upper Extremity - General', 'General'],
  'wrist': ['Upper Extremity - Wrist/Hand', 'Upper Extremity - General', 'General'],
  'hand': ['Upper Extremity - Wrist/Hand', 'Upper Extremity - General', 'General'],
  'forearm': ['Upper Extremity - General', 'General'],
  'arm': ['Upper Extremity - General', 'General'],
  'hip': ['Lower Extremity - Hip', 'Lower Extremity - General', 'General'],
  'knee': ['Lower Extremity - Knee', 'Lower Extremity - General', 'General'],
  'ankle': ['Lower Extremity - Foot/Ankle', 'Lower Extremity - General', 'General'],
  'foot': ['Lower Extremity - Foot/Ankle', 'Lower Extremity - General', 'General'],
  'lower-leg': ['Lower Extremity - General', 'General'],
  'thigh': ['Lower Extremity - General', 'General'],
};

function detectRegionString(painLocation: any): string {
  if (!painLocation) return '';
  const loc = Array.isArray(painLocation) ? painLocation : [painLocation];
  const first = loc[0];
  if (typeof first === 'object' && first?.mainRegion) return first.mainRegion;
  return String(first ?? '').toLowerCase();
}

function getPromsForRegion(region: string): PromEntry[] {
  const bodyRegions = REGION_ALIAS[region] || REGION_ALIAS[region.replace(/_/g, '-')] || REGION_ALIAS[region.replace(/-/g, '_')] || [];
  const allProms = (promRegistry as any).proms as PromEntry[];

  if (bodyRegions.length === 0) return allProms.filter(p => p.status === 'available');

  const regionSet = new Set(bodyRegions.map(r => r.toLowerCase()));
  const matched = allProms.filter(p =>
    p.status === 'available' && regionSet.has(p.body_region.toLowerCase())
  );

  // If we got some region matches, return those; otherwise return all available
  return matched.length > 0 ? matched : allProms.filter(p => p.status === 'available');
}

function calculateScore(promData: PromData, answers: Record<string, number>): {
  totalScore: number;
  percentage: number;
  interpretation: string;
} {
  const totalScore = Object.values(answers).reduce((sum, s) => sum + s, 0);
  const maxScore = promData.scoring.total_score.max;
  const percentage = Math.round((totalScore / maxScore) * 100);

  // Find interpretation bracket
  let interpretation = '';
  const interpMap = promData.scoring.total_score.interpretation;
  for (const [range, label] of Object.entries(interpMap)) {
    const [low, high] = range.split('-').map(Number);
    if (percentage >= low && percentage <= high) {
      interpretation = label;
      break;
    }
  }

  if (!interpretation) {
    // Fallback: find the closest bracket
    const entries = Object.entries(interpMap);
    interpretation = entries[entries.length - 1]?.[1] || 'Completed';
  }

  return { totalScore, percentage, interpretation };
}

function percentageToSeverity(pct: number): 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' {
  if (pct <= 10) return 'NONE';
  if (pct <= 30) return 'MILD';
  if (pct <= 60) return 'MODERATE';
  return 'SEVERE';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ADLMode({
  extractedFields,
  analysisAnswers,
  onComplete,
  onSkip,
}: ADLModeProps) {
  const [phase, setPhase] = useState<Phase>('SELECTION');
  const [isLoading, setIsLoading] = useState(true);

  // Phase 1 state
  const [recommendedProm, setRecommendedProm] = useState<string | null>(null);
  const [recommendedReason, setRecommendedReason] = useState('');
  const [alternativeProms, setAlternativeProms] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Phase 2 state
  const [selectedPromEntry, setSelectedPromEntry] = useState<PromEntry | null>(null);
  const [promData, setPromData] = useState<PromData | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loadingProm, setLoadingProm] = useState(false);

  // Phase 2 result
  const [scoreResult, setScoreResult] = useState<{ totalScore: number; percentage: number; interpretation: string } | null>(null);

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Detect region
  const region: string = analysisAnswers.analysis_region
    ?? extractedFields.analysis_region
    ?? detectRegionString(extractedFields.pain_location);

  const regionProms = useMemo(() => getPromsForRegion(region), [region]);

  // Remaining PROMs (not recommended, not alternatives)
  const remainingProms = useMemo(() => {
    const excludeSet = new Set([recommendedProm, ...alternativeProms].filter(Boolean));
    return regionProms.filter(p => !excludeSet.has(p.prom_id));
  }, [regionProms, recommendedProm, alternativeProms]);

  // Call AI on mount to get PROM recommendation
  useEffect(() => {
    if (regionProms.length === 0) { setIsLoading(false); return; }

    (async () => {
      try {
        const result = await getRecommendedPROMs({
          clinicalData: {
            chief_complaint: extractedFields.chief_complaint,
            pain_nature: extractedFields.pain_nature,
            aggravating_factors: extractedFields.aggravating_factors,
            functional_impact: extractedFields.functional_impact,
            vas_score: extractedFields.vas_score,
          },
          region,
          availableADLs: regionProms.map(p => ({ value: p.prom_id, label: p.full_name })),
        });

        if (result.length > 0) {
          setRecommendedProm(result[0].activity);
          setRecommendedReason(result[0].reason);
          setAlternativeProms(result.slice(1, 4).map(r => r.activity));
        } else {
          // Fallback: use first prom as recommended
          setRecommendedProm(regionProms[0].prom_id);
        }
      } catch {
        // Fallback: use first prom as recommended
        if (regionProms.length > 0) {
          setRecommendedProm(regionProms[0].prom_id);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Select a PROM and move to Phase 2
  const selectProm = useCallback(async (promEntry: PromEntry) => {
    setSelectedPromEntry(promEntry);
    setLoadingProm(true);
    setPhase('QUESTIONNAIRE');
    setAnswers({});
    setScoreResult(null);

    try {
      const mod = await import(`@/data/conditions/proms/${promEntry.file}`);
      const data: PromData = mod.default || mod;
      setPromData(data);
    } catch (err) {
      console.error('Failed to load PROM data:', err);
    } finally {
      setLoadingProm(false);
    }
  }, []);

  // Get all questions flat
  const allQuestions = useMemo(() => {
    if (!promData) return [];
    return promData.sections.flatMap(s => s.questions).sort((a, b) => a.order - b.order);
  }, [promData]);

  // Answer a question
  const answerQuestion = useCallback((questionId: string, score: number) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: score };

      // Find the next unanswered question and scroll to it
      const currentIdx = allQuestions.findIndex(q => q.id === questionId);
      if (currentIdx >= 0 && currentIdx < allQuestions.length - 1) {
        const nextQ = allQuestions[currentIdx + 1];
        setTimeout(() => {
          const ref = questionRefs.current[nextQ.id];
          if (ref && scrollContainerRef.current) {
            ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
      }

      // If all answered, calculate score
      if (Object.keys(next).length === allQuestions.length && promData) {
        const result = calculateScore(promData, next);
        setScoreResult(result);
      }

      return next;
    });
  }, [allQuestions, promData]);

  // Complete the questionnaire
  const handleComplete = useCallback(() => {
    if (!scoreResult || !selectedPromEntry || !promData) return;

    const severity = percentageToSeverity(scoreResult.percentage);

    const adlData: ADLData = {
      selected_prom: selectedPromEntry.prom_id,
      prom_name: promData.full_name,
      total_score: scoreResult.totalScore,
      percentage: scoreResult.percentage,
      interpretation: scoreResult.interpretation,
      answers,
      completed_at: new Date().toISOString(),
      // Backward compat fields
      affected_activities: [{
        activity: selectedPromEntry.prom_id,
        label: promData.full_name,
        severity: severity === 'NONE' ? 'MILD' : severity,
      }],
      functional_limitation_level: severity,
      work_affected: scoreResult.percentage > 40,
      sleep_affected: scoreResult.percentage > 50,
    };

    onComplete(adlData);
  }, [scoreResult, selectedPromEntry, promData, answers, onComplete]);

  // ─── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <AIBubbleLoader />
        <p className="text-sm text-gray-500 mt-3">Finding the best outcome measure...</p>
      </div>
    );
  }

  // No PROMs available
  if (regionProms.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No outcome measures found for this region.</p>
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onSkip} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase 1: PROM Selection ──────────────────────────────────────────────

  if (phase === 'SELECTION') {
    const recEntry = regionProms.find(p => p.prom_id === recommendedProm);
    const altEntries = alternativeProms
      .map(id => regionProms.find(p => p.prom_id === id))
      .filter(Boolean) as PromEntry[];

    const renderPromCard = (entry: PromEntry, isRecommended: boolean, idx: number) => (
      <motion.button
        key={entry.prom_id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        onClick={() => selectProm(entry)}
        className={`w-full text-left rounded-xl border overflow-hidden transition-all hover:shadow-sm ${
          isRecommended
            ? 'border-teal-400 bg-gradient-to-br from-teal-50/80 to-white shadow-sm'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="px-4 py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isRecommended && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 uppercase tracking-[0.1em] mb-1">
                  <Sparkles className="w-3 h-3" />
                  AI Recommended
                </span>
              )}
              <p className={`text-[14px] font-semibold ${isRecommended ? 'text-teal-800' : 'text-gray-800'}`}>
                {entry.prom_id}
              </p>
              <p className="text-[12px] text-gray-500 mt-0.5">{entry.full_name}</p>
              {isRecommended && recommendedReason && (
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{recommendedReason}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-[11px] text-gray-400">{entry.items} items</span>
              <span className="text-[11px] text-gray-400">~{entry.estimated_minutes} min</span>
            </div>
          </div>
        </div>
      </motion.button>
    );

    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
          <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-0.5 font-medium">Outcome Measure</p>
          <h3 className="text-base font-semibold text-gray-800">Select a PROM</h3>
          <p className="text-[13px] text-gray-400 mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-500" />
            AI-selected based on clinical findings
          </p>
        </div>

        {/* PROM list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {/* Recommended */}
          {recEntry && (
            <>
              <p className="text-[12px] text-teal-600 font-medium uppercase tracking-[0.12em]">Best Match</p>
              {renderPromCard(recEntry, true, 0)}
            </>
          )}

          {/* Alternatives */}
          {altEntries.length > 0 && (
            <>
              <p className="text-[12px] text-gray-400 font-medium uppercase tracking-[0.12em] mt-3">Alternatives</p>
              {altEntries.map((entry, idx) => renderPromCard(entry, false, idx + 1))}
            </>
          )}

          {/* Show all toggle */}
          {remainingProms.length > 0 && (
            <>
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                {showAll ? 'Hide' : `Show ${remainingProms.length} more`}
              </button>
              <AnimatePresence>
                {showAll && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2.5 overflow-hidden"
                  >
                    {remainingProms.map((entry, idx) => renderPromCard(entry, false, idx + altEntries.length + 1))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Bottom actions */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0">
          <button onClick={onSkip} className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 py-1 transition-colors">
            Skip this step
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase 2: Questionnaire ───────────────────────────────────────────────

  if (phase === 'QUESTIONNAIRE') {
    if (loadingProm || !promData) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-white">
          <AIBubbleLoader />
          <p className="text-sm text-gray-500 mt-3">Loading questionnaire...</p>
        </div>
      );
    }

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = allQuestions.length;
    const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-0.5 font-medium">{promData.prom_id}</p>
              <h3 className="text-base font-semibold text-gray-800">{promData.full_name}</h3>
            </div>
            <span className="text-[12px] text-gray-400 font-medium">
              {answeredCount} of {totalQuestions}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-teal-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {promData.instructions && (
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{promData.instructions}</p>
          )}
        </div>

        {/* Questions */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {allQuestions.map((question, qIdx) => {
            const isAnswered = answers[question.id] !== undefined;
            const selectedScore = answers[question.id];

            return (
              <motion.div
                key={question.id}
                ref={el => { questionRefs.current[question.id] = el; }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIdx * 0.03 }}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isAnswered ? 'border-teal-200 bg-white' : 'border-gray-200 bg-white'
                }`}
              >
                {/* Question header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                      isAnswered ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isAnswered ? <CheckCircle className="w-3.5 h-3.5" /> : qIdx + 1}
                    </span>
                    <p className={`text-[13px] font-medium ${isAnswered ? 'text-teal-800' : 'text-gray-700'}`}>
                      {question.question}
                    </p>
                  </div>
                </div>

                {/* Options */}
                <div className="divide-y divide-gray-50">
                  {question.options.map(option => {
                    const isSelected = selectedScore === option.score;
                    return (
                      <button
                        key={option.value}
                        onClick={() => answerQuestion(question.id, option.score)}
                        className={`w-full text-left px-4 py-2.5 transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-teal-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className={`text-[13px] leading-relaxed ${
                          isSelected ? 'text-teal-800 font-medium' : 'text-gray-600'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          {/* Score result */}
          <AnimatePresence>
            {scoreResult && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="rounded-xl border border-teal-300 bg-gradient-to-br from-teal-50 to-white p-5 text-center"
              >
                <CheckCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-1">Score</p>
                <p className="text-3xl font-bold text-teal-700">{scoreResult.percentage}%</p>
                <p className="text-[14px] font-medium text-gray-700 mt-1">{scoreResult.interpretation}</p>
                <p className="text-[12px] text-gray-400 mt-1">
                  Raw score: {scoreResult.totalScore} / {promData.scoring.total_score.max}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom actions */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white space-y-2 flex-shrink-0">
          {scoreResult ? (
            <button
              onClick={handleComplete}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              Complete <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-gray-200 text-gray-400 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
              Answer all questions ({answeredCount}/{totalQuestions})
            </button>
          )}
          <button onClick={onSkip} className="w-full text-center text-[13px] text-gray-400 hover:text-gray-600 py-1 transition-colors">
            Skip this step
          </button>
        </div>
      </div>
    );
  }

  // Fallback (Phase DONE handled via onComplete)
  return null;
}
