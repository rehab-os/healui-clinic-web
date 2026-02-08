import { ReferralSourceEngine, SourceIdentificationResult } from './referralSourceEngine';

interface CPTTable {
  cpt_tables: {
    [conditionId: string]: {
      name: string;
      base_probability: number;
      symptom_probabilities: {
        [symptomId: string]: {
          present: number;
          absent: number;
          weight: number;
          category: string;
        }
      }
    }
  };
  symptom_definitions?: any;
  prior_probabilities?: any;
}

interface Question {
  id: string;
  phase: 'safety' | 'context' | 'region' | 'functional' | 'differential' | 'source_identification';
  text: string;
  type: 'yes_no' | 'multiple_choice' | 'body_selection';
  body_regions?: string[];
  tests_symptoms: string[];
  diagnostic_weight: number;
  information_gain_potential?: number;
  red_flag?: boolean;
  clinical_note?: string;
  options?: Array<{value: string, text: string}>;
}

interface DiagnosticState {
  currentPhase: 'safety' | 'context' | 'region' | 'source_identification' | 'functional' | 'differential';
  bodyRegion: string | null;
  askedQuestions: Set<string>;
  symptoms: Map<string, boolean>;
  conditionProbabilities: Map<string, number>;
  redFlagDetected: boolean;
  confidenceLevel: number;
  // Source identification state
  sourceIdentificationComplete: boolean;
  identifiedSource: SourceIdentificationResult | null;
}

export class PhysioBayesianEngine {
  private cptTables: CPTTable;
  private questions: Map<string, Question>;
  private state: DiagnosticState;
  private referralSourceEngine: ReferralSourceEngine | null = null;
  private sourceCPTData: any = null;
  private sourceQuestionsData: any = null;

  constructor(cptData: CPTTable, questionData: any, sourceCPTData?: any, sourceQuestionsData?: any) {
    this.cptTables = cptData;
    this.questions = new Map(Object.entries(questionData.questions));

    // Store source data for lazy initialization
    this.sourceCPTData = sourceCPTData;
    this.sourceQuestionsData = sourceQuestionsData;

    // Merge source identification questions into main questions if provided
    if (sourceQuestionsData?.referral_questions) {
      for (const [id, q] of Object.entries(sourceQuestionsData.referral_questions)) {
        this.questions.set(id, q as Question);
      }
    }

    this.state = {
      currentPhase: 'safety',
      bodyRegion: null,
      askedQuestions: new Set(),
      symptoms: new Map(),
      conditionProbabilities: new Map(),
      redFlagDetected: false,
      confidenceLevel: 0,
      sourceIdentificationComplete: false,
      identifiedSource: null
    };

    // Initialize source engine if data provided
    if (sourceCPTData && sourceQuestionsData) {
      this.referralSourceEngine = new ReferralSourceEngine(sourceCPTData, sourceQuestionsData);
    }
  }

  // Core Bayesian inference
  updateProbabilities(symptomId: string, isPresent: boolean): void {
    this.state.symptoms.set(symptomId, isPresent);

    // Calculate evidence probability P(symptom)
    let evidenceProb = 0;
    for (const [conditionId, priorProb] of this.state.conditionProbabilities) {
      const likelihood = this.getLikelihood(conditionId, symptomId, isPresent);
      evidenceProb += likelihood * priorProb;
    }

    // Update posteriors using Bayes' rule: P(C|S) = P(S|C) * P(C) / P(S)
    for (const [conditionId, priorProb] of this.state.conditionProbabilities) {
      const likelihood = this.getLikelihood(conditionId, symptomId, isPresent);
      const posteriorProb = (likelihood * priorProb) / evidenceProb;
      this.state.conditionProbabilities.set(conditionId, posteriorProb);
    }

    this.normalize();
    this.updateConfidence();
  }

  private getLikelihood(conditionId: string, symptomId: string, isPresent: boolean): number {
    const conditionData = this.cptTables.cpt_tables?.[conditionId];
    if (!conditionData) return 0.5;

    const symptomProb = conditionData.symptom_probabilities?.[symptomId];
    if (!symptomProb) return 0.5; // Neutral likelihood if no data

    // Handle the case where symptomProb might be value-specific format
    if (typeof symptomProb === 'object' && 'present' in symptomProb) {
      return isPresent ? symptomProb.present : symptomProb.absent;
    }

    // If it's value-specific format, return neutral
    return 0.5;
  }

  // Calculate likelihood ratios for diagnostic accuracy
  private calculateLikelihoodRatio(symptomId: string, isPresent: boolean): {positive: number, negative: number} {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const [conditionId] of this.state.conditionProbabilities) {
      const likelihood = this.getLikelihood(conditionId, symptomId, isPresent);

      if (likelihood > 0.5) {
        if (isPresent) truePositives++;
        else falseNegatives++;
      } else {
        if (isPresent) falsePositives++;
        else trueNegatives++;
      }
    }

    const sensitivity = truePositives / (truePositives + falseNegatives) || 0;
    const specificity = trueNegatives / (trueNegatives + falsePositives) || 0;

    const positiveLR = sensitivity / (1 - specificity) || 1;
    const negativeLR = (1 - sensitivity) / specificity || 1;

    return {positive: positiveLR, negative: negativeLR};
  }

  private normalize(): void {
    const total = Array.from(this.state.conditionProbabilities.values())
      .reduce((sum, prob) => sum + prob, 0);

    if (total > 0) {
      for (const [conditionId, prob] of this.state.conditionProbabilities) {
        this.state.conditionProbabilities.set(conditionId, prob / total);
      }
    }
  }

  private updateConfidence(): void {
    const probabilities = Array.from(this.state.conditionProbabilities.values());
    if (probabilities.length === 0) {
      this.state.confidenceLevel = 0;
      return;
    }

    // Calculate confidence using multiple metrics
    const maxProb = Math.max(...probabilities);
    const entropy = this.calculateEntropy(this.state.conditionProbabilities);
    const maxEntropy = Math.log2(probabilities.length);

    // Confidence combines max probability and low entropy
    const normalizedEntropy = maxEntropy > 0 ? 1 - (entropy / maxEntropy) : 1;
    this.state.confidenceLevel = Math.sqrt(maxProb * normalizedEntropy);
  }

  // Smart question selection with information gain
  getNextQuestion(): Question | null {
    // Check if red flag detected
    if (this.state.redFlagDetected) {
      return null; // Stop questioning, refer immediately
    }

    // Check stopping criteria
    if (this.shouldStop()) {
      return null;
    }

    // ADAPTIVE QUESTIONING: Clinical decision tree flow
    // 1. Safety screening first (red flags)
    // 2. Context questions (onset, mechanism)
    // 3. Body region selection (MANDATORY before region-specific questions)
    // 4. Functional questions based on selected region
    // 5. Differential questions for final diagnosis

    switch (this.state.currentPhase) {
      case 'safety':
        return this.getNextSafetyQuestion();
      case 'context':
        return this.getNextContextQuestion();
      case 'region':
        // Body region selection phase
        if (!this.state.bodyRegion) {
          return this.getBodyRegionQuestion();
        }
        // If body region selected, move to SOURCE IDENTIFICATION phase (NEW!)
        if (this.referralSourceEngine && !this.state.sourceIdentificationComplete) {
          this.state.currentPhase = 'source_identification';
          this.referralSourceEngine.initializeForRegion(this.state.bodyRegion);
          return this.getNextQuestion();
        }
        // If no source engine, skip to functional
        this.state.currentPhase = 'functional';
        return this.getNextQuestion();

      case 'source_identification':
        // NEW PHASE: Identify if pain is local or referred
        if (!this.referralSourceEngine) {
          this.state.currentPhase = 'functional';
          return this.getNextQuestion();
        }

        // Check if source identification is complete
        if (this.referralSourceEngine.isComplete()) {
          this.state.sourceIdentificationComplete = true;
          this.state.identifiedSource = this.referralSourceEngine.getResult();

          // Log source identification result
          console.log('Source Identification Complete:', this.state.identifiedSource);

          // Check for red flags from source identification
          if (this.state.identifiedSource?.redFlagDetected) {
            this.state.redFlagDetected = true;
            return null;
          }

          // Check if we should switch body regions
          if (this.state.identifiedSource?.shouldSwitchRegion && this.state.identifiedSource?.newRegion) {
            console.log(`Switching body region from ${this.state.bodyRegion} to ${this.state.identifiedSource.newRegion}`);
            const newRegion = this.state.identifiedSource.newRegion;
            this.processBodySelection(newRegion);
          }

          // Move to functional phase
          this.state.currentPhase = 'functional';
          return this.getNextQuestion();
        }

        // Get next source identification question
        const sourceQuestion = this.referralSourceEngine.getNextQuestion();
        if (sourceQuestion) {
          return sourceQuestion as Question;
        }

        // No more source questions - complete and move on
        this.state.sourceIdentificationComplete = true;
        this.state.identifiedSource = this.referralSourceEngine.getResult();
        this.state.currentPhase = 'functional';
        return this.getNextQuestion();

      case 'functional':
        // CRITICAL: Body region MUST be selected before ANY region-specific questions
        if (!this.state.bodyRegion) {
          this.state.currentPhase = 'region';
          return this.getBodyRegionQuestion();
        }
        return this.getNextFunctionalQuestion();
      case 'differential':
        // Safety check: Never ask differential questions without body region
        if (!this.state.bodyRegion) {
          console.warn('Attempted differential phase without body region - switching back to region');
          this.state.currentPhase = 'region';
          return this.getBodyRegionQuestion();
        }
        return this.getNextDifferentialQuestion();
      default:
        return null;
    }
  }

  private getBodyRegionQuestion(): Question | null {
    // Try new format first (REGION_001), fallback to old format (FUNCTIONAL_001)
    const bodyRegionQuestion = this.questions.get('REGION_001') || this.questions.get('FUNCTIONAL_001');
    const questionId = this.questions.has('REGION_001') ? 'REGION_001' : 'FUNCTIONAL_001';
    if (bodyRegionQuestion && !this.state.askedQuestions.has(questionId)) {
      return bodyRegionQuestion;
    }
    return null;
  }

  private shouldStop(): boolean {
    // IMPROVED STOPPING CRITERIA for accurate diagnosis

    // Get current top conditions
    const topConditions = Array.from(this.state.conditionProbabilities.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topConditions.length === 0) return false;

    const [topCondition, topProbability] = topConditions[0];
    const secondProbability = topConditions.length > 1 ? topConditions[1][1] : 0;

    // Stop if we have very high confidence in top condition
    if (topProbability > 0.85 && this.state.confidenceLevel > 0.8) {
      return true;
    }

    // Stop if clear separation between top conditions
    if (topProbability > 0.7 && (topProbability - secondProbability) > 0.4) {
      return true;
    }

    // Stop if we've asked enough questions (but allow more for complex cases)
    const maxQuestions = this.state.bodyRegion === 'ankle' ? 15 : 12; // More questions for ankle complexity
    if (this.state.askedQuestions.size > maxQuestions) {
      return true;
    }

    // Stop if we're in differential phase and have moderate confidence
    if (this.state.currentPhase === 'differential' &&
        this.state.confidenceLevel > 0.6 &&
        this.state.askedQuestions.size > 8) {
      return true;
    }

    return false;
  }

  private getNextSafetyQuestion(): Question | null {
    // ADAPTIVE SAFETY: Only ask general safety questions initially
    // Region-specific safety questions (like Ottawa Ankle Rules) only after region selection
    const safetyQuestions = Array.from(this.questions.values())
      .filter(q => {
        if (q.phase !== 'safety' || this.state.askedQuestions.has(q.id)) {
          return false;
        }

        // If no body region selected yet, only ask general safety questions
        if (!this.state.bodyRegion) {
          // General safety questions have body_regions: ["all"] or no specific region
          return !q.body_regions || q.body_regions.includes('all');
        }

        // If body region is selected, can ask region-specific safety questions
        return !q.body_regions ||
               q.body_regions.includes('all') ||
               q.body_regions.includes(this.state.bodyRegion);
      });

    if (safetyQuestions.length === 0) {
      this.state.currentPhase = 'context';
      return this.getNextQuestion();
    }

    // Prioritize general safety questions first, then region-specific
    const generalSafety = safetyQuestions.filter(q =>
      !q.body_regions || q.body_regions.includes('all')
    );

    if (generalSafety.length > 0) {
      return generalSafety[0];
    }

    return safetyQuestions[0];
  }

  private getNextContextQuestion(): Question | null {
    // ADAPTIVE CONTEXT: Ask general context first, then region-specific if body region known
    const contextQuestions = Array.from(this.questions.values())
      .filter(q => {
        if (q.phase !== 'context' || this.state.askedQuestions.has(q.id)) {
          return false;
        }

        // If body region is known, filter for relevant context questions
        if (this.state.bodyRegion && q.body_regions) {
          return q.body_regions.includes('all') || q.body_regions.includes(this.state.bodyRegion);
        }

        // If no body region yet, ask general context questions
        return !q.body_regions || q.body_regions.includes('all');
      });

    if (contextQuestions.length === 0) {
      // Move to region phase to select body region before functional questions
      this.state.currentPhase = 'region';
      return this.getNextQuestion();
    }

    // Prioritize general context questions first, then region-specific
    const generalContext = contextQuestions.filter(q =>
      !q.body_regions || q.body_regions.includes('all')
    );

    if (generalContext.length > 0) {
      return generalContext[0];
    }

    return contextQuestions[0];
  }

  private getNextFunctionalQuestion(): Question | null {
    // ADAPTIVE FUNCTIONAL: Only ask region-specific functional questions for selected region
    const functionalQuestions = Array.from(this.questions.values())
      .filter(q => {
        if (q.phase !== 'functional' || this.state.askedQuestions.has(q.id)) {
          return false;
        }

        // Skip the body region selection question if already answered (both old and new formats)
        if ((q.id === 'FUNCTIONAL_001' || q.id === 'REGION_001') && this.state.bodyRegion) {
          return false;
        }

        // If body region is selected, only show relevant functional questions
        if (this.state.bodyRegion && q.body_regions) {
          return q.body_regions.includes('all') || q.body_regions.includes(this.state.bodyRegion);
        }

        // General functional questions for all regions
        return !q.body_regions || q.body_regions.includes('all');
      });

    if (functionalQuestions.length === 0) {
      this.state.currentPhase = 'differential';
      return this.getNextQuestion();
    }

    return functionalQuestions[0];
  }

  private getNextDifferentialQuestion(): Question | null {
    const availableQuestions = Array.from(this.questions.values())
      .filter(q =>
        q.phase === 'differential' &&
        !this.state.askedQuestions.has(q.id) &&
        this.isQuestionRelevant(q)
      );

    if (availableQuestions.length === 0) return null;

    // Select question with highest information gain
    return this.selectOptimalQuestion(availableQuestions);
  }

  private isQuestionRelevant(question: Question): boolean {
    // Filter by body region if selected
    if (this.state.bodyRegion && question.body_regions) {
      return question.body_regions.includes(this.state.bodyRegion) ||
             question.body_regions.includes('all');
    }
    return true;
  }

  private selectOptimalQuestion(questions: Question[]): Question {
    let bestQuestion = questions[0];
    let maxDiagnosticValue = 0;

    for (const question of questions) {
      // Calculate comprehensive diagnostic value considering:
      // 1. Information gain
      // 2. Diagnostic weight
      // 3. Likelihood ratio potential
      // 4. Current confidence level
      const infoGain = this.calculateInformationGain(question);
      const diagnosticWeight = question.diagnostic_weight || 1;
      const infoGainPotential = question.information_gain_potential || 1;

      // Boost questions that can rule out conditions (high specificity)
      const currentTopCondition = this.getCurrentTopCondition();
      let conditionRelevanceBoost = 1;
      if (currentTopCondition && this.isQuestionRelevantToCondition(question, currentTopCondition)) {
        conditionRelevanceBoost = 1.5;
      }

      const diagnosticValue = infoGain * diagnosticWeight * infoGainPotential * conditionRelevanceBoost;

      if (diagnosticValue > maxDiagnosticValue) {
        maxDiagnosticValue = diagnosticValue;
        bestQuestion = question;
      }
    }

    return bestQuestion;
  }

  private calculateInformationGain(question: Question): number {
    const currentEntropy = this.calculateEntropy(this.state.conditionProbabilities);

    let expectedEntropy = 0;
    let likelihoodRatioWeight = 1;

    // Calculate likelihood ratio weighting for the question
    for (const symptomId of question.tests_symptoms) {
      const lr = this.calculateLikelihoodRatio(symptomId, true);
      // Strong evidence has LR+ > 10 or LR- < 0.1 (from research)
      if (lr.positive > 10 || lr.negative < 0.1) {
        likelihoodRatioWeight *= 1.5; // Boost high-value questions
      } else if (lr.positive > 5 || lr.negative < 0.2) {
        likelihoodRatioWeight *= 1.2; // Moderate boost
      }
    }

    // Calculate expected entropy for both yes/no answers
    for (const answer of [true, false]) {
      const answerProb = this.calculateAnswerProbability(question, answer);
      if (answerProb > 0) {
        const simulatedProbs = this.simulateAnswer(question, answer);
        const answerEntropy = this.calculateEntropy(simulatedProbs);
        expectedEntropy += answerProb * answerEntropy;
      }
    }

    const baseInfoGain = currentEntropy - expectedEntropy;
    const clinicalWeight = question.diagnostic_weight || 1;
    const informationGainPotential = question.information_gain_potential || 1;

    return baseInfoGain * likelihoodRatioWeight * clinicalWeight * informationGainPotential;
  }

  private calculateEntropy(probabilities: Map<string, number>): number {
    let entropy = 0;
    for (const prob of probabilities.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  private calculateAnswerProbability(question: Question, answer: boolean): number {
    let totalProb = 0;

    for (const [conditionId, conditionProb] of this.state.conditionProbabilities) {
      let symptomProb = 1;

      for (const symptomId of question.tests_symptoms) {
        const likelihood = this.getLikelihood(conditionId, symptomId, answer);
        symptomProb *= likelihood;
      }

      totalProb += conditionProb * symptomProb;
    }

    return totalProb;
  }

  private simulateAnswer(question: Question, answer: boolean): Map<string, number> {
    const simulatedProbs = new Map(this.state.conditionProbabilities);

    // Temporarily update probabilities for each symptom tested by question
    for (const symptomId of question.tests_symptoms) {
      let evidenceProb = 0;

      for (const [conditionId, priorProb] of simulatedProbs) {
        const likelihood = this.getLikelihood(conditionId, symptomId, answer);
        evidenceProb += likelihood * priorProb;
      }

      for (const [conditionId, priorProb] of simulatedProbs) {
        const likelihood = this.getLikelihood(conditionId, symptomId, answer);
        const posteriorProb = (likelihood * priorProb) / evidenceProb;
        simulatedProbs.set(conditionId, posteriorProb);
      }
    }

    return simulatedProbs;
  }

  // Handle user responses
  processAnswer(questionId: string, answer: any): void {
    this.state.askedQuestions.add(questionId);
    const question = this.questions.get(questionId);

    if (!question) return;

    // Handle SOURCE IDENTIFICATION phase questions
    if (question.phase === 'source_identification' && this.referralSourceEngine) {
      this.referralSourceEngine.processAnswer(questionId, answer);

      // Check for red flags from source identification
      if (question.red_flag && answer === true) {
        this.state.redFlagDetected = true;
      }

      return; // Source questions are handled by the source engine
    }

    // Handle different question types
    if (question.type === 'yes_no') {
      this.processYesNoAnswer(question, answer as boolean);
    } else if (question.type === 'body_selection') {
      this.processBodySelection(answer as string);
    } else if (question.type === 'multiple_choice') {
      this.processMultipleChoice(question, answer as string);
    }

    // Check for red flags (handled in processMultipleChoice for comprehensive screening)
    if (question.red_flag && question.type === 'yes_no' && answer === true) {
      this.state.redFlagDetected = true;
    }

    // ADAPTIVE LOGIC: Update phase based on question answered and body region status
    this.updatePhaseBasedOnContext();
  }

  private processYesNoAnswer(question: Question, answer: boolean): void {
    for (const symptomId of question.tests_symptoms) {
      this.updateProbabilities(symptomId, answer);
    }
  }

  private processBodySelection(bodyRegion: string): void {
    const previousRegion = this.state.bodyRegion;
    this.state.bodyRegion = bodyRegion;

    // If changing body region mid-conversation, reset phase to safety for region-specific screening
    if (previousRegion && previousRegion !== bodyRegion) {
      console.log(`Body region changed from ${previousRegion} to ${bodyRegion} - resetting to safety phase`);
      this.state.currentPhase = 'safety';
      // Clear region-specific questions that were asked for previous region
      const regionSpecificQuestions = Array.from(this.state.askedQuestions).filter(questionId => {
        const question = this.questions.get(questionId);
        return question && question.body_regions &&
               !question.body_regions.includes('all') &&
               question.body_regions.includes(previousRegion);
      });
      regionSpecificQuestions.forEach(qId => this.state.askedQuestions.delete(qId));
    }

    // Initialize condition probabilities for selected region
    this.initializeRegionalPriors(bodyRegion);
  }

  private processMultipleChoice(question: Question, answer: string): void {
    // Handle red flag screening
    if (question.red_flag && (answer === 'cauda_equina' || answer === 'neurological_severe' ||
        answer === 'outer_ankle_bone' || answer === 'inner_ankle_bone' ||
        answer === 'midfoot_navicular' || answer === 'outer_foot_base')) {
      this.state.redFlagDetected = true;
    }

    // Pure Bayesian approach - update symptoms with specific values
    for (const symptomId of question.tests_symptoms) {
      this.updateProbabilitiesWithValue(symptomId, answer);
    }
  }

  // New method for handling symptom values (not just present/absent)
  updateProbabilitiesWithValue(symptomId: string, value: string): void {
    this.state.symptoms.set(symptomId, value);

    // Calculate evidence probability P(symptom=value)
    let evidenceProb = 0;
    for (const [conditionId, priorProb] of this.state.conditionProbabilities) {
      const likelihood = this.getLikelihoodForValue(conditionId, symptomId, value);
      evidenceProb += likelihood * priorProb;
    }

    // Prevent division by zero
    if (evidenceProb === 0) evidenceProb = 0.001;

    // Update posteriors using Bayes' rule: P(C|S=value) = P(S=value|C) * P(C) / P(S=value)
    for (const [conditionId, priorProb] of this.state.conditionProbabilities) {
      const likelihood = this.getLikelihoodForValue(conditionId, symptomId, value);
      const posteriorProb = (likelihood * priorProb) / evidenceProb;
      this.state.conditionProbabilities.set(conditionId, posteriorProb);
    }

    this.normalize();
    this.updateConfidence();
  }

  private getLikelihoodForValue(conditionId: string, symptomId: string, value: string): number {
    const conditionData = this.cptTables.cpt_tables?.[conditionId];
    if (!conditionData) return 0.5; // Neutral probability if no condition data

    const symptomProb = conditionData.symptom_probabilities?.[symptomId];
    if (!symptomProb) {
      // CRITICAL FIX: If symptom not defined for condition, return neutral probability
      // Don't penalize conditions that don't track this symptom
      return 0.5; // Neutral evidence
    }

    // Handle both old format (present/absent) and new format (value-specific)
    if (typeof symptomProb === 'object' && 'present' in symptomProb) {
      // Old format for yes/no questions
      return value === 'true' || value === true ? symptomProb.present : symptomProb.absent;
    } else if (typeof symptomProb === 'object' && value in symptomProb) {
      // New format for multiple choice questions
      const specificLikelihood = symptomProb[value];
      if (specificLikelihood !== undefined) {
        return specificLikelihood;
      }
      // If specific value not found, return low but not zero probability
      return 0.1;
    }

    return 0.5; // Default neutral probability for unknown formats
  }

  private updatePhaseBasedOnContext(): void {
    // ADAPTIVE PHASE MANAGEMENT: Intelligently progress through clinical phases
    // based on what information we have and what we still need

    // If body region was just selected and we're in region phase, move to functional
    if (this.state.bodyRegion && this.state.currentPhase === 'region') {
      this.state.currentPhase = 'functional';
    }

    // If body region is selected and we're still in functional phase,
    // check if we should move to differential
    if (this.state.bodyRegion && this.state.currentPhase === 'functional') {
      // Move to differential if we have basic functional information
      const functionalQuestionsAsked = Array.from(this.state.askedQuestions)
        .filter(qId => {
          const q = this.questions.get(qId);
          return q && q.phase === 'functional' && q.id !== 'FUNCTIONAL_001' && q.id !== 'REGION_001';
        });

      // If we've asked some functional questions, ready for differential
      if (functionalQuestionsAsked.length >= 1) {
        this.state.currentPhase = 'differential';
      }
    }

    // If we have high confidence early, we can move to differential sooner
    if (this.state.confidenceLevel > 0.7 &&
        this.state.currentPhase === 'functional' &&
        this.state.bodyRegion) {
      this.state.currentPhase = 'differential';
    }
  }

  private initializeRegionalPriors(bodyRegion: string): void {
    // Use the prior probabilities from the loaded data
    const priorProbabilities = this.cptTables.prior_probabilities || {};
    const regionalPriors = priorProbabilities[bodyRegion] || {};

    this.state.conditionProbabilities.clear();

    // ONLY initialize conditions that are relevant to the selected body region
    for (const [conditionId, probability] of Object.entries(regionalPriors)) {
      if (conditionId !== 'other' && typeof probability === 'number') {
        this.state.conditionProbabilities.set(conditionId, probability);
      }
    }

    // Normalize probabilities to sum to 1
    const total = Array.from(this.state.conditionProbabilities.values()).reduce((sum, prob) => sum + prob, 0);
    if (total > 0) {
      for (const [conditionId, prob] of this.state.conditionProbabilities) {
        this.state.conditionProbabilities.set(conditionId, prob / total);
      }
    }

    // Initialized conditions for selected body region
  }

  // Get current diagnostic results
  getDiagnosticResults(): {
    topConditions: Array<{id: string, name: string, probability: number, confidence: string}>;
    confidence: number;
    needsReferral: boolean;
    questionsAsked: number;
    diagnosticSummary: string;
    evidenceQuality: string;
    // NEW: Source identification results
    sourceIdentification?: SourceIdentificationResult;
    painSourceSummary?: string;
  } {
    const topConditions = Array.from(this.state.conditionProbabilities.entries())
      .filter(([id, probability]) => probability > 0.01) // Only show conditions with >1% probability
      .map(([id, probability]) => ({
        id,
        name: this.getConditionName(id),
        probability: Math.round(probability * 100) / 100,
        confidence: this.getConfidenceLevel(probability)
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3);

    // Generate pain source summary if available
    let painSourceSummary: string | undefined;
    if (this.state.identifiedSource) {
      const src = this.state.identifiedSource;
      if (src.isLocal) {
        painSourceSummary = `Pain appears to originate locally from ${src.topSource.name} (${Math.round(src.topSource.probability * 100)}% confidence)`;
      } else {
        painSourceSummary = `Pain at ${src.painSite} is likely REFERRED from ${src.topSource.name} (${Math.round(src.topSource.probability * 100)}% confidence). ${src.clinicalImplication}`;
      }
    }

    return {
      topConditions,
      confidence: Math.round(this.state.confidenceLevel * 100) / 100,
      needsReferral: this.state.redFlagDetected,
      questionsAsked: this.state.askedQuestions.size,
      diagnosticSummary: this.generateDiagnosticSummary(topConditions),
      evidenceQuality: this.assessEvidenceQuality(),
      sourceIdentification: this.state.identifiedSource || undefined,
      painSourceSummary
    };
  }

  private getConfidenceLevel(probability: number): string {
    if (probability > 0.8) return 'Very High';
    if (probability > 0.6) return 'High';
    if (probability > 0.4) return 'Moderate';
    if (probability > 0.2) return 'Low';
    return 'Very Low';
  }

  private generateDiagnosticSummary(topConditions: Array<{name: string, probability: number}>): string {
    if (topConditions.length === 0) {
      return 'Insufficient information for diagnosis. More assessment needed.';
    }

    const topCondition = topConditions[0];

    if (topCondition.probability > 0.8) {
      return `Strong evidence suggests ${topCondition.name} (${Math.round(topCondition.probability * 100)}% probability)`;
    } else if (topCondition.probability > 0.6) {
      return `Likely diagnosis: ${topCondition.name} (${Math.round(topCondition.probability * 100)}% probability)`;
    } else if (topConditions.length > 1) {
      const secondCondition = topConditions[1];
      return `Differential diagnosis between ${topCondition.name} (${Math.round(topCondition.probability * 100)}%) and ${secondCondition.name} (${Math.round(secondCondition.probability * 100)}%)`;
    } else {
      return `Possible diagnosis: ${topCondition.name} (${Math.round(topCondition.probability * 100)}% probability). Further assessment recommended.`;
    }
  }

  private assessEvidenceQuality(): string {
    const questionsAsked = this.state.askedQuestions.size;
    const hasBodyRegion = !!this.state.bodyRegion;
    const hasHighValueEvidence = this.hasHighValueEvidence();

    if (questionsAsked >= 8 && hasBodyRegion && hasHighValueEvidence) {
      return 'Strong evidence base';
    } else if (questionsAsked >= 5 && hasBodyRegion) {
      return 'Adequate evidence base';
    } else if (questionsAsked >= 3) {
      return 'Limited evidence base';
    } else {
      return 'Insufficient evidence';
    }
  }

  private hasHighValueEvidence(): boolean {
    // Check if we have evidence from high-weight symptoms
    for (const [symptomId, value] of this.state.symptoms) {
      const symptomUsedInTopConditions = Array.from(this.state.conditionProbabilities.entries())
        .slice(0, 2) // Top 2 conditions
        .some(([conditionId]) => {
          const conditionData = this.cptTables.cpt_tables?.[conditionId];
          const symptomProb = conditionData?.symptom_probabilities?.[symptomId];
          return symptomProb &&
                 typeof symptomProb === 'object' &&
                 'weight' in symptomProb &&
                 symptomProb.weight > 0.8;
        });

      if (symptomUsedInTopConditions) return true;
    }
    return false;
  }

  private getCurrentTopCondition(): string | null {
    if (this.state.conditionProbabilities.size === 0) return null;

    let topCondition = null;
    let maxProbability = 0;

    for (const [conditionId, probability] of this.state.conditionProbabilities) {
      if (probability > maxProbability) {
        maxProbability = probability;
        topCondition = conditionId;
      }
    }

    return maxProbability > 0.1 ? topCondition : null; // Only return if >10% probability
  }

  private isQuestionRelevantToCondition(question: Question, conditionId: string): boolean {
    const conditionData = this.cptTables.cpt_tables?.[conditionId];
    if (!conditionData) return false;

    // Check if question tests symptoms that are important for this condition
    for (const symptomId of question.tests_symptoms) {
      const symptomProb = conditionData.symptom_probabilities?.[symptomId];
      if (symptomProb) {
        // If symptom has high diagnostic weight for this condition
        const weight = typeof symptomProb === 'object' && 'weight' in symptomProb ? symptomProb.weight : 0.5;
        if (weight > 0.7) { // High diagnostic value
          return true;
        }
      }
    }

    return false;
  }

  private getConditionName(conditionId: string): string {
    const conditionData = this.cptTables.cpt_tables?.[conditionId];
    if (conditionData && conditionData.name) {
      return conditionData.name;
    }
    return conditionId;
  }

  // Reset for new assessment
  reset(): void {
    this.state = {
      currentPhase: 'safety',
      bodyRegion: null,
      askedQuestions: new Set(),
      symptoms: new Map(),
      conditionProbabilities: new Map(),
      redFlagDetected: false,
      confidenceLevel: 0,
      sourceIdentificationComplete: false,
      identifiedSource: null
    };

    // Reset source engine if available
    if (this.referralSourceEngine) {
      this.referralSourceEngine.reset();
    }
  }

  // Get source identification result
  getSourceIdentificationResult(): SourceIdentificationResult | null {
    return this.state.identifiedSource;
  }

  // Check if source identification is complete
  isSourceIdentificationComplete(): boolean {
    return this.state.sourceIdentificationComplete;
  }

  // Get current phase
  getCurrentPhase(): string {
    return this.state.currentPhase;
  }
}
