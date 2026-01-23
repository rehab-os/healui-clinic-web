'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import {
  AlertTriangle,
  Check,
  ArrowRight,
  RotateCcw,
  Stethoscope,
  Target,
  Calendar,
  Sparkles,
  Activity,
  CircleDot,
  User,
  AlertCircle,
  Zap,
  MessageSquare,
  ClipboardList,
  ChevronRight,
  Mic,
  Keyboard,
  Brain,
  Crosshair,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import {
  SmartScreeningEngine,
  ScreeningQuestion,
  DiagnosisResult,
} from '@/services/smartScreeningEngine';
import BodyMapSelector from './BodyMapSelector';
import VoiceInputButton from './VoiceInputButton';
import FloatingSummaryPanel from './FloatingSummaryPanel';
import screeningAPI from '@/services/screeningAPI';
import useAIQuestionFlow from '@/hooks/useAIQuestionFlow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AnimatedProgress,
  AnimatedAlert,
  AnimatedResults,
  AnimatedResultCard,
  ProcessingIndicator,
  AnimatedCheckmark,
  questionVariants,
  optionsContainerVariants,
  optionVariants,
  resultCardVariants,
} from '@/components/ui/screening-animations';

// ==================== Types ====================

interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'system';
  content: string;
  timestamp: Date;
  questionId?: string;
}

interface SmartScreeningChatbotProps {
  patientId: string;
  patientName?: string;
  onComplete?: (result: any) => void;
  onClose?: () => void;
}

// ==================== Clubbed Questions Configuration ====================
// Questions that should be shown together on the same screen
const QUESTION_CLUBS: Record<string, { questions: string[]; label: string }> = {
  'timeline': {
    questions: ['symptom_onset', 'onset_nature', 'symptom_progression'],
    label: 'Timeline'
  },
  'pain_characteristics': {
    questions: ['vas_score', 'pain_nature'],
    label: 'Pain Characteristics'
  },
  'pain_factors': {
    questions: ['aggravating_factors', 'relieving_factors'],
    label: 'Pain Factors'
  },
  'functional': {
    questions: ['functional_impact', 'work_impact'],
    label: 'Functional Impact'
  },
  'history': {
    questions: ['previous_episodes', 'previous_episode_comparison'],
    label: 'History'
  }
};

// Get club for a question (returns club info if this question starts a club)
const getQuestionClub = (questionId: string): { questions: string[]; label: string } | null => {
  for (const club of Object.values(QUESTION_CLUBS)) {
    if (club.questions[0] === questionId) {
      return club;
    }
  }
  return null;
};

// Check if question is part of a club (but not the first)
const isPartOfClub = (questionId: string): boolean => {
  for (const club of Object.values(QUESTION_CLUBS)) {
    if (club.questions.includes(questionId) && club.questions[0] !== questionId) {
      return true;
    }
  }
  return false;
};

// Check if a question is a referral screening question (dynamically generated)
const REFERRAL_QUESTION_PREFIXES = [
  'shoulder_', 'elbow_', 'forearm_', 'wrist_', 'hand_',
  'lb_', 'hip_', 'thigh_', 'knee_', 'calf_', 'ankle_', 'foot_',
  'neck_', 'headache_', 'chest_', 'thoracic_', 'abdomen_'
];

const isReferralQuestion = (questionId: string): boolean => {
  return REFERRAL_QUESTION_PREFIXES.some(prefix => questionId.startsWith(prefix));
};

// ==================== Date Picker Input ====================

const DatePickerInput = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dateValue = value ? new Date(value) : undefined;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getChronicity = (date: Date) => {
    const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 0) return { label: 'Today', days: 0, color: 'bg-teal-100 text-teal-700' };
    if (daysSince <= 7) return { label: 'This week', days: daysSince, color: 'bg-teal-100 text-teal-700' };
    if (daysSince <= 42) return { label: 'Acute', days: daysSince, color: 'bg-green-100 text-green-700' };
    if (daysSince <= 84) return { label: 'Subacute', days: daysSince, color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Chronic', days: daysSince, color: 'bg-orange-100 text-orange-700' };
  };

  const chronicity = dateValue ? getChronicity(dateValue) : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Input Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-md text-left transition-colors ${
          isOpen ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {dateValue ? (
            <span className="text-sm text-slate-800">
              {dateValue.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Select a date...</span>
          )}
        </div>
        {chronicity && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${chronicity.color}`}>
            {chronicity.label}
          </span>
        )}
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <CalendarPicker
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) {
                onChange(date.toISOString().split('T')[0]);
                setIsOpen(false);
              }
            }}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-2 pb-2 relative items-center",
              caption_label: "text-base font-semibold text-slate-800",
              nav: "space-x-1 flex items-center",
              nav_button: "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100 rounded-md inline-flex items-center justify-center",
              nav_button_previous: "absolute left-2",
              nav_button_next: "absolute right-2",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-slate-500 rounded-md w-11 font-medium text-sm",
              row: "flex w-full mt-1",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              day: "h-11 w-11 p-0 font-normal text-sm rounded-md hover:bg-slate-100 focus:bg-slate-100 aria-selected:opacity-100 inline-flex items-center justify-center",
              day_selected: "bg-teal-600 text-white hover:bg-teal-600 hover:text-white focus:bg-teal-600 focus:text-white",
              day_today: "bg-slate-100 text-slate-900 font-semibold",
              day_outside: "text-slate-300 opacity-50",
              day_disabled: "text-slate-300 opacity-50 cursor-not-allowed",
              day_hidden: "invisible",
            }}
            disabled={(date) => date > new Date()}
            defaultMonth={dateValue || new Date()}
            className="p-4"
          />
        </div>
      )}
    </div>
  );
};

// ==================== Typing Indicator ====================

const TypingIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-2">
    <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-full">
      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

// ==================== Side AI Processing Indicator ====================

const SideProcessingIndicator = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200"
      aria-live="polite"
      aria-label="AI is analyzing"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 px-3 py-4 flex flex-col items-center gap-3">
        {/* Animated dots */}
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-teal-500"
              style={{
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
          Analyzing
        </span>
      </div>
    </div>
  );
};

// ==================== Stage Progress Sidebar ====================

const StageProgressSidebar = ({
  stages,
  currentStageIndex,
  answeredCount,
  totalQuestions
}: {
  stages: { id: string; label: string; icon: React.ReactNode }[];
  currentStageIndex: number;
  answeredCount: number;
  totalQuestions: number;
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Progress</p>
      </div>
      <div className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div
              key={stage.id}
              className={`
                flex items-center gap-2 px-3 py-2 mx-1 rounded-md transition-all duration-150
                ${isCurrent ? 'bg-teal-50' : ''}
              `}
            >
              {/* Status indicator */}
              <div
                className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all duration-150
                  ${isCompleted ? 'bg-teal-600 text-white' : isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'}
                `}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span className={`
                text-xs truncate transition-colors duration-150
                ${isCurrent ? 'text-teal-700 font-medium' : isCompleted ? 'text-slate-600' : 'text-slate-400'}
              `}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom stats */}
      <div className="px-3 py-3 border-t border-slate-100 mt-auto">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Answered</span>
          <span className="font-medium text-slate-600">{answeredCount}/{totalQuestions}</span>
        </div>
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

const SmartScreeningChatbot: React.FC<SmartScreeningChatbotProps> = ({
  patientId,
  patientName,
  onComplete,
  onClose,
}) => {
  const [engine] = useState(() => new SmartScreeningEngine(patientId));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<ScreeningQuestion | null>(null);
  const [currentResponse, setCurrentResponse] = useState<any>('');
  // Clubbed questions state
  const [clubbedQuestions, setClubbedQuestions] = useState<ScreeningQuestion[]>([]);
  const [clubbedResponses, setClubbedResponses] = useState<Record<string, any>>({});
  const [currentClubLabel, setCurrentClubLabel] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [useAIFlow, setUseAIFlow] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<any[]>([]);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [detectedRedFlags, setDetectedRedFlags] = useState<string[]>([]);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isSourceTrackingPhase, setIsSourceTrackingPhase] = useState(false);
  const [identifiedSources, setIdentifiedSources] = useState<Array<{sourceRegion: string; implication: string}>>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<number>(Date.now());

  // AI Question Flow Hook (used when useAIFlow is true)
  const aiFlow = useAIQuestionFlow({
    selectedRegions,
    enabled: useAIFlow,
    onQuestionRecommended: (q) => {
      console.log('AI recommended question:', q);
    },
  });

  // Voice transcription handler
  const handleVoiceTranscription = useCallback(async (audioBlob: Blob): Promise<string> => {
    const transcription = await screeningAPI.transcribeAudio(audioBlob);
    return transcription;
  }, []);

  // Handle voice input completion
  const handleVoiceInputComplete = useCallback((transcription: string) => {
    if (!currentQuestion) return;

    // For text questions, set directly
    if (currentQuestion.type === 'text') {
      setCurrentResponse(transcription);
      return;
    }

    // For single_choice, try to match
    if (currentQuestion.type === 'single_choice' && currentQuestion.options) {
      const parsed = screeningAPI.parseNaturalLanguageResponse(transcription, {
        questionId: currentQuestion.id,
        questionType: 'single_choice',
        options: currentQuestion.options.map(o => o.label)
      });
      if (parsed.value && parsed.confidence > 0.5) {
        const matched = currentQuestion.options.find(o =>
          o.label.toLowerCase() === parsed.value.toLowerCase()
        );
        if (matched) {
          setCurrentResponse(matched.value);
          return;
        }
      }
    }

    // For multi_choice, try to match multiple
    if (currentQuestion.type === 'multi_choice' && currentQuestion.options) {
      const parsed = screeningAPI.parseNaturalLanguageResponse(transcription, {
        questionId: currentQuestion.id,
        questionType: 'multi_choice',
        options: currentQuestion.options.map(o => o.label)
      });
      if (parsed.value && Array.isArray(parsed.value) && parsed.confidence > 0.5) {
        const matchedValues = parsed.value.map((label: string) => {
          const opt = currentQuestion.options?.find(o =>
            o.label.toLowerCase() === label.toLowerCase()
          );
          return opt?.value;
        }).filter(Boolean);
        if (matchedValues.length > 0) {
          setCurrentResponse(matchedValues);
          return;
        }
      }
    }

    // For slider/scale
    if (currentQuestion.type === 'slider') {
      const parsed = screeningAPI.parseNaturalLanguageResponse(transcription, {
        questionId: currentQuestion.id,
        questionType: 'scale'
      });
      if (typeof parsed.value === 'number' && parsed.confidence > 0.5) {
        setCurrentResponse(parsed.value);
        return;
      }
    }

    // Fallback: set as text
    setCurrentResponse(transcription);
  }, [currentQuestion]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const addMessage = useCallback((type: ChatMessage['type'], content: string, questionId?: string) => {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      content,
      timestamp: new Date(),
      questionId,
    };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
    return msg;
  }, [scrollToBottom]);

  const addBotMessage = useCallback(async (content: string, questionId?: string) => {
    setIsTyping(true);
    // Reduced delay for expert users (was 400-700ms, now 80-120ms)
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40));
    setIsTyping(false);
    addMessage('bot', content, questionId);
  }, [addMessage]);

  // Load a question (handles clubbed questions)
  const loadQuestion = useCallback(async (question: ScreeningQuestion) => {
    // Check if this question starts a club
    const club = getQuestionClub(question.id);

    if (club) {
      // Load all questions in the club
      const clubQuestions: ScreeningQuestion[] = [question];
      for (let i = 1; i < club.questions.length; i++) {
        const q = engine.getQuestionById(club.questions[i]);
        if (q) {
          clubQuestions.push(q);
        }
      }

      setClubbedQuestions(clubQuestions);
      setCurrentClubLabel(club.label);
      setClubbedResponses({});
      setCurrentQuestion(null); // Use clubbedQuestions instead

      await addBotMessage(`Let's gather some ${club.label.toLowerCase()} information.`, question.id);
    } else if (isPartOfClub(question.id)) {
      // Skip questions that are part of a club (they were already shown)
      // Process an empty response to move to next question
      const nextQuestionId = await engine.processResponse(question.id, null);
      if (nextQuestionId) {
        const nextQuestion = engine.getCurrentQuestion();
        if (nextQuestion) {
          await loadQuestion(nextQuestion);
        }
      }
    } else if (isReferralQuestion(question.id)) {
      // Dynamic club: Load all referral questions together
      // Get the engine's session to check responses and queue
      const session = engine.getSession();
      const responses = session.responses || {};
      const queue = session.questionQueue || [];

      // Skip if this question was already answered
      if (responses[question.id] !== undefined) {
        const nextQuestionId = await engine.processResponse(question.id, responses[question.id]);
        if (nextQuestionId) {
          const nextQuestion = engine.getCurrentQuestion();
          if (nextQuestion) {
            await loadQuestion(nextQuestion);
          }
        }
        return;
      }

      // Find all unanswered referral questions in the queue
      const referralQuestions: ScreeningQuestion[] = [question];

      for (const qId of queue) {
        if (isReferralQuestion(qId) && responses[qId] === undefined) {
          const q = engine.getQuestionById(qId);
          if (q) {
            referralQuestions.push(q);
          }
        }
      }

      // Enter source tracking phase
      setIsSourceTrackingPhase(true);

      // If we have multiple referral questions, club them
      if (referralQuestions.length > 1) {
        setClubbedQuestions(referralQuestions);
        setCurrentClubLabel('AI Source Detection');
        setClubbedResponses({});
        setCurrentQuestion(null);

        await addBotMessage("🔬 Initiating AI Source Detection — I'll analyze referral patterns across cardiac, visceral, neural, and vascular pathways to find where your pain is truly originating.", question.id);
      } else {
        // Single referral question - show normally
        setClubbedQuestions([]);
        setCurrentClubLabel('');
        setClubbedResponses({});
        setCurrentQuestion(question);
        await addBotMessage(question.question, question.id);
      }
    } else {
      // Single question (not clubbed)
      setClubbedQuestions([]);
      setCurrentClubLabel('');
      setClubbedResponses({});
      setCurrentQuestion(question);
      await addBotMessage(question.question, question.id);
    }
  }, [engine, addBotMessage]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const greeting = patientName
        ? `Hello! Let's assess ${patientName}'s condition.`
        : "Hello! Let's begin the clinical assessment.";

      await addBotMessage(greeting);

      setTimeout(async () => {
        const question = engine.getCurrentQuestion();
        if (question) {
          await loadQuestion(question);
        }
      }, 300);
    };
    init();
  }, [engine, patientName, addBotMessage, loadQuestion]);

  // Reset response when question changes
  useEffect(() => {
    if (currentQuestion) {
      if (['multi_choice', 'checklist', 'body_map', 'observational', 'red_flags'].includes(currentQuestion.type)) {
        setCurrentResponse([]);
      } else if (['tenderness_map', 'measurement', 'rom_measurement', 'mmt_testing', 'scale_grid'].includes(currentQuestion.type)) {
        setCurrentResponse({});
      } else if (currentQuestion.type === 'slider') {
        setCurrentResponse(currentQuestion.min || 0);
      } else {
        setCurrentResponse('');
      }
    }
  }, [currentQuestion]);

  const formatUserResponse = (value: any, question: ScreeningQuestion): string => {
    // Handle body_map structured response
    if (question.type === 'body_map' && value?.detailed) {
      const detailed = value.detailed;
      if (Array.isArray(detailed)) {
        return detailed.map((selection: any) => {
          const region = selection.mainRegion?.replace(/_/g, ' ');
          const side = selection.laterality === 'center' ? '' :
            selection.laterality === 'both' ? ' (both sides)' :
            ` (${selection.laterality})`;
          const subRegions = selection.subRegions?.length > 0
            ? `: ${selection.subRegions.map((s: string) => s.replace(/_/g, ' ')).join(', ')}`
            : '';
          return `${region}${side}${subRegions}`;
        }).join('; ');
      }
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return "None selected";
      const labels = value.map(v => {
        const opt = question.options?.find(o => o.value === v);
        return opt?.label || v;
      });
      return labels.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      // Skip body_map regions object (handled above)
      if (value.regions && value.detailed) {
        return "Body regions selected";
      }
      const entries = Object.entries(value).filter(([_, v]) => v);
      return entries.length > 0 ? entries.map(([k, v]) => `${k}: ${v}`).join(', ') : "Not assessed";
    }
    if (question.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (question.type === 'single_choice' || question.type === 'yes_no') {
      const opt = question.options?.find(o => o.value === value);
      return opt?.label || (value === 'yes' ? 'Yes' : value === 'no' ? 'No' : value);
    }
    if (question.type === 'slider') {
      return `${value}/10`;
    }
    return String(value);
  };

  // Handle submit for clubbed questions
  const handleClubbedSubmit = async () => {
    if (clubbedQuestions.length === 0 || !canSubmitClubbed()) return;

    // Filter questions that should be processed (skip conditional questions that don't apply)
    const questionsToProcess = clubbedQuestions.filter(q => {
      // Skip previous_episode_comparison if previous_episodes is not "yes"
      if (q.id === 'previous_episode_comparison' && clubbedResponses['previous_episodes'] !== 'yes') {
        return false;
      }
      return true;
    });

    // Format display message for answered responses only
    const displayParts = questionsToProcess.map(q => {
      const response = clubbedResponses[q.id];
      const formatted = formatUserResponse(response, q);
      return `${q.question.split('?')[0].split('.')[0]}: ${formatted}`;
    });
    addMessage('user', displayParts.join('\n'));

    setIsProcessing(true);

    // Track collected data for summary panel
    const newCollectedData: Record<string, any> = {};
    for (const q of questionsToProcess) {
      const response = clubbedResponses[q.id];
      newCollectedData[q.id] = response;

      // Detect red flags from text responses
      if (typeof response === 'string') {
        const flags = screeningAPI.detectRedFlags(response);
        if (flags.length > 0) {
          setDetectedRedFlags(prev => [...new Set([...prev, ...flags])]);
        }
      }

      // Record response in AI flow context
      if (useAIFlow) {
        aiFlow.recordResponse(q.id, response);
      }
    }
    setCollectedData(prev => ({ ...prev, ...newCollectedData }));

    // Process all responses with engine
    let nextQuestionId: string | null = null;
    for (const q of questionsToProcess) {
      nextQuestionId = await engine.processResponse(q.id, clubbedResponses[q.id]);
    }

    // Move to next question
    await moveToNextQuestion(nextQuestionId);

    setIsProcessing(false);
    scrollToBottom();
  };

  // Handle submit for single question
  const handleSubmit = async () => {
    // If we have clubbed questions, use the clubbed submit
    if (clubbedQuestions.length > 0) {
      return handleClubbedSubmit();
    }

    if (!currentQuestion || !canSubmit()) return;

    const displayValue = formatUserResponse(currentResponse, currentQuestion);
    addMessage('user', displayValue);

    setIsProcessing(true);

    // Track collected data for summary panel
    setCollectedData(prev => ({
      ...prev,
      [currentQuestion.id]: currentResponse
    }));

    // Track selected regions from body_map
    if (currentQuestion.type === 'body_map' && currentResponse?.detailed) {
      setSelectedRegions(currentResponse.detailed);
    }

    // Detect red flags from text responses
    if (typeof currentResponse === 'string') {
      const flags = screeningAPI.detectRedFlags(currentResponse);
      if (flags.length > 0) {
        setDetectedRedFlags(prev => [...new Set([...prev, ...flags])]);
      }
    }

    // Record response in AI flow context
    if (useAIFlow) {
      aiFlow.recordResponse(currentQuestion.id, currentResponse);
    }

    // Process response with engine
    const nextQuestionId = await engine.processResponse(currentQuestion.id, currentResponse);

    // Move to next question
    await moveToNextQuestion(nextQuestionId);

    setIsProcessing(false);
    scrollToBottom();
  };

  // Move to next question (shared logic for single and clubbed)
  const moveToNextQuestion = async (nextQuestionId: string | null) => {
    // Check if we just completed source tracking phase
    if (isSourceTrackingPhase && nextQuestionId && !isReferralQuestion(nextQuestionId)) {
      setIsSourceTrackingPhase(false);
      // Get identified referral sources from engine
      const sources = engine.getIdentifiedReferralSources();
      if (sources && sources.length > 0) {
        setIdentifiedSources(sources.map(s => ({ sourceRegion: s.sourceRegion, implication: s.implication })));
      }
    }

    if (useAIFlow && nextQuestionId) {
      // In AI mode, get AI recommendation for next question
      try {
        const aiRecommendation = await aiFlow.getNextQuestion();
        if (aiRecommendation && aiRecommendation.questionId !== 'screening_complete') {
          const nextQuestion = engine.getQuestionById(aiRecommendation.questionId);
          if (nextQuestion) {
            engine.setCurrentStep(aiRecommendation.questionId);
            await loadQuestion(nextQuestion);
          } else {
            const fallbackQuestion = engine.getCurrentQuestion();
            if (fallbackQuestion) {
              await loadQuestion(fallbackQuestion);
            } else {
              setCurrentQuestion(null);
              setClubbedQuestions([]);
              await generateDiagnosis();
            }
          }
        } else {
          setCurrentQuestion(null);
          setClubbedQuestions([]);
          await generateDiagnosis();
        }
      } catch (error) {
        console.error('AI flow error, falling back to manual:', error);
        const nextQuestion = engine.getCurrentQuestion();
        if (nextQuestion) {
          await loadQuestion(nextQuestion);
        }
      }
    } else if (nextQuestionId) {
      // Manual mode - use engine's next question
      const nextQuestion = engine.getCurrentQuestion();
      if (nextQuestion) {
        await loadQuestion(nextQuestion);
      }
    } else {
      setCurrentQuestion(null);
      setClubbedQuestions([]);
      await generateDiagnosis();
    }
  };

  const canSubmit = (): boolean => {
    // If clubbed questions, use clubbed validation
    if (clubbedQuestions.length > 0) {
      return canSubmitClubbed();
    }

    if (currentResponse === null || currentResponse === undefined) return false;

    if (['multi_choice', 'checklist', 'body_map', 'observational'].includes(currentQuestion?.type || '')) {
      return Array.isArray(currentResponse) && currentResponse.length > 0;
    }

    if (currentQuestion?.type === 'red_flags') {
      return true;
    }

    if (['tenderness_map', 'measurement', 'rom_measurement', 'mmt_testing', 'scale_grid'].includes(currentQuestion?.type || '')) {
      return currentResponse && typeof currentResponse === 'object' && Object.keys(currentResponse).length > 0;
    }

    if (typeof currentResponse === 'string') {
      return currentResponse.trim().length > 0;
    }

    if (currentQuestion?.type === 'slider') {
      return typeof currentResponse === 'number';
    }

    return true;
  };

  // Check if all clubbed questions have valid responses
  const canSubmitClubbed = (): boolean => {
    if (clubbedQuestions.length === 0) return false;

    for (const q of clubbedQuestions) {
      const response = clubbedResponses[q.id];

      // Special case: previous_episode_comparison is only required if previous_episodes is "yes"
      if (q.id === 'previous_episode_comparison') {
        const previousEpisodesResponse = clubbedResponses['previous_episodes'];
        if (previousEpisodesResponse !== 'yes') {
          continue; // Skip validation - not required
        }
      }

      if (response === null || response === undefined) return false;

      if (['multi_choice', 'checklist'].includes(q.type)) {
        if (!Array.isArray(response) || response.length === 0) return false;
      } else if (q.type === 'slider') {
        if (typeof response !== 'number') return false;
      } else if (q.type === 'yes_no') {
        if (response !== 'yes' && response !== 'no') return false;
      } else if (typeof response === 'string') {
        if (response.trim().length === 0) return false;
      }
    }

    return true;
  };

  const generateDiagnosis = async () => {
    await addBotMessage("Analyzing your responses...");
    setIsProcessing(true);
    setIsTyping(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = await engine.getDiagnosis();
      setDiagnosisResult(result);
      setIsComplete(true);
      setIsTyping(false);

      if (result.success && result.diagnosis) {
        await addBotMessage("Analysis complete. Review the findings on the right.");
      } else {
        await addBotMessage("Assessment complete. Review the clinical summary.");
      }
    } catch (error) {
      console.error('Diagnosis error:', error);
      setIsTyping(false);
      setDiagnosisResult({
        success: false,
        error: 'Failed to generate diagnosis',
        clinicalSummary: engine.generateClinicalSummary(),
      });
      setIsComplete(true);
    }

    setIsProcessing(false);
    scrollToBottom();
  };

  const handleConditionSelect = async (condition: any) => {
    setIsProcessing(true);
    addMessage('user', `Selected: ${condition.condition_name}`);

    const isTestMode = patientId.startsWith('test');

    if (!isTestMode) {
      try {
        const { default: ApiManager } = await import('@/services/api');
        const conditionPayload = engine.createConditionPayload(condition);
        await ApiManager.createPatientCondition(patientId, conditionPayload);
      } catch (error) {
        console.error('Error saving condition:', error);
        addMessage('system', 'Error saving diagnosis. Please try again.');
        setIsProcessing(false);
        return;
      }
    }

    await addBotMessage(`Confirmed: "${condition.condition_name}" (${Math.round(condition.confidence_score * 100)}% confidence)`);

    if (onComplete) {
      onComplete({
        diagnosis: condition,
        session: engine.getSession(),
        clinicalSummary: engine.generateClinicalSummary(),
      });
    }

    setIsProcessing(false);
  };

  const handleReset = () => {
    engine.reset();
    setMessages([]);
    setCurrentQuestion(null);
    setCurrentResponse('');
    setIsComplete(false);
    setDiagnosisResult(null);

    setTimeout(async () => {
      await addBotMessage("Starting fresh assessment.");
      setTimeout(async () => {
        const question = engine.getCurrentQuestion();
        if (question) {
          setCurrentQuestion(question);
          await addBotMessage(question.question, question.id);
        }
      }, 400);
    }, 200);
  };

  // ==================== Render Input Components ====================

  // Voice mode toggle component
  const VoiceModeToggle = () => {
    const showVoice = ['text', 'single_choice', 'multi_choice', 'slider'].includes(currentQuestion?.type || '');
    if (!showVoice) return null;

    return (
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <button
          onClick={() => setIsVoiceMode(!isVoiceMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isVoiceMode
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isVoiceMode ? <Mic className="w-3.5 h-3.5" /> : <Keyboard className="w-3.5 h-3.5" />}
          {isVoiceMode ? 'Voice Mode' : 'Type Mode'}
        </button>
        {isVoiceMode && (
          <span className="text-xs text-slate-500">Tap microphone to speak</span>
        )}
      </div>
    );
  };

  // Render a single input for a clubbed question
  const renderClubbedInput = (question: ScreeningQuestion) => {
    const response = clubbedResponses[question.id];

    const updateResponse = (value: any) => {
      setClubbedResponses(prev => ({ ...prev, [question.id]: value }));
    };

    switch (question.type) {
      case 'date':
        return <DatePickerInput value={response} onChange={updateResponse} />;

      case 'yes_no':
        return (
          <div className="flex gap-3">
            {[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateResponse(value)}
                className={`flex-1 flex items-center justify-center gap-2 min-h-[56px] rounded-md border-2 transition-all ${
                  response === value
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                {value === 'yes' ? (
                  <Check className={`h-5 w-5 ${response === value ? 'text-white' : 'text-slate-400'}`} />
                ) : (
                  <CircleDot className={`h-5 w-5 ${response === value ? 'text-white' : 'text-slate-400'}`} />
                )}
                <span className="font-medium text-base">{label}</span>
              </button>
            ))}
          </div>
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => updateResponse(option.value)}
                className={`w-full flex items-center gap-3 min-h-[52px] px-4 rounded-md border-2 transition-all text-left ${
                  response === option.value
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  response === option.value ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                }`}>
                  {response === option.value && <Check className="h-4 w-4 text-white" />}
                </div>
                <span className={`text-[15px] ${response === option.value ? 'text-teal-800 font-medium' : 'text-slate-600'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        );

      case 'multi_choice':
      case 'checklist':
        const selectedValues = Array.isArray(response) ? response : [];
        return (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {question.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    const newValues = isSelected
                      ? selectedValues.filter(v => v !== option.value)
                      : [...selectedValues, option.value];
                    updateResponse(newValues);
                  }}
                  className={`w-full flex items-center gap-3 min-h-[52px] px-4 rounded-md border-2 transition-all text-left ${
                    isSelected ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <span className={`text-[15px] ${isSelected ? 'text-teal-800 font-medium' : 'text-slate-600'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'slider':
        const sliderValue = typeof response === 'number' ? response : (question.min || 0);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-slate-800 tabular-nums">{sliderValue}</span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                sliderValue === 0 ? 'bg-green-100 text-green-700' :
                sliderValue <= 3 ? 'bg-emerald-100 text-emerald-700' :
                sliderValue <= 6 ? 'bg-yellow-100 text-yellow-700' :
                sliderValue <= 8 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {sliderValue === 0 ? 'None' : sliderValue <= 3 ? 'Mild' : sliderValue <= 6 ? 'Moderate' : sliderValue <= 8 ? 'Severe' : 'Worst'}
              </span>
            </div>
            <input
              type="range"
              min={question.min || 0}
              max={question.max || 10}
              value={sliderValue}
              onChange={(e) => updateResponse(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer touch-pan-y
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-8
                [&::-webkit-slider-thumb]:h-8
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-teal-600
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:border-4
                [&::-webkit-slider-thumb]:border-white"
            />
            <div className="flex justify-between text-xs text-slate-400 px-1">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        );

      case 'text':
      default:
        return (
          <Textarea
            value={response || ''}
            onChange={(e) => updateResponse(e.target.value)}
            placeholder={question.placeholder || "Enter your response..."}
            className="min-h-[80px] bg-white border-slate-200 text-slate-800 rounded-lg resize-none text-sm"
          />
        );
    }
  };

  // Render clubbed questions (multiple questions on one screen)
  const renderClubbedQuestions = () => {
    if (clubbedQuestions.length === 0 || isProcessing || isTyping) return null;

    return (
      <div className="space-y-6">
        {clubbedQuestions.map((question, index) => {
          // Check if this question should be disabled (conditional questions)
          const isConditionallyDisabled =
            question.id === 'previous_episode_comparison' &&
            clubbedResponses['previous_episodes'] !== 'yes';

          return (
            <div
              key={question.id}
              className={`space-y-3 ${isConditionallyDisabled ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="flex items-start gap-2">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center ${
                  isConditionallyDisabled ? 'bg-slate-100 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {index + 1}
                </span>
                <p className={`font-medium text-sm leading-relaxed ${
                  isConditionallyDisabled ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  {question.question}
                  {isConditionallyDisabled && (
                    <span className="text-xs text-slate-400 ml-2">(only if yes above)</span>
                  )}
                </p>
              </div>
              <div className="ml-8">
                {renderClubbedInput(question)}
              </div>
            </div>
          );
        })}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };

  const renderInput = () => {
    // If we have clubbed questions, render those instead
    if (clubbedQuestions.length > 0) {
      return renderClubbedQuestions();
    }

    if (!currentQuestion || isProcessing || isTyping) return null;

    switch (currentQuestion.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <VoiceModeToggle />
            {isVoiceMode ? (
              <div className="flex flex-col items-center py-6">
                <VoiceInputButton
                  onTranscription={handleVoiceInputComplete}
                  onProcessingStart={() => setIsVoiceProcessing(true)}
                  onProcessingEnd={() => setIsVoiceProcessing(false)}
                  transcribeAudio={handleVoiceTranscription}
                  size="lg"
                  showTimer
                />
                {currentResponse && (
                  <div className="mt-4 w-full p-4 bg-teal-50 border border-teal-200 rounded-md">
                    <p className="text-sm text-teal-800 font-medium">Transcribed:</p>
                    <p className="text-base text-teal-700 mt-1">{currentResponse}</p>
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder={currentQuestion.placeholder || "Describe in detail..."}
                  className="min-h-[140px] bg-white border-slate-200 text-slate-800 rounded-md resize-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 text-base p-4"
                  autoFocus
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-3">
            <DatePickerInput
              value={currentResponse}
              onChange={(val) => setCurrentResponse(val)}
            />
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[44px] font-medium text-sm"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'yes_no':
        return (
          <motion.div
            className="grid grid-cols-2 gap-3"
            role="radiogroup"
            aria-label={currentQuestion?.question}
            variants={optionsContainerVariants}
            initial="initial"
            animate="animate"
          >
            {[
              { value: 'yes', label: 'Yes', icon: Check },
              { value: 'no', label: 'No', icon: CircleDot }
            ].map(({ value, label, icon: Icon }, index) => (
              <motion.button
                key={value}
                variants={optionVariants}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                role="radio"
                aria-checked={currentResponse === value}
                tabIndex={currentResponse === value || (!currentResponse && index === 0) ? 0 : -1}
                onClick={() => {
                  setCurrentResponse(value);
                  setTimeout(handleSubmit, 100);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setCurrentResponse(value === 'yes' ? 'no' : 'yes');
                  } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentResponse(value);
                    setTimeout(handleSubmit, 100);
                  }
                }}
                className={`flex items-center justify-center gap-2 min-h-[52px] rounded-md border transition-colors duration-100
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
                  currentResponse === value
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Icon className={`h-5 w-5 ${currentResponse === value ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-medium">{label}</span>
              </motion.button>
            ))}
          </motion.div>
        );

      case 'single_choice':
        return (
          <div className="space-y-3">
            <VoiceModeToggle />
            {isVoiceMode ? (
              <div className="flex flex-col items-center py-4">
                <VoiceInputButton
                  onTranscription={handleVoiceInputComplete}
                  onProcessingStart={() => setIsVoiceProcessing(true)}
                  onProcessingEnd={() => setIsVoiceProcessing(false)}
                  transcribeAudio={handleVoiceTranscription}
                  size="md"
                  showTimer
                />
                <p className="text-sm text-slate-500 mt-3 text-center">
                  Say the option you want to select
                </p>
                {currentResponse && (
                  <div className="mt-3 px-4 py-2 bg-teal-50 border border-teal-200 rounded-md">
                    <p className="text-sm text-teal-700">
                      Selected: {currentQuestion.options?.find(o => o.value === currentResponse)?.label || currentResponse}
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <motion.div
                  role="radiogroup"
                  aria-label={currentQuestion.question}
                  className="space-y-2"
                  variants={optionsContainerVariants}
                  initial="initial"
                  animate="animate"
                >
                  {currentQuestion.options?.map((option, index) => (
                    <motion.button
                      key={option.value}
                      variants={optionVariants}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      role="radio"
                      aria-checked={currentResponse === option.value}
                      tabIndex={currentResponse === option.value || (!currentResponse && index === 0) ? 0 : -1}
                      onClick={() => {
                        setCurrentResponse(option.value);
                        // Auto-submit after brief visual feedback
                        setTimeout(handleSubmit, 120);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          const nextIndex = (index + 1) % (currentQuestion.options?.length || 1);
                          setCurrentResponse(currentQuestion.options?.[nextIndex]?.value);
                        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                          e.preventDefault();
                          const prevIndex = (index - 1 + (currentQuestion.options?.length || 1)) % (currentQuestion.options?.length || 1);
                          setCurrentResponse(currentQuestion.options?.[prevIndex]?.value);
                        } else if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCurrentResponse(option.value);
                          setTimeout(handleSubmit, 120);
                        }
                      }}
                      className={`w-full flex items-center gap-3 min-h-[48px] px-4 rounded-md border transition-colors duration-100 text-left
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
                        currentResponse === option.value
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        currentResponse === option.value
                          ? 'border-teal-600 bg-teal-600'
                          : 'border-slate-300'
                      }`}>
                        <AnimatedCheckmark show={currentResponse === option.value} />
                      </div>
                      <span className={`text-sm ${currentResponse === option.value ? 'text-teal-800 font-medium' : 'text-slate-700'}`}>
                        {option.label}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </div>
        );

      case 'multi_choice':
      case 'checklist':
        return (
          <div className="space-y-2">
            <VoiceModeToggle />
            {isVoiceMode ? (
              <div className="flex flex-col items-center py-4">
                <VoiceInputButton
                  onTranscription={handleVoiceInputComplete}
                  onProcessingStart={() => setIsVoiceProcessing(true)}
                  onProcessingEnd={() => setIsVoiceProcessing(false)}
                  transcribeAudio={handleVoiceTranscription}
                  size="md"
                  showTimer
                />
                <p className="text-sm text-slate-500 mt-3 text-center">
                  Say the options you want (e.g., "walking and standing")
                </p>
                {Array.isArray(currentResponse) && currentResponse.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {currentResponse.map((val: string) => {
                      const opt = currentQuestion.options?.find(o => o.value === val);
                      return (
                        <span key={val} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded text-sm font-medium">
                          {opt?.label || val}
                        </span>
                      );
                    })}
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {currentQuestion.options?.map((option) => {
                    const isSelected = Array.isArray(currentResponse) && currentResponse.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setCurrentResponse((prev: string[]) => {
                            const arr = Array.isArray(prev) ? prev : [];
                            return arr.includes(option.value)
                              ? arr.filter(v => v !== option.value)
                              : [...arr, option.value];
                          });
                        }}
                        className={`w-full flex items-center gap-3 min-h-[44px] px-3 rounded-md border transition-all duration-100 text-left ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-teal-800 font-medium' : 'text-slate-700'}`}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[44px] mt-3 font-medium text-sm"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );

      case 'slider':
        const sliderValue = typeof currentResponse === 'number' ? currentResponse : 0;
        const getSeverityStyle = (value: number) => {
          if (value === 0) return 'bg-green-100 text-green-700';
          if (value <= 3) return 'bg-emerald-100 text-emerald-700';
          if (value <= 6) return 'bg-yellow-100 text-yellow-700';
          if (value <= 8) return 'bg-orange-100 text-orange-700';
          return 'bg-red-100 text-red-700';
        };
        return (
          <div className="space-y-6">
            <VoiceModeToggle />
            {isVoiceMode ? (
              <div className="flex flex-col items-center py-4">
                <VoiceInputButton
                  onTranscription={handleVoiceInputComplete}
                  onProcessingStart={() => setIsVoiceProcessing(true)}
                  onProcessingEnd={() => setIsVoiceProcessing(false)}
                  transcribeAudio={handleVoiceTranscription}
                  size="md"
                  showTimer
                />
                <p className="text-sm text-slate-500 mt-3 text-center">
                  Say a number from 0 to 10 (e.g., "seven" or "moderate")
                </p>
                {typeof currentResponse === 'number' && (
                  <div className="mt-4 text-center">
                    <span className="text-5xl font-bold text-slate-800 tabular-nums">{currentResponse}</span>
                    <span className="text-slate-400 text-xl ml-1">/ 10</span>
                    <div className={`text-sm font-medium mt-2 inline-block px-3 py-1 rounded-full ${getSeverityStyle(currentResponse)}`}>
                      {currentResponse === 0 ? 'No pain' : currentResponse <= 3 ? 'Mild pain' : currentResponse <= 6 ? 'Moderate pain' : currentResponse <= 8 ? 'Severe pain' : 'Worst pain'}
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 rounded-lg p-6 sm:p-8">
                  <div className="text-center mb-8">
                    <div className="text-7xl font-bold text-slate-800 tabular-nums">{sliderValue}</div>
                    <div className={`text-sm font-medium mt-3 inline-block px-4 py-1.5 rounded-full ${getSeverityStyle(sliderValue)}`}>
                      {sliderValue === 0 ? 'No pain' : sliderValue <= 3 ? 'Mild pain' : sliderValue <= 6 ? 'Moderate pain' : sliderValue <= 8 ? 'Severe pain' : 'Worst pain'}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={currentQuestion.min || 0}
                    max={currentQuestion.max || 10}
                    value={sliderValue}
                    onChange={(e) => setCurrentResponse(parseInt(e.target.value))}
                    aria-label="Pain scale from 0 to 10"
                    aria-valuemin={currentQuestion.min || 0}
                    aria-valuemax={currentQuestion.max || 10}
                    aria-valuenow={sliderValue}
                    aria-valuetext={sliderValue === 0 ? 'No pain' : sliderValue <= 3 ? 'Mild pain' : sliderValue <= 6 ? 'Moderate pain' : sliderValue <= 8 ? 'Severe pain' : 'Worst pain'}
                    className="w-full h-4 bg-slate-200 rounded-full appearance-none cursor-pointer touch-pan-y
                      focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-10
                      [&::-webkit-slider-thumb]:h-10
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-teal-600
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:border-4
                      [&::-webkit-slider-thumb]:border-white
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:active:scale-110
                      [&::-webkit-slider-thumb]:focus-visible:ring-4
                      [&::-webkit-slider-thumb]:focus-visible:ring-teal-200"
                  />
                  <div className="flex justify-between text-sm text-slate-400 mt-4">
                    <span>0 - None</span>
                    <span>5 - Moderate</span>
                    <span>10 - Worst</span>
                  </div>
                </div>
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );

      case 'body_map':
        // Convert BodyMapSelector format to flat array for engine
        const handleBodyMapComplete = () => {
          if (Array.isArray(currentResponse) && currentResponse.length > 0) {
            // Convert structured selection to flat region IDs for the engine
            const flatRegions = currentResponse.flatMap((selection: any) => {
              const mainRegion = selection.mainRegion;
              const laterality = selection.laterality;
              const subRegions = selection.subRegions || [];

              // Create region identifiers
              if (laterality === 'both') {
                return [
                  ...subRegions.map((sub: string) => `${mainRegion}_left_${sub}`),
                  ...subRegions.map((sub: string) => `${mainRegion}_right_${sub}`),
                ];
              } else if (laterality === 'center') {
                return subRegions.map((sub: string) => `${mainRegion}_${sub}`);
              } else {
                return subRegions.map((sub: string) => `${mainRegion}_${laterality}_${sub}`);
              }
            });

            // Also store the structured data for clinical summary
            const structuredData = {
              regions: flatRegions,
              detailed: currentResponse,
            };

            // Submit with the structured response
            setCurrentResponse(structuredData);
            setTimeout(() => handleSubmit(), 100);
          }
        };

        return (
          <div className="h-[500px]">
            <BodyMapSelector
              selectedRegions={Array.isArray(currentResponse) ? currentResponse : []}
              onSelectionChange={(regions) => setCurrentResponse(regions)}
              onComplete={handleBodyMapComplete}
              maxSelections={5}
            />
          </div>
        );

      case 'red_flags':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-md border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <span className="text-amber-700 text-sm font-medium">Select any that apply, or continue if none</span>
            </div>
            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {currentQuestion.options?.map((option) => {
                const isSelected = Array.isArray(currentResponse) && currentResponse.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setCurrentResponse((prev: string[]) => {
                        const arr = Array.isArray(prev) ? prev : [];
                        return arr.includes(option.value)
                          ? arr.filter(v => v !== option.value)
                          : [...arr, option.value];
                      });
                    }}
                    className={`w-full flex items-center gap-4 min-h-[56px] px-4 rounded-md border-2 transition-all duration-150 text-left ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className={`text-base ${isSelected ? 'text-amber-800 font-medium' : 'text-slate-600'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
            >
              {Array.isArray(currentResponse) && currentResponse.length === 0
                ? "None Apply - Continue"
                : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'tenderness_map':
        return (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 px-1">0 = None, 1 = Mild, 2 = Moderate, 3 = Severe</div>
            {['Anterior', 'Posterior', 'Medial', 'Lateral', 'Deep'].map((location) => (
              <div key={location} className="flex items-center justify-between p-4 bg-slate-50 rounded-md">
                <span className="font-medium text-slate-700">{location}</span>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setCurrentResponse((prev: any) => ({ ...prev, [location]: grade.toString() }))}
                      className={`min-w-[48px] min-h-[48px] rounded-md font-semibold transition-all ${
                        currentResponse?.[location] === grade.toString()
                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] mt-2 font-medium"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'measurement':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-slate-600">Location</Label>
                <Input
                  placeholder="e.g. 10cm above patella"
                  value={currentResponse?.location || ''}
                  onChange={(e) => setCurrentResponse((prev: any) => ({ ...prev, location: e.target.value }))}
                  className="mt-1 rounded-lg border-slate-200"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">Value (cm)</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  step="0.1"
                  value={currentResponse?.measurement || ''}
                  onChange={(e) => setCurrentResponse((prev: any) => ({ ...prev, measurement: e.target.value }))}
                  className="mt-1 rounded-lg border-slate-200"
                />
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg h-11"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'rom_measurement':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {['Flexion', 'Extension', 'Abduction', 'Adduction', 'Int. Rotation', 'Ext. Rotation'].map((movement) => (
                <div key={movement}>
                  <Label className="text-xs font-medium text-slate-500">{movement} (°)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={currentResponse?.[movement.toLowerCase().replace('. ', '_').replace(' ', '_')] || ''}
                    onChange={(e) => setCurrentResponse((prev: any) => ({
                      ...prev,
                      [movement.toLowerCase().replace('. ', '_').replace(' ', '_')]: e.target.value
                    }))}
                    className="mt-1 rounded-lg border-slate-200"
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg h-11 mt-2"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'mmt_testing':
        return (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 px-1">Oxford Scale: 0-5 (0=No contraction, 5=Normal)</div>
            <div className="max-h-[350px] overflow-y-auto space-y-3">
              {currentQuestion.options?.map((muscle) => (
                <div key={muscle.value} className="p-4 bg-slate-50 rounded-md">
                  <span className="font-medium text-slate-700 text-sm block mb-3">{muscle.label}</span>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3, 4, 5].map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setCurrentResponse((prev: any) => ({ ...prev, [muscle.value]: grade.toString() }))}
                        className={`min-w-[44px] min-h-[44px] rounded-md text-sm font-semibold transition-all ${
                          currentResponse?.[muscle.value] === grade.toString()
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'scale_grid':
        return (
          <div className="space-y-4">
            <div className="max-h-[350px] overflow-y-auto space-y-4">
              {currentQuestion.options?.map((item) => (
                <div key={item.value} className="p-4 bg-slate-50 rounded-md">
                  <Label className="font-medium text-slate-700 text-sm block mb-3">{item.label}</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <button
                        key={score}
                        onClick={() => setCurrentResponse((prev: any) => ({ ...prev, [item.value]: score.toString() }))}
                        className={`min-w-[40px] min-h-[44px] rounded-md text-sm font-semibold transition-all ${
                          currentResponse?.[item.value] === score.toString()
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] font-medium"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'observational':
        return (
          <div className="space-y-3">
            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {currentQuestion.options?.map((observation) => {
                const isSelected = Array.isArray(currentResponse) && currentResponse.includes(observation.value);
                return (
                  <button
                    key={observation.value}
                    onClick={() => {
                      setCurrentResponse((prev: string[]) => {
                        const arr = Array.isArray(prev) ? prev : [];
                        return arr.includes(observation.value)
                          ? arr.filter(v => v !== observation.value)
                          : [...arr, observation.value];
                      });
                    }}
                    className={`w-full flex items-center gap-4 min-h-[56px] px-4 rounded-md border-2 transition-all text-left ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className={`text-base ${isSelected ? 'text-teal-800 font-medium' : 'text-slate-600'}`}>{observation.label}</span>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-md min-h-[48px] mt-3 font-medium"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <Input
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder="Enter your response..."
              className="rounded-lg border-slate-200"
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg h-11"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  // ==================== Render Diagnosis Results ====================

  const renderDiagnosisResults = () => {
    if (!diagnosisResult) return null;

    // Extract structured data for display
    const responses = collectedData;
    const vasScore = responses.vas_score;
    const classification = responses.condition_classification || 'ACUTE';
    const progression = responses.symptom_progression;
    const chiefComplaint = responses.chief_complaint;
    const onsetDate = responses.symptom_onset;
    const painNature = responses.pain_nature;
    const aggravating = responses.aggravating_factors;
    const relieving = responses.relieving_factors;
    const behavior24hr = responses.behavior_24hr;

    // Get location string properly
    let locationStr = '';
    if (responses.pain_location) {
      if (Array.isArray(responses.pain_location)) {
        locationStr = responses.pain_location.map((loc: any) => {
          if (typeof loc === 'string') return loc;
          return loc?.slug || loc?.name || '';
        }).filter(Boolean).join(', ').replace(/_/g, ' ');
      } else if (typeof responses.pain_location === 'object') {
        locationStr = (responses.pain_location.slug || responses.pain_location.name || '').replace(/_/g, ' ');
      } else {
        locationStr = String(responses.pain_location).replace(/_/g, ' ');
      }
    }

    // Get progression text
    const progressionText = progression === 'getting_worse' ? 'Worsening'
      : progression === 'getting_better' ? 'Improving'
      : progression === 'staying_same' ? 'Stable'
      : progression?.replace(/_/g, ' ') || '';

    // Format onset
    const formatOnset = () => {
      if (!onsetDate) return null;
      const days = Math.floor((Date.now() - new Date(onsetDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days <= 7) return `${days} days ago`;
      if (days <= 30) return `${Math.ceil(days / 7)} weeks ago`;
      return `${Math.ceil(days / 30)} months ago`;
    };

    // Format array values
    const formatArray = (val: any) => {
      if (!val) return null;
      if (Array.isArray(val)) return val.map(v => String(v).replace(/_/g, ' ')).join(', ');
      return String(val).replace(/_/g, ' ');
    };

    return (
      <div className="space-y-4">

        {/* 1. RED FLAGS BANNER - ALWAYS FIRST - FULL WIDTH */}
        {(engine.requiresUrgentReferral() || detectedRedFlags.length > 0) && (
          <div className="bg-red-600 text-white rounded-md p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Red Flags Detected - Screen Before MSK Treatment</p>
                {detectedRedFlags.length > 0 && (
                  <p className="text-red-100 text-sm mt-1">
                    {detectedRedFlags.map(f => f.replace(/_/g, ' ')).join(' • ')}
                  </p>
                )}
                {identifiedSources.some(s =>
                  s.sourceRegion.toLowerCase().includes('cardiac') ||
                  s.sourceRegion.toLowerCase().includes('gallbladder')
                ) && (
                  <p className="text-red-100 text-xs mt-2 border-t border-red-500 pt-2">
                    Left shoulder + exertion = cardiac • Right shoulder + meals = gallbladder
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. QUICK-SCAN HEADER STRIP - FULL WIDTH */}
        <div className="flex flex-wrap gap-1 text-sm font-medium">
          <span className={`px-3 py-1.5 rounded-l-md ${
            classification === 'ACUTE' ? 'bg-amber-500 text-white' :
            classification === 'CHRONIC' ? 'bg-blue-600 text-white' :
            'bg-slate-700 text-white'
          }`}>
            {classification}
          </span>
          {vasScore !== undefined && (
            <span className={`px-3 py-1.5 ${
              vasScore >= 7 ? 'bg-red-100 text-red-700' :
              vasScore >= 4 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              VAS {vasScore}/10
            </span>
          )}
          {locationStr && (
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 capitalize">
              {locationStr}
            </span>
          )}
          {progressionText && (
            <span className={`px-3 py-1.5 rounded-r-md ${
              progression === 'getting_worse' ? 'bg-red-100 text-red-700' :
              progression === 'getting_better' ? 'bg-green-100 text-green-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {progressionText}
            </span>
          )}
        </div>

        {/* 3. TWO-COLUMN LAYOUT: Summary (left) | Diagnosis (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* LEFT COLUMN: Clinical Summary */}
          <div className="space-y-3 order-2 lg:order-1">

            {/* Chief Complaint */}
            {chiefComplaint && (
              <div className="bg-white rounded-md border border-slate-200 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-1">Chief Complaint</p>
                <p className="text-slate-800 font-medium">{chiefComplaint}</p>
              </div>
            )}

            {/* Key Clinical Data */}
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-medium text-slate-600">Clinical Data</span>
              </div>
              <div className="divide-y divide-slate-100">
                {formatOnset() && (
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-xs text-slate-500">Onset</span>
                    <span className="text-xs text-slate-700 font-medium">{formatOnset()}</span>
                  </div>
                )}
                {painNature && (
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-xs text-slate-500">Pain Type</span>
                    <span className="text-xs text-slate-700 font-medium capitalize">{formatArray(painNature)}</span>
                  </div>
                )}
                {behavior24hr && (
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-xs text-slate-500">24hr Pattern</span>
                    <span className="text-xs text-slate-700 font-medium capitalize">{behavior24hr.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {aggravating && (
                  <div className="px-3 py-2 flex justify-between gap-4">
                    <span className="text-xs text-slate-500 flex-shrink-0">Aggravating</span>
                    <span className="text-xs text-slate-700 font-medium text-right capitalize">{formatArray(aggravating)}</span>
                  </div>
                )}
                {relieving && (
                  <div className="px-3 py-2 flex justify-between gap-4">
                    <span className="text-xs text-slate-500 flex-shrink-0">Relieving</span>
                    <span className="text-xs text-slate-700 font-medium text-right capitalize">{formatArray(relieving)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Referral Screening - Source vs Site */}
            {identifiedSources.length > 0 && (
              <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
                  <Crosshair className="h-3.5 w-3.5 text-teal-600" />
                  <span className="text-xs font-medium text-slate-700">Referral Sources</span>
                </div>

                {locationStr && (
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px]">
                    <span className="text-slate-400">Pain Site:</span>
                    <span className="ml-1 font-medium text-slate-600 capitalize">{locationStr}</span>
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {identifiedSources.map((source, idx) => {
                    const isUrgent = source.sourceRegion.toLowerCase().includes('cardiac') ||
                      source.sourceRegion.toLowerCase().includes('gallbladder') ||
                      source.sourceRegion.toLowerCase().includes('vascular');

                    return (
                      <div key={idx} className="px-3 py-2 flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          isUrgent ? 'bg-red-500' : 'bg-teal-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase ${
                              isUrgent ? 'text-red-600' : 'text-slate-600'
                            }`}>
                              {source.sourceRegion.replace(/_/g, ' ')}
                            </span>
                            {isUrgent && (
                              <span className="text-[8px] px-1 py-0.5 bg-red-500 text-white rounded font-bold">
                                SCREEN
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {source.implication}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full Clinical Summary (Collapsible) */}
            <details className="bg-white rounded-md border border-slate-200 overflow-hidden group">
              <summary className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between list-none">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">Full Summary</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 max-h-60 overflow-y-auto">
                <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {diagnosisResult.clinicalSummary}
                </pre>
              </div>
            </details>
          </div>

          {/* RIGHT COLUMN: Differential Diagnosis - Animated */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {diagnosisResult.success && diagnosisResult.diagnosis && (
              <div className="bg-white rounded-md border border-slate-200 overflow-hidden h-full flex flex-col">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between flex-shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                    >
                      <Zap className="h-4 w-4" />
                    </motion.div>
                    <h3 className="font-semibold text-sm">Differential Diagnosis</h3>
                  </div>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="text-[10px] px-2 py-0.5 bg-white/20 rounded font-medium"
                  >
                    {diagnosisResult.diagnosis.treatment_urgency?.toUpperCase()}
                  </motion.span>
                </motion.div>

                <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {diagnosisResult.diagnosis.differential_diagnosis.map((condition, index) => (
                    <motion.button
                      key={condition.condition_id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.01, x: 4, backgroundColor: 'rgba(20, 184, 166, 0.05)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleConditionSelect(condition)}
                      disabled={isProcessing}
                      className="w-full px-4 py-3 transition-colors text-left group disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 300 }}
                          className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${
                            index === 0 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {index + 1}
                        </motion.span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">
                              {condition.condition_name}
                            </span>
                            <motion.span
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: 'auto', opacity: 1 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="text-xs px-1.5 py-0.5 bg-slate-800 text-white rounded font-medium overflow-hidden"
                            >
                              {Math.round(condition.confidence_score * 100)}%
                            </motion.span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {condition.clinical_reasoning}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-teal-600 transition-colors flex-shrink-0" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex-shrink-0"
                >
                  <p className="text-[10px] text-slate-500 text-center">
                    Select a diagnosis to confirm and continue
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* 4. ACTIONS - FULL WIDTH */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleReset} className="flex-1 rounded-md h-10 border-slate-300 text-sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
          {onClose && (
            <Button onClick={onClose} className="flex-1 rounded-md h-10 bg-slate-800 hover:bg-slate-700 text-sm">
              Close
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ==================== Main Render - Mobile-First Single Column Layout ====================

  const progress = engine.getProgress();
  const currentStep = engine.getCurrentStepIndex();
  const totalSteps = engine.getTotalSteps();

  // Circular progress component
  const CircularProgress = ({ value, size = 44 }: { value: number; size?: number }) => {
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-slate-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="text-teal-600 transition-all duration-300"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
          {value}%
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ===== SIMPLE HEADER ===== */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 safe-area-inset-top">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + Progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {patientName || 'Patient Assessment'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isComplete ? 'Complete' : `Question ${currentStep + 1} of ${totalSteps}`}
                  </p>
                </div>
              </div>
              {/* Animated progress bar */}
              <AnimatedProgress progress={progress} className="mt-2 max-w-xs" />
            </div>

            {/* Right: Simple actions */}
            <div className="flex items-center gap-2">
              {/* Reset */}
              {!isComplete && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}

              {/* Mobile: Summary Toggle */}
              {!isComplete && (
                <button
                  onClick={() => setShowSummaryPanel(!showSummaryPanel)}
                  className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                    showSummaryPanel
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Summary</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE CHAT HISTORY SLIDE-OVER ===== */}
      {showChatHistory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setShowChatHistory(false)}
          />

          {/* Mobile Panel */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h2 className="font-semibold text-slate-800">Conversation History</h2>
              </div>
              <button
                onClick={() => setShowChatHistory(false)}
                className="p-2 hover:bg-slate-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      msg.type === 'user'
                        ? 'bg-teal-600 text-white'
                        : msg.type === 'system'
                        ? 'bg-slate-100 text-slate-500 text-sm italic'
                        : 'bg-white text-slate-700 shadow-sm border border-slate-200'
                    }`}
                  >
                    <span className="text-sm leading-relaxed">{msg.content}</span>
                  </div>
                  {msg.type === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center ml-2 flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>
          </div>
        </>
      )}

      {/* ===== MOBILE SUMMARY BOTTOM SHEET ===== */}
      {showSummaryPanel && Object.keys(collectedData).length > 0 && !isComplete && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setShowSummaryPanel(false)}
          />

          {/* Mobile Panel */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            <FloatingSummaryPanel
              collectedData={collectedData}
              selectedRegions={selectedRegions}
              answeredCount={Object.keys(collectedData).length}
              totalQuestions={totalSteps}
              redFlags={detectedRedFlags}
              isAIMode={useAIFlow}
              isSourceTrackingPhase={isSourceTrackingPhase}
              identifiedSources={identifiedSources}
              className="flex-1 border-0 shadow-none rounded-none overflow-auto"
            />
          </div>
        </>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-y-auto">

        {/* RESULTS VIEW - Full Width */}
        {isComplete ? (
          <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
            {renderDiagnosisResults()}
          </div>
        ) : (
          /* QUESTION VIEW - Two Column Layout */
          <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6 lg:grid lg:grid-cols-12 lg:gap-6">

            {/* ===== MAIN COLUMN: Current Question ===== */}
            <div className="lg:col-span-8">
              {/* ===== QUESTION VIEW ===== */}
              <div className="space-y-6">

              {/* Red Flags Banner */}
              {detectedRedFlags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Red Flags Detected</p>
                    <p className="text-red-700 text-sm mt-1">
                      {detectedRedFlags.map(f => f.replace(/_/g, ' ')).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Clubbed Questions Card */}
              {clubbedQuestions.length > 0 && !isProcessing && !isTyping && (
                <div className="bg-white rounded-md border border-slate-200 overflow-hidden lg:bg-transparent lg:border-0 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  {/* Header */}
                  <div className={`px-4 py-3 border-b lg:px-0 lg:py-0 lg:border-b-0 lg:mb-4 ${isSourceTrackingPhase ? 'bg-teal-50 border-teal-100 lg:bg-transparent' : ''}`}>
                    <div className="flex items-start gap-3 lg:block">
                      <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 lg:hidden ${isSourceTrackingPhase ? 'bg-teal-600' : 'bg-teal-600'}`}>
                        {isSourceTrackingPhase ? (
                          <Crosshair className="w-4 h-4 text-white" />
                        ) : (
                          <ClipboardList className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-base lg:text-lg">
                          {isSourceTrackingPhase ? 'Checking Referral Patterns' : currentClubLabel}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isSourceTrackingPhase
                            ? `${clubbedQuestions.length} areas`
                            : `${clubbedQuestions.length} questions`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 lg:p-0">
                    {renderClubbedQuestions()}
                  </div>
                </div>
              )}

              {/* Single Question Card - Animated */}
              <AnimatePresence mode="wait">
                {currentQuestion && clubbedQuestions.length === 0 && !isProcessing && !isTyping && (
                  <motion.div
                    key={currentQuestion.id}
                    variants={questionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white rounded-md border border-slate-200 overflow-hidden lg:bg-transparent lg:border-0"
                  >
                    {/* Question Header */}
                    <div className="px-4 py-3 border-b border-slate-100 lg:px-0 lg:py-0 lg:border-b-0 lg:mb-4">
                      <div className="flex items-start gap-3 lg:block">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.2 }}
                          className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center flex-shrink-0 lg:hidden"
                        >
                          <Target className="w-4 h-4 text-white" />
                        </motion.div>
                        <div className="flex-1">
                          <h2 className="text-base font-medium text-slate-800 leading-snug lg:text-lg">
                            {currentQuestion.question}
                          </h2>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {currentQuestion.type === 'multi_choice' || currentQuestion.type === 'checklist' || currentQuestion.type === 'body_map'
                              ? 'Select all that apply'
                              : currentQuestion.type === 'single_choice'
                              ? 'Tap to select'
                              : currentQuestion.type === 'yes_no'
                              ? 'Yes or No'
                              : currentQuestion.type === 'slider'
                              ? 'Drag or tap'
                              : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 lg:p-0">
                      {renderInput()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Processing State - Animated */}
              <AnimatePresence>
                {(isProcessing || isTyping) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center py-8"
                  >
                    <div className="px-4 py-2 bg-slate-100 rounded-full">
                      <ProcessingIndicator text="Preparing next question..." />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>
            {/* END CENTER COLUMN */}

            {/* ===== RIGHT COLUMN: Summary Panel (Desktop Always Visible) ===== */}
            <aside className="hidden lg:block lg:col-span-4">
              <div className="sticky top-[73px] h-[calc(100vh-89px)] flex flex-col gap-3 overflow-hidden">

                {/* Source Detection Results - Above Summary */}
                {!isSourceTrackingPhase && identifiedSources.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-md p-3 animate-in fade-in slide-in-from-top-2 duration-300 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Crosshair className="w-4 h-4 text-teal-600" />
                      <span className="font-medium text-slate-700 text-sm">Referral Sources</span>
                      <span className="ml-auto text-xs text-slate-400">{identifiedSources.length} found</span>
                    </div>
                    <div className="space-y-1.5">
                      {identifiedSources.map((source, idx) => {
                        const isRedFlag = source.sourceRegion.toLowerCase().includes('cardiac') ||
                          source.sourceRegion.toLowerCase().includes('vascular');
                        return (
                          <div key={idx} className={`flex items-start gap-2 p-2 rounded ${isRedFlag ? 'bg-red-50' : 'bg-slate-50'}`}>
                            <MapPin className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isRedFlag ? 'text-red-500' : 'text-teal-500'}`} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium capitalize ${isRedFlag ? 'text-red-700' : 'text-slate-700'}`}>
                                {source.sourceRegion.replace(/_/g, ' ')}
                              </span>
                              <p className={`text-[10px] leading-tight ${isRedFlag ? 'text-red-500' : 'text-slate-400'}`}>
                                {source.implication}
                              </p>
                            </div>
                            {isRedFlag && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded flex-shrink-0">
                                URGENT
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary Panel */}
                <div className="flex-1 flex flex-col bg-white rounded-md border border-slate-200 overflow-hidden animate-in fade-in duration-300 min-h-0">
                {Object.keys(collectedData).length > 0 ? (
                  <FloatingSummaryPanel
                    collectedData={collectedData}
                    selectedRegions={selectedRegions}
                    answeredCount={Object.keys(collectedData).length}
                    totalQuestions={totalSteps}
                    redFlags={detectedRedFlags}
                    isAIMode={useAIFlow}
                    isSourceTrackingPhase={isSourceTrackingPhase}
                    identifiedSources={identifiedSources}
                    className="flex-1 border-0 shadow-none rounded-none overflow-auto"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Activity className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Summary</p>
                    <p className="text-xs text-slate-400 mt-1">Data will appear as you answer</p>
                  </div>
                )}
                </div>
              </div>
            </aside>

          </div>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      {!isComplete && (
        <footer className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 py-2 safe-area-inset-bottom lg:hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[40px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">Reset</span>
            </button>

            {/* Mobile mode toggle */}
            <div className="flex md:hidden items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setUseAIFlow(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium min-h-[36px] ${
                  !useAIFlow ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setUseAIFlow(true)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium min-h-[36px] ${
                  useAIFlow ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                AI Flow
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Side AI Processing Indicator - shows on right edge when AI is working */}
      <SideProcessingIndicator isVisible={isProcessing && !isTyping} />
    </div>
  );
};

export default SmartScreeningChatbot;
