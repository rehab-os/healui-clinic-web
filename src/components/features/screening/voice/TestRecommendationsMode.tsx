'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAIAssessmentRecommendations } from '@/services/ai/diagnostic.service';
import QuickAssessmentInput from '@/components/features/assessments/QuickAssessmentInput';

interface TestRecommendation {
  assessment_id: string;
  name: string;
  relevance_score: number;
  reasoning: string;
  category: string;
  estimated_time: string;
}

interface TestRecommendationsModeProps {
  extractedFields: Record<string, any>;
  gapAnswers: Record<string, any>;
  onComplete: (completedAssessments: any[]) => void;
  onSkip: () => void;
}

export default function TestRecommendationsMode({
  extractedFields,
  gapAnswers,
  onComplete,
  onSkip,
}: TestRecommendationsModeProps) {
  const [recommendations, setRecommendations] = useState<TestRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [capturedResults, setCapturedResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const merged = { ...extractedFields, ...gapAnswers };

  // Derive screening context for QuickAssessmentInput
  const screeningContext = (() => {
    const painLoc = merged.pain_location;
    if (painLoc && Array.isArray(painLoc) && painLoc.length > 0) {
      const first = painLoc[0];
      if (typeof first === 'object' && first?.mainRegion) {
        return {
          region: first.mainRegion,
          side: first.laterality === 'center' ? null : first.laterality,
          painLocation: first.mainRegion,
          vasScore: merged.vas_score ?? null,
        };
      }
      // String format fallback
      const locStr = String(first);
      const sideMatch = locStr.match(/(left|right|both)$/i);
      return {
        region: sideMatch ? locStr.replace(/_(left|right|both)$/i, '') : locStr,
        side: sideMatch ? sideMatch[1].toLowerCase() : null,
        painLocation: locStr,
        vasScore: merged.vas_score ?? null,
      };
    }
    return { region: null, side: null, painLocation: null, vasScore: merged.vas_score ?? null };
  })();

  // Fetch recommendations on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await getAIAssessmentRecommendations({
          responses: merged,
          selectedRegions: merged.pain_location || [],
          redFlags: merged.red_flag_screening || [],
        });

        if (result.success && result.recommendations?.length > 0) {
          setRecommendations(result.recommendations);
        } else {
          // No recommendations — skip to diagnosis
          setRecommendations([]);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load test recommendations');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback((assessmentId: string, data: Record<string, any>) => {
    setCapturedResults(prev => {
      const updated = { ...prev, [assessmentId]: data };
      return updated;
    });
    // Move to next uncaptured test
    setActiveIndex(prev => {
      const nextIdx = prev + 1;
      return nextIdx;
    });
  }, []);

  const handleSkipCurrent = () => {
    setActiveIndex(prev => prev + 1);
  };

  const allComplete = activeIndex >= recommendations.length;
  const capturedCount = Object.keys(capturedResults).length;

  const handleProceed = () => {
    const assessments = Object.entries(capturedResults).map(([id, data]) => {
      const rec = recommendations.find(r => r.assessment_id === id);
      return {
        assessment_id: id,
        assessment_name: rec?.name || id,
        category: rec?.category || 'Clinical Assessment',
        completed_at: new Date().toISOString(),
        form_data: data,
        findings_summary: null,
      };
    });
    onComplete(assessments);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Analyzing recommended tests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Button variant="ghost" onClick={onSkip}>Skip to Diagnosis</Button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-sm text-gray-600 mb-4">No specific clinical tests recommended for this presentation.</p>
        <Button onClick={onSkip}>
          Continue to Diagnosis
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-[15px] font-medium text-gray-800">Recommended Clinical Tests</h3>
          <div className="flex items-center gap-3 mt-2">
            {screeningContext.region && (
              <span className="text-xs text-gray-500">
                {screeningContext.side ? `${screeningContext.side.charAt(0).toUpperCase() + screeningContext.side.slice(1)} ` : ''}
                {screeningContext.region?.replace(/_/g, ' ').replace(/-/g, ' ')}
              </span>
            )}
            {screeningContext.vasScore != null && (
              <span className="text-xs text-gray-500">Pain {screeningContext.vasScore}/10</span>
            )}
            <span className="text-xs text-gray-400 ml-auto tabular-nums">
              {capturedCount}/{recommendations.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-0.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(capturedCount / recommendations.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full bg-brand-teal rounded-full"
            />
          </div>
        </div>

        {/* Test list */}
        <div className="divide-y divide-gray-100">
          {recommendations.map((rec, idx) => {
            const isCaptured = !!capturedResults[rec.assessment_id];
            const isActive = idx === activeIndex && !allComplete;

            return (
              <motion.div
                key={rec.assessment_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.2, ease: 'easeOut' }}
                className={isActive ? 'py-3' : 'py-1.5'}
              >
                <QuickAssessmentInput
                  assessmentId={rec.assessment_id}
                  screeningContext={screeningContext}
                  relevanceScore={rec.relevance_score}
                  onCapture={handleCapture}
                  isActive={isActive}
                  completedData={isCaptured ? capturedResults[rec.assessment_id] : null}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-3">
          {!allComplete && (
            <button
              onClick={handleSkipCurrent}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip test
            </button>
          )}
          <button
            onClick={() => {
              // Skip all remaining and proceed
              handleProceed();
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto"
          >
            <SkipForward className="w-3 h-3 inline mr-1" />
            Skip to diagnosis
          </button>
        </div>
        {(allComplete || capturedCount > 0) && (
          <Button onClick={handleProceed} className="w-full" size="lg">
            Generate Diagnosis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
