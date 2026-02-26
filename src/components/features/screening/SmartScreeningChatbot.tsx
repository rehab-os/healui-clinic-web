"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
 Target,
 Calendar,
 Sparkles,
 Activity,
 CircleDot,
 User,
 AlertCircle,
 MessageSquare,
 ClipboardList,
 ChevronRight,
 ChevronDown,
 Brain,
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
import QuickAssessmentInput from "../assessments/QuickAssessmentInput";
import { getAIAssessmentRecommendations } from "@/services/ai/diagnostic.service";
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
  questions: ["functional_impact"],
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

// ==================== Question Label Helpers ====================

// Short display labels for answered question history
const QUESTION_SHORT_LABELS: Record<string, string> = {
 chief_complaint: 'Chief Complaint',
 symptom_onset: 'Onset Date',
 onset_nature: 'Onset',
 symptom_progression: 'Progression',
 previous_episodes: 'Previous Episodes',
 previous_episode_comparison: 'vs Previous',
 red_flag_screening: 'Red Flags',
 pain_screening: 'Pain',
 weakness_screening: 'Weakness',
 sensation_screening: 'Sensation',
 mobility_screening: 'Mobility',
 stiffness_screening: 'Stiffness',
 instability_screening: 'Instability',
 body_map: 'Body Region',
 vas_score: 'Pain Level',
 pain_nature: 'Pain Type',
 aggravating_factors: 'Aggravates',
 relieving_factors: 'Relieves',
 functional_impact: 'Function',
 gait_pattern: 'Gait',
 posture_observation: 'Posture',
 muscle_tone_observation: 'Muscle Tone',
 swelling_observation: 'Swelling',
 deformity_observation: 'Deformity',
 skin_observation: 'Skin',
 pain_location: 'Pain Location',
};

const getQuestionShortLabel = (questionId: string, questionText?: string): string => {
 if (QUESTION_SHORT_LABELS[questionId]) return QUESTION_SHORT_LABELS[questionId];
 // For referral/dynamic questions, derive from ID
 return questionId
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (c) => c.toUpperCase())
  .replace(/^(Shoulder|Elbow|Wrist|Hip|Knee|Ankle|Lb|Neck)\s/, '')
  .slice(0, 20);
};

// ==================== Answer History Component ====================

interface AnswerHistoryEntry {
 label: string;
 value: string;
 id: string;
}

const AnswerHistoryDropdown: React.FC<{
 entries: AnswerHistoryEntry[];
}> = ({ entries }) => {
 const [isOpen, setIsOpen] = useState(false);

 if (entries.length === 0) return null;

 // Show last 2 as preview, rest in dropdown
 const previewCount = 3;
 const previewEntries = entries.slice(-previewCount);
 const hiddenCount = entries.length - previewCount;

 return (
  <div className="w-full mb-6">
   {/* Collapsed preview - always visible */}
   <button
    onClick={() => setIsOpen(!isOpen)}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-150 group"
   >
    <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
     {previewEntries.map((entry, i) => (
      <span key={entry.id} className="inline-flex items-center gap-1 text-xs">
       <span className="text-gray-400 font-medium">{entry.label}:</span>
       <span className="text-gray-700 font-semibold truncate max-w-[120px]">{entry.value}</span>
       {i < previewEntries.length - 1 && <span className="text-gray-300 mx-0.5">|</span>}
      </span>
     ))}
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
     {hiddenCount > 0 && (
      <span className="text-[10px] font-semibold text-gray-400 bg-gray-200/60 rounded-full px-1.5 py-0.5 tabular-nums">
       {entries.length}
      </span>
     )}
     <motion.div
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.15 }}
     >
      <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-500" />
     </motion.div>
    </div>
   </button>

   {/* Expanded history */}
   <AnimatePresence>
    {isOpen && (
     <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden"
     >
      <div className="mt-1.5 rounded-lg bg-white border border-gray-100 shadow-sm divide-y divide-gray-50">
       {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between px-3 py-2">
         <span className="text-xs text-gray-400 font-medium">{entry.label}</span>
         <span className="text-xs text-gray-700 font-semibold text-right max-w-[60%] truncate">{entry.value}</span>
        </div>
       ))}
      </div>
     </motion.div>
    )}
   </AnimatePresence>
  </div>
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
   return { label: "Today", days: 0, color: "bg-teal-100 text-teal-800" };
  if (daysSince <= 7)
   return {
    label: "This week",
    days: daysSince,
    color: "bg-teal-100 text-teal-800",
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
      ? "border-brand-teal ring-2 ring-teal-100 shadow-lg"
      : "border-gray-200 hover:border-teal-300 hover:shadow-md"
    }`}
   >
    <div className='flex items-center gap-2'>
     <CalendarDays className='h-5 w-5 text-gray-400' />
     {dateValue ? (
      <span className='text-base text-gray-800 font-medium'>
       {dateValue.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
       })}
      </span>
     ) : (
      <span className='text-base text-gray-400'>Select a date...</span>
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
    <div className='absolute z-50 mt-2 left-0 right-0 bg-white rounded-2xl border border-gray-200 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150'>
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
       caption_label: "text-base font-semibold text-gray-800",
       nav: "space-x-1 flex items-center",
       nav_button:
        "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-gray-100 rounded-md inline-flex items-center justify-center",
       nav_button_previous: "absolute left-2",
       nav_button_next: "absolute right-2",
       table: "w-full border-collapse",
       head_row: "flex",
       head_cell: "text-gray-500 rounded-md w-11 font-medium text-sm",
       row: "flex w-full mt-1",
       cell:
        "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-teal-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
       day: "h-11 w-11 p-0 font-normal text-sm rounded-md hover:bg-gray-100 focus:bg-gray-100 aria-selected:opacity-100 inline-flex items-center justify-center",
       day_selected:
        "bg-brand-teal text-white hover:bg-brand-teal hover:text-white focus:bg-brand-teal focus:text-white",
       day_today: "bg-gray-100 text-gray-900 font-semibold",
       day_outside: "text-gray-300 opacity-50",
       day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
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
   "bg-brand-teal",
   "bg-teal-400",
   "bg-teal-300",
   "bg-emerald-400",
   "bg-cyan-400",
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
  <div className='flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-teal-50 to-teal-50 rounded-2xl border border-teal-200/60 shadow-sm'>
   <div className='flex gap-1.5'>
    <motion.div
     animate={{ y: [0, -5, 0] }}
     transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
     className='w-2 h-2 bg-brand-teal rounded-full'
    />
    <motion.div
     animate={{ y: [0, -5, 0] }}
     transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
     className='w-2 h-2 bg-brand-teal rounded-full'
    />
    <motion.div
     animate={{ y: [0, -5, 0] }}
     transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
     className='w-2 h-2 bg-brand-teal rounded-full'
    />
   </div>
   <span className='text-sm font-medium text-brand-teal'>Analyzing...</span>
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
   <div className='bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-teal-100 px-3 py-4 flex flex-col items-center gap-3'>
    {/* Animated dots */}
    <div className='flex flex-col gap-1.5'>
     {[0, 1, 2].map((i) => (
      <div
       key={i}
       className='w-2 h-2 rounded-full bg-brand-teal'
       style={{
        animation: "pulse 1.4s ease-in-out infinite",
        animationDelay: `${i * 0.2}s`,
        opacity: 0.4,
       }}
      />
     ))}
    </div>
    <span
     className='text-xs text-gray-500 font-medium uppercase tracking-wider writing-mode-vertical'
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
   <div className='px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-transparent'>
    <p className='text-sm text-brand-teal uppercase tracking-wider font-bold'>
     Clinical Progress
    </p>
   </div>
   <div className='flex-1 py-4 space-y-1 overflow-y-auto relative'>
    {/* Connecting line */}
    <div className='absolute left-9 top-8 bottom-8 w-0.5 bg-gradient-to-b from-brand-teal via-teal-300 to-gray-200' />

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
                ${isCurrent ? "bg-gradient-to-r from-teal-50 to-teal-100/50 shadow-md" : ""}
                ${isCompleted ? "hover:bg-gray-50" : ""}
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
                    ? "bg-gradient-to-br from-brand-teal to-teal-700 text-white shadow-lg shadow-teal-500/30"
                    : isCurrent
                      ? "bg-gradient-to-br from-brand-teal to-teal-600 text-white shadow-xl shadow-teal-500/50 ring-4 ring-teal-100"
                      : "bg-gray-200 text-gray-500 border-2 border-white"
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
                ${isCurrent ? "text-teal-800 font-semibold" : isCompleted ? "text-gray-700" : "text-gray-400"}
              `}
       >
        {stage.label}
       </span>

       {/* Current indicator pulse */}
       {isCurrent && (
        <motion.div
         animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
         transition={{ duration: 2, repeat: Infinity }}
         className='ml-auto w-2 h-2 rounded-full bg-brand-teal'
        />
       )}
      </motion.div>
     );
    })}
   </div>

   {/* Bottom stats */}
   <div className='px-4 py-4 border-t border-gray-200 mt-auto bg-gradient-to-t from-gray-50 to-transparent'>
    <div className='flex items-center justify-between mb-3'>
     <span className='text-xs text-gray-500 font-medium uppercase tracking-wide'>
      Progress
     </span>
     <span className='text-lg font-bold text-gray-800 tabular-nums'>
      {answeredCount}
      <span className='text-gray-400 text-sm'>/{totalQuestions}</span>
     </span>
    </div>
    <div className='relative h-2 bg-gray-200 rounded-full overflow-hidden'>
     <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className='absolute inset-y-0 left-0 bg-gradient-to-r from-brand-teal to-teal-600 rounded-full shadow-sm'
     />
    </div>
    <div className='mt-2 text-center'>
     <span className='text-xs font-semibold text-brand-teal'>
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
 const [currentResponse, _setCurrentResponse] = useState<any>("");
 const currentResponseRef = useRef<any>("");
 const setCurrentResponse = useCallback((val: any) => {
  if (typeof val === 'function') {
   _setCurrentResponse((prev: any) => {
    const next = val(prev);
    currentResponseRef.current = next;
    return next;
   });
  } else {
   currentResponseRef.current = val;
   _setCurrentResponse(val);
  }
 }, []);
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
 const [answerHistory, setAnswerHistory] = useState<AnswerHistoryEntry[]>([]);
 const [isComplete, setIsComplete] = useState(false);
 const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(
  null,
 );
 const [useAIFlow, setUseAIFlow] = useState(false);
 const [selectedRegions, setSelectedRegions] = useState<any[]>([]);
 const [collectedData, setCollectedData] = useState<Record<string, any>>({});
 const [detectedRedFlags, setDetectedRedFlags] = useState<string[]>([]);
 const [showSummaryPanel, setShowSummaryPanel] = useState(false); // Hidden by default — toggle on demand
 const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
 const [isSourceTrackingPhase, setIsSourceTrackingPhase] = useState(false);
 const [identifiedSources, setIdentifiedSources] = useState<
  Array<{ sourceRegion: string; implication: string }>
 >([]);

 // Inline clinical assessment states
 const [isAnalyzingForTests, setIsAnalyzingForTests] = useState(false);
 const [analyzingPhrase, setAnalyzingPhrase] = useState("Analyzing clinical findings...");
 const [showInlineAssessments, setShowInlineAssessments] = useState(false);
 const [inlineRecommendations, setInlineRecommendations] = useState<any[]>([]);
 const [inlineActiveIndex, setInlineActiveIndex] = useState(0);
 const [inlineCapturedResults, setInlineCapturedResults] = useState<Record<string, Record<string, any>>>({});
 const [inlineAllComplete, setInlineAllComplete] = useState(false);
 const [completedAssessments, setCompletedAssessments] = useState<any[]>([]);
 const [showAddTest, setShowAddTest] = useState(false);
 const [addSearchTerm, setAddSearchTerm] = useState("");
 const [availableAssessments, setAvailableAssessments] = useState<Record<string, any>>({});
 const [showResponsesPanel, setShowResponsesPanel] = useState(false);

 const chatEndRef = useRef<HTMLDivElement>(null);
 const sessionStartTime = useRef<number>(Date.now());

 // Screening context for inline assessment cards
 const screeningContext = useMemo(() => ({
  side: selectedRegions?.[0]?.laterality || null,
  region: selectedRegions?.[0]?.mainRegion || null,
  painLocation: collectedData?.pain_location || collectedData?.pain_area || null,
  vasScore: collectedData?.vas_score || null,
 }), [selectedRegions, collectedData]);

 // Analyzing phrases cycle
 useEffect(() => {
  if (!isAnalyzingForTests) return;
  const phrases = [
   "Analyzing clinical findings...",
   "Cross-referencing differential patterns...",
   "Identifying relevant provocative tests...",
   "Matching evidence-based protocols...",
   "Selecting targeted assessments...",
  ];
  let index = 0;
  const interval = setInterval(() => {
   index = (index + 1) % phrases.length;
   setAnalyzingPhrase(phrases[index]);
  }, 2500);
  return () => clearInterval(interval);
 }, [isAnalyzingForTests]);

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
     // Don't add a separate bot message — rendered inline below.
    }
   } else {
    // Single question (not clubbed)
    setClubbedQuestions([]);
    setCurrentClubLabel("");
    setClubbedResponses({});
    setCurrentQuestion(question);
    // Don't add a separate bot message — the question text is already
    // rendered by InlineClinicalQuestion / inline rendering below.
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

  // Track answer history for compact display
  const newHistoryEntries = questionsToProcess.map((q) => ({
   id: q.id,
   label: getQuestionShortLabel(q.id, q.question),
   value: formatUserResponse(clubbedResponses[q.id], q),
  }));
  setAnswerHistory((prev) => {
   const filtered = prev.filter((e) => !newHistoryEntries.some((n) => n.id === e.id));
   return [...filtered, ...newHistoryEntries];
  });

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

 // Handle submit for single question — uses ref to always read latest response
 const handleSubmit = async () => {
  // If we have clubbed questions, use the clubbed submit
  if (clubbedQuestions.length > 0) {
   return handleClubbedSubmit();
  }

  const response = currentResponseRef.current;
  if (!currentQuestion) return;

  // Validate using the ref value directly
  const canProceed = (() => {
   if (response === null || response === undefined) return false;
   if (["multi_choice", "checklist", "body_map", "observational"].includes(currentQuestion.type)) {
    if (currentQuestion.type === "body_map" && response?.detailed) {
     return Array.isArray(response.detailed) && response.detailed.length > 0;
    }
    return Array.isArray(response) && response.length > 0;
   }
   if (currentQuestion.type === "red_flags") return true;
   if (["tenderness_map", "measurement", "rom_measurement", "mmt_testing", "scale_grid"].includes(currentQuestion.type)) {
    return response && typeof response === "object" && Object.keys(response).length > 0;
   }
   if (typeof response === "string") return response.trim().length > 0;
   if (currentQuestion.type === "slider") return typeof response === "number";
   return true;
  })();
  if (!canProceed) return;

  const displayValue = formatUserResponse(response, currentQuestion);
  addMessage("user", displayValue);

  setIsProcessing(true);

  // Track collected data for summary panel
  setCollectedData((prev) => ({
   ...prev,
   [currentQuestion.id]: response,
  }));

  // Track answer history for compact display
  setAnswerHistory((prev) => [
   ...prev.filter((e) => e.id !== currentQuestion.id),
   {
    id: currentQuestion.id,
    label: getQuestionShortLabel(currentQuestion.id, currentQuestion.question),
    value: displayValue,
   },
  ]);

  // Track selected regions from body_map
  if (currentQuestion.type === "body_map" && response?.detailed) {
   setSelectedRegions(response.detailed);
  }

  // Detect red flags from text responses
  if (typeof response === "string") {
   const flags = screeningAPI.detectRedFlags(response);
   if (flags.length > 0) {
    setDetectedRedFlags((prev) => [...new Set([...prev, ...flags])]);
   }
  }

  // Record response in AI flow context
  if (useAIFlow) {
   aiFlow.recordResponse(currentQuestion.id, response);
  }

  // Process response with engine
  const nextQuestionId = await engine.processResponse(
   currentQuestion.id,
   response,
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
   if (currentQuestion?.type === "body_map" && currentResponse?.detailed) {
    return Array.isArray(currentResponse.detailed) && currentResponse.detailed.length > 0;
   }
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
  setAnswerHistory([]);
  setCollectedData({});

  setTimeout(async () => {
   await addBotMessage("Starting fresh assessment.");
   setTimeout(async () => {
    const question = engine.getCurrentQuestion();
    if (question) {
     await loadQuestion(question);
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

 // ==================== Inline Clinical Assessment Flow ====================

 const completeQuestionnaire = async () => {
  await addBotMessage("Screening complete.");
  scrollToBottom();

  // Show analyzing animation inline
  setIsAnalyzingForTests(true);
  scrollToBottom();

  // Load available assessments for "Add test" search
  try {
   const data = await import("@/data/clinical/entities/clinical_assessments.json");
   setAvailableAssessments(data.assessments || {});
  } catch (e) {
   console.error("Failed to load assessments:", e);
  }

  // Fetch AI recommendations
  try {
   const screeningPayload = {
    responses: engine.getSession().responses,
    selectedRegions,
    redFlags: detectedRedFlags,
    collectedData,
   };
   const result = await getAIAssessmentRecommendations(screeningPayload);
   if (result.success && result.recommendations?.length > 0) {
    setInlineRecommendations(result.recommendations);
   } else {
    setInlineRecommendations([{
     assessment_id: "ASSESS_056",
     name: "Range of Motion Assessment",
     relevance_score: 85,
     reasoning: "Basic movement assessment recommended",
     category: "Mobility",
     estimated_time: "5-7 minutes",
    }]);
   }
  } catch (err) {
   console.error("Assessment recommendation error:", err);
   setInlineRecommendations([{
    assessment_id: "ASSESS_056",
    name: "Range of Motion Assessment",
    relevance_score: 85,
    reasoning: "Basic movement assessment recommended",
    category: "Mobility",
    estimated_time: "5-7 minutes",
   }]);
  }

  // Transition: hide loader, show inline tests
  setIsAnalyzingForTests(false);
  setShowInlineAssessments(true);
  setInlineActiveIndex(0);
  setInlineCapturedResults({});
  setInlineAllComplete(false);
  scrollToBottom();
 };

 const handleInlineCapture = useCallback(
  (assessmentId: string, data: Record<string, any>) => {
   setInlineCapturedResults(prev => ({ ...prev, [assessmentId]: data }));

   const nextIndex = inlineActiveIndex + 1;
   if (nextIndex < inlineRecommendations.length) {
    setTimeout(() => {
     setInlineActiveIndex(nextIndex);
     scrollToBottom();
    }, 300);
   } else {
    setTimeout(() => {
     setInlineAllComplete(true);
     scrollToBottom();
    }, 300);
   }
  },
  [inlineActiveIndex, inlineRecommendations.length, scrollToBottom],
 );

 const handleInlineSkipCurrent = useCallback(() => {
  const nextIndex = inlineActiveIndex + 1;
  if (nextIndex < inlineRecommendations.length) {
   setInlineActiveIndex(nextIndex);
   scrollToBottom();
  } else {
   setInlineAllComplete(true);
   scrollToBottom();
  }
 }, [inlineActiveIndex, inlineRecommendations.length, scrollToBottom]);

 const handleInlineRemoveTest = useCallback((assessmentId: string) => {
  setInlineRecommendations(prev => prev.filter(r => r.assessment_id !== assessmentId));
  setInlineCapturedResults(prev => {
   const next = { ...prev };
   delete next[assessmentId];
   return next;
  });
 }, []);

 const handleInlineAddTest = useCallback((assessmentId: string) => {
  const assessment = availableAssessments[assessmentId] as any;
  if (!assessment) return;
  setInlineRecommendations(prev => [...prev, {
   assessment_id: assessmentId,
   name: assessment.name,
   relevance_score: 70,
   reasoning: `Manually added — ${assessment.purpose}`,
   category: assessment.type?.replace(/_/g, " ") || "Clinical",
   estimated_time: "3-5 minutes",
  }]);
  setInlineAllComplete(false);
  setShowAddTest(false);
  setAddSearchTerm("");
 }, [availableAssessments]);

 const handleSkipAllAssessments = () => {
  setShowInlineAssessments(false);
  addBotMessage("Skipping clinical assessments. Generating diagnosis based on screening data...");
  setTimeout(() => proceedToFinalDiagnosis(), 500);
 };

 const handleGenerateDiagnosis = useCallback(() => {
  // Build completed assessments from inline captured data
  const captured = inlineRecommendations
   .filter(rec => inlineCapturedResults[rec.assessment_id])
   .map(rec => ({
    assessment_id: rec.assessment_id,
    assessment_name: rec.name,
    category: rec.category || "Clinical",
    form_data: inlineCapturedResults[rec.assessment_id],
    timestamp: new Date().toISOString(),
   }));
  setCompletedAssessments(captured);
  setShowInlineAssessments(false);

  const capturedCount = captured.length;
  const totalCount = inlineRecommendations.length;
  addBotMessage(
   `${capturedCount} clinical test${capturedCount !== 1 ? "s" : ""} captured${
    capturedCount < totalCount ? ` (${totalCount - capturedCount} skipped)` : ""
   }. Generating enhanced AI diagnosis...`,
  );
  setTimeout(() => proceedToFinalDiagnosis(), 1500);
 }, [inlineRecommendations, inlineCapturedResults]);

 const proceedToFinalDiagnosis = async () => {
  await generateDiagnosis();
 };

 // ==================== Render Input Components ====================

 // Primary action button style
 const primaryBtnClass =
  "w-full bg-brand-teal hover:bg-teal-700 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors duration-150 border-0";

 // Option selected style
 const selectedOptionClass =
  "border-brand-teal bg-brand-teal text-white shadow-sm";
 const unselectedOptionClass =
  "border-gray-200 bg-white hover:border-gray-300 text-gray-700";

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
     <div className='grid grid-cols-2 gap-2.5'>
      {[
       { value: "yes", label: "Yes" },
       { value: "no", label: "No" },
      ].map(({ value, label }) => (
       <button
        key={value}
        onClick={() => updateResponse(value)}
        className={`flex items-center justify-center gap-1.5 py-3.5 px-4 rounded-xl border transition-all duration-150 font-semibold text-sm ${
         response === value
          ? "border-brand-teal bg-brand-teal text-white shadow-sm"
          : `${unselectedOptionClass}`
        }`}
       >
        {response === value && <Check className='h-4 w-4 text-white' />}
        <span>{label}</span>
       </button>
      ))}
     </div>
    );

   case "single_choice": {
    const cscCount = question.options?.length || 0;
    const cscGridClass = cscCount <= 4 ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 sm:grid-cols-3 gap-2.5';

    return (
     <div className={cscGridClass}>
      {question.options?.map((option) => (
       <button
        key={option.value}
        onClick={() => updateResponse(option.value)}
        className={`flex items-center gap-2 p-3.5 rounded-xl border transition-all duration-150 text-left ${
         response === option.value ? selectedOptionClass : unselectedOptionClass
        }`}
       >
        {response === option.value && <Check className='h-3.5 w-3.5 flex-shrink-0' />}
        <span className='text-sm font-medium leading-tight'>
         {option.label}
        </span>
       </button>
      ))}
     </div>
    );
   }

   case "multi_choice":
   case "checklist":
    const selectedValues = Array.isArray(response) ? response : [];
    return (
     <div className='grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto'>
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
         className={`flex items-center gap-2.5 p-3.5 rounded-xl border transition-all duration-150 text-left ${
          isSelected ? selectedOptionClass : unselectedOptionClass
         }`}
        >
         <div
          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
           isSelected ? "border-white/50 bg-white/20" : "border-gray-300 bg-white"
          }`}
         >
          {isSelected && <Check className='h-3 w-3 text-white' />}
         </div>
         <span className='text-sm leading-tight font-medium'>
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
       <span className='text-5xl font-black text-gray-800 tabular-nums'>
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
       className='w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer touch-pan-y
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-8
                [&::-webkit-slider-thumb]:h-8
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-brand-teal
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-xl
                [&::-webkit-slider-thumb]:shadow-teal-500/30
                [&::-webkit-slider-thumb]:border-4
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-webkit-slider-thumb]:active:scale-125'
      />
      <div className='flex justify-between text-xs font-medium text-gray-500 px-1'>
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
      className='min-h-[80px] bg-white border border-gray-200 text-gray-800 rounded-xl resize-none text-sm p-4 focus:border-brand-teal focus:ring-2 focus:ring-teal-500/15 transition-colors duration-150'
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
           ? "bg-gray-100 text-gray-400"
           : "bg-teal-100 text-brand-teal"
         }`}
        >
         {index + 1}
        </span>
        <p
         className={`font-semibold text-sm leading-relaxed font-display tracking-tight ${
          isConditionallyDisabled ? "text-gray-400" : "text-gray-800"
         }`}
        >
         {question.question}
         {isConditionallyDisabled && (
          <span className='text-xs text-gray-400 ml-2 font-normal'>
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
       className='min-h-[120px] bg-white border border-gray-200 text-gray-800 rounded-xl resize-none focus:border-brand-teal focus:ring-2 focus:ring-teal-500/15 text-sm p-4 transition-colors duration-150 placeholder:text-gray-400'
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
        whileTap={{ scale: 0.97 }}
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
        className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border transition-all duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 ${
                   currentResponse === value
                    ? "border-brand-teal bg-brand-teal text-white shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                  }`}
       >
        {currentResponse === value && <Check className='h-4 w-4 text-white' />}
        <span className='font-semibold text-sm'>{label}</span>
       </motion.button>
      ))}
     </motion.div>
    );

   case "single_choice": {
    const scCount = currentQuestion.options?.length || 0;
    const scUseGrid = true; // Always use grid
    const scGridClass = scCount <= 4 ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 sm:grid-cols-3 gap-2.5';

    return (
     <motion.div
      role='radiogroup'
      aria-label={currentQuestion.question}
      className={scGridClass}
      variants={optionsContainerVariants}
      initial='initial'
      animate='animate'
     >
      {currentQuestion.options?.map((option, index) => (
       <motion.button
        key={option.value}
        variants={optionVariants}
        whileTap={{ scale: 0.98 }}
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
        className={`flex items-center gap-2 ${scUseGrid ? 'justify-center text-center p-3.5' : 'text-left p-3.5'} rounded-xl border transition-all duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 ${
                   currentResponse === option.value
                    ? selectedOptionClass
                    : unselectedOptionClass
                  }`}
       >
        {currentResponse === option.value && (
         <Check className='w-3.5 h-3.5 flex-shrink-0' />
        )}
        <span
         className='text-sm font-medium leading-tight'
        >
         {option.label}
        </span>
       </motion.button>
      ))}
     </motion.div>
    );
   }

   case "multi_choice":
   case "checklist":
    // Special case for pain_location - grouped body part grid
    if (currentQuestion.id === "pain_location") {
     const bodyPartGroups = [
      {
       label: "Head & Spine",
       parts: [
        { id: "head", name: "Head", hasLaterality: false },
        { id: "neck", name: "Neck", hasLaterality: false },
        { id: "upper_back", name: "Upper Back", hasLaterality: false },
        { id: "lower_back", name: "Lower Back", hasLaterality: false },
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
        { id: "leg", name: "Calf", hasLaterality: true },
        { id: "ankle", name: "Ankle", hasLaterality: true },
        { id: "foot", name: "Foot", hasLaterality: true },
       ],
      },
     ];

     const selectedParts = Array.isArray(currentResponse) ? currentResponse : [];

     const togglePart = (partId: string) => {
      setCurrentResponse((prev: string[]) => {
       const arr = Array.isArray(prev) ? prev : [];
       const filtered = arr.filter((v) => !v.startsWith(partId));
       if (arr.some((v) => v.startsWith(partId))) return filtered;
       return [...filtered, partId];
      });
     };

     const selectLaterality = (partId: string, laterality: "left" | "right" | "both") => {
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
        <div key={group.label}>
         <h4 className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5'>
          {group.label}
         </h4>
         <div className='grid grid-cols-3 gap-1.5'>
          {group.parts.map((part) => {
           const selectedLat = getSelectedLaterality(part.id);
           const isSelected = selectedLat !== null;
           return (
            <button
             key={part.id}
             onClick={() => {
              if (part.hasLaterality) {
               if (isSelected) togglePart(part.id);
               else {
                setCurrentResponse((prev: string[]) => {
                 const arr = Array.isArray(prev) ? prev : [];
                 return [...arr, `${part.id}_pending`];
                });
               }
              } else togglePart(part.id);
             }}
             className={`px-2 py-2 text-xs font-medium rounded-md border transition-colors text-center ${
              isSelected
               ? "border-brand-teal bg-brand-teal/5 text-brand-teal"
               : "border-gray-200 text-gray-600 hover:border-gray-300"
             }`}
            >
             {part.name}
             {isSelected && selectedLat !== "pending" && selectedLat !== "selected" && (
              <span className='block text-[9px] text-brand-teal/70 mt-0.5 capitalize'>{selectedLat}</span>
             )}
            </button>
           );
          })}
         </div>
         {/* Laterality picker for any pending selections in this group */}
         {group.parts.map((part) => {
          const selectedLat = getSelectedLaterality(part.id);
          if (!part.hasLaterality || !selectedLat || selectedLat !== "pending") return null;
          return (
           <div key={`${part.id}_lat`} className='flex gap-1.5 mt-1.5'>
            <span className='text-xs text-gray-500 self-center mr-1'>{part.name}:</span>
            {(["left", "right", "both"] as const).map((lat) => (
             <button
              key={lat}
              onClick={() => selectLaterality(part.id, lat)}
              className='flex-1 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:border-brand-teal hover:text-brand-teal transition-colors capitalize'
             >
              {lat}
             </button>
            ))}
           </div>
          );
         })}
        </div>
       ))}
       <Button
        onClick={handleSubmit}
        disabled={!canSubmit() || selectedParts.some((p) => p.endsWith("_pending"))}
        className={primaryBtnClass}
       >
        Continue <ArrowRight className='ml-2 h-4 w-4' />
       </Button>
      </div>
     );
    }

    // Regular multi_choice/checklist — always grid
    const mcGridClass = 'grid grid-cols-2 gap-2.5';

    return (
     <div className='space-y-3'>
      <div className={mcGridClass}>
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
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border transition-all duration-150 text-left ${
           isSelected ? selectedOptionClass : unselectedOptionClass
          }`}
         >
          <div
           className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150 border ${
            isSelected
             ? "border-white/50 bg-white/20"
             : "border-gray-300 bg-white"
           }`}
          >
           {isSelected && <Check className='h-3 w-3 text-white' />}
          </div>
          <span
           className='text-sm leading-tight font-medium'
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
       className={primaryBtnClass}
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
       className={`bg-gradient-to-br ${getAmbientBg(sliderValue)} rounded-2xl p-7 sm:p-8 shadow-sm border-2 border-gray-100 transition-all duration-500`}
      >
       <motion.div
        className='text-center mb-8'
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 0.3 }}
        key={sliderValue}
       >
        <motion.div
         className='text-7xl font-black bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent tabular-nums'
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
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-10
                    [&::-webkit-slider-thumb]:h-10
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-grab
                    [&::-webkit-slider-thumb]:shadow-2xl
                    [&::-webkit-slider-thumb]:shadow-gray-900/20
                    [&::-webkit-slider-thumb]:border-4
                    [&::-webkit-slider-thumb]:border-brand-teal
                    [&::-webkit-slider-thumb]:transition-all
                    [&::-webkit-slider-thumb]:duration-150
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-thumb]:active:scale-125
                    [&::-webkit-slider-thumb]:active:cursor-grabbing
                    [&::-webkit-slider-thumb]:focus-visible:ring-4
                    [&::-webkit-slider-thumb]:focus-visible:ring-teal-200'
        />
       </div>

       <div className='flex justify-between text-sm font-semibold text-gray-500 mt-5 px-1'>
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

   case "body_map": {
    const bmGroups = [
     {
      label: "Head & Spine",
      parts: [
       { id: "head", name: "Head", bilateral: false },
       { id: "neck", name: "Neck", bilateral: false },
       { id: "chest", name: "Chest", bilateral: false },
       { id: "abdomen", name: "Abdomen", bilateral: false },
       { id: "lower-back", name: "Lower Back", bilateral: false },
      ],
     },
     {
      label: "Upper Limb",
      parts: [
       { id: "shoulder", name: "Shoulder", bilateral: true },
       { id: "upper-arm", name: "Upper Arm", bilateral: true },
       { id: "elbow", name: "Elbow", bilateral: true },
       { id: "forearm", name: "Forearm", bilateral: true },
       { id: "wrist", name: "Wrist", bilateral: true },
       { id: "hand", name: "Hand", bilateral: true },
      ],
     },
     {
      label: "Lower Limb",
      parts: [
       { id: "hip", name: "Hip", bilateral: true },
       { id: "thigh", name: "Thigh", bilateral: true },
       { id: "knee", name: "Knee", bilateral: true },
       { id: "lower-leg", name: "Lower Leg", bilateral: true },
       { id: "ankle", name: "Ankle", bilateral: true },
       { id: "foot", name: "Foot", bilateral: true },
      ],
     },
    ];

    const bmSelections: any[] = Array.isArray(currentResponse) ? currentResponse : [];
    const getBmSel = (id: string) => bmSelections.find((s: any) => s.mainRegion === id);

    const toggleBmPart = (id: string, bilateral: boolean) => {
     setCurrentResponse((prev: any[]) => {
      const arr = Array.isArray(prev) ? prev : [];
      if (arr.find((s: any) => s.mainRegion === id)) return arr.filter((s: any) => s.mainRegion !== id);
      if (!bilateral) return [...arr, { mainRegion: id, laterality: "center", subRegions: [] }];
      return [...arr, { mainRegion: id, laterality: "pending", subRegions: [] }];
     });
    };

    const setBmLat = (id: string, lat: "left" | "right" | "both") => {
     setCurrentResponse((prev: any[]) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.map((s: any) => s.mainRegion === id ? { ...s, laterality: lat } : s);
     });
    };

    const bmHasPending = bmSelections.some((s: any) => s.laterality === "pending");
    const bmValid = bmSelections.filter((s: any) => s.laterality !== "pending");

    const handleBmGridSubmit = () => {
     const structuredData = {
      regions: bmValid.flatMap((s: any) => {
       if (s.laterality === "both") return [`${s.mainRegion}_left`, `${s.mainRegion}_right`];
       if (s.laterality === "center") return [s.mainRegion];
       return [`${s.mainRegion}_${s.laterality}`];
      }),
      detailed: bmValid,
     };
     setCurrentResponse(structuredData);
     setTimeout(() => handleSubmit(), 100);
    };

    return (
     <div className='space-y-4'>
      {bmGroups.map((group) => (
       <div key={group.label}>
        <h4 className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5'>
         {group.label}
        </h4>
        <div className='grid grid-cols-3 gap-1.5'>
         {group.parts.map((part) => {
          const sel = getBmSel(part.id);
          const isSelected = !!sel;
          return (
           <button
            key={part.id}
            onClick={() => toggleBmPart(part.id, part.bilateral)}
            className={`px-2 py-2 text-xs font-medium rounded-md border transition-colors text-center ${
             isSelected
              ? "border-brand-teal bg-brand-teal/5 text-brand-teal"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
           >
            {part.name}
            {sel && sel.laterality !== "pending" && sel.laterality !== "center" && (
             <span className='block text-[9px] text-brand-teal/70 mt-0.5 capitalize'>{sel.laterality}</span>
            )}
           </button>
          );
         })}
        </div>
        {group.parts.map((part) => {
         const sel = getBmSel(part.id);
         if (!part.bilateral || !sel || sel.laterality !== "pending") return null;
         return (
          <div key={`${part.id}_lat`} className='flex gap-1.5 mt-1.5'>
           <span className='text-xs text-gray-500 self-center mr-1'>{part.name}:</span>
           {(["left", "right", "both"] as const).map((lat) => (
            <button
             key={lat}
             onClick={() => setBmLat(part.id, lat)}
             className='flex-1 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:border-brand-teal hover:text-brand-teal transition-colors capitalize'
            >
             {lat}
            </button>
           ))}
          </div>
         );
        })}
       </div>
      ))}
      <Button
       onClick={handleBmGridSubmit}
       disabled={!canSubmit() || bmHasPending || bmValid.length === 0}
       className={primaryBtnClass}
      >
       Continue <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
     </div>
    );
   }

   case "red_flags":
    return (
     <div className='space-y-3'>
      <div className='flex items-center gap-2 px-3.5 py-2.5 bg-amber-50/80 rounded-lg border border-amber-200/60'>
       <AlertCircle className='h-4 w-4 text-amber-500 flex-shrink-0' />
       <span className='text-amber-700 text-xs font-medium'>
        Select any that apply, or continue if none
       </span>
      </div>
      <div className='grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto'>
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
          className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-150 text-left ${
           isSelected
            ? "border-amber-400 bg-amber-50 shadow-sm"
            : "border-gray-200 bg-white hover:border-amber-200"
          }`}
         >
          <div
           className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
            isSelected
             ? "border-amber-500 bg-amber-500"
             : "border-gray-300 bg-white"
           }`}
          >
           {isSelected && <Check className='h-3 w-3 text-white' />}
          </div>
          <span
           className={`text-xs leading-tight ${isSelected ? "text-amber-800 font-semibold" : "text-gray-600"}`}
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
       <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
     </div>
    );

   case "tenderness_map": {
    const landmarks = currentQuestion.options && currentQuestion.options.length > 0
     ? currentQuestion.options
     : [{ value: 'anterior', label: 'Anterior' }, { value: 'posterior', label: 'Posterior' }, { value: 'medial', label: 'Medial' }, { value: 'lateral', label: 'Lateral' }, { value: 'deep', label: 'Deep' }];
    return (
     <div className='space-y-3'>
      <div className='text-xs text-gray-500 px-1 font-medium'>
       0 = None · 1 = Mild · 2 = Moderate · 3 = Severe
      </div>
      <div className='max-h-[350px] overflow-y-auto space-y-2.5'>
       {landmarks.map((landmark) => (
        <div
         key={landmark.value}
         className='flex items-center justify-between p-4 bg-gray-50 rounded-xl'
        >
         <span className='font-medium text-gray-700 text-sm'>{landmark.label}</span>
         <div className='flex gap-2'>
          {[0, 1, 2, 3].map((grade) => (
           <button
            key={grade}
            onClick={() =>
             setCurrentResponse((prev: any) => ({
              ...prev,
              [landmark.value]: grade.toString(),
             }))
            }
            className={`min-w-[44px] min-h-[44px] rounded-xl font-semibold text-sm transition-all ${
             currentResponse?.[landmark.value] === grade.toString()
              ? "bg-brand-teal text-white shadow-lg shadow-teal-200"
              : "bg-white text-gray-600 hover:bg-teal-50 border border-gray-200"
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
   }

   case "measurement":
    return (
     <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
       <div>
        <Label className='text-xs font-medium text-gray-600'>Location</Label>
        <Input
         placeholder='e.g. 10cm above patella'
         value={currentResponse?.location || ""}
         onChange={(e) =>
          setCurrentResponse((prev: any) => ({
           ...prev,
           location: e.target.value,
          }))
         }
         className='mt-1 rounded-xl border-gray-200 focus:border-brand-teal'
        />
       </div>
       <div>
        <Label className='text-xs font-medium text-gray-600'>Value (cm)</Label>
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
         className='mt-1 rounded-xl border-gray-200 focus:border-brand-teal'
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

   case "rom_measurement": {
    const romMovements = currentQuestion.options && currentQuestion.options.length > 0
     ? currentQuestion.options
     : [{ value: 'flexion', label: 'Flexion' }, { value: 'extension', label: 'Extension' }];
    return (
     <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-3'>
       {romMovements.map((movement) => (
        <div key={movement.value}>
         <Label className='text-xs font-medium text-gray-500'>
          {movement.label} (°)
          {(movement as any).normalROM !== undefined && (
           <span className='text-gray-300 ml-1 text-[10px]'>
            norm: {(movement as any).normalROM}°
           </span>
          )}
         </Label>
         <Input
          type='number'
          placeholder='0'
          value={currentResponse?.[movement.value] || ""}
          onChange={(e) =>
           setCurrentResponse((prev: any) => ({
            ...prev,
            [movement.value]: e.target.value,
           }))
          }
          className='mt-1 rounded-xl border-gray-200 focus:border-brand-teal'
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
   }

   case "mmt_testing":
    return (
     <div className='space-y-4'>
      <div className='text-xs text-gray-500 px-1 font-medium'>
       Oxford Scale: 0–5 (0 = No contraction, 5 = Normal)
      </div>
      <div className='max-h-[350px] overflow-y-auto space-y-3'>
       {currentQuestion.options?.map((muscle) => (
        <div key={muscle.value} className='p-4 bg-gray-50 rounded-xl'>
         <span className='font-medium text-gray-700 text-sm block mb-3'>
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
              ? "bg-brand-teal text-white shadow-lg shadow-teal-200"
              : "bg-white text-gray-600 hover:bg-teal-50 border border-gray-200"
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
        <div key={item.value} className='p-4 bg-gray-50 rounded-xl'>
         <Label className='font-medium text-gray-700 text-sm block mb-3'>
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
              ? "bg-brand-teal text-white shadow-lg shadow-teal-200"
              : "bg-white text-gray-600 hover:bg-teal-50 border border-gray-200"
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
      <div className='max-h-[350px] overflow-y-auto grid grid-cols-2 gap-2.5'>
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
             ? "border-brand-teal bg-brand-teal scale-110"
             : "border-gray-300"
           }`}
          >
           {isSelected && <Check className='h-3 w-3 text-white' />}
          </div>
          <span
           className={`text-sm ${isSelected ? "text-teal-800 font-semibold" : "text-gray-700 font-medium"}`}
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
       className='rounded-2xl border-2 border-gray-200 min-h-[52px] text-sm px-5 focus:border-brand-teal focus:ring-2 focus:ring-teal-500/20 transition-all duration-200'
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
   <div className='space-y-6'>
    {/* 1. RED FLAGS — clean alert, no gradient */}
    {(engine.requiresUrgentReferral() || detectedRedFlags.length > 0) && (
     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='border-l-2 border-red-500 bg-red-50 px-4 py-3'
     >
      <div className='flex items-start gap-2.5'>
       <AlertTriangle className='h-4 w-4 text-red-500 flex-shrink-0 mt-0.5' />
       <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-red-800'>
         Red Flags Detected
        </p>
        {detectedRedFlags.length > 0 && (
         <p className='text-xs text-red-600 mt-1'>
          {detectedRedFlags.map((f) => f.replace(/_/g, " ")).join(" · ")}
         </p>
        )}
        {identifiedSources.some(
         (s) =>
          s.sourceRegion.toLowerCase().includes("cardiac") ||
          s.sourceRegion.toLowerCase().includes("gallbladder"),
        ) && (
         <p className='text-xs text-red-500 mt-1.5'>
          Screen before MSK treatment
         </p>
        )}
       </div>
      </div>
     </motion.div>
    )}

    {/* 2. CONTEXT LINE — inline text, not pills */}
    <div className='flex items-center gap-2 text-xs text-gray-500 flex-wrap'>
     <span className='font-semibold text-gray-700'>{classification}</span>
     <span className='text-gray-300'>·</span>
     {vasScore !== undefined && (
      <>
       <span className={vasScore >= 7 ? 'text-red-600 font-medium' : vasScore >= 4 ? 'text-amber-600 font-medium' : ''}>
        VAS {vasScore}/10
       </span>
       <span className='text-gray-300'>·</span>
      </>
     )}
     {locationStr && (
      <>
       <span className='capitalize'>{locationStr}</span>
       <span className='text-gray-300'>·</span>
      </>
     )}
     {progressionText && (
      <span className={progression === 'getting_worse' ? 'text-red-600 font-medium' : progression === 'getting_better' ? 'text-teal-600 font-medium' : ''}>
       {progressionText}
      </span>
     )}
    </div>

    {/* 3. DIFFERENTIAL DIAGNOSIS — primary content, clean list */}
    {diagnosisResult.success && diagnosisResult.diagnosis && (
     <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
     >
      <div className='flex items-center justify-between mb-3'>
       <h3 className='text-[15px] font-semibold text-gray-900'>Differential Diagnosis</h3>
       {diagnosisResult.diagnosis.treatment_urgency && (
        <span className='text-xs text-gray-400 font-medium uppercase'>
         {diagnosisResult.diagnosis.treatment_urgency}
        </span>
       )}
      </div>

      <div className='border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100'>
       {diagnosisResult.diagnosis.differential_diagnosis.map(
        (condition, index) => (
         <motion.button
          key={condition.condition_id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.06 }}
          onClick={() => handleConditionSelect(condition)}
          disabled={isProcessing}
          className='w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 group'
         >
          <div className='flex items-start gap-3'>
           <span className={`text-xs font-bold tabular-nums mt-0.5 flex-shrink-0 ${
            index === 0 ? 'text-teal-600' : 'text-gray-400'
           }`}>
            {index + 1}
           </span>
           <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
             <span className={`text-sm font-semibold ${index === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
              {condition.condition_name}
             </span>
             <span className={`text-xs font-semibold tabular-nums ${
              index === 0 ? 'text-teal-600' : 'text-gray-400'
             }`}>
              {Math.round(condition.confidence_score * 100)}%
             </span>
            </div>
            <p className='text-xs text-gray-500 mt-0.5 leading-relaxed'>
             {condition.clinical_reasoning}
            </p>
           </div>
           <ChevronRight className='h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-0.5 transition-colors' />
          </div>
         </motion.button>
        ),
       )}
      </div>

      <p className='text-xs text-gray-400 mt-2 text-center'>
       Select a diagnosis to confirm
      </p>
     </motion.div>
    )}

    {/* 4. CLINICAL SUMMARY — collapsible sections */}
    <div className='space-y-3'>
     {chiefComplaint && (
      <div className='px-0'>
       <p className='text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1'>Chief Complaint</p>
       <p className='text-sm text-gray-800'>{chiefComplaint}</p>
      </div>
     )}

     {/* Clinical data — clean key-value rows */}
     {(formatOnset() || painNature || behavior24hr || aggravating || relieving) && (
      <div className='border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-50'>
       {formatOnset() && (
        <div className='px-3 py-2 flex justify-between'>
         <span className='text-xs text-gray-400'>Onset</span>
         <span className='text-xs text-gray-700 font-medium'>{formatOnset()}</span>
        </div>
       )}
       {painNature && (
        <div className='px-3 py-2 flex justify-between'>
         <span className='text-xs text-gray-400'>Pain Type</span>
         <span className='text-xs text-gray-700 font-medium capitalize'>{formatArray(painNature)}</span>
        </div>
       )}
       {behavior24hr && (
        <div className='px-3 py-2 flex justify-between'>
         <span className='text-xs text-gray-400'>24hr Pattern</span>
         <span className='text-xs text-gray-700 font-medium capitalize'>{behavior24hr.replace(/_/g, " ")}</span>
        </div>
       )}
       {aggravating && (
        <div className='px-3 py-2 flex justify-between gap-4'>
         <span className='text-xs text-gray-400 flex-shrink-0'>Aggravating</span>
         <span className='text-xs text-gray-700 font-medium text-right capitalize'>{formatArray(aggravating)}</span>
        </div>
       )}
       {relieving && (
        <div className='px-3 py-2 flex justify-between gap-4'>
         <span className='text-xs text-gray-400 flex-shrink-0'>Relieving</span>
         <span className='text-xs text-gray-700 font-medium text-right capitalize'>{formatArray(relieving)}</span>
        </div>
       )}
      </div>
     )}

     {/* Source Detection */}
     {identifiedSources.length > 0 && (
      <div>
       <p className='text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5'>Source Detection</p>
       <div className='space-y-1.5'>
        {identifiedSources.map((source, idx) => {
         const isUrgent =
          source.sourceRegion.toLowerCase().includes("cardiac") ||
          source.sourceRegion.toLowerCase().includes("gallbladder") ||
          source.sourceRegion.toLowerCase().includes("vascular");
         return (
          <div key={idx} className='flex items-start gap-2'>
           <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${isUrgent ? "bg-red-500" : "bg-teal-500"}`} />
           <div className='min-w-0'>
            <span className={`text-xs font-semibold ${isUrgent ? "text-red-600" : "text-gray-600"}`}>
             {source.sourceRegion.replace(/_/g, " ")}
            </span>
            {isUrgent && <span className='text-[10px] text-red-500 font-semibold ml-1.5'>SCREEN</span>}
            <p className='text-xs text-gray-400 leading-tight'>{source.implication}</p>
           </div>
          </div>
         );
        })}
       </div>
      </div>
     )}

     {/* Full Summary — collapsible */}
     <details className='group'>
      <summary className='flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-gray-600 transition-colors list-none'>
       <ChevronRight className='h-3 w-3 transition-transform group-open:rotate-90' />
       <span className='font-medium'>Full summary</span>
      </summary>
      <div className='mt-2 bg-gray-50 rounded-md px-3 py-2.5 max-h-48 overflow-y-auto'>
       <pre className='text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed'>
        {diagnosisResult.clinicalSummary}
       </pre>
      </div>
     </details>
    </div>

    {/* 5. ACTIONS — simple row */}
    <div className='flex items-center gap-3 pt-1'>
     <button
      onClick={handleReset}
      className='text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5'
     >
      <RotateCcw className='h-3 w-3' /> Start over
     </button>
     {onClose && (
      <button
       onClick={onClose}
       className='text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto'
      >
       Close
      </button>
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
    showSummaryByDefault={false}
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
    {/* ===== ANSWER HISTORY — collapsible key:value dropdown ===== */}
    {!isComplete && !showInlineAssessments && !isAnalyzingForTests && answerHistory.length > 0 && (
     <AnswerHistoryDropdown entries={answerHistory} />
    )}

    {/* ===== LOADING STATE — subtle inline indicator ===== */}
    {(isTyping || isProcessing) && !isComplete && (
     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-2 py-8"
     >
      <div className="flex gap-1.5">
       <span className="w-1.5 h-1.5 bg-brand-teal/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
       <span className="w-1.5 h-1.5 bg-brand-teal/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
       <span className="w-1.5 h-1.5 bg-brand-teal/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
     </motion.div>
    )}

    {/* ===== CURRENT QUESTION — single question at a time, no chat ===== */}
    {!isTyping && !isProcessing && !isComplete && !showInlineAssessments && !isAnalyzingForTests && (
     <motion.div
      key={currentQuestion?.id || 'clubbed'}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
     >
      {/* Simple questions via InlineClinicalQuestion */}
      {currentQuestion &&
       clubbedQuestions.length === 0 &&
       isSimpleQuestionType(currentQuestion.type) && (
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
       )}

      {/* Complex questions — question text + renderInput */}
      {currentQuestion &&
       clubbedQuestions.length === 0 &&
       !isSimpleQuestionType(currentQuestion.type) &&
       currentQuestion.type !== "date" &&
       currentQuestion.type !== "body_map" && (
        <div className='space-y-4'>
         <p className='text-[15px] leading-snug text-gray-900 font-semibold tracking-tight'>
          {currentQuestion.question}
         </p>
         {renderInput()}
        </div>
       )}

      {/* Date question */}
      {currentQuestion &&
       clubbedQuestions.length === 0 &&
       currentQuestion.type === "date" && (
        <div className='space-y-4'>
         <p className='text-[15px] leading-snug text-gray-900 font-semibold tracking-tight'>
          {currentQuestion.question}
         </p>
         <DatePickerInput
          value={currentResponse}
          onChange={(val) => setCurrentResponse(val)}
         />
         <button
          type='button'
          onClick={(e) => {
           e.preventDefault();
           e.stopPropagation();
           handleSubmit();
          }}
          disabled={isProcessing || !canSubmit()}
          className='w-full rounded-xl py-3.5 text-sm font-semibold
                    bg-brand-teal text-white hover:bg-teal-700
                    transition-colors duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed'
         >
          Continue
         </button>
        </div>
       )}

      {/* Body map question — grid selector */}
      {currentQuestion &&
       clubbedQuestions.length === 0 &&
       currentQuestion.type === "body_map" && (
        <div className='space-y-4'>
         <p className='text-[15px] leading-snug text-gray-900 font-semibold tracking-tight'>
          {currentQuestion.question}
         </p>
         {renderInput()}
        </div>
       )}

      {/* Clubbed questions */}
      {clubbedQuestions.length > 0 && renderClubbedQuestions()}
     </motion.div>
    )}

    {/* ===== ANALYZING FOR TESTS — inline floating dots + rotating phrases ===== */}
    {isAnalyzingForTests && (
     <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center py-12"
     >
      <div className="flex gap-2 mb-5">
       <motion.div
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
        className="w-2.5 h-2.5 bg-brand-teal rounded-full"
       />
       <motion.div
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
        className="w-2.5 h-2.5 bg-brand-teal rounded-full"
       />
       <motion.div
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
        className="w-2.5 h-2.5 bg-brand-teal rounded-full"
       />
      </div>
      <AnimatePresence mode="wait">
       <motion.p
        key={analyzingPhrase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-gray-500 font-medium text-center"
       >
        {analyzingPhrase}
       </motion.p>
      </AnimatePresence>
     </motion.div>
    )}

    {/* ===== INLINE CLINICAL TESTS — clean, minimal ===== */}
    {showInlineAssessments && inlineRecommendations.length > 0 && (
     <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4"
     >
      {/* Header line */}
      <div>
       <div className="flex items-center justify-between">
        <p className="text-[15px] leading-relaxed text-gray-800">
         Recommended clinical tests
        </p>
        {answerHistory.length > 0 && (
         <button
          onClick={() => setShowResponsesPanel(true)}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
         >
          {answerHistory.length} responses
         </button>
        )}
       </div>
       <div className="flex items-center gap-3 mt-2">
        {screeningContext.region && (
         <span className="text-xs text-gray-500">
          {screeningContext.side === "left" ? "Left" : screeningContext.side === "right" ? "Right" : screeningContext.side === "both" ? "Bilateral" : ""}{" "}
          {screeningContext.region?.replace(/_/g, " ").replace(/-/g, " ")}
         </span>
        )}
        {screeningContext.vasScore && (
         <span className="text-xs text-gray-500">
          Pain {screeningContext.vasScore}/10
         </span>
        )}
        {detectedRedFlags.length > 0 && (
         <span className="text-xs text-red-500 font-medium">
          {detectedRedFlags.length} red flag{detectedRedFlags.length !== 1 ? "s" : ""}
         </span>
        )}
        <span className="text-xs text-gray-400 ml-auto tabular-nums">
         {Object.keys(inlineCapturedResults).length}/{inlineRecommendations.length}
        </span>
       </div>
       {/* Thin progress line */}
       <div className="mt-2 h-0.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
         animate={{ width: `${(Object.keys(inlineCapturedResults).length / inlineRecommendations.length) * 100}%` }}
         transition={{ duration: 0.4, ease: "easeOut" }}
         className="h-full bg-brand-teal rounded-full"
        />
       </div>
      </div>

      {/* Test list — clean dividers, no heavy cards */}
      <div className="divide-y divide-gray-100">
       {inlineRecommendations.map((rec, idx) => {
        const isCaptured = !!inlineCapturedResults[rec.assessment_id];
        const isActive = idx === inlineActiveIndex && !inlineAllComplete;

        return (
         <motion.div
          key={rec.assessment_id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06, duration: 0.2, ease: "easeOut" }}
          className={isActive ? "py-3" : "py-1.5"}
         >
          <QuickAssessmentInput
           assessmentId={rec.assessment_id}
           screeningContext={screeningContext}
           relevanceScore={rec.relevance_score}
           onCapture={handleInlineCapture}
           isActive={isActive}
           completedData={isCaptured ? inlineCapturedResults[rec.assessment_id] : null}
          />
         </motion.div>
        );
       })}
      </div>

      {/* Actions row — minimal */}
      <div className="flex items-center justify-between pt-2">
       <div className="flex items-center gap-4">
        {!inlineAllComplete && (
         <button
          onClick={handleInlineSkipCurrent}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
         >
          Skip test
         </button>
        )}
        <button
         onClick={() => setShowAddTest(true)}
         className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
         + Add test
        </button>
        <button
         onClick={handleSkipAllAssessments}
         className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
         Skip to diagnosis
        </button>
       </div>
       {inlineAllComplete && (
        <button
         onClick={handleGenerateDiagnosis}
         className="px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
         Generate Diagnosis
        </button>
       )}
      </div>
     </motion.div>
    )}

    {/* ===== ADD TEST SIDE PANEL — slides from right ===== */}
    <AnimatePresence>
     {showAddTest && (
      <>
       <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { setShowAddTest(false); setAddSearchTerm(""); }}
        className="fixed inset-0 bg-black/20 z-[60]"
       />
       <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-[61] flex flex-col"
       >
        {/* Panel header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
         <h3 className="text-sm font-semibold text-gray-900">Add Test</h3>
         <button
          onClick={() => { setShowAddTest(false); setAddSearchTerm(""); }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
         >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
         </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
         <div className="relative">
          <input
           type="text"
           value={addSearchTerm}
           onChange={e => setAddSearchTerm(e.target.value)}
           placeholder="Search tests..."
           autoFocus
           className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-gray-50"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
         </div>
        </div>

        {/* Test list */}
        <div className="flex-1 overflow-y-auto">
         {Object.entries(availableAssessments)
          .filter(([id, a]: [string, any]) => {
           const alreadyAdded = inlineRecommendations.some(r => r.assessment_id === id);
           if (alreadyAdded) return false;
           if (!addSearchTerm || addSearchTerm.length < 2) return true;
           return a.name?.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
            a.purpose?.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
            a.type?.toLowerCase().includes(addSearchTerm.toLowerCase());
          })
          .slice(0, 30)
          .map(([id, a]: [string, any]) => (
           <button
            key={id}
            onClick={() => handleInlineAddTest(id)}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 flex items-center justify-between gap-3"
           >
            <div className="min-w-0">
             <p className="text-sm text-gray-800 truncate">{a.name}</p>
             <p className="text-xs text-gray-400 truncate">{a.type?.replace(/_/g, " ")}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
           </button>
          ))}
        </div>
       </motion.div>
      </>
     )}
    </AnimatePresence>

    {/* ===== RESPONSES SIDE PANEL — slides from right ===== */}
    <AnimatePresence>
     {showResponsesPanel && (
      <>
       <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowResponsesPanel(false)}
        className="fixed inset-0 bg-black/20 z-[60]"
       />
       <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-[61] flex flex-col"
       >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
         <h3 className="text-sm font-semibold text-gray-900">Screening Responses</h3>
         <button
          onClick={() => setShowResponsesPanel(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
         >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
         </button>
        </div>
        <div className="flex-1 overflow-y-auto">
         {answerHistory.map((entry) => (
          <div key={entry.id} className="flex items-start justify-between px-4 py-2.5 border-b border-gray-50">
           <span className="text-xs text-gray-400 font-medium min-w-0 flex-shrink-0 mr-3">{entry.label}</span>
           <span className="text-xs text-gray-800 font-medium text-right">{entry.value}</span>
          </div>
         ))}
        </div>
       </motion.div>
      </>
     )}
    </AnimatePresence>

    {/* ===== DIAGNOSIS RESULTS ===== */}
    {isComplete && diagnosisResult && (
     <div className='py-2'>
      {renderDiagnosisResults()}
     </div>
    )}

    <div ref={chatEndRef} />
   </ClinicalChatbotLayout>

   {/* Keep existing modals and overlays */}
   <AnimatePresence>
    {isComplete && diagnosisResult?.success && <ExtractedCompletionCelebration />}
   </AnimatePresence>


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
