'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { ConversationManager } from '@/services/symptom-assessment/conversationManager';

// ========== INTERFACES ==========

export interface SymptomDxResponse {
  question_id: string;
  question_text: string;
  question_type: string;
  answer: any;
  timestamp: string;
}

export interface SymptomDxAIAnalysis {
  top_conditions: {
    condition_id: string;
    condition_name: string;
    probability: number;
  }[];
  confidence: number;
  red_flags_detected: string[];
  recommendations: string[];
}

export interface SymptomDxData {
  session_id: string;
  started_at: string;
  completed_at: string;
  filled_by: 'PATIENT' | 'PHYSIO';
  filled_by_user_id?: string;
  responses: SymptomDxResponse[];
  ai_analysis?: SymptomDxAIAnalysis;
  body_regions: string[];
  symptom_duration?: string;
  pain_level?: number;
  chief_complaint?: string;
  questions_asked: number;
  completion_percentage: number;
}

interface SymptomAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  filledBy: 'PATIENT' | 'PHYSIO';
  filledByUserId?: string;
  onComplete: (data: SymptomDxData) => void;
  existingData?: SymptomDxData;
}

interface ChatMessage {
  type: 'question' | 'answer' | 'diagnosis' | 'referral';
  content: any;
  timestamp: Date;
}

// Animation variants
const questionVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const optionVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

export default function SymptomAssessmentModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  filledBy,
  filledByUserId,
  onComplete,
  existingData,
}: SymptomAssessmentModalProps) {
  const [conversationManager] = useState(() => new ConversationManager());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ questionsAsked: 0, confidence: 0, topCondition: '' });
  const [sessionStartTime] = useState<Date>(new Date());
  const [sessionId] = useState<string>(`symptom_dx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [responses, setResponses] = useState<SymptomDxResponse[]>([]);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [needsReferral, setNeedsReferral] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen]);

  const initializeChat = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setIsComplete(false);
      setMessages([]);
      setResponses([]);
      setDiagnosticResults(null);
      setNeedsReferral(false);

      await conversationManager.initializeEngine();
      const result = conversationManager.startConversation();
      setCurrentQuestion(result.question);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize symptom assessment:', err);
      setError('Unable to load the assessment. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const handleAnswer = useCallback((answer: any) => {
    if (!currentQuestion) return;

    // Record the response
    const response: SymptomDxResponse = {
      question_id: currentQuestion.id,
      question_text: currentQuestion.text,
      question_type: currentQuestion.type,
      answer: answer,
      timestamp: new Date().toISOString(),
    };
    setResponses(prev => [...prev, response]);

    setMessages(prev => [...prev, {
      type: 'answer',
      content: answer,
      timestamp: new Date()
    }]);

    try {
      const result = conversationManager.processUserResponse(answer);

      if (result.type === 'question') {
        setCurrentQuestion(result.question);
        setProgress(result.progress);
      } else if (result.type === 'diagnosis') {
        setDiagnosticResults(result.results);
        setMessages(prev => [...prev, {
          type: 'diagnosis',
          content: result,
          timestamp: new Date()
        }]);
        setIsComplete(true);
      } else if (result.type === 'referral') {
        setNeedsReferral(true);
        setDiagnosticResults(result.results);
        setMessages(prev => [...prev, {
          type: 'referral',
          content: result,
          timestamp: new Date()
        }]);
        setIsComplete(true);
      } else if (result.type === 'source_identified') {
        // Source identified but continue with questions
        setCurrentQuestion(result.question);
        setProgress(result.progress);
      }
    } catch (err) {
      console.error('Error processing answer:', err);
      setError('Something went wrong. Please try again.');
    }
  }, [currentQuestion, conversationManager]);

  const handleComplete = useCallback(() => {
    // Build the SymptomDxData object
    const symptomDxData: SymptomDxData = {
      session_id: sessionId,
      started_at: sessionStartTime.toISOString(),
      completed_at: new Date().toISOString(),
      filled_by: filledBy,
      filled_by_user_id: filledByUserId,
      responses: responses,
      ai_analysis: diagnosticResults ? {
        top_conditions: diagnosticResults.topConditions?.map((c: any) => ({
          condition_id: c.id || c.condition_id,
          condition_name: c.name || c.condition_name,
          probability: c.probability || c.confidence_score || 0,
        })) || [],
        confidence: diagnosticResults.confidence || 0,
        red_flags_detected: diagnosticResults.redFlagsDetected || [],
        recommendations: diagnosticResults.recommendations?.nextSteps || [],
      } : undefined,
      body_regions: extractBodyRegions(responses),
      symptom_duration: extractSymptomDuration(responses),
      pain_level: extractPainLevel(responses),
      chief_complaint: extractChiefComplaint(responses),
      questions_asked: responses.length,
      completion_percentage: 100,
    };

    onComplete(symptomDxData);
  }, [sessionId, sessionStartTime, filledBy, filledByUserId, responses, diagnosticResults, onComplete]);

  // Helper functions to extract data from responses
  const extractBodyRegions = (responses: SymptomDxResponse[]): string[] => {
    const bodyResponse = responses.find(r =>
      r.question_id.includes('body') ||
      r.question_id.includes('region') ||
      r.question_type === 'body_selection'
    );
    if (bodyResponse) {
      if (Array.isArray(bodyResponse.answer)) return bodyResponse.answer;
      if (typeof bodyResponse.answer === 'string') return [bodyResponse.answer];
    }
    return [];
  };

  const extractSymptomDuration = (responses: SymptomDxResponse[]): string | undefined => {
    const durationResponse = responses.find(r =>
      r.question_id.includes('duration') ||
      r.question_text.toLowerCase().includes('how long')
    );
    return durationResponse?.answer?.toString();
  };

  const extractPainLevel = (responses: SymptomDxResponse[]): number | undefined => {
    const painResponse = responses.find(r =>
      r.question_id.includes('pain') &&
      (r.question_id.includes('level') || r.question_id.includes('scale'))
    );
    if (painResponse && typeof painResponse.answer === 'number') {
      return painResponse.answer;
    }
    return undefined;
  };

  const extractChiefComplaint = (responses: SymptomDxResponse[]): string | undefined => {
    // Build chief complaint from body region and main symptom
    const bodyRegions = extractBodyRegions(responses);
    if (bodyRegions.length > 0) {
      return `${bodyRegions.join(', ')} symptoms`;
    }
    return undefined;
  };

  const handleClose = () => {
    if (!isComplete && responses.length > 0) {
      // Ask for confirmation if assessment is in progress
      if (window.confirm('Are you sure you want to close? Your progress will be lost.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col justify-center items-center h-64 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-medium text-gray-700">
          Preparing your assessment
        </span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
              animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
          ))}
        </span>
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">Something went wrong</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={initializeChat}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );

  // Render question
  const renderQuestion = (question: any) => {
    if (!question) return null;

    const isRedFlag = question.red_flag;

    return (
      <motion.div
        key={question.id || question.text}
        variants={questionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`bg-white rounded-xl p-6 ${isRedFlag ? 'border-2 border-red-200 bg-red-50' : ''}`}
      >
        {isRedFlag && (
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-red-700 font-medium text-sm">Important Safety Question</span>
          </div>
        )}

        <h3 className={`text-lg font-medium mb-6 leading-relaxed ${isRedFlag ? 'text-red-900' : 'text-gray-900'}`}>
          {question.text}
        </h3>

        {/* Yes/No Buttons */}
        {question.type === 'yes_no' && (
          <div className="flex gap-4">
            <Button
              onClick={() => handleAnswer(true)}
              className="flex-1 min-h-[48px]"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleAnswer(false)}
              variant="outline"
              className="flex-1 min-h-[48px]"
            >
              No
            </Button>
          </div>
        )}

        {/* Multiple Choice */}
        {question.type === 'multiple_choice' && (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {question.options?.map((option: any, index: number) => (
              <motion.button
                key={index}
                variants={optionVariants}
                onClick={() => handleAnswer(option.value)}
                className="block w-full text-left p-4 font-medium text-gray-800 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-blue-600 mr-3">&#8226;</span>
                {option.text}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Body Selection */}
        {question.type === 'body_selection' && (
          <motion.div
            className="grid grid-cols-2 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {question.options?.map((option: any, index: number) => (
              <motion.button
                key={index}
                variants={optionVariants}
                onClick={() => handleAnswer(option.value)}
                className="p-4 text-center font-medium text-gray-800 min-h-[48px] bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {option.text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Render completion screen
  const renderCompletion = () => {
    if (needsReferral) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-900">Medical Attention Recommended</h3>
          </div>
          <p className="text-red-800 mb-6">
            Based on your responses, we recommend seeking medical attention.
            The clinical assessment will still proceed with caution.
          </p>
          <Button onClick={handleComplete} className="w-full">
            Continue to Clinical Assessment
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Symptom Assessment Complete
        </h3>
        <p className="text-gray-600 mb-6">
          {responses.length} questions answered. Your responses have been recorded
          and will be used to guide the clinical assessment.
        </p>

        {diagnosticResults?.topConditions && diagnosticResults.topConditions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-medium text-blue-900 mb-2">Preliminary Analysis</h4>
            <p className="text-sm text-blue-700">
              Based on your symptoms, the assessment suggests: {' '}
              <span className="font-medium">
                {diagnosticResults.topConditions[0]?.name}
              </span>
              {diagnosticResults.confidence && (
                <span className="text-blue-500">
                  {' '}({Math.round(diagnosticResults.confidence * 100)}% confidence)
                </span>
              )}
            </p>
          </div>
        )}

        <Button onClick={handleComplete} className="w-full" size="lg">
          Continue to Clinical Assessment
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">
              Symptom Assessment
              {patientName && <span className="text-gray-500 font-normal ml-2">for {patientName}</span>}
            </DialogTitle>
            <DialogDescription>
              {filledBy === 'PATIENT'
                ? 'Please answer a few questions about your symptoms'
                : 'Record patient symptoms before clinical examination'
              }
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Progress Bar */}
        {!isLoading && !isComplete && progress.questionsAsked > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Question {progress.questionsAsked}</span>
              <span className="text-sm text-gray-500">
                {progress.confidence > 0.5 ? 'Almost there' : 'Gathering information'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((progress.questionsAsked / 12) * 100, 100)}%` }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="py-4">
          {isLoading && renderLoading()}
          {error && !isLoading && renderError()}
          {!isLoading && !error && !isComplete && (
            <AnimatePresence mode="wait">
              {renderQuestion(currentQuestion)}
            </AnimatePresence>
          )}
          {isComplete && renderCompletion()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
