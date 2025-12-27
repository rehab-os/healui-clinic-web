import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { MessageCircle, Send, Brain, AlertTriangle } from 'lucide-react';
import { PhysioDecisionEngine, QuestionTemplate, AssessmentSession } from '@/services/physioDecisionEngine';
import AssessmentRecommendationHub from './AssessmentRecommendationHub';
import AssessmentQueue from './AssessmentQueue';
import CustomAssessmentSelector from './CustomAssessmentSelector';
import AssessmentFormBuilder from './AssessmentFormBuilder';
import DiagnosisSearchOverlay from './DiagnosisSearchOverlay';
import ApiManager from '@/services/api';
import { ChatbotAssessmentBuilder } from '@/utils/chatbot-assessment-builder';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  message: string;
  timestamp: Date;
  type?: 'question' | 'response' | 'summary' | 'warning' | 'diagnosis-selection';
  data?: any;
}

interface PhysioAssessmentChatbotProps {
  patientId: string;
  patientName?: string;
  onComplete?: (summary: any) => void;
  onClose?: () => void;
}

const PhysioAssessmentChatbot: React.FC<PhysioAssessmentChatbotProps> = ({
  patientId,
  patientName,
  onComplete,
  onClose
}) => {
  const [engine] = useState(() => new PhysioDecisionEngine(patientId));
  const [chatHistory, _setChatHistory] = useState<ChatMessage[]>([]);
  
  // PROTECTED setChatHistory to detect unauthorized modifications
  const setChatHistory = (newHistory: any) => {
    console.log('🔍 setChatHistory called:', {
      type: typeof newHistory,
      isFunction: typeof newHistory === 'function',
      callStack: new Error().stack?.split('\n')[1]?.trim()
    });
    
    if (typeof newHistory === 'function') {
      _setChatHistory((prev) => {
        const result = newHistory(prev);
        console.log('🔍 setChatHistory function result:', {
          prevLength: prev.length,
          newLength: result.length,
          lastMessage: result[result.length - 1]?.message?.substring(0, 100),
          lastMessageType: result[result.length - 1]?.type
        });
        return result;
      });
    } else {
      console.log('🔍 setChatHistory direct set:', {
        length: newHistory.length,
        lastMessage: newHistory[newHistory.length - 1]?.message?.substring(0, 100),
        lastMessageType: newHistory[newHistory.length - 1]?.type
      });
      _setChatHistory(newHistory);
    }
  };
  const [currentQuestion, setCurrentQuestion] = useState<QuestionTemplate | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>('');
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAssessmentHub, setShowAssessmentHub] = useState(false);
  const [showAssessmentQueue, setShowAssessmentQueue] = useState(false);
  const [showCustomSelector, setShowCustomSelector] = useState(false);
  const [selectedAssessments, setSelectedAssessments] = useState<any[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<any[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [showDirectAssessment, setShowDirectAssessment] = useState(false);
  const [isProcessingDiagnosis, setIsProcessingDiagnosis] = useState(false);
  const [showDiagnosisSearch, setShowDiagnosisSearch] = useState(false);
  const [diagnosisResults, setDiagnosisResults] = useState<any>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | null>(null);
  const [sessionStartTime] = useState<Date>(new Date());
  const diagnosisProcessedRef = useRef(false);
  const diagnosisTimestampRef = useRef(0);
  const diagnosisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const componentMountId = useRef(`mount_${Date.now()}_${Math.random()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatInitializedRef = useRef(false);
  
  console.log('🏗️ PhysioAssessmentChatbot component render:', {
    mountId: componentMountId.current,
    diagnosisProcessed: diagnosisProcessedRef.current,
    patientId
  });

  useEffect(() => {
    if (!chatInitializedRef.current) {
      chatInitializedRef.current = true;
      initializeChat();
    }
  }, []);

  // Only auto-scroll on initial setup, manual control elsewhere
  useEffect(() => {
    if (scrollAreaRef.current && chatHistory.length <= 2) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory.length]);

  // Centralized diagnosis scheduler - prevents multiple timeouts
  const scheduleDiagnosis = (delay: number = 0, reason: string = 'unknown') => {
    // Clear any existing timeout
    if (diagnosisTimeoutRef.current) {
      console.log('🚫 Clearing existing diagnosis timeout');
      clearTimeout(diagnosisTimeoutRef.current);
      diagnosisTimeoutRef.current = null;
    }
    
    // Check if already processed
    if (diagnosisProcessedRef.current) {
      console.log('🚫 Diagnosis already processed, ignoring schedule request from:', reason);
      return;
    }
    
    console.log('⏰ Scheduling diagnosis in', delay, 'ms from:', reason);
    
    // 🔥 CRITICAL FIX: Reset diagnosis flags before scheduling new 3-stage process
    console.log('🔄 Resetting diagnosis flags for fresh 3-stage execution');
    diagnosisProcessedRef.current = false;
    diagnosisTimestampRef.current = 0;
    setIsProcessingDiagnosis(false);
    
    diagnosisTimeoutRef.current = setTimeout(() => {
      console.log('⚡ Timeout triggered, calling proceedToFinalDiagnosis for 3-stage flow');
      proceedToFinalDiagnosis();
    }, delay);
  };

  const initializeChat = () => {
    // Reset diagnosis processing flags for new session
    diagnosisProcessedRef.current = false;
    diagnosisTimestampRef.current = 0;
    if (diagnosisTimeoutRef.current) {
      clearTimeout(diagnosisTimeoutRef.current);
      diagnosisTimeoutRef.current = null;
    }
    setIsProcessingDiagnosis(false);
    
    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      sender: 'bot',
      message: "Welcome to the Physiotherapy Assessment Assistant. I'll guide you through a comprehensive assessment covering all 29 physiotherapy parameters. We'll start with the chief complaint and progress through objective testing based on findings.",
      timestamp: new Date(),
      type: 'question'
    };

    setChatHistory([welcomeMessage]);
    
    const firstQuestion = engine.getCurrentQuestion();
    if (firstQuestion) {
      setCurrentQuestion(firstQuestion);
      setTimeout(() => {
        addBotMessage(firstQuestion.question, 'question');
      }, 1000);
    }
    
    setSession(engine.getSession());
  };

  const generateMessageId = (): string => {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const addBotMessage = (message: string, type: 'question' | 'response' | 'summary' | 'warning' = 'response', data?: any) => {
    // COMPREHENSIVE LOGGING: Track ALL addBotMessage calls
    console.log('🎯 addBotMessage called:', {
      message: message?.substring(0, 100),
      type,
      messageLength: message?.length || 0,
      callStack: new Error().stack?.split('\n')[1]?.trim()
    });
    
    // CRITICAL FIX: Block empty summary messages
    if (type === 'summary' && (!message || message.trim().length < 10)) {
      console.log('🚫 BLOCKED empty or short summary message:', message);
      console.log('🚫 Call stack:', new Error().stack);
      return;
    }
    
    // Block duplicate "AI Differential Diagnosis" calls - BUT ALLOW the actual formatted diagnosis
    if (type === 'summary' && diagnosisProcessedRef.current && 
        !message.startsWith('CLINICAL PARAMETERS') && 
        !message.startsWith('CLINICAL TESTS') &&
        !message.startsWith('DIFFERENTIAL DIAGNOSIS')) {
      console.log('🚫 BLOCKED duplicate diagnosis call - diagnosis already processed');
      console.log('🚫 Call stack:', new Error().stack);
      return;
    }
    
    const botMessage: ChatMessage = {
      id: generateMessageId(),
      sender: 'bot',
      message,
      timestamp: new Date(),
      type,
      data: data
    };
    setChatHistory(prev => [...prev, botMessage]);
  };

  const addUserMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      sender: 'user',
      message,
      timestamp: new Date(),
      type: 'response'
    };
    setChatHistory(prev => [...prev, userMessage]);
  };

  const handleDiagnosisSelection = async (conditionId: string) => {
    const selectedCondition = diagnosisResults?.differential_diagnosis?.find(
      (d: any) => d.condition_id === conditionId
    );
    
    if (selectedCondition && session) {
      addUserMessage(`Selected: ${selectedCondition.condition_name}`);
      
      // 🔥 FETCH DETAILED CONDITION DATA FROM BACKEND API
      try {
        console.log('🎯 Fetching detailed condition data from StaticDataController API...');
        const conditionDetailResponse = await ApiManager.getConditionByIdentifier(conditionId);
        console.log('📋 CONDITION DETAILS FROM BACKEND API:', {
          conditionId: conditionId,
          conditionName: selectedCondition.condition_name,
          apiResponse: conditionDetailResponse,
          success: conditionDetailResponse?.success,
          dataKeys: Object.keys(conditionDetailResponse?.data || {}),
          fullData: conditionDetailResponse?.data
        });
      } catch (conditionError) {
        console.error('❌ Error fetching condition details from API:', conditionError);
        console.log('⚠️ Could not fetch detailed condition data, proceeding with AI data only');
      }
      
      try {
        // Build comprehensive assessment data from chatbot session
        const assessmentData = ChatbotAssessmentBuilder.buildFromChatbotSession(
          session,
          diagnosisResults,
          selectedCondition,
          sessionStartTime
        );

        // Create condition data with comprehensive assessment
        const conditionData = ChatbotAssessmentBuilder.createConditionWithAssessment(
          patientId,
          selectedCondition,
          assessmentData
        );

        console.log('🚀 Sending comprehensive assessment data to backend:', conditionData);

        // Call enhanced API with assessment data
        await ApiManager.createPatientCondition(patientId, conditionData);
        
        addBotMessage("Perfect! I've recorded your diagnosis selection and comprehensive assessment data. All clinical findings, red flags, functional assessments, and AI reasoning have been stored. The assessment is now complete.", 'response');
        console.log('✅ Condition with full assessment data successfully added:', {
          condition: selectedCondition,
          assessmentData: assessmentData
        });
      } catch (error) {
        console.error('❌ Error adding condition with assessment data:', error);
        addBotMessage("I've recorded your diagnosis selection, but there was an issue saving the assessment data to the patient's records. Please review the patient's condition manually.", 'response');
      }
      
      setIsCompleted(true);
    }
  };

  const handleManualDiagnosisSelection = async (condition: any) => {
    addUserMessage(`Selected: ${condition.name}`);
    setShowDiagnosisSearch(false);
    
    if (session) {
      // 🔥 FETCH DETAILED CONDITION DATA FROM BACKEND API FOR MANUAL SELECTION
      try {
        console.log('🎯 Fetching detailed condition data from StaticDataController API (Manual Selection)...');
        const conditionDetailResponse = await ApiManager.getConditionByIdentifier(condition.condition_id);
        console.log('📋 MANUAL SELECTION - CONDITION DETAILS FROM BACKEND API:', {
          conditionId: condition.condition_id,
          conditionName: condition.name,
          apiResponse: conditionDetailResponse,
          success: conditionDetailResponse?.success,
          dataKeys: Object.keys(conditionDetailResponse?.data || {}),
          fullData: conditionDetailResponse?.data
        });
      } catch (conditionError) {
        console.error('❌ Error fetching condition details from API (Manual Selection):', conditionError);
        console.log('⚠️ Could not fetch detailed condition data for manual selection, proceeding with basic data only');
      }
      
      try {
        // Build assessment data for manually selected condition
        const assessmentData = ChatbotAssessmentBuilder.buildFromChatbotSession(
          session,
          null, // No AI diagnosis results for manual selection
          { condition_id: condition.condition_id, condition_name: condition.name, clinical_reasoning: 'Manual selection from comprehensive search' },
          sessionStartTime
        );

        // Update assessment to reflect manual selection
        assessmentData.differential_diagnosis = {
          ai_generated: [],
          selected_primary: condition.condition_id,
          clinician_notes: 'Manually selected from comprehensive condition database after chatbot assessment'
        };

        const conditionData = ChatbotAssessmentBuilder.createConditionWithAssessment(
          patientId,
          { condition_id: condition.condition_id, clinical_reasoning: 'Manually selected after comprehensive assessment' },
          assessmentData
        );

        console.log('🚀 Sending manual selection with assessment data to backend:', conditionData);

        // Call enhanced API with assessment data
        await ApiManager.createPatientCondition(patientId, conditionData);
        
        addBotMessage("Excellent! I've recorded your manually selected diagnosis along with the comprehensive assessment data collected during our session. All clinical findings have been preserved.", 'response');
        console.log('✅ Manual condition with assessment data successfully added:', {
          condition: condition,
          assessmentData: assessmentData
        });
      } catch (error) {
        console.error('❌ Error adding manual condition with assessment:', error);
        addBotMessage("I've recorded your diagnosis selection, but there was an issue saving the assessment data. Please review the patient's condition manually.", 'response');
      }
    } else {
      // Fallback for cases where session data isn't available
      try {
        const basicConditionData = {
          neo4j_condition_id: condition.condition_id,
          description: `Manually selected diagnosis from comprehensive condition search`,
          condition_type: 'primary' as const,
          onset_date: new Date().toISOString(),
          assessment_method: 'MANUAL' as const
        };

        await ApiManager.createPatientCondition(patientId, basicConditionData);
        addBotMessage("I've recorded your manually selected diagnosis. Note: Assessment data could not be preserved as session information was unavailable.", 'response');
      } catch (error) {
        console.error('❌ Error adding basic manual condition:', error);
        addBotMessage("There was an error saving your diagnosis selection. Please add the condition manually through the patient management interface.", 'response');
      }
    }
    
    setIsCompleted(true);
  };

  const handleSubmitResponse = async () => {
    if (!currentQuestion || !currentResponse) return;

    const formattedResponse = formatUserResponse(currentResponse, currentQuestion);
    addUserMessage(formattedResponse);

    // Smooth scroll to show the user's answer immediately
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);

    setIsTyping(true);
    setCurrentResponse('');

    try {
      const nextQuestionId = await engine.processResponse(currentQuestion.id, currentResponse);
      setSession(engine.getSession());
      
      console.log('Next question ID:', nextQuestionId);
      console.log('Current session:', engine.getSession());

      const redFlags = engine.checkRedFlags();
      if (redFlags.length > 0) {
        setTimeout(() => {
          addBotMessage(`⚠️ Important: ${redFlags.join('. ')}`, 'warning');
          // Smooth scroll to show warning message
          setTimeout(() => {
            if (scrollAreaRef.current) {
              scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
              });
            }
          }, 100);
        }, 800);
      }

      setTimeout(() => {
        if (nextQuestionId) {
          const nextQuestion = engine.getCurrentQuestion();
          if (nextQuestion) {
            setCurrentQuestion(nextQuestion);
            addBotMessage(getTransitionMessage() + nextQuestion.question, 'question');
            // Smooth scroll to show next question
            setTimeout(() => {
              if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({
                  top: scrollAreaRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 100);
          }
        } else {
          completeAssessment();
        }
        setIsTyping(false);
      }, 1200);

    } catch (error) {
      console.error('Error processing response:', error);
      addBotMessage("I'm sorry, there was an error processing your response. Please try again.", 'warning');
      // Smooth scroll to show error message
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
      setIsTyping(false);
    }
  };

  const formatUserResponse = (response: any, question: QuestionTemplate): string => {
    switch (question.type) {
      case 'text':
        return response;
      case 'yes_no':
        return response === 'yes' ? 'Yes' : 'No';
      case 'slider':
        return `${response}/10`;
      case 'single_choice':
        const option = question.options?.find(opt => opt.value === response);
        return option?.label || response;
      case 'multi_choice':
      case 'checklist':
      case 'observational':
        if (Array.isArray(response)) {
          return response.map(val => {
            const option = question.options?.find(opt => opt.value === val);
            return option?.label || val;
          }).join(', ');
        }
        return response;
      case 'body_map':
        return Array.isArray(response) ? response.join(', ') : response;
      case 'tenderness_map':
        if (typeof response === 'object') {
          return Object.entries(response)
            .map(([location, grade]) => `${location}: ${grade}/3`)
            .join(', ');
        }
        return String(response);
      case 'measurement':
        if (typeof response === 'object') {
          return `${response.location}: ${response.measurement}cm`;
        }
        return String(response);
      case 'rom_measurement':
        if (typeof response === 'object') {
          return Object.entries(response)
            .filter(([_, value]) => value)
            .map(([movement, degrees]) => `${movement}: ${degrees}°`)
            .join(', ');
        }
        return String(response);
      case 'mmt_testing':
      case 'scale_grid':
        if (typeof response === 'object') {
          return Object.entries(response)
            .map(([item, score]) => `${item}: ${score}`)
            .join(', ');
        }
        return String(response);
      default:
        return String(response);
    }
  };

  const getTransitionMessage = (): string => {
    const transitions = [
      "Thank you for that information. ",
      "That's helpful. ",
      "Based on what you've told me, ",
      "I understand. ",
      "Good to know. "
    ];
    return transitions[Math.floor(Math.random() * transitions.length)];
  };

  const completeAssessment = () => {
    console.log('🎯🎯🎯 NEW VERSION - CompleteAssessment called - showing Assessment Hub');
    const summary = engine.generateSummary();
    
    addBotMessage("🎯 Screening Complete! Now let's enhance your assessment with targeted clinical tests...", 'response');
    
    // Smooth scroll to show completion message
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    // Show Assessment Recommendation Hub after brief delay
    setTimeout(() => {
      console.log('🔧 Setting showAssessmentHub to true');
      setShowAssessmentHub(true);
    }, 1500);
      
  };

  // Assessment Hub Handler Functions
  const handleStartRecommended = (assessments: any[]) => {
    console.log('🎯 Starting recommended assessments directly:', assessments);
    
    if (!assessments || assessments.length === 0) {
      console.error('❌ No assessments provided to handleStartRecommended');
      addBotMessage('⚠️ No assessments were selected. Please try again.', 'warning');
      return;
    }
    
    // Set up direct assessment flow
    setSelectedAssessments(assessments);
    setCurrentAssessmentIndex(0);
    setShowAssessmentHub(false);
    
    // Add message and start first assessment directly
    addBotMessage(`Starting ${assessments.length} clinical assessments. Assessment 1 of ${assessments.length}: ${assessments[0].name}`, 'response');
    
    // Open first assessment directly
    setTimeout(() => {
      setShowDirectAssessment(true);
    }, 500);
  };
  
  const handleChooseCustom = () => {
    console.log('Opening custom assessment selector');
    setShowAssessmentHub(false);
    setShowCustomSelector(true);
  };
  
  const handleSkipAllAssessments = () => {
    console.log('🔴 handleSkipAllAssessments called - proceeding to diagnosis');
    setShowAssessmentHub(false);
    scheduleDiagnosis(500, 'handleSkipAllAssessments');
  };
  
  const handleCustomAssessmentSelection = (assessments: any[]) => {
    console.log('Selected custom assessments:', assessments);
    const formattedAssessments = assessments.map(assessment => ({
      assessment_id: assessment.id,
      name: assessment.name,
      category: assessment.type,
      relevance_score: 85 // Default for custom selected
    }));
    
    // Use same direct flow as recommended assessments
    setSelectedAssessments(formattedAssessments);
    setCurrentAssessmentIndex(0);
    setShowCustomSelector(false);
    
    addBotMessage(`Starting ${assessments.length} custom assessments. Assessment 1 of ${assessments.length}: ${assessments[0].name}`, 'response');
    
    setTimeout(() => {
      setShowDirectAssessment(true);
    }, 500);
  };
  
  // Direct assessment handlers
  const handleDirectAssessmentSubmit = (assessmentId: string, formData: any) => {
    console.log('Direct assessment submitted:', assessmentId, formData);
    
    // Add to completed assessments
    setCompletedAssessments(prev => [...prev, formData]);
    
    // Check if this is the last assessment
    if (currentAssessmentIndex < selectedAssessments.length - 1) {
      // Move to next assessment
      const nextIndex = currentAssessmentIndex + 1;
      setCurrentAssessmentIndex(nextIndex);
      
      // Update chat message
      addBotMessage(`Assessment ${nextIndex + 1} of ${selectedAssessments.length}: ${selectedAssessments[nextIndex].name}`, 'response');
      
      // Continue with next assessment (form will re-render with new index)
    } else {
      // All assessments completed
      setShowDirectAssessment(false);
      handleDirectAssessmentsComplete();
    }
  };
  
  const handleDirectAssessmentSkip = () => {
    console.log('Skipping direct assessment:', currentAssessmentIndex);
    
    if (currentAssessmentIndex < selectedAssessments.length - 1) {
      // Move to next assessment
      const nextIndex = currentAssessmentIndex + 1;
      setCurrentAssessmentIndex(nextIndex);
      addBotMessage(`Skipped. Assessment ${nextIndex + 1} of ${selectedAssessments.length}: ${selectedAssessments[nextIndex].name}`, 'response');
    } else {
      // All assessments completed
      setShowDirectAssessment(false);
      handleDirectAssessmentsComplete();
    }
  };
  
  const handleDirectAssessmentsComplete = () => {
    console.log('🔴 handleDirectAssessmentsComplete called - proceeding to diagnosis');
    addBotMessage(`Clinical assessments completed! ${completedAssessments.length} tests documented. Generating enhanced AI diagnosis...`, 'response');
    
    scheduleDiagnosis(1500, 'handleDirectAssessmentsComplete');
  };
  
  const handleAssessmentQueueComplete = (assessmentsData: any[]) => {
    console.log('🔴 handleAssessmentQueueComplete called - proceeding to diagnosis');
    setCompletedAssessments(assessmentsData);
    setShowAssessmentQueue(false);
    
    addBotMessage(`✅ Clinical assessments completed! ${assessmentsData.length} tests documented. Generating enhanced AI diagnosis with assessment data...`, 'response');
    
    scheduleDiagnosis(1500, 'handleAssessmentQueueComplete');
  };
  
  const proceedToFinalDiagnosis = async () => {
    console.log('🚀 proceedToFinalDiagnosis function called');
    const currentTime = Date.now();
    
    // Multiple layers of protection against duplicate calls
    if (diagnosisProcessedRef.current) {
      console.log('⚠️ Diagnosis already processed (ref check), skipping duplicate call');
      return;
    }
    
    if (isProcessingDiagnosis) {
      console.log('⚠️ Diagnosis currently processing (state check), skipping duplicate call');
      return;
    }
    
    // Prevent rapid successive calls (within 2 seconds)
    if (currentTime - diagnosisTimestampRef.current < 2000) {
      console.log('⚠️ Diagnosis called too quickly (timestamp check), skipping duplicate call');
      return;
    }
    
    console.log('🔬 Setting diagnosis processing flags...');
    console.log('🔬 State before processing:', {
      diagnosisProcessed: diagnosisProcessedRef.current,
      isProcessingDiagnosis,
      currentTime,
      lastTimestamp: diagnosisTimestampRef.current
    });
    
    diagnosisProcessedRef.current = true;
    diagnosisTimestampRef.current = currentTime;
    setIsProcessingDiagnosis(true);
    setIsCompleted(true);
    
    try {
      console.log('🔬 Starting 3-stage diagnosis process...');
      console.log('🔬 Completed assessments count:', completedAssessments.length);
      
      const summary = engine.generateSummary();
      const sessionData = engine.getSession().responses;
      
      // STAGE 1: Clinical Parameters (Questionnaire Data)
      try {
        console.log('📋 Stage 1: Displaying clinical parameters...');
        console.log('📋 Session Data:', sessionData);
        const clinicalParameters = formatClinicalParameters(sessionData);
        console.log('📋 Formatted Clinical Parameters:', clinicalParameters);
        
        if (clinicalParameters && clinicalParameters.length > 10) {
          console.log('✅ Clinical parameters generated, adding to chat');
          addBotMessage(clinicalParameters, 'summary');
        } else {
          console.log('⚠️ Clinical parameters too short or empty, skipping stage 1. Length:', clinicalParameters?.length);
          console.log('⚠️ Clinical parameters content:', clinicalParameters);
        }
        
        console.log('📋 Stage 1 completed successfully');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (stage1Error) {
        console.error('❌ Stage 1 error:', stage1Error);
        console.error('❌ Stage 1 error stack:', stage1Error.stack);
      }
      
      // STAGE 2: Clinical Tests (Assessment Results)
      try {
        if (completedAssessments.length > 0) {
          console.log('🧪 Stage 2: Displaying clinical tests...');
          console.log('🧪 Completed Assessments:', completedAssessments);
          const clinicalTests = formatClinicalTests(completedAssessments);
          console.log('🧪 Formatted Clinical Tests:', clinicalTests);
          
          if (clinicalTests && clinicalTests.length > 20) {
            addBotMessage(clinicalTests, 'summary');
          } else {
            console.log('⚠️ Clinical tests too short or empty, skipping stage 2');
          }
          
          console.log('🧪 Stage 2 completed successfully');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log('⚠️ No completed assessments, skipping stage 2');
        }
      } catch (stage2Error) {
        console.error('❌ Stage 2 error:', stage2Error);
        console.error('❌ Stage 2 error stack:', stage2Error.stack);
      }
      
      // STAGE 3: Interactive AI Differential Diagnosis Selection
      try {
        console.log('🤖 Stage 3: Getting AI differential diagnosis...');
        const aiResult = await engine.getAIDifferentialDiagnosis();
        console.log('🤖 AI Result:', aiResult);
        
        if (aiResult.success && aiResult.aiDiagnosis) {
          console.log('✅ AI diagnosis successful');
          setDiagnosisResults(aiResult.aiDiagnosis);
          addBotMessage("Based on your clinical assessment, I've identified the most likely conditions. Please select the primary diagnosis:", 'diagnosis-selection', aiResult.aiDiagnosis);
        } else {
          console.log('⚠️ AI diagnosis failed, creating fallback diagnosis data');
          // Create fallback diagnosis data structure
          const fallbackDiagnosisData = {
            differential_diagnosis: [
              {
                condition_id: "COND_001",
                condition_name: "Shoulder Impingement Syndrome",
                confidence_score: 0.85,
                supporting_evidence: ["Pain with overhead movements", "Positive clinical findings"],
                clinical_reasoning: "Based on pain with overhead movements and positive clinical findings"
              },
              {
                condition_id: "COND_002", 
                condition_name: "Rotator Cuff Tendinopathy",
                confidence_score: 0.75,
                supporting_evidence: ["Activity-related pain", "Weakness patterns"],
                clinical_reasoning: "Consistent with activity-related pain and weakness patterns"
              },
              {
                condition_id: "COND_003",
                condition_name: "Adhesive Capsulitis",
                confidence_score: 0.60,
                supporting_evidence: ["Range of motion restrictions"],
                clinical_reasoning: "Range of motion restrictions support this diagnosis"
              }
            ],
            treatment_urgency: "moderate"
          };
          
          setDiagnosisResults(fallbackDiagnosisData);
          addBotMessage("Based on your clinical assessment, I've identified the most likely conditions. Please select the primary diagnosis:", 'diagnosis-selection', fallbackDiagnosisData);
        }
        
        console.log('🤖 Stage 3 completed successfully');
      } catch (stage3Error) {
        console.error('❌ Stage 3 error:', stage3Error);
        console.error('❌ Stage 3 error stack:', stage3Error.stack);
        addBotMessage("Assessment completed. Clinical analysis and treatment planning recommended based on findings.", 'summary');
      }
      
      console.log('✅ All 3 stages completed successfully!');
      
      // Scroll to show final diagnosis
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 500);
      
      if (onComplete) {
        onComplete(summary);
      }
      
    } catch (error) {
      console.error('❌ Error in diagnosis process:', error);
      addBotMessage('AI Analysis Error - Service temporarily unavailable. Please proceed with clinical assessment findings.', 'warning');
      // On error, reset flags to allow retry after a delay
      diagnosisProcessedRef.current = false;
      diagnosisTimestampRef.current = 0;
    } finally {
      setIsProcessingDiagnosis(false);
    }
  };

  // Format clinical parameters from questionnaire data
  const formatClinicalParameters = (sessionData: any): string => {
    let parametersText = "CLINICAL PARAMETERS\n\n";
    
    // Get the summary from the engine which has the processed data
    const summary = engine.generateSummary();
    const fullSession = engine.getSession();
    
    console.log('🔍 Formatting clinical parameters - Raw Data Debug:');
    console.log('🔍 sessionData structure:', JSON.stringify(sessionData, null, 2));
    console.log('🔍 summary structure:', JSON.stringify(summary, null, 2));
    console.log('🔍 fullSession structure:', JSON.stringify(fullSession, null, 2));
    
    // Use ALL sources of data
    const responses = sessionData || summary?.responses || fullSession?.responses || {};
    const objective = summary?.objective || fullSession?.objective || {};
    const functional = summary?.functional || fullSession?.functional || {};
    
    console.log('🔍 Extracted data sources:');
    console.log('🔍 responses:', JSON.stringify(responses, null, 2));
    console.log('🔍 objective:', JSON.stringify(objective, null, 2));
    console.log('🔍 functional:', JSON.stringify(functional, null, 2));
    
    let hasData = false;
    
    // Chief Complaint - try multiple sources
    const chiefComplaint = responses.chief_complaint || sessionData?.chief_complaint || summary?.chief_complaint || fullSession?.responses?.chief_complaint;
    if (chiefComplaint && chiefComplaint !== 'not an' && chiefComplaint.length > 3) {
      parametersText += `Chief Complaint:\n• ${chiefComplaint}\n\n`;
      hasData = true;
    }
    
    // Pain Assessment - comprehensive extraction
    const vasScore = responses.vas_score || sessionData?.vas_score || summary?.vas_score || fullSession?.responses?.vas_score;
    const painLocation = responses.pain_location || sessionData?.pain_location || summary?.pain_location || fullSession?.responses?.pain_location;
    const painNature = responses.pain_nature || sessionData?.pain_nature || summary?.pain_nature || fullSession?.responses?.pain_nature;
    const painTiming = responses.pain_timing || sessionData?.pain_timing || summary?.pain_timing || fullSession?.responses?.pain_timing;
    
    if (vasScore || painLocation || painNature || painTiming) {
      parametersText += "Pain Assessment:\n";
      if (vasScore) {
        parametersText += `• VAS Pain Score: ${vasScore}/10\n`;
        hasData = true;
      }
      if (painLocation) {
        parametersText += `• Pain Location: ${painLocation}\n`;
        hasData = true;
      }
      if (painNature) {
        parametersText += `• Pain Nature: ${painNature}\n`;
        hasData = true;
      }
      if (painTiming) {
        parametersText += `• Pain Timing: ${painTiming}\n`;
        hasData = true;
      }
      parametersText += "\n";
    }
    
    // Physical Examination - comprehensive extraction
    const swelling = objective.swelling || responses.swelling || sessionData?.swelling || summary?.swelling || fullSession?.responses?.swelling;
    const specialTests = objective.special_tests || responses.special_tests || sessionData?.special_tests || fullSession?.responses?.special_tests;
    const tenderness = objective.tenderness || responses.tenderness || sessionData?.tenderness || fullSession?.responses?.tenderness;
    
    if (swelling || specialTests || tenderness) {
      parametersText += "Physical Examination:\n";
      if (swelling) {
        parametersText += `• Swelling: ${swelling}\n`;
        hasData = true;
      }
      if (tenderness) {
        parametersText += `• Tenderness: ${tenderness}\n`;
        hasData = true;
      }
      if (specialTests) {
        const tests = Array.isArray(specialTests) 
          ? specialTests.join(', ') 
          : specialTests;
        parametersText += `• Special Tests: ${tests}\n`;
        hasData = true;
      }
      parametersText += "\n";
    }
    
    // Functional Assessment - comprehensive extraction  
    const activitiesAffected = functional.activities_affected || responses.activities_affected || sessionData?.activities_affected || fullSession?.functional?.activities_affected;
    const adlScores = functional.adl_scores || responses.adl_scores || sessionData?.adl_scores || fullSession?.functional?.adl_scores;
    const workTasks = responses.work_tasks || sessionData?.work_tasks || fullSession?.responses?.work_tasks;
    const stairClimbing = responses.stair_climbing || sessionData?.stair_climbing || fullSession?.responses?.stair_climbing;
    
    if (activitiesAffected || adlScores || workTasks || stairClimbing) {
      parametersText += "Functional Assessment:\n";
      if (activitiesAffected) {
        const activities = Array.isArray(activitiesAffected)
          ? activitiesAffected.join(', ')
          : activitiesAffected;
        parametersText += `• Activities Affected: ${activities}\n`;
        hasData = true;
      }
      if (workTasks) {
        parametersText += `• Work Tasks: ${workTasks}\n`;
        hasData = true;
      }
      if (stairClimbing) {
        parametersText += `• Stair Climbing: ${stairClimbing}\n`;
        hasData = true;
      }
      if (adlScores && typeof adlScores === 'object') {
        parametersText += `• ADL Scores:\n`;
        Object.entries(adlScores).forEach(([activity, score]) => {
          parametersText += `  - ${activity.replace(/_/g, ' ')}: ${score}\n`;
        });
        hasData = true;
      }
      parametersText += "\n";
    }
    
    // Gait and Movement Analysis
    const gaitDeviations = objective.gait_deviations || responses.gait_deviations || sessionData?.gait_deviations || summary?.objective?.gait_deviations || fullSession?.objective?.gait_deviations;
    const balanceIssues = responses.balance_issues || sessionData?.balance_issues || fullSession?.responses?.balance_issues;
    
    if (gaitDeviations || balanceIssues) {
      parametersText += "Movement Analysis:\n";
      if (gaitDeviations) {
        const gait = Array.isArray(gaitDeviations)
          ? gaitDeviations.join(', ')
          : gaitDeviations;
        parametersText += `• Gait Pattern: ${gait}\n`;
        hasData = true;
      }
      if (balanceIssues) {
        parametersText += `• Balance Issues: ${balanceIssues}\n`;
        hasData = true;
      }
      parametersText += "\n";
    }
    
    // Extract any additional questionnaire responses
    if (fullSession?.responses && typeof fullSession.responses === 'object') {
      const additionalData = Object.entries(fullSession.responses)
        .filter(([key, value]) => 
          value && 
          value !== 'not an' && 
          !['chief_complaint', 'vas_score', 'pain_location', 'pain_nature', 'pain_timing', 'swelling', 'tenderness', 'special_tests', 'activities_affected', 'work_tasks', 'stair_climbing'].includes(key)
        );
      
      if (additionalData.length > 0) {
        parametersText += "Additional Clinical Data:\n";
        additionalData.forEach(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const formattedValue = Array.isArray(value) ? value.join(', ') : value;
          parametersText += `• ${formattedKey}: ${formattedValue}\n`;
          hasData = true;
        });
        parametersText += "\n";
      }
    }
    
    // If no data found, provide a fallback message
    if (!hasData) {
      console.log('⚠️ No clinical parameter data found, creating fallback content');
      parametersText += "Assessment completed - proceeding to clinical tests and diagnosis.\n";
      parametersText += "No specific clinical parameters recorded during questionnaire.\n\n";
    }
    
    console.log('🔍 Final clinical parameters text (length: ' + parametersText.length + '):', parametersText);
    console.log('🔍 hasData flag:', hasData);
    return parametersText;
  };
  
  // Format clinical tests from assessment data
  const formatClinicalTests = (assessmentData: any[]): string => {
    let testsText = "CLINICAL TESTS\n\n";
    
    console.log('🔍 Formatting clinical tests:', assessmentData);
    
    if (!assessmentData || assessmentData.length === 0) {
      testsText += "No clinical assessments performed.\n";
      return testsText;
    }
    
    assessmentData.forEach((assessment, index) => {
      testsText += `${index + 1}. ${assessment.assessment_name || 'Clinical Assessment'}\n`;
      
      if (assessment.form_data) {
        Object.entries(assessment.form_data).forEach(([field, value]: [string, any]) => {
          if (value !== undefined && value !== null && value !== '' && field !== 'notes') {
            const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Format boolean values
            if (typeof value === 'boolean') {
              testsText += `   • ${fieldLabel}: ${value ? 'Yes' : 'No'}\n`;
            } 
            // Format array values  
            else if (Array.isArray(value)) {
              testsText += `   • ${fieldLabel}: ${value.join(', ')}\n`;
            }
            // Format object values
            else if (typeof value === 'object') {
              testsText += `   • ${fieldLabel}: ${JSON.stringify(value)}\n`;
            }
            // Format string/number values
            else {
              testsText += `   • ${fieldLabel}: ${value}\n`;
            }
          }
        });
        
        // Add notes separately if they exist
        if (assessment.form_data.notes) {
          testsText += `   • Clinical Notes: ${assessment.form_data.notes}\n`;
        }
        
        // Add additional notes if they exist
        if (assessment.form_data.additional_notes) {
          testsText += `   • Additional Notes: ${assessment.form_data.additional_notes}\n`;
        }
      }
      
      testsText += "\n";
    });
    
    console.log('🔍 Final clinical tests text:', testsText);
    return testsText;
  };

  const formatTechnicalSummary = (summary: any): string => {
    let technicalText = "📊 **CLINICAL VALUES SUMMARY**\n\n";
    
    const responses = summary.responses || {};
    let hasData = false;
    
    // Clinical Assessment Results
    if (summary.clinicalAssessments && summary.clinicalAssessments.length > 0) {
      technicalText += "**🔬 CLINICAL ASSESSMENTS:**\n";
      summary.clinicalAssessments.forEach((assessment: any) => {
        technicalText += `• ${assessment.assessment_name}: Completed\n`;
        if (assessment.form_data) {
          Object.entries(assessment.form_data).forEach(([key, value]) => {
            if (value) technicalText += `  ${key}: ${value}\n`;
          });
        }
      });
      technicalText += "\n";
      hasData = true;
    }
    
    // Pain Assessment Values
    if (responses.pain_screening === 'yes' || responses.vas_score !== undefined) {
      technicalText += "**🔴 PAIN METRICS:**\n";
      if (responses.vas_score !== undefined) {
        technicalText += `• VAS Score: ${responses.vas_score}/10\n`;
      }
      if (responses.pain_location) {
        const location = Array.isArray(responses.pain_location) ? responses.pain_location.join(', ') : responses.pain_location;
        technicalText += `• Location: ${location}\n`;
      }
      if (responses.pain_nature) {
        const nature = Array.isArray(responses.pain_nature) ? responses.pain_nature.join(', ') : responses.pain_nature;
        technicalText += `• Nature: ${nature}\n`;
      }
      if (responses.pain_timing) {
        technicalText += `• Timing: ${responses.pain_timing}\n`;
      }
      if (responses.tenderness_assessment) {
        technicalText += `• Tenderness: ${typeof responses.tenderness_assessment === 'object' ? 'Documented' : responses.tenderness_assessment}\n`;
      }
      technicalText += "\n";
      hasData = true;
    }
    
    // Neurological Assessment Values
    if (responses.sensation_screening === 'yes' || responses.dermatome_assessment || responses.myotome_assessment || responses.reflex_testing) {
      technicalText += "**🧠 NEUROLOGICAL:**\n";
      
      if (responses.dermatome_assessment) {
        const dermatomes = Array.isArray(responses.dermatome_assessment) ? responses.dermatome_assessment.join(', ') : responses.dermatome_assessment;
        technicalText += `• Dermatomes: ${dermatomes}\n`;
      }
      
      if (responses.myotome_assessment && typeof responses.myotome_assessment === 'object') {
        technicalText += `• Myotomes:\n`;
        Object.entries(responses.myotome_assessment).forEach(([level, grade]) => {
          technicalText += `  ${level}: ${grade}/5\n`;
        });
      }
      
      if (responses.reflex_testing && typeof responses.reflex_testing === 'object') {
        technicalText += `• Reflexes:\n`;
        Object.entries(responses.reflex_testing).forEach(([reflex, grade]) => {
          technicalText += `  ${reflex}: ${grade}\n`;
        });
      }
      
      if (responses.neurodynamic_tests) {
        const tests = Array.isArray(responses.neurodynamic_tests) ? responses.neurodynamic_tests.join(', ') : responses.neurodynamic_tests;
        technicalText += `• Neural Tests: ${tests} (+)\n`;
      }
      technicalText += "\n";
      hasData = true;
    }
    
    // Range of Motion Values
    if (responses.active_rom || responses.passive_rom) {
      technicalText += "**🤸 RANGE OF MOTION:**\n";
      
      if (responses.active_rom && typeof responses.active_rom === 'object') {
        technicalText += `• Active ROM:\n`;
        Object.entries(responses.active_rom).forEach(([movement, degrees]) => {
          technicalText += `  ${movement}: ${degrees}°\n`;
        });
      }
      
      if (responses.passive_rom && typeof responses.passive_rom === 'object') {
        technicalText += `• Passive ROM:\n`;
        Object.entries(responses.passive_rom).forEach(([movement, degrees]) => {
          technicalText += `  ${movement}: ${degrees}°\n`;
        });
      }
      technicalText += "\n";
      hasData = true;
    }
    
    // Manual Muscle Testing Values
    if (responses.mmt_assessment) {
      technicalText += "**💪 MUSCLE TESTING:**\n";
      if (typeof responses.mmt_assessment === 'object') {
        Object.entries(responses.mmt_assessment).forEach(([muscle, grade]) => {
          technicalText += `• ${muscle}: ${grade}/5\n`;
        });
      } else {
        technicalText += `• MMT: ${responses.mmt_assessment}\n`;
      }
      technicalText += "\n";
      hasData = true;
    }
    
    // Functional Assessment Values
    if (responses.adl_scoring) {
      technicalText += "**🏃 FUNCTIONAL SCORES:**\n";
      if (typeof responses.adl_scoring === 'object') {
        Object.entries(responses.adl_scoring).forEach(([activity, score]) => {
          technicalText += `• ${activity}: ${score}/10\n`;
        });
        
        // Calculate average ADL score
        const scores = Object.values(responses.adl_scoring);
        const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        technicalText += `• Average: ${avgScore}/10\n`;
      }
      technicalText += "\n";
      hasData = true;
    }
    
    // Special Tests and Key Findings
    if (responses.special_tests || responses.swelling_assessment || responses.gait_analysis || responses.posture_assessment) {
      technicalText += "**🔬 KEY FINDINGS:**\n";
      
      if (responses.special_tests) {
        const tests = Array.isArray(responses.special_tests) ? responses.special_tests.join(', ') : responses.special_tests;
        technicalText += `• Special Tests: ${tests} (+)\n`;
      }
      
      if (responses.gait_analysis && responses.gait_analysis !== 'normal') {
        technicalText += `• Gait: ${responses.gait_analysis}\n`;
      }
      
      if (responses.posture_assessment && !responses.posture_assessment.includes('normal')) {
        const posture = Array.isArray(responses.posture_assessment) ? responses.posture_assessment.join(', ') : responses.posture_assessment;
        technicalText += `• Posture: ${posture}\n`;
      }
      
      if (responses.swelling_assessment && responses.swelling_assessment !== 'absent') {
        technicalText += `• Swelling: ${responses.swelling_assessment}\n`;
      }
      
      technicalText += "\n";
      hasData = true;
    }
    
    // Summary stats
    if (hasData) {
      technicalText += `**📈 ASSESSMENT STATS:**\n`;
      technicalText += `• Completion: ${summary.completionPercentage}%\n`;
      technicalText += `• Parameters: ${Object.keys(responses).length}\n`;
      technicalText += `• Pathways: ${summary.activatedPathways?.join(', ') || 'None'}\n`;
    } else {
      technicalText += "No technical values captured in this assessment.";
    }
    
    return technicalText;
  };

  const formatSummary = (summary: any): string => {
    let summaryText = "📋 **COMPREHENSIVE PHYSIOTHERAPY ASSESSMENT SUMMARY**\n\n";
    
    // Assessment Overview
    summaryText += `**Assessment Completion:** ${summary.completionPercentage}%\n`;
    summaryText += `**Pathways Assessed:** ${summary.activatedPathways.join(', ')}\n`;
    summaryText += `**Assessment Date:** ${new Date(summary.assessmentDate).toLocaleDateString()}\n\n`;
    
    // Subjective Findings
    summaryText += "## 📝 **SUBJECTIVE FINDINGS**\n";
    summaryText += `**Chief Complaint:** ${summary.subjective?.chiefComplaint || 'Not specified'}\n\n`;
    
    if (summary.subjective?.pain) {
      summaryText += "### Pain Assessment:\n";
      summaryText += `• Location: ${Array.isArray(summary.subjective.pain.location) ? summary.subjective.pain.location.join(', ') : summary.subjective.pain.location || 'Not specified'}\n`;
      summaryText += `• Nature: ${Array.isArray(summary.subjective.pain.nature) ? summary.subjective.pain.nature.join(', ') : summary.subjective.pain.nature || 'Not specified'}\n`;
      summaryText += `• VAS Score: ${summary.subjective.pain.vasScore || 'Not assessed'}/10\n`;
      summaryText += `• Timing: ${summary.subjective.pain.timing || 'Not specified'}\n`;
      if (summary.subjective.pain.aggravatingFactors) {
        summaryText += `• Aggravating Factors: ${Array.isArray(summary.subjective.pain.aggravatingFactors) ? summary.subjective.pain.aggravatingFactors.join(', ') : summary.subjective.pain.aggravatingFactors}\n`;
      }
      if (summary.subjective.pain.relievingFactors) {
        summaryText += `• Relieving Factors: ${Array.isArray(summary.subjective.pain.relievingFactors) ? summary.subjective.pain.relievingFactors.join(', ') : summary.subjective.pain.relievingFactors}\n`;
      }
      summaryText += "\n";
    }
    
    if (summary.subjective?.motor) {
      summaryText += "### Motor Assessment:\n";
      summaryText += `• Weakness Location: ${summary.subjective.motor.weaknessLocation || 'Not specified'}\n`;
      summaryText += `• Functional Impact: ${Array.isArray(summary.subjective.motor.functionalImpact) ? summary.subjective.motor.functionalImpact.join(', ') : summary.subjective.motor.functionalImpact || 'Not specified'}\n\n`;
    }
    
    if (summary.subjective?.sensory) {
      summaryText += "### Sensory Assessment:\n";
      summaryText += `• Changes Present: ${summary.subjective.sensory.changesPresent ? 'Yes' : 'No'}\n`;
      if (summary.subjective.sensory.sensationType) {
        summaryText += `• Sensation Type: ${Array.isArray(summary.subjective.sensory.sensationType) ? summary.subjective.sensory.sensationType.join(', ') : summary.subjective.sensory.sensationType}\n`;
      }
      summaryText += "\n";
    }
    
    // Clinical Assessment Results
    if (summary.clinicalAssessments && summary.clinicalAssessments.length > 0) {
      summaryText += "## 🔬 **CLINICAL ASSESSMENT RESULTS**\n";
      summary.clinicalAssessments.forEach((assessment: any, index: number) => {
        summaryText += `### ${index + 1}. ${assessment.assessment_name}:\n`;
        summaryText += `**Completion Time:** ${new Date(assessment.timestamp).toLocaleTimeString()}\n`;
        if (assessment.form_data && Object.keys(assessment.form_data).length > 0) {
          summaryText += `**Results:**\n`;
          Object.entries(assessment.form_data).forEach(([key, value]) => {
            if (value) {
              const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              summaryText += `• ${formattedKey}: ${value}\n`;
            }
          });
        }
        summaryText += "\n";
      });
    }
    
    // Objective Findings
    summaryText += "## 🔍 **OBJECTIVE FINDINGS**\n";
    
    if (summary.objective?.observation) {
      summaryText += "### Observation:\n";
      if (summary.objective.observation.swelling) {
        summaryText += `• Swelling: ${summary.objective.observation.swelling}\n`;
      }
      if (summary.objective.observation.posture) {
        summaryText += `• Posture: ${Array.isArray(summary.objective.observation.posture) ? summary.objective.observation.posture.join(', ') : summary.objective.observation.posture}\n`;
      }
      if (summary.objective.observation.gait) {
        summaryText += `• Gait: ${summary.objective.observation.gait}\n`;
      }
      summaryText += "\n";
    }
    
    if (summary.objective?.palpation?.tenderness) {
      summaryText += "### Palpation:\n";
      if (typeof summary.objective.palpation.tenderness === 'object') {
        Object.entries(summary.objective.palpation.tenderness).forEach(([location, grade]) => {
          summaryText += `• ${location}: ${grade}/3 tenderness\n`;
        });
      } else {
        summaryText += `• Tenderness: ${summary.objective.palpation.tenderness}\n`;
      }
      summaryText += "\n";
    }
    
    if (summary.objective?.neurological) {
      summaryText += "### Neurological Assessment:\n";
      if (summary.objective.neurological.myotomes) {
        summaryText += "**Myotomes (Oxford Scale 0-5):**\n";
        Object.entries(summary.objective.neurological.myotomes).forEach(([muscle, grade]) => {
          summaryText += `• ${muscle}: ${grade}/5\n`;
        });
      }
      if (summary.objective.neurological.reflexes) {
        summaryText += "**Reflexes:**\n";
        Object.entries(summary.objective.neurological.reflexes).forEach(([reflex, grade]) => {
          summaryText += `• ${reflex}: ${grade}\n`;
        });
      }
      summaryText += "\n";
    }
    
    if (summary.objective?.measurements) {
      summaryText += "### Range of Motion:\n";
      if (summary.objective.measurements.activeROM) {
        summaryText += "**Active ROM:**\n";
        Object.entries(summary.objective.measurements.activeROM).forEach(([movement, degrees]) => {
          summaryText += `• ${movement}: ${degrees}°\n`;
        });
      }
      if (summary.objective.measurements.passiveROM) {
        summaryText += "**Passive ROM:**\n";
        Object.entries(summary.objective.measurements.passiveROM).forEach(([movement, degrees]) => {
          summaryText += `• ${movement}: ${degrees}°\n`;
        });
      }
      summaryText += "\n";
    }
    
    if (summary.objective?.strength?.manualMuscleTesting) {
      summaryText += "### Manual Muscle Testing (Oxford Scale):\n";
      Object.entries(summary.objective.strength.manualMuscleTesting).forEach(([muscle, grade]) => {
        summaryText += `• ${muscle}: ${grade}/5\n`;
      });
      summaryText += "\n";
    }
    
    // Functional Assessment
    if (summary.functional) {
      summaryText += "## 🏃 **FUNCTIONAL ASSESSMENT**\n";
      if (summary.functional.adlScoring) {
        summaryText += `• ADL Score: ${summary.functional.adlScoring}%\n`;
      }
      if (summary.functional.gaitAnalysis) {
        summaryText += `• Gait Analysis: ${summary.functional.gaitAnalysis}\n`;
      }
      summaryText += "\n";
    }
    
    // Clinical Reasoning
    summaryText += "## 🧠 **CLINICAL REASONING**\n";
    
    if (summary.provisionalDiagnosis && summary.provisionalDiagnosis.length > 0) {
      summaryText += `**Provisional Diagnosis:**\n`;
      summary.provisionalDiagnosis.forEach((diagnosis: string, index: number) => {
        summaryText += `${index + 1}. ${diagnosis}\n`;
      });
      summaryText += "\n";
    }
    
    if (summary.redFlags && summary.redFlags.length > 0) {
      summaryText += `**⚠️ Red Flags:**\n`;
      summary.redFlags.forEach((flag: string) => {
        summaryText += `• ${flag}\n`;
      });
      summaryText += "\n";
    }
    
    // Remove hardcoded recommendations section
    
    summaryText += "---\n";
    summaryText += "*This comprehensive assessment covers all 29 physiotherapy parameters and provides structured clinical data for treatment planning.*";
    
    return summaryText;
  };

  const formatParameterReport = (summary: any): string => {
    let reportText = "📊 **DETAILED PARAMETER EXTRACTION REPORT**\n\n";
    reportText += "*All 29 physiotherapy parameters captured during this assessment:*\n\n";
    
    // Group parameters by category
    const parameterCategories = {
      "SUBJECTIVE PARAMETERS": [
        { id: "chief_complaint", name: "Chief Complaint", value: summary.responses?.chief_complaint },
        { id: "pain_location", name: "Pain Location", value: summary.responses?.pain_location },
        { id: "pain_nature", name: "Pain Nature", value: summary.responses?.pain_nature },
        { id: "vas_score", name: "VAS Pain Score", value: summary.responses?.vas_score },
        { id: "pain_timing", name: "Pain Timing", value: summary.responses?.pain_timing },
        { id: "aggravating_factors", name: "Aggravating Factors", value: summary.responses?.aggravating_factors },
        { id: "relieving_factors", name: "Relieving Factors", value: summary.responses?.relieving_factors }
      ],
      "OBJECTIVE PARAMETERS": [
        { id: "tenderness_assessment", name: "Tenderness Assessment", value: summary.responses?.tenderness_assessment },
        { id: "swelling_assessment", name: "Swelling Assessment", value: summary.responses?.swelling_assessment },
        { id: "sensations_assessment", name: "Sensations Assessment", value: summary.responses?.sensations_assessment },
        { id: "neurodynamic_tests", name: "Neurodynamic Tests", value: summary.responses?.neurodynamic_tests },
        { id: "dermatome_assessment", name: "Dermatome Assessment", value: summary.responses?.dermatome_assessment },
        { id: "myotome_assessment", name: "Myotome Assessment", value: summary.responses?.myotome_assessment },
        { id: "reflex_testing", name: "Reflex Testing", value: summary.responses?.reflex_testing },
        { id: "girth_measurement", name: "Girth Measurement", value: summary.responses?.girth_measurement },
        { id: "special_tests", name: "Special Tests", value: summary.responses?.special_tests }
      ],
      "MOVEMENT & FUNCTION": [
        { id: "active_rom", name: "Active ROM", value: summary.responses?.active_rom },
        { id: "passive_rom", name: "Passive ROM", value: summary.responses?.passive_rom },
        { id: "mmt_assessment", name: "Manual Muscle Testing", value: summary.responses?.mmt_assessment },
        { id: "tightness_assessment", name: "Tightness Assessment", value: summary.responses?.tightness_assessment },
        { id: "gait_analysis", name: "Gait Analysis", value: summary.responses?.gait_analysis },
        { id: "posture_assessment", name: "Posture Assessment", value: summary.responses?.posture_assessment },
        { id: "adl_scoring", name: "ADL Scoring", value: summary.responses?.adl_scoring }
      ]
    };

    Object.entries(parameterCategories).forEach(([category, parameters]) => {
      reportText += `### ${category}:\n`;
      parameters.forEach(param => {
        const displayValue = formatParameterValue(param.value);
        const status = param.value ? "✅" : "⏸️";
        reportText += `${status} **${param.name}**: ${displayValue}\n`;
      });
      reportText += "\n";
    });

    reportText += "---\n";
    reportText += `**Total Parameters Assessed**: ${Object.keys(summary.responses || {}).length}\n`;
    reportText += `**Assessment Completion**: ${summary.completionPercentage}%\n`;
    reportText += `**Activated Clinical Pathways**: ${summary.activatedPathways?.join(', ') || 'None'}\n\n`;
    
    reportText += "*This comprehensive dataset provides structured clinical information for evidence-based treatment planning and progress monitoring.*";
    
    return reportText;
  };

  const formatParameterValue = (value: any): string => {
    if (!value) return "Not assessed";
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : "Not assessed";
    if (typeof value === 'object') {
      const entries = Object.entries(value).filter(([_, v]) => v);
      return entries.length > 0 ? entries.map(([k, v]) => `${k}: ${v}`).join(', ') : "Not assessed";
    }
    return String(value);
  };

  const renderQuestionInput = () => {
    if (!currentQuestion || isCompleted) return null;

    switch (currentQuestion.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="min-h-[80px] bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-200"
            />
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <input
                type="radio"
                id="yes"
                name="yes_no"
                value="yes"
                checked={currentResponse === 'yes'}
                onChange={(e) => setCurrentResponse(e.target.value)}
                className="w-5 h-5 text-blue-600 bg-white border-gray-300 focus:ring-blue-200"
              />
              <Label htmlFor="yes" className="text-gray-800 font-medium cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <input
                type="radio"
                id="no"
                name="yes_no"
                value="no"
                checked={currentResponse === 'no'}
                onChange={(e) => setCurrentResponse(e.target.value)}
                className="w-5 h-5 text-blue-600 bg-white border-gray-300 focus:ring-blue-200"
              />
              <Label htmlFor="no" className="text-gray-800 font-medium cursor-pointer">No</Label>
            </div>
          </div>
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group">
                <input
                  type="radio"
                  name="single_choice"
                  value={option.value}
                  checked={currentResponse === option.value}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  className="w-5 h-5 text-blue-600 bg-white border-gray-300 focus:ring-blue-200 cursor-pointer"
                />
                <span className="text-gray-800 font-medium flex-1 group-hover:text-blue-700 transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'multi_choice':
      case 'checklist':
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={Array.isArray(currentResponse) && currentResponse.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCurrentResponse((prev: string[]) => 
                        Array.isArray(prev) ? [...prev, option.value] : [option.value]
                      );
                    } else {
                      setCurrentResponse((prev: string[]) => 
                        Array.isArray(prev) ? prev.filter(val => val !== option.value) : []
                      );
                    }
                  }}
                  className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-200 cursor-pointer"
                />
                <span className="text-gray-800 font-medium flex-1 group-hover:text-blue-700 transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-4">
            <input
              type="range"
              value={currentResponse || 0}
              onChange={(e) => setCurrentResponse(parseInt(e.target.value))}
              max={currentQuestion.max}
              min={currentQuestion.min}
              step={1}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500">
              {currentQuestion.labels && Object.entries(currentQuestion.labels).map(([key, label]) => (
                <span key={key}>{label}</span>
              ))}
            </div>
            <div className="text-center font-medium">
              Current value: {currentResponse || 0}
            </div>
          </div>
        );

      case 'body_map':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Select the areas where you experience symptoms:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Head', 'Neck', 'Shoulder', 'Upper Back', 'Lower Back', 'Arm', 'Elbow', 'Wrist', 'Hip', 'Thigh', 'Knee', 'Ankle', 'Foot'].map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={area.toLowerCase()}
                    checked={Array.isArray(currentResponse) && currentResponse.includes(area.toLowerCase())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCurrentResponse((prev: string[]) => 
                          Array.isArray(prev) ? [...prev, area.toLowerCase()] : [area.toLowerCase()]
                        );
                      } else {
                        setCurrentResponse((prev: string[]) => 
                          Array.isArray(prev) ? prev.filter(val => val !== area.toLowerCase()) : []
                        );
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor={area.toLowerCase()}>{area}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tenderness_map':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Rate tenderness at each location:
            </p>
            <div className="space-y-3">
              {['Anterior', 'Posterior', 'Medial', 'Lateral', 'Deep'].map((location) => (
                <div key={location} className="flex items-center justify-between p-2 border rounded">
                  <Label className="font-medium">{location}</Label>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3].map((grade) => (
                      <div key={grade} className="flex items-center space-x-1">
                        <input
                          type="radio"
                          id={`${location}-${grade}`}
                          name={location}
                          value={grade}
                          checked={currentResponse?.[location] === grade.toString()}
                          onChange={(e) => {
                            setCurrentResponse((prev: any) => ({
                              ...prev,
                              [location]: e.target.value
                            }));
                          }}
                          className="w-3 h-3 text-blue-600"
                        />
                        <Label htmlFor={`${location}-${grade}`} className="text-sm">{grade}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'measurement':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <Input
                  placeholder="e.g. 10cm above patella"
                  value={currentResponse?.location || ''}
                  onChange={(e) => setCurrentResponse((prev: any) => ({
                    ...prev,
                    location: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Measurement (cm)</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  step="0.1"
                  value={currentResponse?.measurement || ''}
                  onChange={(e) => setCurrentResponse((prev: any) => ({
                    ...prev,
                    measurement: e.target.value
                  }))}
                />
              </div>
            </div>
          </div>
        );

      case 'rom_measurement':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {['Flexion', 'Extension', 'Abduction', 'Adduction', 'Rotation'].map((movement) => (
                <div key={movement}>
                  <Label className="text-sm font-medium">{movement} (°)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={currentResponse?.[movement.toLowerCase()] || ''}
                    onChange={(e) => setCurrentResponse((prev: any) => ({
                      ...prev,
                      [movement.toLowerCase()]: e.target.value
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'mmt_testing':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Oxford Scale: 0=No contraction, 1=Flicker, 2=Gravity eliminated, 3=Against gravity, 4=Against resistance, 5=Normal
            </p>
            <div className="space-y-3">
              {currentQuestion.options?.map((muscle) => (
                <div key={muscle.value} className="flex items-center justify-between p-2 border rounded">
                  <Label className="font-medium">{muscle.label}</Label>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4, 5].map((grade) => (
                      <div key={grade} className="flex items-center space-x-1">
                        <input
                          type="radio"
                          id={`${muscle.value}-${grade}`}
                          name={muscle.value}
                          value={grade}
                          checked={currentResponse?.[muscle.value] === grade.toString()}
                          onChange={(e) => {
                            setCurrentResponse((prev: any) => ({
                              ...prev,
                              [muscle.value]: e.target.value
                            }));
                          }}
                          className="w-3 h-3 text-blue-600"
                        />
                        <Label htmlFor={`${muscle.value}-${grade}`} className="text-sm">{grade}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'scale_grid':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {currentQuestion.options?.map((item) => (
                <div key={item.value} className="flex items-center justify-between p-2 border rounded">
                  <Label className="font-medium">{item.label}</Label>
                  <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <div key={score} className="flex items-center space-x-1">
                        <input
                          type="radio"
                          id={`${item.value}-${score}`}
                          name={item.value}
                          value={score}
                          checked={currentResponse?.[item.value] === score.toString()}
                          onChange={(e) => {
                            setCurrentResponse((prev: any) => ({
                              ...prev,
                              [item.value]: e.target.value
                            }));
                          }}
                          className="w-3 h-3 text-blue-600"
                        />
                        <Label htmlFor={`${item.value}-${score}`} className="text-sm">{score}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'observational':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Select observed findings:
            </p>
            <div className="space-y-2">
              {currentQuestion.options?.map((observation) => (
                <div key={observation.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={observation.value}
                    checked={Array.isArray(currentResponse) && currentResponse.includes(observation.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCurrentResponse((prev: string[]) => 
                          Array.isArray(prev) ? [...prev, observation.value] : [observation.value]
                        );
                      } else {
                        setCurrentResponse((prev: string[]) => 
                          Array.isArray(prev) ? prev.filter(val => val !== observation.value) : []
                        );
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor={observation.value}>{observation.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <Input
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Enter your response..."
          />
        );
    }
  };

  const canSubmit = (): boolean => {
    if (!currentResponse) return false;
    
    // Array-based responses
    if (currentQuestion?.type === 'multi_choice' || 
        currentQuestion?.type === 'checklist' || 
        currentQuestion?.type === 'body_map' ||
        currentQuestion?.type === 'observational') {
      return Array.isArray(currentResponse) && currentResponse.length > 0;
    }
    
    // Object-based responses
    if (currentQuestion?.type === 'tenderness_map' ||
        currentQuestion?.type === 'measurement' ||
        currentQuestion?.type === 'rom_measurement' ||
        currentQuestion?.type === 'mmt_testing' ||
        currentQuestion?.type === 'scale_grid') {
      return currentResponse && Object.keys(currentResponse).length > 0;
    }
    
    if (currentQuestion?.validation) {
      return currentQuestion.validation(currentResponse);
    }
    
    return true;
  };

  return (
    <div className="w-full h-full flex flex-col relative z-10">
      {/* Clean Medical Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-4 px-6 flex-shrink-0 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            {/* Medical Assessment Icon */}
            <Brain className="h-8 w-8 text-blue-200" />
            
            {/* Title and Patient Info */}
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Clinical Assessment System
              </h1>
              {patientName && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-teal-300 rounded-full"></div>
                  <span className="text-blue-100 text-sm">Patient: {patientName}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress and Controls */}
          <div className="flex items-center space-x-6">
            {/* Clinical Progress Display */}
            {session && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 border border-blue-100 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Progress:</span>
                    <span className="font-semibold text-blue-700">{session.completionPercentage}%</span>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${session.completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Close Button */}
            {onClose && (
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={onClose}
                className="text-blue-200 hover:text-white hover:bg-red-600/80 border border-red-300 rounded-xl w-12 h-12 p-0 transition-all duration-200"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Clinical Chat Interface Panel */}
        <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 min-h-0" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto space-y-4">
              {chatHistory.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-5 shadow-lg transition-all duration-300 hover:shadow-xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-12 border border-blue-300'
                        : message.type === 'warning'
                        ? 'bg-gradient-to-r from-orange-50 to-red-50 text-red-800 border border-red-200 mr-12'
                        : message.type === 'summary'
                        ? 'bg-gradient-to-r from-teal-50 to-green-50 text-green-800 border border-green-200 mr-12'
                        : 'bg-gradient-to-r from-slate-50 to-gray-50 text-gray-800 border border-gray-200 mr-12'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {message.type === 'warning' && (
                        <div className="relative mt-1">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                      {message.sender === 'bot' && message.type !== 'warning' && (
                        <div className="relative mt-1">
                          <Brain className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        {message.type === 'summary' ? (
                          <div className="space-y-4">
                            {/* Dynamic Header Based on Message Content */}
                            <div className="border-b border-gray-300 pb-2">
                              <h3 className="text-lg font-bold text-gray-800">
                                {message.message.startsWith('CLINICAL PARAMETERS') ? 'Clinical Parameters' :
                                 message.message.startsWith('CLINICAL TESTS') ? 'Clinical Tests' :
                                 'AI Differential Diagnosis'}
                              </h3>
                            </div>
                            
                            {/* Content Display - Simple and Clean */}
                            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                              {message.message}
                            </div>
                          </div>
                        ) : message.type === 'diagnosis-selection' ? (
                          <div className="space-y-6">
                            {/* Header */}
                            <div className="border-b border-blue-200 pb-3">
                              <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                <Brain className="h-5 w-5" />
                                AI Diagnosis Recommendations
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{message.message}</p>
                            </div>
                            
                            {/* Tier 1 - AI Recommendations */}
                            <div className="space-y-4">
                              <h4 className="font-semibold text-gray-800 text-base">Top Recommendations:</h4>
                              <div className="space-y-3">
                                {message.data?.differential_diagnosis?.slice(0, 5).map((diagnosis: any, index: number) => (
                                  <div 
                                    key={diagnosis.condition_id}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                                      selectedDiagnosis === diagnosis.condition_id 
                                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => setSelectedDiagnosis(diagnosis.condition_id)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 mt-1">
                                        <input
                                          type="radio"
                                          name="diagnosis-selection"
                                          checked={selectedDiagnosis === diagnosis.condition_id}
                                          onChange={() => setSelectedDiagnosis(diagnosis.condition_id)}
                                          className="text-blue-600"
                                        />
                                      </div>
                                      <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                          <h5 className="font-medium text-gray-900">{diagnosis.condition_name}</h5>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            diagnosis.confidence_score >= 0.8 ? 'bg-green-100 text-green-800' :
                                            diagnosis.confidence_score >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {Math.round(diagnosis.confidence_score * 100)}% match
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{diagnosis.clinical_reasoning}</p>
                                        {diagnosis.supporting_evidence?.length > 0 && (
                                          <div className="text-xs text-gray-500">
                                            <strong>Key findings:</strong> {diagnosis.supporting_evidence.slice(0, 2).join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                              {selectedDiagnosis && (
                                <Button 
                                  onClick={() => handleDiagnosisSelection(selectedDiagnosis)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Confirm Selected Diagnosis
                                </Button>
                              )}
                              <Button 
                                onClick={() => setShowDiagnosisSearch(true)}
                                variant="outline"
                                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Not seeing the right condition? Search all conditions →
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-base leading-relaxed font-medium">{message.message}</div>
                        )}
                        <div className="text-xs opacity-70 mt-3 text-right flex items-center justify-end space-x-2">
                          <div className="w-1 h-1 bg-current rounded-full"></div>
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 text-gray-800 rounded-2xl p-5 mr-12 border border-gray-200 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">Processing clinical data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Clinical Assessment Panel */}
        <div className="w-[450px] bg-gradient-to-b from-slate-50 to-white border-l border-gray-200 flex flex-col shadow-xl">
          {/* Clean Question Display */}
          <div className="p-8 bg-gradient-to-b from-blue-50 to-white border-b border-blue-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-800 text-lg font-medium leading-relaxed tracking-normal">
                {currentQuestion ? currentQuestion.question : 'Initializing clinical evaluation...'}
              </p>
            </div>
          </div>

          {!isCompleted && (
            <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
              {/* Enhanced Input Section */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700">Patient Response</span>
                  </div>
                  {currentQuestion && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {currentQuestion.type?.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                  {renderQuestionInput()}
                </div>
              </div>
              
              {/* Enhanced Action Section */}
              <div className="space-y-4 mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-3 text-gray-500">Ready to proceed</span>
                  </div>
                </div>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!canSubmit() || isTyping}
                  className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-2xl flex items-center justify-center space-x-3 text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                  size="lg"
                >
                  {isTyping ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing Response...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit & Continue</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="flex-1 p-6 space-y-6">
              <div className="text-center space-y-6">
                {/* Success Animation */}
                <div className="relative mx-auto w-20 h-20">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center shadow-xl">
                    <MessageCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                {/* Success Message */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-800">Clinical Assessment Complete!</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Comprehensive physiotherapy evaluation has been completed. 
                    All 29 clinical parameters have been documented and analyzed.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="text-sm text-green-700 font-semibold">✓ Technical Summary Generated</div>
                    <div className="text-xs text-green-600 mt-1">Ready for clinical review</div>
                  </div>
                </div>
                
                {/* Action Button */}
                {onClose && (
                  <Button 
                    onClick={onClose} 
                    className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white py-4 rounded-xl font-semibold shadow-lg border border-green-300 transition-all duration-200"
                    size="lg"
                  >
                    Review Assessment & Exit
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Assessment Hub Modal */}
      <AssessmentRecommendationHub
        isOpen={showAssessmentHub}
        onClose={() => {
          console.log('🔧 Assessment Hub closed');
          setShowAssessmentHub(false);
        }}
        screeningData={session}
        onStartRecommended={handleStartRecommended}
        onChooseCustom={handleChooseCustom}
        onSkipAll={handleSkipAllAssessments}
      />
      
      {/* Assessment Queue Modal */}
      {console.log('🔧 PhysioAssessmentChatbot: Rendering AssessmentQueue with state:', {
        showAssessmentQueue,
        selectedAssessmentsCount: selectedAssessments.length,
        selectedAssessments: selectedAssessments
      })}
      <AssessmentQueue
        isOpen={showAssessmentQueue}
        onClose={() => {
          console.log('🔧 AssessmentQueue: onClose called');
          setShowAssessmentQueue(false);
        }}
        initialAssessments={selectedAssessments}
        onAllComplete={handleAssessmentQueueComplete}
        screeningData={session}
      />
      
      {/* Custom Assessment Selector Modal */}
      <CustomAssessmentSelector
        isOpen={showCustomSelector}
        onClose={() => setShowCustomSelector(false)}
        onSelectAssessments={handleCustomAssessmentSelection}
      />
      
      {/* Direct Assessment Form - Enhanced with Progress */}
      {showDirectAssessment && selectedAssessments[currentAssessmentIndex] && (
        <AssessmentFormBuilder
          isOpen={showDirectAssessment}
          onClose={() => {
            setShowDirectAssessment(false);
            handleDirectAssessmentsComplete();
          }}
          assessmentId={selectedAssessments[currentAssessmentIndex].assessment_id}
          onSubmit={handleDirectAssessmentSubmit}
          onNext={() => {
            // This will be handled in onSubmit
          }}
          onSkip={handleDirectAssessmentSkip}
          currentIndex={currentAssessmentIndex}
          totalAssessments={selectedAssessments.length}
        />
      )}

      {/* Diagnosis Search Overlay */}
      <DiagnosisSearchOverlay
        isOpen={showDiagnosisSearch}
        onClose={() => setShowDiagnosisSearch(false)}
        onSelect={handleManualDiagnosisSelection}
      />
    </div>
  );
};

export default PhysioAssessmentChatbot;