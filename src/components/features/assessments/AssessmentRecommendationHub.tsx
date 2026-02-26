'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAIAssessmentRecommendations } from '@/services/ai/diagnostic.service';
import QuickAssessmentInput from './QuickAssessmentInput';

// ── Types ────────────────────────────────────────────────────
interface AssessmentRecommendation {
  assessment_id: string;
  name: string;
  relevance_score: number;
  reasoning: string;
  category: string;
  estimated_time: string;
}

interface AssessmentRecommendationHubProps {
  isOpen: boolean;
  onClose: () => void;
  screeningData: any;
  onStartRecommended: (assessments: AssessmentRecommendation[]) => void;
  onChooseCustom: () => void;
  onSkipAll: () => void;
}

// ── Component ────────────────────────────────────────────────
const AssessmentRecommendationHub: React.FC<AssessmentRecommendationHubProps> = ({
  isOpen,
  onClose,
  screeningData,
  onStartRecommended,
  onChooseCustom,
  onSkipAll,
}) => {
  const [recommendations, setRecommendations] = useState<AssessmentRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [capturedResults, setCapturedResults] = useState<Record<string, Record<string, any>>>({});
  const [allComplete, setAllComplete] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [availableAssessments, setAvailableAssessments] = useState<Record<string, any>>({});

  // Build screening context for QuickAssessmentInput
  const screeningContext = {
    side: screeningData?.selectedRegions?.[0]?.laterality || null,
    region: screeningData?.selectedRegions?.[0]?.mainRegion || null,
    painLocation: screeningData?.collectedData?.pain_location || screeningData?.collectedData?.pain_area || null,
    vasScore: screeningData?.collectedData?.vas_score || null,
  };

  const regionLabel = screeningContext.region?.replace(/_/g, ' ') || 'Unknown region';
  const sideLabel = screeningContext.side === 'left' ? 'Left' : screeningContext.side === 'right' ? 'Right' : screeningContext.side === 'both' ? 'Bilateral' : '';
  const vasLabel = screeningContext.vasScore ? `${screeningContext.vasScore}/10` : null;

  useEffect(() => {
    if (isOpen && screeningData) {
      generateRecommendations();
      loadAssessments();
    }
  }, [isOpen, screeningData]);

  const loadAssessments = async () => {
    try {
      const data = await import('@/data/clinical/entities/clinical_assessments.json');
      setAvailableAssessments(data.assessments || {});
    } catch (e) {
      console.error('Failed to load assessments:', e);
    }
  };

  const generateRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setActiveIndex(0);
      setCapturedResults({});
      setAllComplete(false);

      const aiRecommendations = await getAIAssessmentRecommendations(screeningData);

      if (aiRecommendations.success && aiRecommendations.recommendations.length > 0) {
        setRecommendations(aiRecommendations.recommendations);
      } else {
        setRecommendations([
          {
            assessment_id: 'ASSESS_056',
            name: 'Range of Motion Assessment',
            relevance_score: 85,
            reasoning: 'Basic movement assessment recommended for all patients',
            category: 'Mobility',
            estimated_time: '5-7 minutes',
          },
        ]);
      }
    } catch (err) {
      setError('Failed to generate recommendations');
      console.error('Assessment recommendation error:', err);
      setRecommendations([
        {
          assessment_id: 'ASSESS_056',
          name: 'Range of Motion Assessment',
          relevance_score: 85,
          reasoning: 'Basic movement assessment recommended',
          category: 'Mobility',
          estimated_time: '5-7 minutes',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = useCallback(
    (assessmentId: string, data: Record<string, any>) => {
      // Store the captured result
      const resultField = Object.keys(data).find(k => k === 'result' || k === 'test_result' || k.includes('result'));
      const resultValue = resultField ? data[resultField] : null;

      setCapturedResults(prev => ({
        ...prev,
        [assessmentId]: { ...data, result: resultValue },
      }));

      // Advance to next test or complete
      const nextIndex = activeIndex + 1;
      if (nextIndex < recommendations.length) {
        setTimeout(() => setActiveIndex(nextIndex), 300);
      } else {
        setTimeout(() => setAllComplete(true), 300);
      }
    },
    [activeIndex, recommendations.length]
  );

  const handleComplete = useCallback(() => {
    // Build completed assessments data and pass upstream
    const completedAssessments = recommendations.map(rec => ({
      ...rec,
      captured_data: capturedResults[rec.assessment_id] || null,
    }));
    onStartRecommended(completedAssessments);
  }, [recommendations, capturedResults, onStartRecommended]);

  const handleSkipCurrent = useCallback(() => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < recommendations.length) {
      setActiveIndex(nextIndex);
    } else {
      setAllComplete(true);
    }
  }, [activeIndex, recommendations.length]);

  const handleRemoveTest = useCallback(
    (assessmentId: string) => {
      setRecommendations(prev => prev.filter(r => r.assessment_id !== assessmentId));
      setCapturedResults(prev => {
        const next = { ...prev };
        delete next[assessmentId];
        return next;
      });
    },
    []
  );

  const handleAddTest = useCallback(
    (assessmentId: string) => {
      const assessment = availableAssessments[assessmentId];
      if (!assessment) return;
      const newRec: AssessmentRecommendation = {
        assessment_id: assessmentId,
        name: assessment.name,
        relevance_score: 70,
        reasoning: `Manually added — ${assessment.purpose}`,
        category: assessment.type?.replace(/_/g, ' ') || 'Clinical',
        estimated_time: '3-5 minutes',
      };
      setRecommendations(prev => [...prev, newRec]);
      setAllComplete(false);
      setShowAddTest(false);
      setAddSearchTerm('');
    },
    [availableAssessments]
  );

  const completedCount = Object.keys(capturedResults).length;
  const totalCount = recommendations.length;

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────
  const panelContent = (
    <div
      className="fixed inset-0 z-[99999] flex"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop — semi-transparent, clicking skips to diagnosis */}
      <div
        className="flex-shrink-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        style={{ width: '35%', minWidth: 200 }}
        onClick={onSkipAll}
      />

      {/* Slide-in panel */}
      <div
        className="flex-1 bg-gray-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden"
        style={{ maxWidth: '65%' }}
      >
        {/* ── Header with screening context ──────────────── */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Clinical Tests</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-teal-100 text-xs font-medium bg-white/15 px-2 py-0.5 rounded">
                  {sideLabel} {regionLabel}
                </span>
                {vasLabel && (
                  <span className="text-teal-100 text-xs font-medium bg-white/15 px-2 py-0.5 rounded">
                    Pain {vasLabel}
                  </span>
                )}
                {screeningData?.redFlags?.length > 0 && (
                  <span className="text-red-100 text-xs font-medium bg-red-500/30 px-2 py-0.5 rounded">
                    Red flags detected
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          {!isLoading && totalCount > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-white/20 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-white/80 text-xs font-medium">
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-600 font-medium">Analyzing screening data...</p>
              <p className="text-xs text-gray-400 mt-1">Selecting optimal diagnostic tests</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button
                onClick={generateRecommendations}
                className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* All-complete summary */}
              {allComplete && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800 text-sm">
                        {completedCount} of {totalCount} tests captured
                      </p>
                      <p className="text-xs text-emerald-600">Ready to generate enhanced diagnosis</p>
                    </div>
                  </div>
                  <button
                    onClick={handleComplete}
                    className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors text-sm"
                  >
                    Generate Diagnosis
                  </button>
                </div>
              )}

              {/* Test cards */}
              {recommendations.map((rec, idx) => {
                const isCaptured = !!capturedResults[rec.assessment_id];
                const isActive = idx === activeIndex && !allComplete;

                return (
                  <div key={rec.assessment_id} className="relative">
                    {/* Remove button for non-captured tests */}
                    {!isCaptured && !isActive && (
                      <button
                        onClick={() => handleRemoveTest(rec.assessment_id)}
                        className="absolute -right-1 -top-1 z-10 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <QuickAssessmentInput
                      assessmentId={rec.assessment_id}
                      screeningContext={screeningContext}
                      relevanceScore={rec.relevance_score}
                      onCapture={handleCapture}
                      isActive={isActive}
                      completedData={isCaptured ? capturedResults[rec.assessment_id] : null}
                    />
                  </div>
                );
              })}

              {/* Skip current test */}
              {!allComplete && recommendations.length > 0 && (
                <div className="flex justify-center pt-1">
                  <button
                    onClick={handleSkipCurrent}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip this test
                  </button>
                </div>
              )}

              {/* Add a test */}
              <div className="pt-2">
                {!showAddTest ? (
                  <button
                    onClick={() => setShowAddTest(true)}
                    className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
                  >
                    + Add another test
                  </button>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={addSearchTerm}
                        onChange={e => setAddSearchTerm(e.target.value)}
                        placeholder="Search tests..."
                        autoFocus
                        className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      />
                      <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <button
                        onClick={() => { setShowAddTest(false); setAddSearchTerm(''); }}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {addSearchTerm.length >= 2 && (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {Object.entries(availableAssessments)
                          .filter(([id, a]: [string, any]) => {
                            const alreadyAdded = recommendations.some(r => r.assessment_id === id);
                            const matches =
                              a.name?.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
                              a.purpose?.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
                              a.type?.toLowerCase().includes(addSearchTerm.toLowerCase());
                            return !alreadyAdded && matches;
                          })
                          .slice(0, 8)
                          .map(([id, a]: [string, any]) => (
                            <button
                              key={id}
                              onClick={() => handleAddTest(id)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                                <p className="text-xs text-gray-500 truncate">{a.type?.replace(/_/g, ' ')}</p>
                              </div>
                              <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────── */}
        {!isLoading && recommendations.length > 0 && (
          <div className="border-t border-gray-200 bg-white px-5 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={onSkipAll}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip to diagnosis
              </button>

              {!allComplete ? (
                <div className="text-xs text-gray-400">
                  {completedCount} of {totalCount} captured
                </div>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  Generate Diagnosis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(panelContent, document.body) : null;
};

export default AssessmentRecommendationHub;
