/**
 * Referral Source Engine - Bayesian Source Identification
 *
 * Determines if pain is LOCAL or REFERRED from another region.
 * Uses the same Bayesian inference as PhysioBayesianEngine but for
 * pain sources instead of conditions.
 *
 * Flow: Patient says "shoulder pain" -> Is it local shoulder or referred from cervical?
 */

interface SourceCPTTable {
  source_cpt_tables: {
    [bodyRegion: string]: {
      sources: {
        [sourceId: string]: {
          name: string;
          base_probability: number;
          is_local: boolean;
          is_red_flag?: boolean;
          refers_to_region?: string;
          symptom_probabilities: {
            [symptomId: string]: {
              present: number;
              absent: number;
              weight: number;
              category: 'screening' | 'confirmation' | 'pathognomonic';
            };
          };
        };
      };
    };
  };
}

interface QuestionOption {
  id: string;
  text: string;
}

interface ConditionalOn {
  question: string;
  answer: string | boolean;
}

interface ReferralQuestion {
  id: string;
  phase: 'source_identification';
  text: string;
  type: 'yes_no' | 'multiple_choice';
  options?: QuestionOption[];
  body_regions: string[];
  tests_symptoms: string[];
  diagnostic_weight: number;
  information_gain_potential?: number;
  red_flag?: boolean;
  clinical_note?: string;
  conditional_on?: ConditionalOn;
}

interface SourceIdentificationState {
  bodyRegion: string | null;
  sourceProbabilities: Map<string, number>;
  askedQuestions: Set<string>;
  questionAnswers: Map<string, any>;  // Store actual answers for conditional logic
  symptoms: Map<string, boolean | string>;
  identifiedSource: string | null;
  confidenceLevel: number;
  redFlagDetected: boolean;
  isComplete: boolean;
}

export interface SourceIdentificationResult {
  painSite: string;
  isLocal: boolean;
  topSource: {
    id: string;
    name: string;
    probability: number;
    isLocal: boolean;
    refersToRegion?: string;
  };
  allSources: Array<{
    id: string;
    name: string;
    probability: number;
    isLocal: boolean;
  }>;
  shouldSwitchRegion: boolean;
  newRegion?: string;
  confidence: number;
  supportingFindings: string[];
  clinicalImplication: string;
  redFlagDetected: boolean;
}

export class ReferralSourceEngine {
  private sourceCPT: SourceCPTTable;
  private questions: Map<string, ReferralQuestion>;
  private state: SourceIdentificationState;
  private supportingFindings: string[] = [];

  constructor(sourceCPTData: SourceCPTTable, questionData: { referral_questions: Record<string, ReferralQuestion> }) {
    this.sourceCPT = sourceCPTData;
    this.questions = new Map(Object.entries(questionData.referral_questions));

    this.state = {
      bodyRegion: null,
      sourceProbabilities: new Map(),
      askedQuestions: new Set(),
      questionAnswers: new Map(),
      symptoms: new Map(),
      identifiedSource: null,
      confidenceLevel: 0,
      redFlagDetected: false,
      isComplete: false
    };
  }

  /**
   * Initialize source probabilities for a body region
   */
  initializeForRegion(bodyRegion: string): void {
    this.state.bodyRegion = bodyRegion;
    this.state.sourceProbabilities.clear();
    this.state.askedQuestions.clear();
    this.state.questionAnswers.clear();
    this.state.symptoms.clear();
    this.state.isComplete = false;
    this.state.redFlagDetected = false;
    this.supportingFindings = [];

    const regionData = this.sourceCPT.source_cpt_tables[bodyRegion];

    if (!regionData) {
      console.warn(`No source CPT data for region: ${bodyRegion}`);
      this.state.isComplete = true;
      return;
    }

    // Initialize with base probabilities (priors)
    for (const [sourceId, sourceData] of Object.entries(regionData.sources)) {
      this.state.sourceProbabilities.set(sourceId, sourceData.base_probability);
    }

    // Normalize to sum to 1
    this.normalize();

    console.log(`Initialized source probabilities for ${bodyRegion}:`,
      Object.fromEntries(this.state.sourceProbabilities));
  }

  /**
   * Core Bayesian update - same math as condition engine
   * P(Source|Symptom) = P(Symptom|Source) * P(Source) / P(Symptom)
   */
  updateProbabilities(symptomId: string, isPresent: boolean): void {
    this.state.symptoms.set(symptomId, isPresent);

    if (!this.state.bodyRegion) return;

    const regionData = this.sourceCPT.source_cpt_tables[this.state.bodyRegion];
    if (!regionData) return;

    // Calculate evidence probability P(symptom)
    let evidenceProb = 0;
    for (const [sourceId, priorProb] of this.state.sourceProbabilities) {
      const likelihood = this.getLikelihood(sourceId, symptomId, isPresent);
      evidenceProb += likelihood * priorProb;
    }

    // Prevent division by zero
    if (evidenceProb < 0.001) evidenceProb = 0.001;

    // Update posteriors using Bayes' rule
    for (const [sourceId, priorProb] of this.state.sourceProbabilities) {
      const likelihood = this.getLikelihood(sourceId, symptomId, isPresent);
      const posteriorProb = (likelihood * priorProb) / evidenceProb;
      this.state.sourceProbabilities.set(sourceId, posteriorProb);
    }

    this.normalize();
    this.updateConfidence();

    console.log(`Updated source probabilities after ${symptomId}=${isPresent}:`,
      Object.fromEntries(this.state.sourceProbabilities));
  }

  /**
   * Get likelihood P(Symptom|Source)
   */
  private getLikelihood(sourceId: string, symptomId: string, isPresent: boolean): number {
    if (!this.state.bodyRegion) return 0.5;

    const regionData = this.sourceCPT.source_cpt_tables[this.state.bodyRegion];
    if (!regionData) return 0.5;

    const sourceData = regionData.sources[sourceId];
    if (!sourceData) return 0.5;

    const symptomProb = sourceData.symptom_probabilities[symptomId];
    if (!symptomProb) return 0.5; // Neutral if no data

    return isPresent ? symptomProb.present : symptomProb.absent;
  }

  /**
   * Normalize probabilities to sum to 1
   */
  private normalize(): void {
    const total = Array.from(this.state.sourceProbabilities.values())
      .reduce((sum, prob) => sum + prob, 0);

    if (total > 0) {
      for (const [sourceId, prob] of this.state.sourceProbabilities) {
        this.state.sourceProbabilities.set(sourceId, prob / total);
      }
    }
  }

  /**
   * Update confidence level based on entropy
   */
  private updateConfidence(): void {
    const probabilities = Array.from(this.state.sourceProbabilities.values());
    if (probabilities.length === 0) {
      this.state.confidenceLevel = 0;
      return;
    }

    const maxProb = Math.max(...probabilities);
    const entropy = this.calculateEntropy();
    const maxEntropy = Math.log2(probabilities.length);

    const normalizedEntropy = maxEntropy > 0 ? 1 - (entropy / maxEntropy) : 1;
    this.state.confidenceLevel = Math.sqrt(maxProb * normalizedEntropy);
  }

  /**
   * Calculate entropy of probability distribution
   */
  private calculateEntropy(): number {
    let entropy = 0;
    for (const prob of this.state.sourceProbabilities.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  /**
   * Get next source identification question
   */
  getNextQuestion(): ReferralQuestion | null {
    if (this.state.redFlagDetected || this.state.isComplete) {
      return null;
    }

    // Check stopping criteria
    if (this.shouldStop()) {
      this.state.isComplete = true;
      return null;
    }

    const availableQuestions = Array.from(this.questions.values())
      .filter(q =>
        q.phase === 'source_identification' &&
        !this.state.askedQuestions.has(q.id) &&
        q.body_regions.includes(this.state.bodyRegion!) &&
        this.checkConditional(q)
      );

    if (availableQuestions.length === 0) {
      this.state.isComplete = true;
      return null;
    }

    // Select question with highest information gain
    return this.selectOptimalQuestion(availableQuestions);
  }

  /**
   * Check if a conditional question should be shown
   */
  private checkConditional(question: ReferralQuestion): boolean {
    if (!question.conditional_on) {
      return true; // No condition, always show
    }

    const { question: condQuestionId, answer: requiredAnswer } = question.conditional_on;
    const actualAnswer = this.state.questionAnswers.get(condQuestionId);

    if (actualAnswer === undefined) {
      return false; // Prerequisite question not answered yet
    }

    return actualAnswer === requiredAnswer;
  }

  /**
   * Check if we should stop asking questions
   */
  private shouldStop(): boolean {
    const topSource = this.getTopSource();
    if (!topSource) return false;

    // Stop if very high confidence
    if (topSource.probability > 0.85 && this.state.confidenceLevel > 0.8) {
      return true;
    }

    // Stop if clear separation (top vs second > 40%)
    const sources = Array.from(this.state.sourceProbabilities.entries())
      .sort(([,a], [,b]) => b - a);

    if (sources.length > 1) {
      const [, topProb] = sources[0];
      const [, secondProb] = sources[1];

      if (topProb > 0.7 && (topProb - secondProb) > 0.35) {
        return true;
      }
    }

    // Stop after 30 questions max for comprehensive diagnosis
    if (this.state.askedQuestions.size >= 30) {
      return true;
    }

    // Stop if very high confidence after 6 questions
    if (this.state.askedQuestions.size >= 6 && this.state.confidenceLevel > 0.85) {
      return true;
    }

    // Stop if good confidence after 10 questions
    if (this.state.askedQuestions.size >= 10 && this.state.confidenceLevel > 0.75) {
      return true;
    }

    return false;
  }

  /**
   * Select question with highest information gain
   */
  private selectOptimalQuestion(questions: ReferralQuestion[]): ReferralQuestion {
    let bestQuestion = questions[0];
    let maxValue = 0;

    for (const question of questions) {
      const infoGain = this.calculateInformationGain(question);
      const weight = question.diagnostic_weight || 1;
      const potential = question.information_gain_potential || 1;

      // Boost pathognomonic questions
      const categoryBoost = this.getCategoryBoost(question);

      const value = infoGain * weight * potential * categoryBoost;

      if (value > maxValue) {
        maxValue = value;
        bestQuestion = question;
      }
    }

    return bestQuestion;
  }

  /**
   * Get boost factor based on symptom category
   */
  private getCategoryBoost(question: ReferralQuestion): number {
    if (!this.state.bodyRegion) return 1;

    const regionData = this.sourceCPT.source_cpt_tables[this.state.bodyRegion];
    if (!regionData) return 1;

    // Check if any tested symptom is pathognomonic for top sources
    for (const symptomId of question.tests_symptoms) {
      for (const [sourceId, prob] of this.state.sourceProbabilities) {
        if (prob < 0.2) continue; // Skip low probability sources

        const sourceData = regionData.sources[sourceId];
        const symptomProb = sourceData?.symptom_probabilities[symptomId];

        if (symptomProb?.category === 'pathognomonic') {
          return 1.5;
        } else if (symptomProb?.category === 'confirmation') {
          return 1.3;
        }
      }
    }

    return 1;
  }

  /**
   * Calculate information gain for a question
   */
  private calculateInformationGain(question: ReferralQuestion): number {
    const currentEntropy = this.calculateEntropy();

    let expectedEntropy = 0;

    for (const answer of [true, false]) {
      const answerProb = this.calculateAnswerProbability(question, answer);
      if (answerProb > 0) {
        const simulatedEntropy = this.simulateAnswerEntropy(question, answer);
        expectedEntropy += answerProb * simulatedEntropy;
      }
    }

    return Math.max(0, currentEntropy - expectedEntropy);
  }

  /**
   * Calculate probability of getting a specific answer
   */
  private calculateAnswerProbability(question: ReferralQuestion, answer: boolean): number {
    let totalProb = 0;

    for (const [sourceId, sourceProb] of this.state.sourceProbabilities) {
      let symptomProb = 1;

      for (const symptomId of question.tests_symptoms) {
        const likelihood = this.getLikelihood(sourceId, symptomId, answer);
        symptomProb *= likelihood;
      }

      totalProb += sourceProb * symptomProb;
    }

    return totalProb;
  }

  /**
   * Simulate entropy after answering a question
   */
  private simulateAnswerEntropy(question: ReferralQuestion, answer: boolean): number {
    // Create temporary copy of probabilities
    const simulated = new Map(this.state.sourceProbabilities);

    for (const symptomId of question.tests_symptoms) {
      let evidenceProb = 0;

      for (const [sourceId, priorProb] of simulated) {
        const likelihood = this.getLikelihood(sourceId, symptomId, answer);
        evidenceProb += likelihood * priorProb;
      }

      if (evidenceProb < 0.001) evidenceProb = 0.001;

      for (const [sourceId, priorProb] of simulated) {
        const likelihood = this.getLikelihood(sourceId, symptomId, answer);
        const posteriorProb = (likelihood * priorProb) / evidenceProb;
        simulated.set(sourceId, posteriorProb);
      }
    }

    // Normalize
    const total = Array.from(simulated.values()).reduce((sum, p) => sum + p, 0);
    if (total > 0) {
      for (const [sourceId, prob] of simulated) {
        simulated.set(sourceId, prob / total);
      }
    }

    // Calculate entropy
    let entropy = 0;
    for (const prob of simulated.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }

    return entropy;
  }

  /**
   * Process user answer - handles both yes/no and multiple choice
   */
  processAnswer(questionId: string, answer: any): void {
    this.state.askedQuestions.add(questionId);
    this.state.questionAnswers.set(questionId, answer);  // Store for conditional logic

    const question = this.questions.get(questionId);
    if (!question) return;

    // Check for red flag
    if (question.red_flag && answer === true) {
      this.state.redFlagDetected = true;
    }

    if (question.type === 'multiple_choice') {
      this.processMultipleChoiceAnswer(question, answer);
    } else {
      // Yes/No question
      const isPresent = answer === true || answer === 'yes';
      for (const symptomId of question.tests_symptoms) {
        this.updateProbabilities(symptomId, isPresent);
      }

      // Track supporting findings
      if (isPresent && question.clinical_note) {
        this.supportingFindings.push(question.clinical_note);
      } else if (isPresent) {
        this.supportingFindings.push(question.text.replace('?', ''));
      }
    }
  }

  /**
   * Process multiple choice answer with intelligent symptom mapping
   */
  private processMultipleChoiceAnswer(question: ReferralQuestion, selectedOptionId: string): void {
    // Map option IDs to their corresponding symptoms
    const optionSymptomMap: Record<string, Record<string, string[]>> = {
      // Q002 - Mechanism of injury (updated with external rotation for high ankle)
      'RSRC_ANKLE_002': {
        'inversion': ['RSYM_INVERSION_INJURY', 'RSYM_HISTORY_TRAUMA'],
        'eversion': ['RSYM_EVERSION_INJURY', 'RSYM_HISTORY_TRAUMA'],
        'external_rotation': ['RSYM_EXTERNAL_ROTATION_INJURY', 'RSYM_HISTORY_TRAUMA'],
        'other_trauma': ['RSYM_HISTORY_TRAUMA'],
        'gradual': ['RSYM_GRADUAL_ONSET', 'RSYM_NO_TRAUMA_HISTORY']
      },
      // Q003 - Pain location (updated with "above" for high ankle)
      'RSRC_ANKLE_003': {
        'lateral': ['RSYM_LATERAL_ANKLE_TENDERNESS'],
        'medial': ['RSYM_MEDIAL_ANKLE_TENDERNESS', 'RSYM_MEDIAL_ANKLE_SYMPTOMS'],
        'posterior': ['RSYM_POSTERIOR_ANKLE_PAIN', 'RSYM_ACHILLES_TENDERNESS'],
        'above': ['RSYM_PAIN_ABOVE_ANKLE', 'RSYM_PAIN_BETWEEN_TIBIA_FIBULA'],
        'diffuse': [] // No specific symptom activated
      },
      // Q003B - Specific lateral location (ATFL vs CFL vs Peroneal vs Fracture)
      'RSRC_ANKLE_003B': {
        'anterior': ['RSYM_PAIN_ANTERIOR_LAT_MALLEOLUS'],
        'inferior': ['RSYM_PAIN_INFERIOR_LAT_MALLEOLUS'],
        'posterior': ['RSYM_PAIN_POSTERIOR_LAT_MALLEOLUS', 'RSYM_RETROMALLEOLAR_TENDERNESS'],
        'on_bone': ['RSYM_BONE_TENDERNESS_LAT_MALLEOLUS']
      },
      // Q019 - Foot position at injury (ATFL vs CFL)
      'RSRC_ANKLE_019': {
        'plantarflexed': ['RSYM_PLANTARFLEXION_AT_INJURY'],
        'dorsiflexed': ['RSYM_DORSIFLEXION_AT_INJURY'],
        'unsure': []
      },
      // Q024 - Weight category
      'RSRC_ANKLE_024': {
        'underweight': ['RSYM_LOW_BMI'],
        'normal': [],
        'overweight': ['RSYM_OVERWEIGHT'],
        'obese': ['RSYM_OVERWEIGHT']
      },
      // Q025 - Age range
      'RSRC_ANKLE_025': {
        'under_30': [],
        '30_50': ['RSYM_AGE_40_60'],
        '50_65': ['RSYM_AGE_40_60', 'RSYM_AGE_OVER_50'],
        'over_65': ['RSYM_AGE_OVER_50']
      },
      // Q026 - Activity level
      'RSRC_ANKLE_026': {
        'sedentary': [],
        'moderate': [],
        'active': ['RSYM_RUNNER_HIGH_ACTIVITY'],
        'very_active': ['RSYM_RUNNER_HIGH_ACTIVITY']
      },
      // Q057 - Sex
      'RSRC_ANKLE_057': {
        'male': ['RSYM_MALE'],
        'female': ['RSYM_FEMALE']
      },

      // ========== LUMBAR SPINE QUESTIONS ==========

      // LBP Q034 - Morning stiffness duration (CRITICAL for inflammatory vs mechanical)
      'RSRC_LBP_034': {
        'none': [],  // No stiffness = mechanical
        'short': ['RSYM_MORNING_STIFFNESS_SHORT'],  // <30 min = mechanical
        'long': ['RSYM_MORNING_STIFFNESS_LONG'],  // 30-60 min = possibly inflammatory
        'very_long': ['RSYM_MORNING_STIFFNESS_LONG', 'RSYM_MORNING_STIFFNESS_OVER_1_HOUR']  // >1 hour = INFLAMMATORY
      },

      // LBP Q039 - Age at onset of back pain (inflammatory SpA criteria)
      'RSRC_LBP_039': {
        'under_20': ['RSYM_AGE_UNDER_45_ONSET', 'RSYM_YOUNG_ONSET'],
        '20_45': ['RSYM_AGE_UNDER_45_ONSET'],  // <45 is inflammatory criterion
        'over_45': ['RSYM_AGE_OVER_50']  // >45 = degenerative/cancer risk
      },

      // LBP Q050 - Current age (cancer, fracture, AAA risk)
      'RSRC_LBP_050': {
        'under_50': [],  // Low risk age
        '50_70': ['RSYM_AGE_OVER_50'],  // Cancer risk begins
        'over_70': ['RSYM_AGE_OVER_50', 'RSYM_AGE_OVER_70', 'RSYM_AGE_OVER_65_MALE']  // High fracture/AAA risk
      },

      // LBP Q054 - Biological sex (osteoporosis/AAA risk factors)
      'RSRC_LBP_054': {
        'male': ['RSYM_MALE'],
        'female': ['RSYM_FEMALE']
      },

      // ========== SHOULDER QUESTIONS ==========

      // SHOULDER Q015B - Which fingers have numbness (dermatomal pattern)
      'RSRC_SHOULDER_015B': {
        'thumb_index': ['RSYM_THUMB_INDEX_NUMBNESS'],  // C6 radiculopathy
        'middle': ['RSYM_MIDDLE_FINGER_NUMBNESS'],  // C7 radiculopathy
        'ring_little': ['RSYM_ULNAR_DISTRIBUTION'],  // C8/TOS
        'all_hand': []  // Non-dermatomal = may be TOS or non-neurogenic
      },

      // SHOULDER Q023 - Which shoulder affected (visceral referral)
      'RSRC_SHOULDER_023': {
        'left': ['RSYM_LEFT_SHOULDER'],  // Cardiac concern
        'right': ['RSYM_RIGHT_SHOULDER'],  // Gallbladder concern
        'both': []
      },

      // SHOULDER Q052 - Age range (risk stratification)
      'RSRC_SHOULDER_052': {
        'under_30': ['RSYM_YOUNG_AGE'],  // Instability/labral risk
        '30_50': ['RSYM_AGE_40_60'],  // Frozen shoulder risk
        '50_70': ['RSYM_AGE_40_60', 'RSYM_AGE_OVER_50'],  // OA, cuff tear risk
        'over_70': ['RSYM_AGE_OVER_50']  // High OA, malignancy risk
      },

      // SHOULDER Q053 - Biological sex
      'RSRC_SHOULDER_053': {
        'male': ['RSYM_MALE'],
        'female': ['RSYM_FEMALE']  // Higher frozen shoulder risk
      }
    };

    // Mutually exclusive symptoms to set as absent when another option is chosen
    const exclusiveSymptoms: Record<string, string[]> = {
      'RSRC_ANKLE_002': [
        'RSYM_INVERSION_INJURY', 'RSYM_EVERSION_INJURY', 'RSYM_EXTERNAL_ROTATION_INJURY',
        'RSYM_GRADUAL_ONSET', 'RSYM_NO_TRAUMA_HISTORY', 'RSYM_HISTORY_TRAUMA'
      ],
      'RSRC_ANKLE_003': [
        'RSYM_LATERAL_ANKLE_TENDERNESS', 'RSYM_MEDIAL_ANKLE_TENDERNESS',
        'RSYM_POSTERIOR_ANKLE_PAIN', 'RSYM_ACHILLES_TENDERNESS', 'RSYM_MEDIAL_ANKLE_SYMPTOMS',
        'RSYM_PAIN_ABOVE_ANKLE', 'RSYM_PAIN_BETWEEN_TIBIA_FIBULA'
      ],
      'RSRC_ANKLE_003B': [
        'RSYM_PAIN_ANTERIOR_LAT_MALLEOLUS', 'RSYM_PAIN_INFERIOR_LAT_MALLEOLUS',
        'RSYM_PAIN_POSTERIOR_LAT_MALLEOLUS', 'RSYM_BONE_TENDERNESS_LAT_MALLEOLUS',
        'RSYM_RETROMALLEOLAR_TENDERNESS'
      ],
      'RSRC_ANKLE_019': [
        'RSYM_PLANTARFLEXION_AT_INJURY', 'RSYM_DORSIFLEXION_AT_INJURY'
      ],
      'RSRC_ANKLE_024': [
        'RSYM_LOW_BMI', 'RSYM_OVERWEIGHT'
      ],
      'RSRC_ANKLE_025': [
        'RSYM_AGE_40_60', 'RSYM_AGE_OVER_50'
      ],
      'RSRC_ANKLE_026': [
        'RSYM_RUNNER_HIGH_ACTIVITY'
      ],
      'RSRC_ANKLE_057': [
        'RSYM_MALE', 'RSYM_FEMALE'
      ],

      // ========== LUMBAR SPINE EXCLUSIVE SYMPTOMS ==========
      'RSRC_LBP_034': [
        'RSYM_MORNING_STIFFNESS_SHORT', 'RSYM_MORNING_STIFFNESS_LONG', 'RSYM_MORNING_STIFFNESS_OVER_1_HOUR'
      ],
      'RSRC_LBP_039': [
        'RSYM_AGE_UNDER_45_ONSET', 'RSYM_YOUNG_ONSET', 'RSYM_AGE_OVER_50'
      ],
      'RSRC_LBP_050': [
        'RSYM_AGE_OVER_50', 'RSYM_AGE_OVER_70', 'RSYM_AGE_OVER_65_MALE'
      ],
      'RSRC_LBP_054': [
        'RSYM_MALE', 'RSYM_FEMALE'
      ],

      // ========== SHOULDER EXCLUSIVE SYMPTOMS ==========
      'RSRC_SHOULDER_015B': [
        'RSYM_THUMB_INDEX_NUMBNESS', 'RSYM_MIDDLE_FINGER_NUMBNESS', 'RSYM_ULNAR_DISTRIBUTION'
      ],
      'RSRC_SHOULDER_023': [
        'RSYM_LEFT_SHOULDER', 'RSYM_RIGHT_SHOULDER'
      ],
      'RSRC_SHOULDER_052': [
        'RSYM_YOUNG_AGE', 'RSYM_AGE_40_60', 'RSYM_AGE_OVER_50'
      ],
      'RSRC_SHOULDER_053': [
        'RSYM_MALE', 'RSYM_FEMALE'
      ]
    };

    const questionMap = optionSymptomMap[question.id];
    const exclusiveList = exclusiveSymptoms[question.id] || [];

    if (questionMap) {
      const activeSymptoms = questionMap[selectedOptionId] || [];

      // Set selected symptoms as present
      for (const symptomId of activeSymptoms) {
        this.updateProbabilities(symptomId, true);
      }

      // Set other mutually exclusive symptoms as absent
      for (const symptomId of exclusiveList) {
        if (!activeSymptoms.includes(symptomId)) {
          this.updateProbabilities(symptomId, false);
        }
      }

      // Track finding
      const selectedOption = question.options?.find(opt => opt.id === selectedOptionId);
      if (selectedOption) {
        this.supportingFindings.push(`${question.text.replace('?', '')}: ${selectedOption.text}`);
      }
    } else {
      // Fallback: treat as positive if any answer given
      for (const symptomId of question.tests_symptoms) {
        this.updateProbabilities(symptomId, true);
      }
    }
  }

  /**
   * Get the top source by probability
   */
  private getTopSource(): { id: string; probability: number } | null {
    if (this.state.sourceProbabilities.size === 0) return null;

    let topId = '';
    let topProb = 0;

    for (const [sourceId, prob] of this.state.sourceProbabilities) {
      if (prob > topProb) {
        topProb = prob;
        topId = sourceId;
      }
    }

    return { id: topId, probability: topProb };
  }

  /**
   * Get source data by ID
   */
  private getSourceData(sourceId: string): any {
    if (!this.state.bodyRegion) return null;

    const regionData = this.sourceCPT.source_cpt_tables[this.state.bodyRegion];
    return regionData?.sources[sourceId];
  }

  /**
   * Get final source identification result
   */
  getResult(): SourceIdentificationResult {
    const topSourceData = this.getTopSource();
    const bodyRegion = this.state.bodyRegion || 'unknown';

    if (!topSourceData) {
      return {
        painSite: bodyRegion,
        isLocal: true,
        topSource: {
          id: 'unknown',
          name: 'Unknown',
          probability: 0,
          isLocal: true
        },
        allSources: [],
        shouldSwitchRegion: false,
        confidence: 0,
        supportingFindings: [],
        clinicalImplication: 'Unable to determine pain source. Proceed with local assessment.',
        redFlagDetected: this.state.redFlagDetected
      };
    }

    const sourceData = this.getSourceData(topSourceData.id);
    const isLocal = sourceData?.is_local ?? true;
    const refersToRegion = sourceData?.refers_to_region;

    // Build all sources list
    const allSources = Array.from(this.state.sourceProbabilities.entries())
      .map(([id, prob]) => {
        const data = this.getSourceData(id);
        return {
          id,
          name: data?.name || id,
          probability: Math.round(prob * 100) / 100,
          isLocal: data?.is_local ?? true
        };
      })
      .sort((a, b) => b.probability - a.probability);

    // Determine if we should switch regions
    const shouldSwitch = !isLocal && topSourceData.probability > 0.55;

    // Generate clinical implication
    let clinicalImplication = '';
    if (this.state.redFlagDetected) {
      clinicalImplication = `RED FLAG DETECTED: ${sourceData?.name}. Immediate referral required.`;
    } else if (shouldSwitch) {
      clinicalImplication = `Pain at ${bodyRegion} is likely referred from ${sourceData?.name}. ` +
        `Recommend assessing ${refersToRegion} before treating ${bodyRegion} locally.`;
    } else if (isLocal) {
      clinicalImplication = `Pain appears to originate locally from ${sourceData?.name}. ` +
        `Proceed with ${bodyRegion} assessment.`;
    } else {
      clinicalImplication = `Mixed findings. Consider both local ${bodyRegion} and ${sourceData?.name} involvement.`;
    }

    return {
      painSite: bodyRegion,
      isLocal,
      topSource: {
        id: topSourceData.id,
        name: sourceData?.name || topSourceData.id,
        probability: Math.round(topSourceData.probability * 100) / 100,
        isLocal,
        refersToRegion
      },
      allSources,
      shouldSwitchRegion: shouldSwitch,
      newRegion: shouldSwitch ? refersToRegion : undefined,
      confidence: Math.round(this.state.confidenceLevel * 100) / 100,
      supportingFindings: this.supportingFindings.slice(0, 5),
      clinicalImplication,
      redFlagDetected: this.state.redFlagDetected
    };
  }

  /**
   * Check if source identification is complete
   */
  isComplete(): boolean {
    return this.state.isComplete || this.state.redFlagDetected;
  }

  /**
   * Get current confidence level
   */
  getConfidence(): number {
    return this.state.confidenceLevel;
  }

  /**
   * Get number of questions asked
   */
  getQuestionsAsked(): number {
    return this.state.askedQuestions.size;
  }

  /**
   * Reset the engine
   */
  reset(): void {
    this.state = {
      bodyRegion: null,
      sourceProbabilities: new Map(),
      askedQuestions: new Set(),
      questionAnswers: new Map(),
      symptoms: new Map(),
      identifiedSource: null,
      confidenceLevel: 0,
      redFlagDetected: false,
      isComplete: false
    };
    this.supportingFindings = [];
  }
}
