"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
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
 Brain,
 Crosshair,
 MapPin,
 CalendarDays,
 Bot,
 Cpu,
} from "lucide-react";
import {
 SmartScreeningEngine,
 ScreeningQuestion,
 DiagnosisResult,
} from "@/services/ai/screening-engine.service";
import BodyMapSelector from "../maps/BodyMapSelector";
import FloatingSummaryPanel from "./FloatingSummaryPanel";
import AssessmentRecommendationHub from "../assessments/AssessmentRecommendationHub";
import AssessmentFormBuilder from "../assessments/AssessmentFormBuilder";
import screeningAPI from "@/services/api/screening-api.service";
import useAIQuestionFlow from "@/hooks/useAIQuestionFlow";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@/components/ui/screening-animations";

// Extracted screening components
import {
  YesNoInput,
  VASSliderInput,
  TypingIndicator as ExtractedTypingIndicator,
  CompletionCelebration as ExtractedCompletionCelebration,
  ScreeningProgressBar,
  useAssessmentFlow,
  AssessmentHubDialog,
  ChatMessage,
  InlineClinicalQuestion,
  ChatProgress,
  SlidingSummaryPanel,
  ClinicalChatbotLayout,
} from "./screening";

// ==================== Types ====================

interface ChatMessage {
 id: string;
 type: "bot" | "user" | "system";
 content: string;
 timestamp: Date;
 questionId?: string;
}

// Import SymptomDxData type
import type { SymptomDxData } from "./SymptomAssessmentModal";

// Diagnosis method type
type DiagnosisMethod = "SYMPTOM_AND_CLINICAL" | "CLINICAL_ONLY";

interface SmartScreeningChatbotProps {
 patientId: string;
 patientName?: string;
 onComplete?: (result: any) => void;
 onClose?: () => void;
 // NEW: Optional SymptomDx data from previous step
 symptomDxData?: SymptomDxData | null;
 diagnosisMethod?: DiagnosisMethod | null;
 // Draft condition ID - when provided, UPDATE this condition instead of creating new
 draftConditionId?: string | null;
}

// ==================== Clubbed Questions Configuration ====================
// Questions that should be shown together on the same screen
const QUESTION_CLUBS: Record<string, { questions: string[]; label: string }> = {
 timeline: {
  questions: ["symptom_onset", "onset_nature", "symptom_progression"],
  label: "Timeline",
 },
 pain_characteristics: {
  questions: ["vas_score", "pain_nature"],
  label: "Pain Characteristics",
 },
 pain_factors: {
  questions: ["aggravating_factors", "relieving_factors"],
  label: "Pain Factors",
 },
 functional: {
  questions: ["functional_impact", "work_impact"],
  label: "Functional Impact",
 },
 history: {
  questions: ["previous_episodes", "previous_episode_comparison"],
  label: "History",
 },
};

// Get club for a question (returns club info if this question starts a club)
const getQuestionClub = (
 questionId: string,
): { questions: string[]; label: string } | null => {
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
 "shoulder_",
 "elbow_",
 "forearm_",
 "wrist_",
 "hand_",
 "lb_",
 "hip_",
 "thigh_",
 "knee_",
 "calf_",
 "ankle_",
 "foot_",
 "neck_",
 "headache_",
 "chest_",
 "thoracic_",
 "abdomen_",
];

const isReferralQuestion = (questionId: string): boolean => {
 return REFERRAL_QUESTION_PREFIXES.some((prefix) =>
  questionId.startsWith(prefix),
 );
};

// ==================== Date Picker Input ====================

const DatePickerInput = ({
 value,
 onChange,
}: {
 value: string;
 onChange: (val: string) => void;
}) => {
 const [isOpen, setIsOpen] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);
 const dateValue = value ? new Date(value) : undefined;

 // Close on click outside
 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (
    containerRef.current &&
    !containerRef.current.contains(e.target as Node)
   ) {
    setIsOpen(false);
   }
  };
  if (isOpen) {
   document.addEventListener("mousedown", handleClickOutside);
   return () => document.removeEventListener("mousedown", handleClickOutside);
  }
 }, [isOpen]);

 const getChronicity = (date: Date) => {
  const daysSince = Math.floor(
   (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSince <= 0)
   return { label: "Today", days: 0, color: "bg-blue-100 text-blue-700" };
  if (daysSince <= 7)
   return {
    label: "This week",
    days: daysSince,
    color: "bg-blue-100 text-blue-700",
   };
  if (daysSince <= 42)
   return { label: "Acute", days: daysSince, color: "bg-sky-100 text-sky-700" };
  if (daysSince <= 84)
   return {
    label: "Subacute",
    days: daysSince,
    color: "bg-amber-100 text-amber-700",
   };
  return {
   label: "Chronic",
   days: daysSince,
   color: "bg-orange-100 text-orange-700",
  };
 };

 const chronicity = dateValue ? getChronicity(dateValue) : null;

 return (
  <div ref={containerRef} className='relative'>
   {/* Input Field */}
   <button
    type='button'
    onClick={() => setIsOpen(!isOpen)}
    className={`w-full flex items-center justify-between px-4 py-3.5 bg-white border-2 rounded-2xl text-left transition-all duration-200 ${
     isOpen
      ? "border-blue-500 ring-2 ring-blue-100 shadow-lg"
      : "border-slate-200 hover:border-blue-300 hover:shadow-md"
    }`}
   >
    <div className='flex items-center gap-2'>
     <CalendarDays className='h-5 w-5 text-slate-400' />
     {dateValue ? (
      <span className='text-base text-slate-800 font-medium'>
       {dateValue.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
       })}
      </span>
     ) : (
      <span className='text-base text-slate-400'>Select a date...</span>
     )}
    </div>
    {chronicity && (
     <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${chronicity.color}`}
     >
      {chronicity.label}
     </span>
    )}
   </button>

   {/* Calendar Dropdown */}
   {isOpen && (
    <div className='absolute z-50 mt-2 left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150'>
     <CalendarPicker
      mode='single'
      selected={dateValue}
      onSelect={(date) => {
       if (date) {
        onChange(date.toISOString().split("T")[0]);
        setIsOpen(false);
       }
      }}
      classNames={{
       months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
       month: "space-y-4",
       caption: "flex justify-center pt-2 pb-2 relative items-center",
       caption_label: "text-base font-semibold text-slate-800",
       nav: "space-x-1 flex items-center",
       nav_button:
        "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100 rounded-md inline-flex items-center justify-center",
       nav_button_previous: "absolute left-2",
       nav_button_next: "absolute right-2",
       table: "w-full border-collapse",
       head_row: "flex",
       head_cell: "text-slate-500 rounded-md w-11 font-medium text-sm",
       row: "flex w-full mt-1",
       cell:
        "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
       day: "h-11 w-11 p-0 font-normal text-sm rounded-md hover:bg-slate-100 focus:bg-slate-100 aria-selected:opacity-100 inline-flex items-center justify-center",
       day_selected:
        "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
       day_today: "bg-slate-100 text-slate-900 font-semibold",
       day_outside: "text-slate-300 opacity-50",
       day_disabled: "text-slate-300 opacity-50 cursor-not-allowed",
       day_hidden: "invisible",
      }}
      disabled={(date) => date > new Date()}
      defaultMonth={dateValue || new Date()}
      className='p-4'
     />
    </div>
   )}
  </div>
 );
};

// ==================== Completion Celebration ====================

const CompletionCelebration = () => {
 const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.5,
  duration: 2 + Math.random(),
  color: [
   "bg-blue-500",
   "bg-blue-400",
   "bg-indigo-400",
   "bg-sky-400",
   "bg-violet-400",
  ][Math.floor(Math.random() * 5)],
 }));

 return (
  <div className='fixed inset-0 pointer-events-none z-50 overflow-hidden'>
   {confettiPieces.map((piece) => (
    <motion.div
     key={piece.id}
     initial={{ y: -20, x: `${piece.x}vw`, opacity: 1, rotate: 0 }}
     animate={{
      y: "110vh",
      rotate: 360,
      opacity: 0,
     }}
     transition={{
      duration: piece.duration,
      delay: piece.delay,
      ease: "easeIn",
     }}
     className={`absolute w-3 h-3 ${piece.color} rounded-sm`}
    />
   ))}
  </div>
 );
};

// ==================== Typing Indicator ====================

const TypingIndicator = () => (
 <motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  className='flex items-center gap-2 px-3 py-2'
 >
  <div className='flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/60 shadow-sm'>
   <div className='flex gap-1.5'>
    <motion.div
     animate={{ y: [0, -5, 0] }}
     transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
     className='w-2 h-2 bg-blue-500 rounded-full'
    />
    <motion.div
     animate={{ y: [0, -5, 0] }}
     transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
     className='w-2 h-2 bg-blue-500 rounded-full'
    />
    <motion.div
     animate={{ y: [0, -5, 0] }}
     transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
     className='w-2 h-2 bg-blue-500 rounded-full'
    />
   </div>
   <span className='text-sm font-medium text-blue-600'>Analyzing...</span>
  </div>
 </motion.div>
);

// ==================== Side AI Processing Indicator ====================

const SideProcessingIndicator = ({ isVisible }: { isVisible: boolean }) => {
 if (!isVisible) return null;

 return (
  <div
   className='fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200'
   aria-live='polite'
   aria-label='AI is analyzing'
  >
   <div className='bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100 px-3 py-4 flex flex-col items-center gap-3'>
    {/* Animated dots */}
    <div className='flex flex-col gap-1.5'>
     {[0, 1, 2].map((i) => (
      <div
       key={i}
       className='w-2 h-2 rounded-full bg-blue-500'
       style={{
        animation: "pulse 1.4s ease-in-out infinite",
        animationDelay: `${i * 0.2}s`,
        opacity: 0.4,
       }}
      />
     ))}
    </div>
    <span
     className='text-xs text-slate-500 font-medium uppercase tracking-wider writing-mode-vertical'
     style={{ writingMode: "vertical-rl" }}
    >
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
 totalQuestions,
}: {
 stages: { id: string; label: string; icon: React.ReactNode }[];
 currentStageIndex: number;
 answeredCount: number;
 totalQuestions: number;
}) => {
 return (
  <div className='flex flex-col h-full'>
   <div className='px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-transparent'>
    <p className='text-sm text-blue-600 uppercase tracking-wider font-bold'>
     Clinical Progress
    </p>
   </div>
   <div className='flex-1 py-4 space-y-1 overflow-y-auto relative'>
    {/* Connecting line */}
    <div className='absolute left-9 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-blue-300 to-slate-200' />

    {stages.map((stage, index) => {
     const isCompleted = index < currentStageIndex;
     const isCurrent = index === currentStageIndex;
     const isPending = index > currentStageIndex;

     return (
      <motion.div
       key={stage.id}
       initial={{ opacity: 0, x: -20 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: index * 0.1 }}
       className={`
                relative flex items-center gap-3 px-3 py-3 mx-2 rounded-xl transition-all duration-200
                ${isCurrent ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 shadow-md" : ""}
                ${isCompleted ? "hover:bg-slate-50" : ""}
              `}
      >
       {/* Status indicator */}
       <motion.div
        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200
                  ${
                   isCompleted
                    ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                    : isCurrent
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/50 ring-4 ring-blue-100"
                      : "bg-slate-200 text-slate-500 border-2 border-white"
                  }
                `}
       >
        {isCompleted ? (
         <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
         >
          <Check className='w-4 h-4' />
         </motion.div>
        ) : (
         <span>{index + 1}</span>
        )}
       </motion.div>

       {/* Label */}
       <span
        className={`
                text-sm truncate transition-colors duration-200 font-medium
                ${isCurrent ? "text-blue-700 font-semibold" : isCompleted ? "text-slate-700" : "text-slate-400"}
              `}
       >
        {stage.label}
       </span>

       {/* Current indicator pulse */}
       {isCurrent && (
        <motion.div
         animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
         transition={{ duration: 2, repeat: Infinity }}
         className='ml-auto w-2 h-2 rounded-full bg-blue-500'
        />
       )}
      </motion.div>
     );
    })}
   </div>

   {/* Bottom stats */}
   <div className='px-4 py-4 border-t border-slate-200 mt-auto bg-gradient-to-t from-slate-50 to-transparent'>
    <div className='flex items-center justify-between mb-3'>
     <span className='text-xs text-slate-500 font-medium uppercase tracking-wide'>
      Progress
     </span>
     <span className='text-lg font-bold text-slate-800 tabular-nums'>
      {answeredCount}
      <span className='text-slate-400 text-sm'>/{totalQuestions}</span>
     </span>
    </div>
    <div className='relative h-2 bg-slate-200 rounded-full overflow-hidden'>
     <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className='absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm'
     />
    </div>
    <div className='mt-2 text-center'>
     <span className='text-xs font-semibold text-blue-600'>
      {Math.round((answeredCount / totalQuestions) * 100)}% Complete
     </span>
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
 symptomDxData,
 diagnosisMethod,
 draftConditionId,
}) => {
 const [engine] = useState(() => new SmartScreeningEngine(patientId));
 const [messages, setMessages] = useState<ChatMessage[]>([]);
 const [currentQuestion, setCurrentQuestion] =
  useState<ScreeningQuestion | null>(null);
 const [currentResponse, setCurrentResponse] = useState<any>("");
 // Clubbed questions state
 const [clubbedQuestions, setClubbedQuestions] = useState<ScreeningQuestion[]>(
  [],
 );
 const [clubbedResponses, setClubbedResponses] = useState<Record<string, any>>(
  {},
 );
 const [currentClubLabel, setCurrentClubLabel] = useState<string>("");
 const [isProcessing, setIsProcessing] = useState(false);
 const [isTyping, setIsTyping] = useState(false);
 const [isComplete, setIsComplete] = useState(false);
 const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(
  null,
 );
 const [useAIFlow, setUseAIFlow] = useState(false);
 const [selectedRegions, setSelectedRegions] = useState<any[]>([]);
 const [collectedData, setCollectedData] = useState<Record<string, any>>({});
 const [detectedRedFlags, setDetectedRedFlags] = useState<string[]>([]);
 const [showSummaryPanel, setShowSummaryPanel] = useState(true); // Start open on desktop
 const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
 const [showChatHistory, setShowChatHistory] = useState(false);
 const [isSourceTrackingPhase, setIsSourceTrackingPhase] = useState(false);
 const [identifiedSources, setIdentifiedSources] = useState<
  Array<{ sourceRegion: string; implication: string }>
 >([]);

 // Clinical Assessment states
 const [showAssessmentHub, setShowAssessmentHub] = useState(false);
 const [showDirectAssessment, setShowDirectAssessment] = useState(false);
 const [selectedAssessments, setSelectedAssessments] = useState<any[]>([]);
 const [completedAssessments, setCompletedAssessments] = useState<any[]>([]);
 const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);

 const chatEndRef = useRef<HTMLDivElement>(null);
 const sessionStartTime = useRef<number>(Date.now());

 // AI Question Flow Hook (used when useAIFlow is true)
 const aiFlow = useAIQuestionFlow({
  selectedRegions,
  enabled: useAIFlow,
  onQuestionRecommended: (q) => {
   console.log("AI recommended question:", q);
  },
 });

 const scrollToBottom = useCallback(() => {
  setTimeout(() => {
   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 100);
 }, []);

 const addMessage = useCallback(
  (type: ChatMessage["type"], content: string, questionId?: string) => {
   const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    content,
    timestamp: new Date(),
    questionId,
   };
   setMessages((prev) => [...prev, msg]);
   scrollToBottom();
   return msg;
  },
  [scrollToBottom],
 );

 const addBotMessage = useCallback(
  async (content: string, questionId?: string) => {
   setIsTyping(true);
   // Reduced delay for expert users (was 400-700ms, now 80-120ms)
   await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 40));
   setIsTyping(false);
   addMessage("bot", content, questionId);
  },
  [addMessage],
 );

 // Load a question (handles clubbed questions)
 const loadQuestion = useCallback(
  async (question: ScreeningQuestion) => {
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

    await addBotMessage(
     `Let's gather some ${club.label.toLowerCase()} information.`,
     question.id,
    );
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
     const nextQuestionId = await engine.processResponse(
      question.id,
      responses[question.id],
     );
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
     setCurrentClubLabel("AI Source Detection");
     setClubbedResponses({});
     setCurrentQuestion(null);

     await addBotMessage(
      "🔬 Initiating AI Source Detection — I'll analyze referral patterns across cardiac, visceral, neural, and vascular pathways to find where your pain is truly originating.",
      question.id,
     );
    } else {
     // Single referral question - show normally
     setClubbedQuestions([]);
     setCurrentClubLabel("");
     setClubbedResponses({});
     setCurrentQuestion(question);
     await addBotMessage(question.question, question.id);
    }
   } else {
    // Single question (not clubbed)
    setClubbedQuestions([]);
    setCurrentClubLabel("");
    setClubbedResponses({});
    setCurrentQuestion(question);
    await addBotMessage(question.question, question.id);
   }
  },
  [engine, addBotMessage],
 );

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

 // Pre-populate from symptomDxData if available (from full assessment pathway)
 useEffect(() => {
  if (symptomDxData && engine) {
   console.log("Pre-populating from SymptomDx data:", symptomDxData);

   // Pre-populate chief complaint if available
   if (symptomDxData.chief_complaint) {
    engine.setResponse?.("chief_complaint", symptomDxData.chief_complaint);
   }

   // Pre-populate body regions
   if (symptomDxData.body_regions?.length > 0) {
    const session = engine.getSession();
    if (session) {
     session.selectedPainRegions = symptomDxData.body_regions;
    }
   }

   // Pre-activate pain pathway if pain level exists
   if (symptomDxData.pain_level && symptomDxData.pain_level > 0) {
    engine.activatePathway?.("PAIN");
    engine.setResponse?.("pain_screening", "yes");
    engine.setResponse?.("vas_score", symptomDxData.pain_level);
   }

   // Add indicator message if symptom data was pre-filled
   if (symptomDxData.questions_asked > 0) {
    addBotMessage(
     `I've received ${symptomDxData.questions_asked} responses from the symptom assessment. ` +
      `${symptomDxData.body_regions?.length > 0 ? `Regions: ${symptomDxData.body_regions.join(", ")}. ` : ""}` +
      `Let's continue with the clinical examination.`,
    );
   }
  }
 }, [symptomDxData, engine, addBotMessage]);

 // Reset response when question changes
 useEffect(() => {
  if (currentQuestion) {
   if (
    [
     "multi_choice",
     "checklist",
     "body_map",
     "observational",
     "red_flags",
    ].includes(currentQuestion.type)
   ) {
    setCurrentResponse([]);
   } else if (
    [
     "tenderness_map",
     "measurement",
     "rom_measurement",
     "mmt_testing",
     "scale_grid",
    ].includes(currentQuestion.type)
   ) {
    setCurrentResponse({});
   } else if (currentQuestion.type === "slider") {
    setCurrentResponse(currentQuestion.min || 0);
   } else {
    setCurrentResponse("");
   }
  }
 }, [currentQuestion]);

 const formatUserResponse = (
  value: any,
  question: ScreeningQuestion,
 ): string => {
  // Handle body_map structured response
  if (question.type === "body_map" && value?.detailed) {
   const detailed = value.detailed;
   if (Array.isArray(detailed)) {
    return detailed
     .map((selection: any) => {
      const region = selection.mainRegion?.replace(/_/g, " ");
      const side =
       selection.laterality === "center"
        ? ""
        : selection.laterality === "both"
          ? " (both sides)"
          : ` (${selection.laterality})`;
      const subRegions =
       selection.subRegions?.length > 0
        ? `: ${selection.subRegions.map((s: string) => s.replace(/_/g, " ")).join(", ")}`
        : "";
      return `${region}${side}${subRegions}`;
     })
     .join("; ");
   }
  }
  if (Array.isArray(value)) {
   if (value.length === 0) return "None selected";
   const labels = value.map((v) => {
    const opt = question.options?.find((o) => o.value === v);
    return opt?.label || v;
   });
   return labels.join(", ");
  }
  if (typeof value === "object" && value !== null) {
   // Skip body_map regions object (handled above)
   if (value.regions && value.detailed) {
    return "Body regions selected";
   }
   const entries = Object.entries(value).filter(([_, v]) => v);
   return entries.length > 0
    ? entries.map(([k, v]) => `${k}: ${v}`).join(", ")
    : "Not assessed";
  }
  if (question.type === "date" && value) {
   return new Date(value).toLocaleDateString();
  }
  if (question.type === "single_choice" || question.type === "yes_no") {
   const opt = question.options?.find((o) => o.value === value);
   return (
    opt?.label || (value === "yes" ? "Yes" : value === "no" ? "No" : value)
   );
  }
  if (question.type === "slider") {
   return `${value}/10`;
  }
  return String(value);
 };

 // Handle submit for clubbed questions
 const handleClubbedSubmit = async () => {
  if (clubbedQuestions.length === 0 || !canSubmitClubbed()) return;

  // Filter questions that should be processed (skip conditional questions that don't apply)
  const questionsToProcess = clubbedQuestions.filter((q) => {
   // Skip previous_episode_comparison if previous_episodes is not "yes"
   if (
    q.id === "previous_episode_comparison" &&
    clubbedResponses["previous_episodes"] !== "yes"
   ) {
    return false;
   }
   return true;
  });

  // Format display message for answered responses only
  const displayParts = questionsToProcess.map((q) => {
   const response = clubbedResponses[q.id];
   const formatted = formatUserResponse(response, q);
   return `${q.question.split("?")[0].split(".")[0]}: ${formatted}`;
  });
  addMessage("user", displayParts.join("\n"));

  setIsProcessing(true);

  // Track collected data for summary panel
  const newCollectedData: Record<string, any> = {};
  for (const q of questionsToProcess) {
   const response = clubbedResponses[q.id];
   newCollectedData[q.id] = response;

   // Detect red flags from text responses
   if (typeof response === "string") {
    const flags = screeningAPI.detectRedFlags(response);
    if (flags.length > 0) {
     setDetectedRedFlags((prev) => [...new Set([...prev, ...flags])]);
    }
   }

   // Record response in AI flow context
   if (useAIFlow) {
    aiFlow.recordResponse(q.id, response);
   }
  }
  setCollectedData((prev) => ({ ...prev, ...newCollectedData }));

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
  addMessage("user", displayValue);

  setIsProcessing(true);

  // Track collected data for summary panel
  setCollectedData((prev) => ({
   ...prev,
   [currentQuestion.id]: currentResponse,
  }));

  // Track selected regions from body_map
  if (currentQuestion.type === "body_map" && currentResponse?.detailed) {
   setSelectedRegions(currentResponse.detailed);
  }

  // Detect red flags from text responses
  if (typeof currentResponse === "string") {
   const flags = screeningAPI.detectRedFlags(currentResponse);
   if (flags.length > 0) {
    setDetectedRedFlags((prev) => [...new Set([...prev, ...flags])]);
   }
  }

  // Record response in AI flow context
  if (useAIFlow) {
   aiFlow.recordResponse(currentQuestion.id, currentResponse);
  }

  // Process response with engine
  const nextQuestionId = await engine.processResponse(
   currentQuestion.id,
   currentResponse,
  );

  // Move to next question
  await moveToNextQuestion(nextQuestionId);

  setIsProcessing(false);
  scrollToBottom();
 };

 // Move to next question (shared logic for single and clubbed)
 const moveToNextQuestion = async (nextQuestionId: string | null) => {
  // Check if we just completed source tracking phase
  if (
   isSourceTrackingPhase &&
   nextQuestionId &&
   !isReferralQuestion(nextQuestionId)
  ) {
   setIsSourceTrackingPhase(false);
   // Get identified referral sources from engine
   const sources = engine.getIdentifiedReferralSources();
   if (sources && sources.length > 0) {
    setIdentifiedSources(
     sources.map((s) => ({
      sourceRegion: s.sourceRegion,
      implication: s.implication,
     })),
    );
   }
  }

  if (useAIFlow && nextQuestionId) {
   // In AI mode, get AI recommendation for next question
   try {
    const aiRecommendation = await aiFlow.getNextQuestion();
    if (
     aiRecommendation &&
     aiRecommendation.questionId !== "screening_complete"
    ) {
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
       await completeQuestionnaire();
      }
     }
    } else {
     setCurrentQuestion(null);
     setClubbedQuestions([]);
     await completeQuestionnaire();
    }
   } catch (error) {
    console.error("AI flow error, falling back to manual:", error);
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
   await completeQuestionnaire();
  }
 };

 const canSubmit = (): boolean => {
  // If clubbed questions, use clubbed validation
  if (clubbedQuestions.length > 0) {
   return canSubmitClubbed();
  }

  if (currentResponse === null || currentResponse === undefined) return false;

  if (
   ["multi_choice", "checklist", "body_map", "observational"].includes(
    currentQuestion?.type || "",
   )
  ) {
   return Array.isArray(currentResponse) && currentResponse.length > 0;
  }

  if (currentQuestion?.type === "red_flags") {
   return true;
  }

  if (
   [
    "tenderness_map",
    "measurement",
    "rom_measurement",
    "mmt_testing",
    "scale_grid",
   ].includes(currentQuestion?.type || "")
  ) {
   return (
    currentResponse &&
    typeof currentResponse === "object" &&
    Object.keys(currentResponse).length > 0
   );
  }

  if (typeof currentResponse === "string") {
   return currentResponse.trim().length > 0;
  }

  if (currentQuestion?.type === "slider") {
   return typeof currentResponse === "number";
  }

  return true;
 };

 // Check if all clubbed questions have valid responses
 const canSubmitClubbed = (): boolean => {
  if (clubbedQuestions.length === 0) return false;

  for (const q of clubbedQuestions) {
   const response = clubbedResponses[q.id];

   // Special case: previous_episode_comparison is only required if previous_episodes is "yes"
   if (q.id === "previous_episode_comparison") {
    const previousEpisodesResponse = clubbedResponses["previous_episodes"];
    if (previousEpisodesResponse !== "yes") {
     continue; // Skip validation - not required
    }
   }

   if (response === null || response === undefined) return false;

   if (["multi_choice", "checklist"].includes(q.type)) {
    if (!Array.isArray(response) || response.length === 0) return false;
   } else if (q.type === "slider") {
    if (typeof response !== "number") return false;
   } else if (q.type === "yes_no") {
    if (response !== "yes" && response !== "no") return false;
   } else if (typeof response === "string") {
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
   await new Promise((resolve) => setTimeout(resolve, 2000));
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
   console.error("Diagnosis error:", error);
   setIsTyping(false);
   setDiagnosisResult({
    success: false,
    error: "Failed to generate diagnosis",
    clinicalSummary: engine.generateClinicalSummary(),
   });
   setIsComplete(true);
  }

  setIsProcessing(false);
  scrollToBottom();
 };

 const handleConditionSelect = async (condition: any) => {
  setIsProcessing(true);
  addMessage("user", `Selected: ${condition.condition_name}`);

  const isTestMode = patientId.startsWith("test");
  const session = engine.getSession();

  if (!isTestMode) {
   try {
    const { default: ApiManager } = await import("@/services/api/api.service");

    // Build comprehensive condition payload with dual diagnosis data
    const conditionPayload = {
     condition_id: condition.condition_id,
     condition_name: condition.condition_name,
     neo4j_condition_id: condition.condition_id,
     diagnosis_method: diagnosisMethod || "CLINICAL_ONLY",
     symptom_dx_data: symptomDxData || null,
     symptom_dx_completed: !!symptomDxData,
     symptom_dx_completed_at: symptomDxData?.completed_at || null,
     symptom_dx_filled_by: symptomDxData?.filled_by || null,
     clinical_dx_data: {
      session_id: session.id,
      started_at: session.startTime?.toISOString() || new Date().toISOString(),
      completed_at: new Date().toISOString(),
      responses: session.responses,
      activated_pathways: Array.from(session.activatedPathways || []),
      skipped_sections: Array.from(session.skippedSections || []),
      red_flags_detected: session.redFlagsDetected || [],
      referral_findings: session.identifiedReferralSources || [],
      selected_pain_regions: session.selectedPainRegions || [],
      completion_percentage: session.completionPercentage || 100,
     },
     clinical_dx_completed: true,
     clinical_dx_completed_at: new Date().toISOString(),
     clinical_assessments_data: completedAssessments.map((a: any) => ({
      assessment_id: a.assessment_id || a.id,
      assessment_name: a.assessment_name || a.name,
      category: a.category || "GENERAL",
      completed_at: a.timestamp || new Date().toISOString(),
      form_data: a.form_data || a,
      findings_summary: a.findings_summary || null,
     })),
     clinical_dx_differential: diagnosisResult?.diagnosis
      ? {
         generated_at: new Date().toISOString(),
         conditions:
          diagnosisResult.diagnosis.differential_diagnosis?.map((d: any) => ({
           condition_id: d.condition_id,
           condition_name: d.condition_name,
           confidence_score: d.confidence_score,
           supporting_evidence: d.supporting_evidence || [],
           clinical_reasoning: d.clinical_reasoning || "",
          })) || [],
         treatment_urgency:
          diagnosisResult.diagnosis.treatment_urgency || "MODERATE",
        }
      : null,
     final_diagnosis: {
      selected_condition_id: condition.condition_id,
      selected_condition_name: condition.condition_name,
      selection_method: "AI_SUGGESTED",
      ai_confidence_score: condition.confidence_score,
      confirmed_at: new Date().toISOString(),
     },
     chief_complaint:
      symptomDxData?.chief_complaint || session.responses?.chief_complaint,
     vas_score: symptomDxData?.pain_level || session.responses?.vas_score,
     primary_body_region:
      symptomDxData?.body_regions?.[0] || session.selectedPainRegions?.[0],
     pain_present: !!(
      symptomDxData?.pain_level || session.responses?.vas_score
     ),
     night_pain:
      session.responses?.night_pain === "yes" ||
      session.responses?.night_pain === true,
     unexplained_weight_loss:
      session.responses?.weight_loss === "yes" ||
      session.responses?.weight_loss === true,
     neurological_symptoms:
      session.responses?.neurological_symptoms === "yes" ||
      session.responses?.neurological_symptoms === true,
     recent_trauma:
      session.responses?.trauma === "yes" || session.responses?.trauma === true,
     bladder_bowel_changes:
      session.responses?.cauda_equina === "yes" ||
      session.responses?.cauda_equina === true,
     urgency_level:
      diagnosisResult?.diagnosis?.treatment_urgency?.toUpperCase() ||
      "MODERATE",
     diagnosis_status: "COMPLETE",
    };

    if (draftConditionId) {
     await ApiManager.updatePatientCondition(
      patientId,
      draftConditionId,
      conditionPayload,
     );
    } else {
     await ApiManager.createPatientCondition(patientId, conditionPayload);
    }
   } catch (error) {
    console.error("Error saving condition:", error);
    addMessage("system", "Error saving diagnosis. Please try again.");
    setIsProcessing(false);
    return;
   }
  }

  await addBotMessage(
   `Confirmed: "${condition.condition_name}" (${Math.round(condition.confidence_score * 100)}% confidence)`,
  );

  if (onComplete) {
   onComplete({
    diagnosis: condition,
    session: engine.getSession(),
    clinicalSummary: engine.generateClinicalSummary(),
    symptomDxData: symptomDxData,
    diagnosisMethod: diagnosisMethod,
   });
  }

  setIsProcessing(false);
 };

 const handleReset = () => {
  engine.reset();
  setMessages([]);
  setCurrentQuestion(null);
  setCurrentResponse("");
  setIsComplete(false);
  setDiagnosisResult(null);
  setShowAssessmentHub(false);
  setShowDirectAssessment(false);
  setSelectedAssessments([]);
  setCompletedAssessments([]);
  setCurrentAssessmentIndex(0);

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

 // Handle close with confirmation
 const handleCloseClick = () => {
  if (!isComplete && Object.keys(collectedData).length > 0) {
   setShowCloseConfirmation(true);
  } else {
   onClose?.();
  }
 };

 const confirmClose = () => {
  setShowCloseConfirmation(false);
  onClose?.();
 };

 const cancelClose = () => {
  setShowCloseConfirmation(false);
 };

 // ==================== Clinical Assessment Flow ====================

 const completeQuestionnaire = async () => {
  await addBotMessage(
   "Screening complete! Now let's enhance your assessment with targeted clinical tests...",
  );
  scrollToBottom();

  setTimeout(() => {
   setShowAssessmentHub(true);
  }, 1000);
 };

 const handleStartRecommended = (assessments: any[]) => {
  if (!assessments || assessments.length === 0) {
   addBotMessage("No assessments were selected. Proceeding to diagnosis...");
   proceedToFinalDiagnosis();
   return;
  }

  setSelectedAssessments(assessments);
  setCurrentAssessmentIndex(0);
  setShowAssessmentHub(false);

  addBotMessage(
   `Starting ${assessments.length} clinical assessments. Assessment 1 of ${assessments.length}: ${assessments[0].name}`,
  );

  setTimeout(() => {
   setShowDirectAssessment(true);
  }, 500);
 };

 const handleChooseCustom = () => {
  setShowAssessmentHub(false);
  addBotMessage(
   "Custom assessment selection not yet implemented. Proceeding to diagnosis...",
  );
  setTimeout(() => {
   proceedToFinalDiagnosis();
  }, 500);
 };

 const handleSkipAllAssessments = () => {
  setShowAssessmentHub(false);
  addBotMessage(
   "Skipping clinical assessments. Generating diagnosis based on screening data...",
  );
  setTimeout(() => {
   proceedToFinalDiagnosis();
  }, 500);
 };

 const handleDirectAssessmentSubmit = (assessmentId: string, formData: any) => {
  const assessment = selectedAssessments[currentAssessmentIndex];
  setCompletedAssessments((prev) => [
   ...prev,
   {
    assessment_id: assessmentId,
    assessment_name: assessment?.name || assessmentId,
    form_data: formData,
    timestamp: new Date().toISOString(),
   },
  ]);

  if (currentAssessmentIndex < selectedAssessments.length - 1) {
   const nextIndex = currentAssessmentIndex + 1;
   setCurrentAssessmentIndex(nextIndex);
   addBotMessage(
    `Assessment ${nextIndex + 1} of ${selectedAssessments.length}: ${selectedAssessments[nextIndex].name}`,
   );
  } else {
   setShowDirectAssessment(false);
   handleDirectAssessmentsComplete();
  }
 };

 const handleDirectAssessmentSkip = () => {
  if (currentAssessmentIndex < selectedAssessments.length - 1) {
   const nextIndex = currentAssessmentIndex + 1;
   setCurrentAssessmentIndex(nextIndex);
   addBotMessage(
    `Skipped. Assessment ${nextIndex + 1} of ${selectedAssessments.length}: ${selectedAssessments[nextIndex].name}`,
   );
  } else {
   setShowDirectAssessment(false);
   handleDirectAssessmentsComplete();
  }
 };

 const handleDirectAssessmentsComplete = () => {
  addBotMessage(
   `Clinical assessments completed! ${completedAssessments.length} tests documented. Generating enhanced AI diagnosis...`,
  );
  setTimeout(() => {
   proceedToFinalDiagnosis();
  }, 1500);
 };

 const proceedToFinalDiagnosis = async () => {
  await generateDiagnosis();
 };

 // ==================== Render Input Components ====================

 // Primary action button style
 const primaryBtnClass =
  "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] text-white rounded-2xl min-h-[56px] font-semibold text-base transition-all duration-200 border-0";

 // Option selected style
 const selectedOptionClass =
  "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/10";
 const unselectedOptionClass =
  "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0";

 // Render a single input for a clubbed question
 const renderClubbedInput = (question: ScreeningQuestion) => {
  const response = clubbedResponses[question.id];

  const updateResponse = (value: any) => {
   setClubbedResponses((prev) => ({ ...prev, [question.id]: value }));
  };

  switch (question.type) {
   case "date":
    return <DatePickerInput value={response} onChange={updateResponse} />;

   case "yes_no":
    return (
     <div className='flex gap-4'>
      {[
       { value: "yes", label: "Yes" },
       { value: "no", label: "No" },
      ].map(({ value, label }) => (
       <button
        key={value}
        onClick={() => updateResponse(value)}
        className={`flex-1 flex items-center justify-center gap-3 min-h-[56px] rounded-2xl border-2 transition-all duration-200 font-semibold text-base ${
         response === value
          ? "border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-500/25 scale-[1.02]"
          : `${unselectedOptionClass} text-slate-700`
        }`}
       >
        {value === "yes" ? (
         <Check
          className={`h-5 w-5 ${response === value ? "text-white" : "text-slate-400"}`}
         />
        ) : (
         <CircleDot
          className={`h-5 w-5 ${response === value ? "text-white" : "text-slate-400"}`}
         />
        )}
        <span>{label}</span>
       </button>
      ))}
     </div>
    );

   case "single_choice":
    return (
     <div className='space-y-2.5'>
      {question.options?.map((option) => (
       <button
        key={option.value}
        onClick={() => updateResponse(option.value)}
        className={`w-full flex items-center gap-4 min-h-[52px] px-5 rounded-2xl border-2 transition-all duration-200 text-left ${
         response === option.value ? selectedOptionClass : unselectedOptionClass
        }`}
       >
        <div
         className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          response === option.value
           ? "border-blue-500 bg-blue-500 scale-110"
           : "border-slate-300"
         }`}
        >
         {response === option.value && <Check className='h-3 w-3 text-white' />}
        </div>
        <span
         className={`text-sm ${response === option.value ? "text-blue-700 font-semibold" : "text-slate-700 font-medium"}`}
        >
         {option.label}
        </span>
       </button>
      ))}
     </div>
    );

   case "multi_choice":
   case "checklist":
    const selectedValues = Array.isArray(response) ? response : [];
    return (
     <div className='space-y-2.5 max-h-[300px] overflow-y-auto'>
      {question.options?.map((option) => {
       const isSelected = selectedValues.includes(option.value);
       return (
        <button
         key={option.value}
         onClick={() => {
          const newValues = isSelected
           ? selectedValues.filter((v) => v !== option.value)
           : [...selectedValues, option.value];
          updateResponse(newValues);
         }}
         className={`w-full flex items-center gap-4 min-h-[52px] px-5 rounded-2xl border-2 transition-all duration-200 text-left ${
          isSelected ? selectedOptionClass : unselectedOptionClass
         }`}
        >
         <div
          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
           isSelected
            ? "border-blue-500 bg-blue-500 scale-110"
            : "border-slate-300"
          }`}
         >
          {isSelected && <Check className='h-3 w-3 text-white' />}
         </div>
         <span
          className={`text-sm ${isSelected ? "text-blue-700 font-semibold" : "text-slate-700 font-medium"}`}
         >
          {option.label}
         </span>
        </button>
       );
      })}
     </div>
    );

   case "slider":
    const sliderValue =
     typeof response === "number" ? response : question.min || 0;
    return (
     <div className='space-y-5'>
      <div className='flex items-center justify-between'>
       <span className='text-5xl font-black text-slate-800 tabular-nums'>
        {sliderValue}
       </span>
       <span
        className={`text-sm font-bold px-4 py-2 rounded-full ${
         sliderValue === 0
          ? "bg-sky-100 text-sky-700"
          : sliderValue <= 3
            ? "bg-sky-100 text-sky-700"
            : sliderValue <= 6
              ? "bg-amber-100 text-amber-700"
              : sliderValue <= 8
                ? "bg-orange-100 text-orange-700"
                : "bg-red-100 text-red-700"
        }`}
       >
        {sliderValue === 0
         ? "None"
         : sliderValue <= 3
           ? "Mild"
           : sliderValue <= 6
             ? "Moderate"
             : sliderValue <= 8
               ? "Severe"
               : "Worst"}
       </span>
      </div>
      <input
       type='range'
       min={question.min || 0}
       max={question.max || 10}
       value={sliderValue}
       onChange={(e) => updateResponse(parseInt(e.target.value))}
       className='w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer touch-pan-y
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-8
                [&::-webkit-slider-thumb]:h-8
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-600
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-xl
                [&::-webkit-slider-thumb]:shadow-blue-500/30
                [&::-webkit-slider-thumb]:border-4
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:active:scale-125'
      />
      <div className='flex justify-between text-xs font-medium text-slate-500 px-1'>
       <span>0</span>
       <span>5</span>
       <span>10</span>
      </div>
     </div>
    );

   case "text":
   default:
    return (
     <Textarea
      value={response || ""}
      onChange={(e) => updateResponse(e.target.value)}
      placeholder={question.placeholder || "Enter your response..."}
      className='min-h-[100px] bg-white border-2 border-slate-200 text-slate-800 rounded-2xl resize-none text-sm p-4 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200'
     />
    );
  }
 };

 // Render clubbed questions (multiple questions on one screen)
 const renderClubbedQuestions = () => {
  if (clubbedQuestions.length === 0 || isProcessing || isTyping) return null;

  return (
   <div className='space-y-6'>
    {clubbedQuestions.map((question, index) => {
     const isConditionallyDisabled =
      question.id === "previous_episode_comparison" &&
      clubbedResponses["previous_episodes"] !== "yes";

     return (
      <div
       key={question.id}
       className={`space-y-3 ${isConditionallyDisabled ? "opacity-40 pointer-events-none" : ""}`}
      >
       <div className='flex items-start gap-3'>
        <span
         className={`flex-shrink-0 w-7 h-7 rounded-full text-sm font-semibold flex items-center justify-center ${
          isConditionallyDisabled
           ? "bg-slate-100 text-slate-400"
           : "bg-blue-100 text-blue-600"
         }`}
        >
         {index + 1}
        </span>
        <p
         className={`font-semibold text-sm leading-relaxed ${
          isConditionallyDisabled ? "text-slate-400" : "text-slate-800"
         }`}
        >
         {question.question}
         {isConditionallyDisabled && (
          <span className='text-xs text-slate-400 ml-2 font-normal'>
           (only if yes above)
          </span>
         )}
        </p>
       </div>
       <div className='ml-10'>{renderClubbedInput(question)}</div>
      </div>
     );
    })}

    <Button
     onClick={handleSubmit}
     disabled={!canSubmit()}
     className={primaryBtnClass}
    >
     Continue <ArrowRight className='ml-2 h-5 w-5' />
    </Button>
   </div>
  );
 };

 const renderInput = () => {
  if (clubbedQuestions.length > 0) {
   return renderClubbedQuestions();
  }

  if (!currentQuestion || isProcessing || isTyping) return null;

  // DEBUG: Log question details for region-specific questions
  if (currentQuestion.id === 'aggravating_factors' || currentQuestion.id === 'relieving_factors') {
   console.log('🔍 REGION QUESTION:', currentQuestion.id);
   console.log('🔍 Type:', currentQuestion.type);
   console.log('🔍 Question text:', currentQuestion.question);
   console.log('🔍 Options count:', currentQuestion.options?.length || 0);
   console.log('🔍 Options:', currentQuestion.options);
  }

  switch (currentQuestion.type) {
   case "text":
    return (
     <div className='space-y-4'>
      <Textarea
       value={currentResponse}
       onChange={(e) => setCurrentResponse(e.target.value)}
       placeholder={currentQuestion.placeholder || "Describe in detail..."}
       className='min-h-[140px] bg-white border-2 border-slate-200 text-slate-800 rounded-2xl resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm p-5 transition-all duration-200 placeholder:text-slate-400'
       autoFocus
      />
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
     </div>
    );

   case "date":
    return (
     <div className='space-y-4'>
      <DatePickerInput
       value={currentResponse}
       onChange={(val) => setCurrentResponse(val)}
      />
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
     </div>
    );

   case "yes_no":
    return (
     <motion.div
      className='grid grid-cols-2 gap-4'
      role='radiogroup'
      aria-label={currentQuestion?.question}
      variants={optionsContainerVariants}
      initial='initial'
      animate='animate'
     >
      {[
       { value: "yes", label: "Yes", icon: Check },
       { value: "no", label: "No", icon: CircleDot },
      ].map(({ value, label, icon: Icon }, index) => (
       <motion.button
        key={value}
        variants={optionVariants}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        role='radio'
        aria-checked={currentResponse === value}
        tabIndex={
         currentResponse === value || (!currentResponse && index === 0) ? 0 : -1
        }
        onClick={() => {
         setCurrentResponse(value);
         setTimeout(handleSubmit, 100);
        }}
        onKeyDown={(e) => {
         if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          setCurrentResponse(value === "yes" ? "no" : "yes");
         } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setCurrentResponse(value);
          setTimeout(handleSubmit, 100);
         }
        }}
        className={`flex items-center justify-center gap-3 min-h-[60px] rounded-2xl border-2 transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                   currentResponse === value
                    ? "border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-500/25"
                    : `${unselectedOptionClass} text-slate-700`
                  }`}
       >
        <Icon
         className={`h-5 w-5 ${currentResponse === value ? "text-white" : "text-slate-400"}`}
        />
        <span className='font-semibold text-base'>{label}</span>
       </motion.button>
      ))}
     </motion.div>
    );

   case "single_choice":
    return (
     <motion.div
      role='radiogroup'
      aria-label={currentQuestion.question}
      className='space-y-2.5'
      variants={optionsContainerVariants}
      initial='initial'
      animate='animate'
     >
      {currentQuestion.options?.map((option, index) => (
       <motion.button
        key={option.value}
        variants={optionVariants}
        whileHover={{ scale: 1.01, x: 4 }}
        whileTap={{ scale: 0.99 }}
        role='radio'
        aria-checked={currentResponse === option.value}
        tabIndex={
         currentResponse === option.value || (!currentResponse && index === 0)
          ? 0
          : -1
        }
        onClick={() => {
         setCurrentResponse(option.value);
         setTimeout(handleSubmit, 120);
        }}
        onKeyDown={(e) => {
         if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          const nextIndex =
           (index + 1) % (currentQuestion.options?.length || 1);
          setCurrentResponse(currentQuestion.options?.[nextIndex]?.value);
         } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          const prevIndex =
           (index - 1 + (currentQuestion.options?.length || 1)) %
           (currentQuestion.options?.length || 1);
          setCurrentResponse(currentQuestion.options?.[prevIndex]?.value);
         } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setCurrentResponse(option.value);
          setTimeout(handleSubmit, 120);
         }
        }}
        className={`w-full flex items-center gap-4 min-h-[52px] px-5 rounded-2xl border-2 transition-all duration-200 text-left
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                   currentResponse === option.value
                    ? selectedOptionClass
                    : unselectedOptionClass
                  }`}
       >
        <div
         className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          currentResponse === option.value
           ? "border-blue-500 bg-blue-500 scale-110"
           : "border-slate-300"
         }`}
        >
         <AnimatedCheckmark show={currentResponse === option.value} />
        </div>
        <span
         className={`text-sm ${currentResponse === option.value ? "text-blue-700 font-semibold" : "text-slate-700 font-medium"}`}
        >
         {option.label}
        </span>
       </motion.button>
      ))}
     </motion.div>
    );

   case "multi_choice":
   case "checklist":
    // Special case for pain_location - grouped body part selector
    if (currentQuestion.id === "pain_location") {
     const bodyPartGroups = [
      {
       label: "Head & Spine",
       parts: [
        { id: "head", name: "Head", hasLaterality: false },
        { id: "neck", name: "Neck", hasLaterality: false },
        {
         id: "upper_back",
         name: "Upper Back (Thoracic)",
         hasLaterality: false,
        },
        { id: "lower_back", name: "Lower Back (Lumbar)", hasLaterality: false },
        { id: "chest", name: "Chest", hasLaterality: false },
       ],
      },
      {
       label: "Upper Limb",
       parts: [
        { id: "shoulder", name: "Shoulder", hasLaterality: true },
        { id: "arm", name: "Upper Arm", hasLaterality: true },
        { id: "elbow", name: "Elbow", hasLaterality: true },
        { id: "forearm", name: "Forearm", hasLaterality: true },
        { id: "wrist", name: "Wrist", hasLaterality: true },
        { id: "hand", name: "Hand", hasLaterality: true },
       ],
      },
      {
       label: "Lower Limb",
       parts: [
        { id: "hip", name: "Hip", hasLaterality: true },
        { id: "thigh", name: "Thigh", hasLaterality: true },
        { id: "knee", name: "Knee", hasLaterality: true },
        { id: "leg", name: "Lower Leg (Calf)", hasLaterality: true },
        { id: "ankle", name: "Ankle", hasLaterality: true },
        { id: "foot", name: "Foot", hasLaterality: true },
       ],
      },
     ];

     const selectedParts = Array.isArray(currentResponse)
      ? currentResponse
      : [];

     const togglePart = (partId: string) => {
      setCurrentResponse((prev: string[]) => {
       const arr = Array.isArray(prev) ? prev : [];
       const filtered = arr.filter((v) => !v.startsWith(partId));
       if (arr.some((v) => v.startsWith(partId))) {
        return filtered;
       }
       return [...filtered, partId];
      });
     };

     const selectLaterality = (
      partId: string,
      laterality: "left" | "right" | "both",
     ) => {
      setCurrentResponse((prev: string[]) => {
       const arr = Array.isArray(prev) ? prev : [];
       const filtered = arr.filter((v) => !v.startsWith(partId));
       return [...filtered, `${partId}_${laterality}`];
      });
     };

     const getSelectedLaterality = (partId: string): string | null => {
      const found = selectedParts.find((v) => v.startsWith(partId));
      if (!found) return null;
      if (found === partId) return "selected";
      return found.split("_").pop() || null;
     };

     return (
      <div className='space-y-4'>
       {bodyPartGroups.map((group) => (
        <div key={group.label} className='space-y-2'>
         <h4 className='text-xs font-semibold text-slate-500 uppercase tracking-wide px-1'>
          {group.label}
         </h4>
         <div className='space-y-2'>
          {group.parts.map((part) => {
           const selectedLat = getSelectedLaterality(part.id);
           const isSelected = selectedLat !== null;

           return (
            <div key={part.id} className='space-y-1'>
             <button
              onClick={() => {
               if (part.hasLaterality) {
                if (isSelected) {
                 togglePart(part.id);
                } else {
                 setCurrentResponse((prev: string[]) => {
                  const arr = Array.isArray(prev) ? prev : [];
                  return [...arr, `${part.id}_pending`];
                 });
                }
               } else {
                togglePart(part.id);
               }
              }}
              className={`w-full flex items-center justify-between min-h-[48px] px-4 rounded-xl border-2 transition-all duration-150 ${
               isSelected
                ? "border-blue-500 bg-blue-50/60"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
              }`}
             >
              <div className='flex items-center gap-3'>
               <div
                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                 isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                }`}
               >
                {isSelected && <Check className='h-3 w-3 text-white' />}
               </div>
               <span
                className={`text-sm ${isSelected ? "text-blue-700 font-medium" : "text-slate-700"}`}
               >
                {part.name}
               </span>
              </div>
              {part.hasLaterality &&
               isSelected &&
               selectedLat !== "pending" && (
                <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize font-medium'>
                 {selectedLat}
                </span>
               )}
             </button>

             {part.hasLaterality && isSelected && (
              <div className='flex gap-2 pl-8'>
               {["left", "right", "both"].map((lat) => (
                <button
                 key={lat}
                 onClick={() =>
                  selectLaterality(part.id, lat as "left" | "right" | "both")
                 }
                 className={`flex-1 py-2 px-3 text-xs font-medium rounded-xl border-2 transition-all ${
                  selectedLat === lat
                   ? "border-blue-500 bg-blue-600 text-white"
                   : "border-slate-200 bg-white hover:border-blue-300 text-slate-600"
                 }`}
                >
                 {lat === "both"
                  ? "Both"
                  : lat.charAt(0).toUpperCase() + lat.slice(1)}
                </button>
               ))}
              </div>
             )}
            </div>
           );
          })}
         </div>
        </div>
       ))}
       <Button
        onClick={handleSubmit}
        disabled={
         !canSubmit() || selectedParts.some((p) => p.endsWith("_pending"))
        }
        className={primaryBtnClass}
       >
        Continue <ArrowRight className='ml-2 h-4 w-4' />
       </Button>
      </div>
     );
    }

    // Regular multi_choice/checklist
    return (
     <div className='space-y-3'>
      <div className='space-y-2.5'>
       {currentQuestion.options?.map((option) => {
        const isSelected =
         Array.isArray(currentResponse) &&
         currentResponse.includes(option.value);
        return (
         <button
          key={option.value}
          onClick={() => {
           setCurrentResponse((prev: string[]) => {
            const arr = Array.isArray(prev) ? prev : [];
            return arr.includes(option.value)
             ? arr.filter((v) => v !== option.value)
             : [...arr, option.value];
           });
          }}
          className={`w-full flex items-center gap-4 min-h-[52px] px-5 rounded-2xl border-2 transition-all duration-200 text-left ${
           isSelected ? selectedOptionClass : unselectedOptionClass
          }`}
         >
          <div
           className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isSelected
             ? "border-blue-500 bg-blue-500 scale-110"
             : "border-slate-300"
           }`}
          >
           {isSelected && <Check className='h-3 w-3 text-white' />}
          </div>
          <span
           className={`text-sm ${isSelected ? "text-blue-700 font-semibold" : "text-slate-700 font-medium"}`}
          >
           {option.label}
          </span>
         </button>
        );
       })}
      </div>
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={`${primaryBtnClass} mt-4`}
      >
       Continue <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
     </div>
    );

   case "slider":
    const sliderValue =
     typeof currentResponse === "number" ? currentResponse : 0;
    const getSeverityStyle = (value: number) => {
     if (value === 0) return "bg-sky-100 text-sky-700";
     if (value <= 3) return "bg-sky-100 text-sky-700";
     if (value <= 6) return "bg-amber-100 text-amber-700";
     if (value <= 8) return "bg-orange-100 text-orange-700";
     return "bg-red-100 text-red-700";
    };

    const getAmbientBg = (value: number) => {
     if (value === 0) return "from-sky-50/50 to-white";
     if (value <= 3) return "from-sky-50/50 to-white";
     if (value <= 6) return "from-amber-50/50 to-white";
     if (value <= 8) return "from-orange-50/50 to-white";
     return "from-red-50/50 to-white";
    };

    return (
     <div className='space-y-5'>
      <div
       className={`bg-gradient-to-br ${getAmbientBg(sliderValue)} rounded-2xl p-7 sm:p-8 shadow-sm border-2 border-slate-100 transition-all duration-500`}
      >
       <motion.div
        className='text-center mb-8'
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 0.3 }}
        key={sliderValue}
       >
        <motion.div
         className='text-7xl font-black bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent tabular-nums'
         animate={{ scale: [1.1, 1] }}
         transition={{ duration: 0.2 }}
         key={sliderValue}
        >
         {sliderValue}
        </motion.div>
        <motion.div
         className={`text-sm font-bold mt-3 inline-block px-5 py-1.5 rounded-full shadow-sm ${getSeverityStyle(sliderValue)}`}
         animate={{ scale: [1.1, 1] }}
         transition={{ duration: 0.2 }}
         key={`badge-${sliderValue}`}
        >
         {sliderValue === 0
          ? "No pain"
          : sliderValue <= 3
            ? "Mild pain"
            : sliderValue <= 6
              ? "Moderate pain"
              : sliderValue <= 8
                ? "Severe pain"
                : "Worst pain"}
        </motion.div>
       </motion.div>

       <div className='relative'>
        <input
         type='range'
         min={currentQuestion.min || 0}
         max={currentQuestion.max || 10}
         value={sliderValue}
         onChange={(e) => setCurrentResponse(parseInt(e.target.value))}
         aria-label='Pain scale from 0 to 10'
         aria-valuemin={currentQuestion.min || 0}
         aria-valuemax={currentQuestion.max || 10}
         aria-valuenow={sliderValue}
         aria-valuetext={
          sliderValue === 0
           ? "No pain"
           : sliderValue <= 3
             ? "Mild pain"
             : sliderValue <= 6
               ? "Moderate pain"
               : sliderValue <= 8
                 ? "Severe pain"
                 : "Worst pain"
         }
         style={{
          background: `linear-gradient(to right,
                      rgb(56, 189, 248) 0%,
                      rgb(234, 179, 8) 50%,
                      rgb(239, 68, 68) 100%)`,
         }}
         className='w-full h-3 rounded-full appearance-none cursor-grab active:cursor-grabbing shadow-inner
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-10
                    [&::-webkit-slider-thumb]:h-10
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-grab
                    [&::-webkit-slider-thumb]:shadow-2xl
                    [&::-webkit-slider-thumb]:shadow-slate-900/20
                    [&::-webkit-slider-thumb]:border-4
                    [&::-webkit-slider-thumb]:border-blue-500
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-150
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-thumb]:active:scale-125
                    [&::-webkit-slider-thumb]:active:cursor-grabbing
                    [&::-webkit-slider-thumb]:focus-visible:ring-4
                    [&::-webkit-slider-thumb]:focus-visible:ring-blue-200'
        />
       </div>

       <div className='flex justify-between text-sm font-semibold text-slate-500 mt-5 px-1'>
        <div className='flex flex-col items-start'>
         <span className='text-xl'>😊</span>
         <span className='text-xs'>None</span>
        </div>
        <div className='flex flex-col items-center'>
         <span className='text-xl'>😐</span>
         <span className='text-xs'>Moderate</span>
        </div>
        <div className='flex flex-col items-end'>
         <span className='text-xl'>😣</span>
         <span className='text-xs'>Worst</span>
        </div>
       </div>
      </div>
      <Button onClick={handleSubmit} className={primaryBtnClass}>
       Continue <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
     </div>
    );

   case "body_map":
    const handleBodyMapComplete = () => {
     if (Array.isArray(currentResponse) && currentResponse.length > 0) {
      const flatRegions = currentResponse.flatMap((selection: any) => {
       const mainRegion = selection.mainRegion;
       const laterality = selection.laterality;
       const subRegions = selection.subRegions || [];

       if (laterality === "both") {
        return [
         ...subRegions.map((sub: string) => `${mainRegion}_left_${sub}`),
         ...subRegions.map((sub: string) => `${mainRegion}_right_${sub}`),
        ];
       } else if (laterality === "center") {
        return subRegions.map((sub: string) => `${mainRegion}_${sub}`);
       } else {
        return subRegions.map(
         (sub: string) => `${mainRegion}_${laterality}_${sub}`,
        );
       }
      });

      const structuredData = {
       regions: flatRegions,
       detailed: currentResponse,
      };

      setCurrentResponse(structuredData);
      setTimeout(() => handleSubmit(), 100);
     }
    };

    return (
     <div className='h-[500px]'>
      <BodyMapSelector
       selectedRegions={Array.isArray(currentResponse) ? currentResponse : []}
       onSelectionChange={(regions) => setCurrentResponse(regions)}
       onComplete={handleBodyMapComplete}
       maxSelections={5}
      />
     </div>
    );

   case "red_flags":
    return (
     <div className='space-y-4'>
      <div className='flex items-center gap-3 px-5 py-3.5 bg-amber-50 rounded-2xl border-2 border-amber-200'>
       <AlertCircle className='h-5 w-5 text-amber-600 flex-shrink-0' />
       <span className='text-amber-700 text-sm font-semibold'>
        Select any that apply, or continue if none
       </span>
      </div>
      <div className='max-h-[350px] overflow-y-auto space-y-2.5'>
       {currentQuestion.options?.map((option) => {
        const isSelected =
         Array.isArray(currentResponse) &&
         currentResponse.includes(option.value);
        return (
         <button
          key={option.value}
          onClick={() => {
           setCurrentResponse((prev: string[]) => {
            const arr = Array.isArray(prev) ? prev : [];
            return arr.includes(option.value)
             ? arr.filter((v) => v !== option.value)
             : [...arr, option.value];
           });
          }}
          className={`w-full flex items-center gap-4 min-h-[52px] px-5 rounded-2xl border-2 transition-all duration-200 text-left ${
           isSelected
            ? "border-amber-400 bg-amber-50 shadow-lg shadow-amber-500/10"
            : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30 hover:shadow-md hover:-translate-y-0.5"
          }`}
         >
          <div
           className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isSelected
             ? "border-amber-500 bg-amber-500 scale-110"
             : "border-slate-300"
           }`}
          >
           {isSelected && <Check className='h-3 w-3 text-white' />}
          </div>
          <span
           className={`text-sm ${isSelected ? "text-amber-800 font-semibold" : "text-slate-700 font-medium"}`}
          >
           {option.label}
          </span>
         </button>
        );
       })}
      </div>
      <Button onClick={handleSubmit} className={primaryBtnClass}>
       {Array.isArray(currentResponse) && currentResponse.length === 0
        ? "None Apply — Continue"
        : "Continue"}{" "}
       <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
     </div>
    );

   case "tenderness_map":
    return (
     <div className='space-y-3'>
      <div className='text-xs text-slate-500 px-1 font-medium'>
       0 = None · 1 = Mild · 2 = Moderate · 3 = Severe
      </div>
      {["Anterior", "Posterior", "Medial", "Lateral", "Deep"].map(
       (location) => (
        <div
         key={location}
         className='flex items-center justify-between p-4 bg-slate-50 rounded-xl'
        >
         <span className='font-medium text-slate-700 text-sm'>{location}</span>
         <div className='flex gap-2'>
          {[0, 1, 2, 3].map((grade) => (
           <button
            key={grade}
            onClick={() =>
             setCurrentResponse((prev: any) => ({
              ...prev,
              [location]: grade.toString(),
             }))
            }
            className={`min-w-[44px] min-h-[44px] rounded-xl font-semibold text-sm transition-all ${
             currentResponse?.[location] === grade.toString()
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
            }`}
           >
            {grade}
           </button>
          ))}
         </div>
        </div>
       ),
      )}
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
     </div>
    );

   case "measurement":
    return (
     <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
       <div>
        <Label className='text-xs font-medium text-slate-600'>Location</Label>
        <Input
         placeholder='e.g. 10cm above patella'
         value={currentResponse?.location || ""}
         onChange={(e) =>
          setCurrentResponse((prev: any) => ({
           ...prev,
           location: e.target.value,
          }))
         }
         className='mt-1 rounded-xl border-slate-200 focus:border-blue-400'
        />
       </div>
       <div>
        <Label className='text-xs font-medium text-slate-600'>Value (cm)</Label>
        <Input
         type='number'
         placeholder='0.0'
         step='0.1'
         value={currentResponse?.measurement || ""}
         onChange={(e) =>
          setCurrentResponse((prev: any) => ({
           ...prev,
           measurement: e.target.value,
          }))
         }
         className='mt-1 rounded-xl border-slate-200 focus:border-blue-400'
        />
       </div>
      </div>
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
     </div>
    );

   case "rom_measurement":
    return (
     <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
       {[
        "Flexion",
        "Extension",
        "Abduction",
        "Adduction",
        "Int. Rotation",
        "Ext. Rotation",
       ].map((movement) => (
        <div key={movement}>
         <Label className='text-xs font-medium text-slate-500'>
          {movement} (°)
         </Label>
         <Input
          type='number'
          placeholder='0'
          value={
           currentResponse?.[
            movement.toLowerCase().replace(". ", "_").replace(" ", "_")
           ] || ""
          }
          onChange={(e) =>
           setCurrentResponse((prev: any) => ({
            ...prev,
            [movement.toLowerCase().replace(". ", "_").replace(" ", "_")]:
             e.target.value,
           }))
          }
          className='mt-1 rounded-xl border-slate-200 focus:border-blue-400'
         />
        </div>
       ))}
      </div>
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
     </div>
    );

   case "mmt_testing":
    return (
     <div className='space-y-4'>
      <div className='text-xs text-slate-500 px-1 font-medium'>
       Oxford Scale: 0–5 (0 = No contraction, 5 = Normal)
      </div>
      <div className='max-h-[350px] overflow-y-auto space-y-3'>
       {currentQuestion.options?.map((muscle) => (
        <div key={muscle.value} className='p-4 bg-slate-50 rounded-xl'>
         <span className='font-medium text-slate-700 text-sm block mb-3'>
          {muscle.label}
         </span>
         <div className='flex gap-2 flex-wrap'>
          {[0, 1, 2, 3, 4, 5].map((grade) => (
           <button
            key={grade}
            onClick={() =>
             setCurrentResponse((prev: any) => ({
              ...prev,
              [muscle.value]: grade.toString(),
             }))
            }
            className={`min-w-[40px] min-h-[40px] rounded-xl text-sm font-semibold transition-all ${
             currentResponse?.[muscle.value] === grade.toString()
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
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
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
     </div>
    );

   case "scale_grid":
    return (
     <div className='space-y-4'>
      <div className='max-h-[350px] overflow-y-auto space-y-4'>
       {currentQuestion.options?.map((item) => (
        <div key={item.value} className='p-4 bg-slate-50 rounded-xl'>
         <Label className='font-medium text-slate-700 text-sm block mb-3'>
          {item.label}
         </Label>
         <div className='flex gap-1.5 flex-wrap'>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
           <button
            key={score}
            onClick={() =>
             setCurrentResponse((prev: any) => ({
              ...prev,
              [item.value]: score.toString(),
             }))
            }
            className={`min-w-[36px] min-h-[40px] rounded-lg text-sm font-semibold transition-all ${
             currentResponse?.[item.value] === score.toString()
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
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
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
     </div>
    );

   case "observational":
    return (
     <div className='space-y-4'>
      <div className='max-h-[350px] overflow-y-auto space-y-2.5'>
       {currentQuestion.options?.map((observation) => {
        const isSelected =
         Array.isArray(currentResponse) &&
         currentResponse.includes(observation.value);
        return (
         <button
          key={observation.value}
          onClick={() => {
           setCurrentResponse((prev: string[]) => {
            const arr = Array.isArray(prev) ? prev : [];
            return arr.includes(observation.value)
             ? arr.filter((v) => v !== observation.value)
             : [...arr, observation.value];
           });
          }}
          className={`w-full flex items-center gap-4 min-h-[52px] px-5 rounded-2xl border-2 transition-all duration-200 text-left ${
           isSelected ? selectedOptionClass : unselectedOptionClass
          }`}
         >
          <div
           className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isSelected
             ? "border-blue-500 bg-blue-500 scale-110"
             : "border-slate-300"
           }`}
          >
           {isSelected && <Check className='h-3 w-3 text-white' />}
          </div>
          <span
           className={`text-sm ${isSelected ? "text-blue-700 font-semibold" : "text-slate-700 font-medium"}`}
          >
           {observation.label}
          </span>
         </button>
        );
       })}
      </div>
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={`${primaryBtnClass} mt-4`}
      >
       Continue <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
     </div>
    );

   default:
    console.warn('⚠️ DEFAULT CASE HIT! Question type not handled:', currentQuestion.type, 'for question:', currentQuestion.id);
    return (
     <div className='space-y-4'>
      <Input
       value={currentResponse}
       onChange={(e) => setCurrentResponse(e.target.value)}
       placeholder='Enter your response...'
       className='rounded-2xl border-2 border-slate-200 min-h-[52px] text-sm px-5 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200'
       autoFocus
      />
      <Button
       onClick={handleSubmit}
       disabled={!canSubmit()}
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-5 w-5' />
      </Button>
     </div>
    );
  }
 };

 // ==================== Render Diagnosis Results ====================

 const renderDiagnosisResults = () => {
  if (!diagnosisResult) return null;

  const responses = collectedData;
  const vasScore = responses.vas_score;
  const classification = responses.condition_classification || "ACUTE";
  const progression = responses.symptom_progression;
  const chiefComplaint = responses.chief_complaint;
  const onsetDate = responses.symptom_onset;
  const painNature = responses.pain_nature;
  const aggravating = responses.aggravating_factors;
  const relieving = responses.relieving_factors;
  const behavior24hr = responses.behavior_24hr;

  let locationStr = "";
  if (responses.pain_location) {
   if (Array.isArray(responses.pain_location)) {
    locationStr = responses.pain_location
     .map((loc: any) => {
      if (typeof loc === "string") return loc;
      return loc?.slug || loc?.name || "";
     })
     .filter(Boolean)
     .join(", ")
     .replace(/_/g, " ");
   } else if (typeof responses.pain_location === "object") {
    locationStr = (
     responses.pain_location.slug ||
     responses.pain_location.name ||
     ""
    ).replace(/_/g, " ");
   } else {
    locationStr = String(responses.pain_location).replace(/_/g, " ");
   }
  }

  const progressionText =
   progression === "getting_worse"
    ? "Worsening"
    : progression === "getting_better"
      ? "Improving"
      : progression === "staying_same"
        ? "Stable"
        : progression?.replace(/_/g, " ") || "";

  const formatOnset = () => {
   if (!onsetDate) return null;
   const days = Math.floor(
    (Date.now() - new Date(onsetDate).getTime()) / (1000 * 60 * 60 * 24),
   );
   if (days === 0) return "Today";
   if (days === 1) return "Yesterday";
   if (days <= 7) return `${days} days ago`;
   if (days <= 30) return `${Math.ceil(days / 7)} weeks ago`;
   return `${Math.ceil(days / 30)} months ago`;
  };

  const formatArray = (val: any) => {
   if (!val) return null;
   if (Array.isArray(val))
    return val.map((v) => String(v).replace(/_/g, " ")).join(", ");
   return String(val).replace(/_/g, " ");
  };

  return (
   <div className='space-y-5'>
    {/* 1. RED FLAGS BANNER */}
    {(engine.requiresUrgentReferral() || detectedRedFlags.length > 0) && (
     <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white rounded-2xl p-5 shadow-2xl shadow-red-500/20 border border-red-400'
     >
      <div className='flex items-start gap-4'>
       <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: 3 }}
       >
        <AlertTriangle className='h-6 w-6 flex-shrink-0' />
       </motion.div>
       <div className='flex-1'>
        <p className='font-bold text-lg'>
         ⚠️ Red Flags Detected — Screen Before MSK Treatment
        </p>
        {detectedRedFlags.length > 0 && (
         <p className='text-red-100 text-sm mt-2 font-medium'>
          {detectedRedFlags.map((f) => f.replace(/_/g, " ")).join(" · ")}
         </p>
        )}
        {identifiedSources.some(
         (s) =>
          s.sourceRegion.toLowerCase().includes("cardiac") ||
          s.sourceRegion.toLowerCase().includes("gallbladder"),
        ) && (
         <p className='text-red-100 text-xs mt-3 pt-3 border-t border-red-400/50'>
          💡 Left shoulder + exertion = cardiac · Right shoulder + meals =
          gallbladder
         </p>
        )}
       </div>
      </div>
     </motion.div>
    )}

    {/* 2. QUICK-SCAN TAGS */}
    <motion.div
     initial={{ opacity: 0, y: -10 }}
     animate={{ opacity: 1, y: 0 }}
     className='flex flex-wrap gap-2 text-sm font-bold'
    >
     <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1, type: "spring" }}
      className={`px-4 py-2 rounded-xl shadow-sm ${
       classification === "ACUTE"
        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
        : classification === "CHRONIC"
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          : "bg-gradient-to-r from-slate-700 to-slate-800 text-white"
      }`}
     >
      {classification}
     </motion.span>
     {vasScore !== undefined && (
      <motion.span
       initial={{ scale: 0 }}
       animate={{ scale: 1 }}
       transition={{ delay: 0.2, type: "spring" }}
       className={`px-4 py-2 rounded-xl shadow-sm ${
        vasScore >= 7
         ? "bg-red-100 text-red-700"
         : vasScore >= 4
           ? "bg-amber-100 text-amber-700"
           : "bg-sky-100 text-sky-700"
       }`}
      >
       VAS {vasScore}/10
      </motion.span>
     )}
     {locationStr && (
      <motion.span
       initial={{ scale: 0 }}
       animate={{ scale: 1 }}
       transition={{ delay: 0.3, type: "spring" }}
       className='px-4 py-2 rounded-xl bg-slate-100 text-slate-700 capitalize shadow-sm'
      >
       📍 {locationStr}
      </motion.span>
     )}
     {progressionText && (
      <motion.span
       initial={{ scale: 0 }}
       animate={{ scale: 1 }}
       transition={{ delay: 0.4, type: "spring" }}
       className={`px-4 py-2 rounded-xl shadow-sm ${
        progression === "getting_worse"
         ? "bg-red-100 text-red-700"
         : progression === "getting_better"
           ? "bg-sky-100 text-sky-700"
           : "bg-slate-100 text-slate-600"
       }`}
      >
       {progression === "getting_worse"
        ? "📈"
        : progression === "getting_better"
          ? "📉"
          : "➡️"}{" "}
       {progressionText}
      </motion.span>
     )}
    </motion.div>

    {/* 3. TWO-COLUMN: Summary | Diagnosis */}
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
     {/* LEFT: Clinical Summary */}
     <div className='space-y-3 order-2 lg:order-1'>
      {chiefComplaint && (
       <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 p-4'
       >
        <p className='text-xs uppercase tracking-wider text-blue-600 font-bold mb-2 flex items-center gap-2'>
         <Stethoscope className='w-3 h-3' /> Chief Complaint
        </p>
        <p className='text-slate-800 font-semibold text-sm leading-relaxed'>
         {chiefComplaint}
        </p>
       </motion.div>
      )}

      <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.1 }}
       className='bg-white rounded-2xl border-2 border-slate-200 overflow-hidden'
      >
       <div className='px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100'>
        <span className='text-sm font-bold text-slate-700'>Clinical Data</span>
       </div>
       <div className='divide-y divide-slate-50'>
        {formatOnset() && (
         <div className='px-4 py-2.5 flex justify-between'>
          <span className='text-xs text-slate-500'>Onset</span>
          <span className='text-xs text-slate-700 font-medium'>
           {formatOnset()}
          </span>
         </div>
        )}
        {painNature && (
         <div className='px-4 py-2.5 flex justify-between'>
          <span className='text-xs text-slate-500'>Pain Type</span>
          <span className='text-xs text-slate-700 font-medium capitalize'>
           {formatArray(painNature)}
          </span>
         </div>
        )}
        {behavior24hr && (
         <div className='px-4 py-2.5 flex justify-between'>
          <span className='text-xs text-slate-500'>24hr Pattern</span>
          <span className='text-xs text-slate-700 font-medium capitalize'>
           {behavior24hr.replace(/_/g, " ")}
          </span>
         </div>
        )}
        {aggravating && (
         <div className='px-4 py-2.5 flex justify-between gap-4'>
          <span className='text-xs text-slate-500 flex-shrink-0'>
           Aggravating
          </span>
          <span className='text-xs text-slate-700 font-medium text-right capitalize'>
           {formatArray(aggravating)}
          </span>
         </div>
        )}
        {relieving && (
         <div className='px-4 py-2.5 flex justify-between gap-4'>
          <span className='text-xs text-slate-500 flex-shrink-0'>
           Relieving
          </span>
          <span className='text-xs text-slate-700 font-medium text-right capitalize'>
           {formatArray(relieving)}
          </span>
         </div>
        )}
       </div>
      </motion.div>

      {/* Referral Screening */}
      {identifiedSources.length > 0 && (
       <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-white rounded-2xl border-2 border-blue-200 overflow-hidden shadow-sm'
       >
        <div className='px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2'>
         <div className='w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center'>
          <Crosshair className='h-4 w-4 text-white' />
         </div>
         <span className='text-sm font-bold text-slate-800'>
          AI Source Detection
         </span>
        </div>
        {locationStr && (
         <div className='px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-xs'>
          <span className='text-slate-400'>Pain Site:</span>
          <span className='ml-1 font-medium text-slate-600 capitalize'>
           {locationStr}
          </span>
         </div>
        )}
        <div className='divide-y divide-slate-50'>
         {identifiedSources.map((source, idx) => {
          const isUrgent =
           source.sourceRegion.toLowerCase().includes("cardiac") ||
           source.sourceRegion.toLowerCase().includes("gallbladder") ||
           source.sourceRegion.toLowerCase().includes("vascular");
          return (
           <div key={idx} className='px-4 py-2.5 flex items-start gap-2'>
            <div
             className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isUrgent ? "bg-red-500" : "bg-blue-500"}`}
            />
            <div className='flex-1 min-w-0'>
             <div className='flex items-center gap-1.5 flex-wrap'>
              <span
               className={`text-xs font-bold uppercase ${isUrgent ? "text-red-600" : "text-slate-600"}`}
              >
               {source.sourceRegion.replace(/_/g, " ")}
              </span>
              {isUrgent && (
               <span className='text-xs leading-none px-1.5 py-0.5 bg-red-500 text-white rounded font-bold'>
                SCREEN
               </span>
              )}
             </div>
             <p className='text-xs text-slate-400 leading-tight'>
              {source.implication}
             </p>
            </div>
           </div>
          );
         })}
        </div>
       </motion.div>
      )}

      {/* Collapsible Summary */}
      <details className='bg-white rounded-xl border border-slate-200 overflow-hidden group'>
       <summary className='px-4 py-2.5 cursor-pointer hover:bg-slate-50 flex items-center justify-between list-none'>
        <div className='flex items-center gap-2'>
         <Stethoscope className='h-3.5 w-3.5 text-slate-400' />
         <span className='text-xs font-medium text-slate-600'>
          Full Summary
         </span>
        </div>
        <ChevronRight className='h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-90' />
       </summary>
       <div className='px-4 py-2.5 border-t border-slate-100 bg-slate-50 max-h-60 overflow-y-auto'>
        <pre className='text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed'>
         {diagnosisResult.clinicalSummary}
        </pre>
       </div>
      </details>
     </div>

     {/* RIGHT: Differential Diagnosis */}
     <motion.div
      className='order-1 lg:order-2'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
     >
      {diagnosisResult.success && diagnosisResult.diagnosis && (
       <div className='bg-white rounded-2xl border-2 border-slate-200 overflow-hidden h-full flex flex-col shadow-lg'>
        <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.2 }}
         className='px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between flex-shrink-0 relative overflow-hidden'
        >
         <motion.div
          animate={{ x: [0, 100], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent'
          style={{ width: "200%" }}
         />
         <div className='flex items-center gap-3 relative z-10'>
          <motion.div
           initial={{ rotate: -180, opacity: 0 }}
           animate={{ rotate: 0, opacity: 1 }}
           transition={{ delay: 0.3, type: "spring" }}
           className='w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center'
          >
           <Zap className='h-5 w-5' />
          </motion.div>
          <h3 className='font-bold text-base tracking-tight'>
           AI Differential Diagnosis
          </h3>
         </div>
         <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className='text-xs px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg font-bold relative z-10'
         >
          {diagnosisResult.diagnosis.treatment_urgency?.toUpperCase()}
         </motion.span>
        </motion.div>

        <div className='flex-1 divide-y divide-slate-100 overflow-y-auto'>
         {diagnosisResult.diagnosis.differential_diagnosis.map(
          (condition, index) => (
           <motion.button
            key={condition.condition_id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => handleConditionSelect(condition)}
            disabled={isProcessing}
            className={`w-full px-5 py-4 transition-all duration-200 text-left group disabled:opacity-50 relative ${
             index === 0
              ? "bg-gradient-to-r from-blue-50/40 to-transparent"
              : "hover:bg-blue-50/20"
            }`}
           >
            {index === 0 && (
             <div className='absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600' />
            )}
            <div className='flex items-start gap-4'>
             <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
               delay: 0.4 + index * 0.1,
               type: "spring",
               stiffness: 300,
              }}
              className='relative'
             >
              <span
               className={`w-9 h-9 rounded-xl text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm ${
                index === 0
                 ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 ring-blue-100"
                 : "bg-slate-200 text-slate-600"
               }`}
              >
               {index + 1}
              </span>
              {index === 0 && (
               <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className='absolute inset-0 rounded-xl bg-blue-500'
               />
              )}
             </motion.div>
             <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 flex-wrap mb-1.5'>
               <span
                className={`font-bold text-sm ${index === 0 ? "text-blue-700" : "text-slate-800"}`}
               >
                {condition.condition_name}
               </span>
               <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`text-xs px-2 py-0.5 rounded-lg font-bold overflow-hidden ${
                 index === 0
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                  : "bg-slate-200 text-slate-700"
                }`}
               >
                {Math.round(condition.confidence_score * 100)}%
               </motion.span>
              </div>
              <p className='text-xs text-slate-500 leading-relaxed'>
               {condition.clinical_reasoning}
              </p>
             </div>
             <ChevronRight
              className={`h-5 w-5 transition-all flex-shrink-0 ${
               index === 0
                ? "text-blue-500"
                : "text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1"
              }`}
             />
            </div>
           </motion.button>
          ),
         )}
        </div>

        <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.8 }}
         className='px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex-shrink-0'
        >
         <p className='text-xs text-slate-500 text-center'>
          Select a diagnosis to confirm and continue
         </p>
        </motion.div>
       </div>
      )}
     </motion.div>
    </div>

    {/* 4. ACTIONS */}
    <div className='flex gap-3 pt-2'>
     <Button
      variant='outline'
      onClick={handleReset}
      className='flex-1 rounded-xl h-11 border-slate-300 text-sm hover:bg-slate-50'
     >
      <RotateCcw className='mr-2 h-4 w-4' /> Start Over
     </Button>
     {onClose && (
      <Button
       onClick={onClose}
       className='flex-1 rounded-xl h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm'
      >
       Close
      </Button>
     )}
    </div>
   </div>
  );
 };

 // ==================== Main Render ====================

 // Helper: Check if question type is simple (supported by InlineClinicalQuestion)
 // Complex types need specialized rendering with the original renderInput() function
 const isSimpleQuestionType = (questionType: string): boolean => {
  return ["yes_no", "slider", "single_choice", "text"].includes(questionType);
 };

 // Helper: Convert ScreeningQuestion type to InlineClinicalQuestion type (only for simple types)
 const getQuestionType = (
  questionType: string,
 ): "yes-no" | "vas-slider" | "multiple-choice" | "text" => {
  switch (questionType) {
   case "yes_no":
    return "yes-no";
   case "slider":
    return "vas-slider";
   case "single_choice":
   case "multi_choice":
    return "multiple-choice";
   case "text":
   default:
    return "text";
  }
 };

 // Helper: Check if all clubbed questions are answered
 const isClubComplete = clubbedQuestions.every(
  (q) => clubbedResponses[q.id] !== undefined && clubbedResponses[q.id] !== "",
 );

 const progress = engine.getProgress();
 const currentStep = engine.getCurrentStepIndex();
 const totalSteps = engine.getTotalSteps();

 return (
  <>
   <ClinicalChatbotLayout
    patientName={patientName}
    isComplete={isComplete}
    onReset={handleReset}
    onClose={handleCloseClick}
    showSummary={showSummaryPanel}
    onToggleSummary={() => setShowSummaryPanel(!showSummaryPanel)}
    showSummaryByDefault={true}
    summaryContent={
     Object.keys(collectedData).length > 0 ? (
      <SlidingSummaryPanel
       isOpen={true}
       onClose={() => setShowSummaryPanel(false)}
       summary={{
        primaryArea: selectedRegions[0]?.label,
        painLevel: collectedData.vas_score,
        symptoms: Object.entries(collectedData)
         .filter(([key, val]) => typeof val === "string" && val.length > 0)
         .map(([key, val]) => String(val))
         .slice(0, 5),
        redFlags: detectedRedFlags,
        currentSection: currentClubLabel || undefined,
       }}
      />
     ) : undefined
    }
    progressComponent={
     !isComplete ? (
      <ChatProgress current={Object.keys(collectedData).length} total={totalSteps} />
     ) : undefined
    }
   >
    {/* Render all messages as chat bubbles */}
    {messages.map((msg) => (
     <ChatMessage key={msg.id} type={msg.type} content={msg.content} showAvatar={true} />
    ))}

    {/* Typing indicator */}
    {isTyping && (
     <ChatMessage
      type='bot'
      content={
       <div className='flex gap-2'>
        <span
         className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
         style={{ animationDelay: "0ms" }}
        />
        <span
         className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
         style={{ animationDelay: "150ms" }}
        />
        <span
         className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
         style={{ animationDelay: "300ms" }}
        />
       </div>
      }
      showAvatar={true}
     />
    )}

    {/* Simple questions using InlineClinicalQuestion */}
    {currentQuestion &&
     !isTyping &&
     !isProcessing &&
     clubbedQuestions.length === 0 &&
     isSimpleQuestionType(currentQuestion.type) && (
      <ChatMessage
       type='bot'
       content={
        <InlineClinicalQuestion
         question={currentQuestion.question}
         type={getQuestionType(currentQuestion.type)}
         options={currentQuestion.options}
         value={currentResponse}
         onChange={setCurrentResponse}
         onSubmit={() => handleSubmit()}
         disabled={isProcessing}
         allowMultiple={false}
        />
       }
       showAvatar={true}
      />
     )}

    {/* Complex questions with specialized UI - Combined question + input */}
    {currentQuestion &&
     !isTyping &&
     !isProcessing &&
     clubbedQuestions.length === 0 &&
     !isSimpleQuestionType(currentQuestion.type) &&
     currentQuestion.type !== "body_map" &&
     currentQuestion.type !== "date" && (
      <ChatMessage
       type='bot'
       content={
        <div className='space-y-4'>
         <p className='text-base leading-relaxed text-gray-800 font-medium'>
          {currentQuestion.question}
         </p>
         {renderInput()}
        </div>
       }
       showAvatar={true}
      />
     )}

    {/* Date question - special handling */}
    {currentQuestion &&
     !isTyping &&
     !isProcessing &&
     clubbedQuestions.length === 0 &&
     currentQuestion.type === "date" && (
      <ChatMessage
       type='bot'
       content={
        <div className='space-y-4'>
         <p className='text-base leading-relaxed text-gray-800 font-medium'>
          {currentQuestion.question}
         </p>
         <DatePickerInput
          value={currentResponse}
          onChange={(val) => setCurrentResponse(val)}
         />
         <motion.button
          type='button'
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
           e.preventDefault();
           e.stopPropagation();
           handleSubmit();
          }}
          disabled={isProcessing || !canSubmit()}
          className='w-full rounded-xl p-5 font-semibold text-base
                    bg-brand-teal text-white
                    hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed'
         >
          Continue
         </motion.button>
        </div>
       }
       showAvatar={true}
      />
     )}

    {/* Body map question - keep original rendering */}
    {currentQuestion &&
     !isTyping &&
     !isProcessing &&
     clubbedQuestions.length === 0 &&
     currentQuestion.type === "body_map" && (
      <ChatMessage
       type='bot'
       content={
        <div className='space-y-4'>
         <p className='text-base leading-relaxed text-gray-800 font-medium'>
          {currentQuestion.question}
         </p>

         {/* Instruction */}
         <div className='flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg'>
          <CircleDot className='w-4 h-4 text-brand-teal flex-shrink-0' />
          <p className='text-sm text-teal-800 font-medium'>
           Click on the body diagram to select painful areas. You can select multiple regions.
          </p>
         </div>

         {/* Body Map Container with Button Inside */}
         <div className='bg-white rounded-xl border-2 border-teal-200 shadow-sm overflow-hidden'>
          <div className='p-6'>
           <BodyMapSelector
            onRegionSelect={(regions) => {
             setCurrentResponse(regions);
            }}
            selectedRegions={currentResponse || []}
            mode='detailed'
           />
          </div>

          {/* Selected regions count - Fixed at bottom of body map */}
          <div className='border-t-2 border-teal-100 bg-teal-50 p-4 space-y-3'>
           {currentResponse && Array.isArray(currentResponse) && currentResponse.length > 0 ? (
            <div className='flex items-center justify-center gap-2'>
             <Check className='w-5 h-5 text-brand-teal' />
             <p className='text-base text-teal-800 font-bold'>
              {currentResponse.length} region{currentResponse.length !== 1 ? 's' : ''} selected
             </p>
            </div>
           ) : (
            <div className='flex items-center justify-center gap-2'>
             <CircleDot className='w-5 h-5 text-teal-600' />
             <p className='text-base text-teal-700 font-medium'>
              Click on body areas to select
             </p>
            </div>
           )}

           {/* Continue Button - Always visible at bottom */}
           <motion.button
            type='button'
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
             e.preventDefault();
             e.stopPropagation();
             handleSubmit();
            }}
            disabled={isProcessing || !canSubmit()}
            className='w-full rounded-xl p-5 font-bold text-lg
                      bg-brand-teal text-white shadow-lg
                      hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400'
           >
            {currentResponse && currentResponse.length > 0 ?
             `Continue with ${currentResponse.length} area${currentResponse.length !== 1 ? 's' : ''}` :
             'Select at least one area'}
           </motion.button>
          </div>
         </div>
        </div>
       }
       showAvatar={true}
      />
     )}

    {/* Clubbed questions - use renderClubbedQuestions which handles all types properly */}
    {clubbedQuestions.length > 0 && !isTyping && !isProcessing && (
     <ChatMessage
      type='bot'
      content={renderClubbedQuestions()}
      showAvatar={true}
     />
    )}

    {/* Processing indicator */}
    {isProcessing && !isTyping && (
     <ChatMessage type='system' content='✨ Analyzing your responses...' />
    )}

    {/* Red Flags Banner */}
    {detectedRedFlags.length > 0 && !isComplete && (
     <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm'
     >
      <motion.div
       animate={{ rotate: [0, -5, 5, -5, 0] }}
       transition={{ duration: 0.5, repeat: 2 }}
      >
       <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0' />
      </motion.div>
      <div className='flex-1'>
       <h3 className='font-bold text-red-800 text-sm mb-1.5'>⚠️ Red Flags Detected</h3>
       <ul className='space-y-1 text-xs text-red-700'>
        {detectedRedFlags.map((flag, idx) => (
         <li key={idx} className='flex items-start gap-2'>
          <span className='text-red-500 mt-0.5'>•</span>
          <span>{flag}</span>
         </li>
        ))}
       </ul>
      </div>
     </motion.div>
    )}

    {/* Diagnosis results */}
    {isComplete && diagnosisResult && (
     <div className='space-y-4 py-4'>
      <ChatMessage type='system' content='✨ Assessment Complete' />
      {renderDiagnosisResults()}
     </div>
    )}

    <div ref={chatEndRef} />
   </ClinicalChatbotLayout>

   {/* Keep existing modals and overlays */}
   <AnimatePresence>
    {isComplete && diagnosisResult?.success && <ExtractedCompletionCelebration />}
   </AnimatePresence>

   <AssessmentRecommendationHub
    isOpen={showAssessmentHub}
    onClose={() => setShowAssessmentHub(false)}
    screeningData={{
     responses: engine.getSession().responses,
     selectedRegions: selectedRegions,
     redFlags: detectedRedFlags,
     collectedData: collectedData,
    }}
    onStartRecommended={handleStartRecommended}
    onChooseCustom={handleChooseCustom}
    onSkipAll={handleSkipAllAssessments}
   />

   {selectedAssessments.length > 0 && (
    <AssessmentFormBuilder
     isOpen={showDirectAssessment}
     onClose={() => setShowDirectAssessment(false)}
     assessmentId={selectedAssessments[currentAssessmentIndex]?.assessment_id || ""}
     onSubmit={handleDirectAssessmentSubmit}
     onNext={() => {}}
     onSkip={handleDirectAssessmentSkip}
     currentIndex={currentAssessmentIndex}
     totalAssessments={selectedAssessments.length}
    />
   )}

   {/* Close Confirmation Dialog */}
   <AnimatePresence>
    {showCloseConfirmation && (
     <>
      <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       onClick={cancelClose}
       className='fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4'
      >
       <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4'
       >
        <div className='flex items-start gap-4'>
         <div className='w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0'>
          <AlertTriangle className='w-6 h-6 text-amber-600' />
         </div>
         <div className='flex-1'>
          <h3 className='text-lg font-bold text-gray-900 mb-2'>
           Close Assessment?
          </h3>
          <p className='text-sm text-gray-600 leading-relaxed'>
           Your assessment progress will be lost. Are you sure you want to close?
          </p>
         </div>
        </div>

        <div className='flex gap-3 pt-2'>
         <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={cancelClose}
          className='flex-1 px-4 py-3 rounded-xl font-semibold text-base
                     bg-gray-100 text-gray-700 hover:bg-gray-200
                     transition-all duration-200'
         >
          Cancel
         </motion.button>
         <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={confirmClose}
          className='flex-1 px-4 py-3 rounded-xl font-semibold text-base
                     bg-red-600 text-white hover:bg-red-700
                     transition-all duration-200'
         >
          Close Anyway
         </motion.button>
        </div>
       </motion.div>
      </motion.div>
     </>
    )}
   </AnimatePresence>
  </>
 );
};

export default SmartScreeningChatbot;
