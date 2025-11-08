import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { MessageCircle, Send, Brain, AlertTriangle } from 'lucide-react';
import { PhysioDecisionEngine, QuestionTemplate, AssessmentSession } from '@/services/physioDecisionEngine';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  message: string;
  timestamp: Date;
  type?: 'question' | 'response' | 'summary' | 'warning';
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionTemplate | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>('');
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
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

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      sender: 'bot',
      message: "Welcome to the Physiotherapy Assessment Assistant. I'll guide you through a comprehensive assessment covering all 29 physiotherapy parameters. We'll start with the chief complaint and progress through objective testing based on findings. Let's begin with the patient's main concern.",
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

  const addBotMessage = (message: string, type: 'question' | 'response' | 'summary' | 'warning' = 'response') => {
    const botMessage: ChatMessage = {
      id: generateMessageId(),
      sender: 'bot',
      message,
      timestamp: new Date(),
      type
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
    setIsCompleted(true);
    const summary = engine.generateSummary();
    
    addBotMessage("🎯 Assessment Complete! Generating comprehensive clinical summary with all captured parameters...", 'summary');
    
    // Smooth scroll to show completion message
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    setTimeout(() => {
      const summaryText = formatSummary(summary);
      addBotMessage(summaryText, 'summary');
      
      // Smooth scroll to show summary
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 200);
      
      // Add technical clinical summary
      setTimeout(() => {
        const technicalSummary = formatTechnicalSummary(summary);
        addBotMessage(technicalSummary, 'summary');
        
        // Smooth scroll to show technical summary
        setTimeout(() => {
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
              top: scrollAreaRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 200);
      }, 1000);
      
      // Complete assessment and get AI diagnosis
      setTimeout(async () => {
        // Generate AI differential diagnosis
        try {
          console.log('🔬 Preparing AI differential diagnosis...');
          
          // Call AI diagnostic service
          const aiResult = await engine.getAIDifferentialDiagnosis();
          
          if (aiResult.success) {
            // Format and display AI diagnosis
            const { aiDiagnosticService } = await import('../../services/aiDiagnosticService');
            const aiSummary = aiDiagnosticService.formatDiagnosticSummary(aiResult.aiDiagnosis);
            
            // Add AI diagnosis as a message
            setTimeout(() => {
              addBotMessage(aiSummary, 'summary');
              
              // Smooth scroll to show AI diagnosis
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  scrollAreaRef.current.scrollTo({
                    top: scrollAreaRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
                }
              }, 200);
              
              console.log('✅ AI Differential Diagnosis displayed successfully!');
              
            }, 1000);
            
          } else {
            console.log('⚠️ AI diagnosis failed, showing fallback message');
            setTimeout(() => {
              addBotMessage(`⚠️ **AI Analysis Unavailable**\n\n${aiResult.fallback}\n\nPlease proceed with clinical assessment findings and manual differential diagnosis.`, 'warning');
              
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  scrollAreaRef.current.scrollTo({
                    top: scrollAreaRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
                }
              }, 200);
            }, 1000);
          }
          
        } catch (error) {
          console.error('❌ Error in AI diagnosis process:', error);
          setTimeout(() => {
            addBotMessage('⚠️ **AI Analysis Error**\n\nDifferential diagnosis service temporarily unavailable. Please proceed with clinical assessment findings.', 'warning');
          }, 1000);
        }
        
        if (onComplete) {
          onComplete(summary);
        }
      }, 1500);
    }, 1500);
  };

  const formatTechnicalSummary = (summary: any): string => {
    let technicalText = "📊 **CLINICAL VALUES SUMMARY**\n\n";
    
    const responses = summary.responses || {};
    let hasData = false;
    
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
                        <div className="whitespace-pre-wrap text-base leading-relaxed font-medium">{message.message}</div>
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
    </div>
  );
};

export default PhysioAssessmentChatbot;