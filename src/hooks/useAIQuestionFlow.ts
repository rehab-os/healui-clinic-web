'use client';

import { useState, useCallback, useRef } from 'react';
import screeningAPI, {
  ScreeningContext,
  NextQuestionResult,
  BatchQuestionsResult,
  CompletenessResult
} from '@/services/screeningAPI';

interface SelectedRegion {
  mainRegion: string;
  laterality?: 'left' | 'right' | 'both' | 'center';
  subRegions?: string[];
}

interface UseAIQuestionFlowOptions {
  selectedRegions: SelectedRegion[];
  onQuestionRecommended?: (question: NextQuestionResult) => void;
  onCompletenessChange?: (completeness: CompletenessResult) => void;
  enabled?: boolean;
}

interface UseAIQuestionFlowReturn {
  // Current state
  nextQuestion: NextQuestionResult | null;
  batchQuestions: BatchQuestionsResult | null;
  completeness: CompletenessResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  recordResponse: (questionId: string, response: any) => void;
  recordRedFlag: (flag: string) => void;
  getNextQuestion: () => Promise<NextQuestionResult | null>;
  getBatchQuestions: (count?: number) => Promise<BatchQuestionsResult | null>;
  checkCompleteness: () => Promise<CompletenessResult | null>;
  resetFlow: () => void;

  // Context
  context: ScreeningContext;
  answeredCount: number;
}

export function useAIQuestionFlow(options: UseAIQuestionFlowOptions): UseAIQuestionFlowReturn {
  const { selectedRegions, onQuestionRecommended, onCompletenessChange, enabled = true } = options;

  const [nextQuestion, setNextQuestion] = useState<NextQuestionResult | null>(null);
  const [batchQuestions, setBatchQuestions] = useState<BatchQuestionsResult | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [collectedResponses, setCollectedResponses] = useState<Record<string, any>>({});
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [redFlagsDetected, setRedFlagsDetected] = useState<string[]>([]);

  const sessionStartTime = useRef<number>(Date.now());

  // Build the current context
  const context: ScreeningContext = {
    selectedRegions,
    collectedResponses,
    answeredQuestionIds,
    redFlagsDetected,
    sessionDuration: Math.floor((Date.now() - sessionStartTime.current) / 1000)
  };

  // Record a response to a question
  const recordResponse = useCallback((questionId: string, response: any) => {
    setCollectedResponses(prev => ({
      ...prev,
      [questionId]: response
    }));

    if (!answeredQuestionIds.includes(questionId)) {
      setAnsweredQuestionIds(prev => [...prev, questionId]);
    }

    // Auto-detect red flags from text responses
    if (typeof response === 'string') {
      const detectedFlags = screeningAPI.detectRedFlags(response);
      if (detectedFlags.length > 0) {
        setRedFlagsDetected(prev => [...new Set([...prev, ...detectedFlags])]);
      }
    }
  }, [answeredQuestionIds]);

  // Record a red flag
  const recordRedFlag = useCallback((flag: string) => {
    if (!redFlagsDetected.includes(flag)) {
      setRedFlagsDetected(prev => [...prev, flag]);
    }
  }, [redFlagsDetected]);

  // Get the next best question
  const getNextQuestion = useCallback(async (): Promise<NextQuestionResult | null> => {
    if (!enabled) return null;

    setIsLoading(true);
    setError(null);

    try {
      const result = await screeningAPI.getNextBestQuestion(context);
      setNextQuestion(result);
      onQuestionRecommended?.(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to get next question');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context, enabled, onQuestionRecommended]);

  // Get batch questions
  const getBatchQuestions = useCallback(async (count: number = 3): Promise<BatchQuestionsResult | null> => {
    if (!enabled) return null;

    setIsLoading(true);
    setError(null);

    try {
      const result = await screeningAPI.getBatchQuestions(context, count);
      setBatchQuestions(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to get batch questions');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context, enabled]);

  // Check completeness
  const checkCompleteness = useCallback(async (): Promise<CompletenessResult | null> => {
    if (!enabled) return null;

    setIsLoading(true);
    setError(null);

    try {
      const result = await screeningAPI.analyzeCompleteness(context);
      setCompleteness(result);
      onCompletenessChange?.(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze completeness');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context, enabled, onCompletenessChange]);

  // Reset the flow
  const resetFlow = useCallback(() => {
    setCollectedResponses({});
    setAnsweredQuestionIds([]);
    setRedFlagsDetected([]);
    setNextQuestion(null);
    setBatchQuestions(null);
    setCompleteness(null);
    setError(null);
    sessionStartTime.current = Date.now();
  }, []);

  // Note: Auto-completeness checking is disabled to avoid infinite API calls
  // when the backend AI service is unavailable. Users can manually call
  // checkCompleteness() when needed.

  return {
    nextQuestion,
    batchQuestions,
    completeness,
    isLoading,
    error,
    recordResponse,
    recordRedFlag,
    getNextQuestion,
    getBatchQuestions,
    checkCompleteness,
    resetFlow,
    context,
    answeredCount: answeredQuestionIds.length
  };
}

export default useAIQuestionFlow;
