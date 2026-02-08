import { PhysioBayesianEngine } from './bayesianEngine';
import { SourceIdentificationResult } from './referralSourceEngine';

interface ConversationState {
  isActive: boolean;
  currentQuestion: any;
  conversationHistory: Array<{
    question: string;
    answer: any;
    timestamp: Date;
    phase?: string;
  }>;
  diagnosticResults: any;
  needsReferral: boolean;
  // NEW: Source identification state
  sourceIdentificationResult: SourceIdentificationResult | null;
  currentPhase: string;
}

export class ConversationManager {
  private bayesianEngine: PhysioBayesianEngine;
  private state: ConversationState;

  constructor() {
    this.state = {
      isActive: false,
      currentQuestion: null,
      conversationHistory: [],
      diagnosticResults: null,
      needsReferral: false,
      sourceIdentificationResult: null,
      currentPhase: 'safety'
    };
  }

  async initializeEngine(): Promise<void> {
    try {
      // Load comprehensive data files for 345 conditions
      // Updated paths for temp-backup project structure
      const cptResponse = await fetch('/data/symptom-assessment/cpt-tables.json');
      if (!cptResponse.ok) {
        throw new Error(`Failed to load CPT data: ${cptResponse.status}`);
      }
      const cptData = await cptResponse.json();

      const questionsResponse = await fetch('/data/symptom-assessment/questions.json');
      if (!questionsResponse.ok) {
        throw new Error(`Failed to load questions data: ${questionsResponse.status}`);
      }
      const questionsData = await questionsResponse.json();

      // NEW: Load referral source CPT data
      let sourceCPTData = null;
      let sourceQuestionsData = null;

      try {
        const sourceCPTResponse = await fetch('/data/symptom-assessment/referral-source-cpt.json');
        if (sourceCPTResponse.ok) {
          sourceCPTData = await sourceCPTResponse.json();
          console.log('Loaded referral source CPT data');
        }

        const sourceQuestionsResponse = await fetch('/data/symptom-assessment/referral-source-questions.json');
        if (sourceQuestionsResponse.ok) {
          sourceQuestionsData = await sourceQuestionsResponse.json();
          console.log('Loaded referral source questions');
        }
      } catch (sourceError) {
        console.warn('Could not load referral source data - source identification will be skipped:', sourceError);
      }

      // Initialize engine with both condition and source data
      this.bayesianEngine = new PhysioBayesianEngine(
        cptData,
        questionsData,
        sourceCPTData,
        sourceQuestionsData
      );

      console.log('Bayesian engine initialized with comprehensive data' +
        (sourceCPTData ? ' + referral source detection' : ''));
    } catch (error) {
      console.error('Failed to initialize Bayesian engine:', error);
      throw error;
    }
  }

  startConversation(): any {
    this.state.isActive = true;
    this.state.conversationHistory = [];
    this.bayesianEngine.reset();

    const firstQuestion = this.bayesianEngine.getNextQuestion();
    this.state.currentQuestion = firstQuestion;

    return {
      question: firstQuestion,
      isFirstQuestion: true,
      conversationId: Date.now().toString()
    };
  }

  processUserResponse(answer: any): any {
    if (!this.state.isActive || !this.state.currentQuestion) {
      throw new Error('No active conversation');
    }

    // Get current phase before processing
    const previousPhase = this.bayesianEngine.getCurrentPhase();

    // Record the conversation with phase info
    this.state.conversationHistory.push({
      question: this.state.currentQuestion.text,
      answer: answer,
      timestamp: new Date(),
      phase: previousPhase
    });

    // Process the answer through Bayesian engine
    this.bayesianEngine.processAnswer(this.state.currentQuestion.id, answer);

    // Get diagnostic results
    const results = this.bayesianEngine.getDiagnosticResults();
    this.state.diagnosticResults = results;

    // Update current phase
    this.state.currentPhase = this.bayesianEngine.getCurrentPhase();

    // Store source identification result if available
    if (results.sourceIdentification) {
      this.state.sourceIdentificationResult = results.sourceIdentification;
    }

    // Check if referral needed (including from source identification red flags)
    if (results.needsReferral) {
      this.state.needsReferral = true;
      this.state.isActive = false;

      // Check if referral is from source identification (e.g., cardiac)
      const sourceResult = this.state.sourceIdentificationResult;
      let referralMessage = 'Based on your responses, you should seek immediate medical attention. Please contact your doctor or visit an emergency room.';

      if (sourceResult?.redFlagDetected) {
        referralMessage = `${sourceResult.clinicalImplication} Please seek immediate medical attention.`;
      }

      return {
        type: 'referral',
        message: referralMessage,
        urgency: 'immediate',
        results: results,
        sourceIdentification: sourceResult
      };
    }

    // Get next question
    const nextQuestion = this.bayesianEngine.getNextQuestion();

    // Get updated phase after getting next question
    const currentPhase = this.bayesianEngine.getCurrentPhase();
    this.state.currentPhase = currentPhase;

    // Check if we just completed source identification phase
    const sourceResult = this.bayesianEngine.getSourceIdentificationResult();
    if (sourceResult && previousPhase === 'source_identification' && currentPhase !== 'source_identification') {
      // Log source identification completion
      console.log('Source identification completed:', sourceResult);

      // If region was switched, notify the user
      if (sourceResult.shouldSwitchRegion && sourceResult.newRegion) {
        // Continue to next question but include source info
        if (nextQuestion) {
          this.state.currentQuestion = nextQuestion;
          return {
            type: 'source_identified',
            message: sourceResult.clinicalImplication,
            sourceIdentification: sourceResult,
            question: nextQuestion,
            progress: {
              questionsAsked: results.questionsAsked,
              confidence: results.confidence,
              topCondition: results.topConditions[0]?.name || 'Analyzing...',
              phase: currentPhase
            }
          };
        }
      }
    }

    if (!nextQuestion) {
      // Assessment complete
      this.state.isActive = false;

      return {
        type: 'diagnosis',
        results: results,
        sourceIdentification: this.state.sourceIdentificationResult,
        conversation_summary: this.generateConversationSummary(),
        recommendations: this.generateRecommendations(results)
      };
    }

    this.state.currentQuestion = nextQuestion;

    return {
      type: 'question',
      question: nextQuestion,
      progress: {
        questionsAsked: results.questionsAsked,
        confidence: results.confidence,
        topCondition: results.topConditions[0]?.name || 'Analyzing...',
        phase: currentPhase,
        sourceIdentification: currentPhase === 'source_identification' ? 'Identifying pain source...' : undefined
      }
    };
  }

  private generateConversationSummary(): any {
    return {
      totalQuestions: this.state.conversationHistory.length,
      duration: this.calculateDuration(),
      keyFindings: this.extractKeyFindings(),
      finalConfidence: this.state.diagnosticResults?.confidence || 0
    };
  }

  private calculateDuration(): number {
    if (this.state.conversationHistory.length === 0) return 0;

    const start = this.state.conversationHistory[0].timestamp;
    const end = this.state.conversationHistory[this.state.conversationHistory.length - 1].timestamp;

    return Math.round((end.getTime() - start.getTime()) / 1000); // seconds
  }

  private extractKeyFindings(): string[] {
    const findings: string[] = [];

    for (const entry of this.state.conversationHistory) {
      if (entry.answer === true || (typeof entry.answer === 'string' && entry.answer !== 'no')) {
        findings.push(entry.question);
      }
    }

    return findings.slice(0, 5); // Top 5 key findings
  }

  private generateRecommendations(results: any): any {
    const topCondition = results.topConditions[0];
    const sourceResult = this.state.sourceIdentificationResult;

    // Include source identification findings in recommendations
    let sourceNote = '';
    if (sourceResult && !sourceResult.isLocal) {
      sourceNote = `\n\nIMPORTANT: ${sourceResult.clinicalImplication}`;
    }

    if (!topCondition || results.confidence < 0.6) {
      return {
        type: 'general',
        message: 'Based on your responses, we recommend a comprehensive physiotherapy assessment to determine the best treatment approach.' + sourceNote,
        nextSteps: [
          'Schedule an appointment with a physiotherapist',
          'Avoid activities that worsen your symptoms',
          'Apply ice for acute injuries, heat for stiffness',
          'Gentle movement as tolerated',
          ...(sourceResult && !sourceResult.isLocal ? [
            `Have your ${sourceResult.topSource.refersToRegion || 'referring region'} assessed as well`
          ] : [])
        ],
        sourceIdentification: sourceResult
      };
    }

    const recommendations = this.getConditionSpecificRecommendations(topCondition.id, results.confidence);

    // Add source identification info
    if (sourceResult) {
      recommendations.sourceIdentification = sourceResult;
      if (!sourceResult.isLocal) {
        recommendations.message += sourceNote;
        recommendations.nextSteps = [
          ...(recommendations.nextSteps || []),
          `Assessment should include ${sourceResult.topSource.refersToRegion || 'the referring region'}`
        ];
      }
    }

    return recommendations;
  }

  private getConditionSpecificRecommendations(conditionId: string, confidence: number): any {
    // Get the condition name from the diagnostic results
    const results = this.state.diagnosticResults;
    const topCondition = results?.topConditions?.[0];
    const conditionName = topCondition?.name || conditionId;

    // Generate generic recommendations based on condition type
    return {
      type: 'specific',
      condition: conditionName,
      confidence: confidence,
      message: `Your symptoms suggest ${conditionName}. A professional physiotherapy assessment can confirm the diagnosis and provide targeted treatment.`,
      nextSteps: [
        'Schedule an appointment with a physiotherapist for confirmation',
        'Avoid activities that worsen your symptoms',
        'Gentle movement as tolerated - avoid complete rest',
        'Apply ice for acute pain (first 48-72 hours) or heat for chronic stiffness',
        'Keep track of your symptoms and any changes'
      ],
      note: 'This is a preliminary assessment based on your reported symptoms. A hands-on clinical examination is recommended for accurate diagnosis and personalized treatment planning.'
    };
  }

  getCurrentState(): ConversationState {
    return { ...this.state };
  }

  getCurrentDiagnostics(): any {
    if (!this.bayesianEngine) return null;
    return this.bayesianEngine.getDiagnosticResults();
  }

  resetConversation(): void {
    this.state = {
      isActive: false,
      currentQuestion: null,
      conversationHistory: [],
      diagnosticResults: null,
      needsReferral: false,
      sourceIdentificationResult: null,
      currentPhase: 'safety'
    };

    if (this.bayesianEngine) {
      this.bayesianEngine.reset();
    }
  }

  // Get current phase
  getCurrentPhase(): string {
    return this.state.currentPhase;
  }

  // Get source identification result
  getSourceIdentificationResult(): SourceIdentificationResult | null {
    return this.state.sourceIdentificationResult;
  }

  // Check if source identification is complete
  isSourceIdentificationComplete(): boolean {
    return this.bayesianEngine?.isSourceIdentificationComplete() || false;
  }

  // Dynamic region switching logic
  checkForRegionSwitch(currentAnswer: any): boolean {
    const history = this.state.conversationHistory;

    // Example: Shoulder pain that worsens with neck movement -> switch to cervical
    if (this.isShoulderToNeckPattern(history, currentAnswer)) {
      return this.switchToRegion('cervical_spine');
    }

    // Example: Knee pain with hip symptoms -> switch to hip
    if (this.isKneeToHipPattern(history, currentAnswer)) {
      return this.switchToRegion('hip');
    }

    return false;
  }

  private isShoulderToNeckPattern(history: any[], currentAnswer: any): boolean {
    const hasShoulderPain = history.some(h =>
      h.question.includes('shoulder') && h.answer === true
    );
    const hasNeckSymptoms = currentAnswer === true &&
      this.state.currentQuestion?.text.includes('neck');

    return hasShoulderPain && hasNeckSymptoms;
  }

  private isKneeToHipPattern(history: any[], currentAnswer: any): boolean {
    const hasKneePain = history.some(h =>
      h.question.includes('knee') && h.answer === true
    );
    const hasHipSymptoms = currentAnswer === true &&
      (this.state.currentQuestion?.text.includes('groin') ||
       this.state.currentQuestion?.text.includes('hip'));

    return hasKneePain && hasHipSymptoms;
  }

  private switchToRegion(newRegion: string): boolean {
    // Update the Bayesian engine's body region
    this.bayesianEngine.processAnswer('FUNCTIONAL_001', newRegion);
    return true;
  }
}
