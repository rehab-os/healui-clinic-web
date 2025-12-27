import { decisionTrees } from '../data/ontology-data/entities/decision_trees.json';
import { clinicalAssessments } from '../data/ontology-data/entities/clinical_assessments.json';

export interface AssessmentResponse {
  questionId: string;
  value: any;
  timestamp: Date;
}

export interface AssessmentSession {
  id: string;
  patientId: string;
  currentStep: string;
  responses: Record<string, any>;
  activatedPathways: Set<string>;
  skippedSections: Set<string>;
  questionQueue: string[];
  completionPercentage: number;
  provisionalDiagnosis: string[];
}

export enum PathwayType {
  PAIN = 'pain',
  MOTOR = 'motor', 
  SENSORY = 'sensory',
  MOBILITY = 'mobility',
  BALANCE = 'balance',
  INFLAMMATION = 'inflammation',
  OBJECTIVE = 'objective',
  FUNCTIONAL = 'functional',
  NEUROLOGICAL = 'neurological'
}

export interface QuestionTemplate {
  id: string;
  type: 'text' | 'yes_no' | 'multi_choice' | 'single_choice' | 'slider' | 'body_map' | 'checklist' | 'measurement' | 'scale_grid' | 'observational' | 'tenderness_map' | 'rom_measurement' | 'mmt_testing';
  question: string;
  options?: Array<{ value: string; label: string; requiresText?: boolean }>;
  validation?: (input: any) => boolean;
  conditional?: Record<string, string[]>;
  min?: number;
  max?: number;
  labels?: Record<number, string>;
  placeholder?: string;
  multiple?: boolean;
}

export class PhysioDecisionEngine {
  private session: AssessmentSession;
  private questionTemplates: Record<string, QuestionTemplate>;

  constructor(patientId: string) {
    this.session = {
      id: this.generateId(),
      patientId,
      currentStep: 'chief_complaint',
      responses: {},
      activatedPathways: new Set(),
      skippedSections: new Set(),
      questionQueue: [],
      completionPercentage: 0,
      provisionalDiagnosis: []
    };

    this.questionTemplates = this.initializeQuestionTemplates();
  }

  private generateId(): string {
    return 'assessment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeQuestionTemplates(): Record<string, QuestionTemplate> {
    return {
      chief_complaint: {
        id: 'chief_complaint',
        type: 'text',
        question: "What is the patient's main concern today? Describe their primary symptoms or functional limitations.",
        placeholder: "e.g., not able to walk, severe back pain, weakness in right arm, xyz condition...",
        validation: (input: string) => input.length > 2
      },

      symptom_onset: {
        id: 'symptom_onset',
        type: 'date',
        question: "When did your symptoms first start? This helps us understand if this is an acute, subacute, or chronic condition.",
        placeholder: "Select the date when symptoms began",
        validation: (input: string) => {
          if (!input) return false;
          const selectedDate = new Date(input);
          const today = new Date();
          return selectedDate <= today;
        }
      },

      onset_nature: {
        id: 'onset_nature',
        type: 'single_choice',
        question: "How did your symptoms begin?",
        options: [
          { value: 'sudden', label: 'Sudden onset (immediate)' },
          { value: 'gradual', label: 'Gradual onset (over days/weeks)' },
          { value: 'after_injury', label: 'After a specific injury or event' },
          { value: 'unknown', label: 'Not sure/Cannot remember' }
        ]
      },

      symptom_progression: {
        id: 'symptom_progression',
        type: 'single_choice',
        question: "Since symptoms started, are they:",
        options: [
          { value: 'getting_worse', label: 'Getting worse' },
          { value: 'getting_better', label: 'Getting better' },
          { value: 'staying_same', label: 'Staying about the same' },
          { value: 'fluctuating', label: 'Going up and down' }
        ]
      },

      previous_episodes: {
        id: 'previous_episodes',
        type: 'yes_no',
        question: "Have you experienced this problem before?"
      },

      pain_screening: {
        id: 'pain_screening',
        type: 'yes_no',
        question: "Does the patient have any pain or discomfort?"
      },

      weakness_screening: {
        id: 'weakness_screening',
        type: 'yes_no',
        question: "Does the patient report any weakness or strength difficulties?"
      },

      sensation_screening: {
        id: 'sensation_screening',
        type: 'yes_no',
        question: "Does the patient have any numbness, tingling, or sensation changes?"
      },

      mobility_screening: {
        id: 'mobility_screening',
        type: 'yes_no',
        question: "Does the patient have any movement or mobility limitations?"
      },
      
      pain_present: {
        id: 'pain_present',
        type: 'yes_no',
        question: "Are you currently experiencing pain?"
      },
      
      pain_location: {
        id: 'pain_location',
        type: 'body_map',
        question: "Where exactly do you feel the pain? You can select multiple areas.",
        multiple: true
      },
      
      pain_nature: {
        id: 'pain_nature',
        type: 'multi_choice',
        question: "How would you describe your pain? Select all that apply.",
        options: [
          { value: 'sharp', label: 'Sharp/Stabbing' },
          { value: 'dull', label: 'Dull/Aching' },
          { value: 'burning', label: 'Burning' },
          { value: 'throbbing', label: 'Throbbing' },
          { value: 'cramping', label: 'Cramping' },
          { value: 'other', label: 'Other', requiresText: true }
        ]
      },
      
      vas_score: {
        id: 'vas_score',
        type: 'slider',
        question: "On a scale of 0-10, how would you rate your pain right now?",
        min: 0,
        max: 10,
        labels: {
          0: 'No Pain',
          5: 'Moderate',
          10: 'Worst Possible'
        }
      },
      
      pain_timing: {
        id: 'pain_timing',
        type: 'single_choice',
        question: "When do you experience this pain?",
        options: [
          { value: 'constant', label: 'Constant' },
          { value: 'intermittent', label: 'Intermittent' },
          { value: 'morning', label: 'Morning' },
          { value: 'evening', label: 'Evening/Night' },
          { value: 'activity', label: 'During activity' },
          { value: 'rest', label: 'At rest' }
        ]
      },
      
      pain_movement: {
        id: 'pain_movement',
        type: 'single_choice',
        question: "How does movement affect your pain?",
        options: [
          { value: 'increases', label: 'Pain increases with movement' },
          { value: 'decreases', label: 'Pain decreases with movement' },
          { value: 'no_change', label: 'No change with movement' },
          { value: 'varies', label: 'Depends on the movement' }
        ],
        conditional: {
          'increases': ['aggravating_factors'],
          'decreases': ['relieving_factors'],
          'varies': ['specific_movements']
        }
      },
      
      aggravating_factors: {
        id: 'aggravating_factors',
        type: 'checklist',
        question: "What makes your pain worse? Check all that apply.",
        options: [
          { value: 'bending_forward', label: 'Bending forward' },
          { value: 'bending_backward', label: 'Bending backward' },
          { value: 'twisting', label: 'Twisting' },
          { value: 'lifting', label: 'Lifting' },
          { value: 'walking', label: 'Walking' },
          { value: 'sitting', label: 'Sitting' },
          { value: 'standing', label: 'Standing' },
          { value: 'lying', label: 'Lying down' },
          { value: 'stairs', label: 'Stairs' },
          { value: 'overhead', label: 'Reaching overhead' }
        ]
      },
      
      relieving_factors: {
        id: 'relieving_factors',
        type: 'checklist',
        question: "What helps reduce your pain? Check all that apply.",
        options: [
          { value: 'rest', label: 'Rest' },
          { value: 'ice', label: 'Ice' },
          { value: 'heat', label: 'Heat' },
          { value: 'medication', label: 'Medication' },
          { value: 'position', label: 'Specific positions' },
          { value: 'movement', label: 'Gentle movement' },
          { value: 'nothing', label: 'Nothing helps' }
        ]
      },
      
      weakness_location: {
        id: 'weakness_location',
        type: 'multi_choice',
        question: "Where do you feel weak or have difficulty with strength?",
        options: [
          { value: 'upper_limb', label: 'Upper limb (arms/hands)' },
          { value: 'lower_limb', label: 'Lower limb (legs/feet)' },
          { value: 'core', label: 'Core/Trunk' },
          { value: 'general', label: 'General/whole body' }
        ]
      },
      
      sensation_type: {
        id: 'sensation_type',
        type: 'multi_choice',
        question: "What kind of sensation changes are you experiencing?",
        options: [
          { value: 'numbness', label: 'Numbness' },
          { value: 'tingling', label: 'Tingling/Pins and needles' },
          { value: 'burning', label: 'Burning' },
          { value: 'hypersensitive', label: 'Hypersensitivity' },
          { value: 'complete_loss', label: 'Complete loss of feeling' }
        ]
      },
      
      functional_impact: {
        id: 'functional_impact',
        type: 'checklist',
        question: "What activities are difficult due to your condition? Check all that apply.",
        options: [
          { value: 'dressing', label: 'Getting dressed' },
          { value: 'walking', label: 'Walking 10 minutes' },
          { value: 'stairs', label: 'Climbing stairs' },
          { value: 'lifting', label: 'Carrying groceries' },
          { value: 'work', label: 'Work activities' },
          { value: 'recreation', label: 'Recreational activities' },
          { value: 'sleeping', label: 'Sleeping' }
        ]
      },

      // OBJECTIVE ASSESSMENT PARAMETERS (l-ac)
      
      tenderness_assessment: {
        id: 'tenderness_assessment',
        type: 'tenderness_map',
        question: "Palpate the affected area and rate tenderness at each point (0=no pain, 3=severe).",
        options: [
          { value: '0', label: 'No tenderness' },
          { value: '1', label: 'Mild tenderness' },
          { value: '2', label: 'Moderate tenderness' },
          { value: '3', label: 'Severe tenderness' }
        ]
      },

      swelling_assessment: {
        id: 'swelling_assessment',
        type: 'single_choice',
        question: "Is there visible swelling in the affected area?",
        options: [
          { value: 'absent', label: 'No swelling' },
          { value: 'mild', label: 'Mild swelling' },
          { value: 'moderate', label: 'Moderate swelling' },
          { value: 'severe', label: 'Severe swelling' }
        ]
      },

      girth_measurement: {
        id: 'girth_measurement',
        type: 'measurement',
        question: "Measure girth at affected areas (in cm).",
        placeholder: "Enter measurements in cm"
      },

      sensations_assessment: {
        id: 'sensations_assessment',
        type: 'multi_choice',
        question: "Test sensation changes in the affected area:",
        options: [
          { value: 'normal', label: 'Normal sensation' },
          { value: 'reduced', label: 'Reduced sensation' },
          { value: 'absent', label: 'Absent sensation' },
          { value: 'hypersensitive', label: 'Hypersensitive' },
          { value: 'allodynia', label: 'Allodynia (pain to light touch)' }
        ]
      },

      dermatome_assessment: {
        id: 'dermatome_assessment',
        type: 'multi_choice',
        question: "Test dermatomes - which areas show sensation changes?",
        options: [
          { value: 'C5', label: 'C5 (outer shoulder)' },
          { value: 'C6', label: 'C6 (thumb side)' },
          { value: 'C7', label: 'C7 (middle finger)' },
          { value: 'C8', label: 'C8 (little finger)' },
          { value: 'L4', label: 'L4 (medial leg)' },
          { value: 'L5', label: 'L5 (dorsal foot)' },
          { value: 'S1', label: 'S1 (lateral foot)' }
        ]
      },

      myotome_assessment: {
        id: 'myotome_assessment',
        type: 'mmt_testing',
        question: "Test myotomes - rate muscle strength (0-5 scale):",
        options: [
          { value: 'C5', label: 'C5 (shoulder abduction)' },
          { value: 'C6', label: 'C6 (elbow flexion)' },
          { value: 'C7', label: 'C7 (elbow extension)' },
          { value: 'C8', label: 'C8 (finger flexion)' },
          { value: 'L4', label: 'L4 (ankle dorsiflexion)' },
          { value: 'L5', label: 'L5 (big toe extension)' },
          { value: 'S1', label: 'S1 (plantar flexion)' }
        ]
      },

      reflex_testing: {
        id: 'reflex_testing',
        type: 'scale_grid',
        question: "Test deep tendon reflexes (0=absent, 1=reduced, 2=normal, 3=brisk, 4=clonus):",
        options: [
          { value: 'biceps', label: 'Biceps (C5-C6)' },
          { value: 'triceps', label: 'Triceps (C7)' },
          { value: 'patellar', label: 'Patellar (L3-L4)' },
          { value: 'achilles', label: 'Achilles (S1)' }
        ]
      },

      neurodynamic_tests: {
        id: 'neurodynamic_tests',
        type: 'checklist',
        question: "Perform neurodynamic tests - which are positive?",
        options: [
          { value: 'slr', label: 'Straight Leg Raise (SLR)' },
          { value: 'ulnt1', label: 'Upper Limb Neural Test 1' },
          { value: 'slump', label: 'Slump Test' },
          { value: 'femoral_stretch', label: 'Femoral Stretch Test' }
        ]
      },

      active_rom: {
        id: 'active_rom',
        type: 'rom_measurement',
        question: "Measure active range of motion (degrees):",
        placeholder: "Enter ROM measurements"
      },

      passive_rom: {
        id: 'passive_rom',
        type: 'rom_measurement',
        question: "Measure passive range of motion (degrees):",
        placeholder: "Enter ROM measurements"
      },

      mmt_assessment: {
        id: 'mmt_assessment',
        type: 'mmt_testing',
        question: "Manual Muscle Testing - rate strength (0-5 Oxford scale):",
        options: [
          { value: '0', label: '0 - No contraction' },
          { value: '1', label: '1 - Flicker of contraction' },
          { value: '2', label: '2 - Movement with gravity eliminated' },
          { value: '3', label: '3 - Movement against gravity' },
          { value: '4', label: '4 - Movement against resistance' },
          { value: '5', label: '5 - Normal strength' }
        ]
      },

      tightness_assessment: {
        id: 'tightness_assessment',
        type: 'multi_choice',
        question: "Assess muscle tightness:",
        options: [
          { value: 'hip_flexors', label: 'Hip flexors (Thomas test)' },
          { value: 'hamstrings', label: 'Hamstrings (SLR for flexibility)' },
          { value: 'ITB', label: 'IT Band (Ober test)' },
          { value: 'gastrocnemius', label: 'Gastrocnemius' },
          { value: 'pectorals', label: 'Pectorals' },
          { value: 'upper_trap', label: 'Upper trapezius' }
        ]
      },

      special_tests: {
        id: 'special_tests',
        type: 'checklist',
        question: "Perform relevant special tests - which are positive?",
        options: [
          { value: 'neer', label: 'Neer Test (shoulder impingement)' },
          { value: 'hawkins', label: 'Hawkins-Kennedy Test' },
          { value: 'lachman', label: 'Lachman Test (ACL)' },
          { value: 'mcmurray', label: 'McMurray Test (meniscus)' },
          { value: 'faber', label: 'FABER Test (hip/SI joint)' },
          { value: 'spurling', label: 'Spurling Test (cervical)' }
        ]
      },

      gait_analysis: {
        id: 'gait_analysis',
        type: 'observational',
        question: "Observe gait pattern:",
        options: [
          { value: 'normal', label: 'Normal gait pattern' },
          { value: 'antalgic', label: 'Antalgic (pain-avoiding)' },
          { value: 'trendelenburg', label: 'Trendelenburg gait' },
          { value: 'foot_drop', label: 'Foot drop pattern' },
          { value: 'circumduction', label: 'Circumduction' },
          { value: 'limp', label: 'General limp' }
        ]
      },

      posture_assessment: {
        id: 'posture_assessment',
        type: 'observational',
        question: "Assess posture:",
        options: [
          { value: 'forward_head', label: 'Forward head posture' },
          { value: 'rounded_shoulders', label: 'Rounded shoulders' },
          { value: 'increased_kyphosis', label: 'Increased thoracic kyphosis' },
          { value: 'increased_lordosis', label: 'Increased lumbar lordosis' },
          { value: 'scoliosis', label: 'Scoliosis' },
          { value: 'pelvic_tilt', label: 'Pelvic tilt' },
          { value: 'normal', label: 'Normal posture' }
        ]
      },

      combined_movements: {
        id: 'combined_movements',
        type: 'observational',
        question: "Test combined movement patterns (spinal conditions):",
        options: [
          { value: 'flexion_rotation', label: 'Flexion + Rotation' },
          { value: 'extension_rotation', label: 'Extension + Rotation' },
          { value: 'lateral_flexion_rotation', label: 'Lateral flexion + Rotation' },
          { value: 'quadrant_test', label: 'Quadrant test' }
        ]
      },

      adl_scoring: {
        id: 'adl_scoring',
        type: 'scale_grid',
        question: "Rate patient's ability in activities of daily living (0=unable, 10=independent):",
        options: [
          { value: 'dressing', label: 'Dressing' },
          { value: 'bathing', label: 'Bathing' },
          { value: 'walking', label: 'Walking' },
          { value: 'stairs', label: 'Climbing stairs' },
          { value: 'lifting', label: 'Lifting objects' },
          { value: 'work_tasks', label: 'Work-related tasks' },
          { value: 'recreation', label: 'Recreational activities' }
        ]
      },

      clarify_symptoms: {
        id: 'clarify_symptoms',
        type: 'text',
        question: "Could you provide more details about your symptoms or concerns?",
        placeholder: "Please describe your main issues in more detail..."
      },

      mobility_limitations: {
        id: 'mobility_limitations',
        type: 'checklist',
        question: "What mobility limitations are you experiencing?",
        options: [
          { value: 'walking', label: 'Walking difficulties' },
          { value: 'stairs', label: 'Climbing stairs' },
          { value: 'standing', label: 'Standing up' },
          { value: 'bending', label: 'Bending over' },
          { value: 'reaching', label: 'Reaching overhead' },
          { value: 'turning', label: 'Turning/twisting' }
        ]
      },

      balance_assessment: {
        id: 'balance_assessment',
        type: 'observational',
        question: "Assess balance and stability:",
        options: [
          { value: 'normal', label: 'Normal balance' },
          { value: 'unsteady', label: 'Unsteady on feet' },
          { value: 'support_needed', label: 'Requires support' },
          { value: 'falls_risk', label: 'High falls risk' },
          { value: 'romberg_positive', label: 'Romberg test positive' }
        ]
      },

      condition_classification: {
        id: 'condition_classification',
        type: 'single_choice',
        question: "Based on the assessment, how would you classify this condition?",
        options: [
          { value: 'ACUTE', label: 'Acute (< 6 weeks duration)' },
          { value: 'CHRONIC', label: 'Chronic (> 12 weeks duration)' },
          { value: 'RECURRING', label: 'Recurring/Episodic condition' }
        ],
        validation: (input: string) => ['ACUTE', 'CHRONIC', 'RECURRING'].includes(input)
      }
    };
  }

  async processResponse(questionId: string, response: any): Promise<string | null> {
    this.session.responses[questionId] = response;
    
    const nextSteps = this.determineNextSteps(questionId, response);
    // Filter out already answered or skipped questions before adding to queue
    const newSteps = nextSteps.filter(
      step => !this.session.responses[step] && !this.session.skippedSections.has(step)
    );
    this.session.questionQueue.push(...newSteps);
    
    this.updateCompletionPercentage();
    
    // Use simple queue processing to avoid any recursion
    // Process queue with a limit to prevent infinite loops
    let attempts = 0;
    const maxQueueAttempts = 10;
    while (this.session.questionQueue.length > 0 && attempts < maxQueueAttempts) {
      attempts++;
      const nextQuestionId = this.session.questionQueue.shift()!;
      
      if (!this.session.skippedSections.has(nextQuestionId) && 
          !this.session.responses[nextQuestionId]) {
        this.session.currentStep = nextQuestionId;
        return nextQuestionId;
      }
    }
    
    // Clear queue if we've exhausted it
    if (attempts >= maxQueueAttempts) {
      this.session.questionQueue = [];
    }
    
    // Check for remaining questions
    const remainingQuestions = this.generateRemainingQuestions();
    if (remainingQuestions.length > 0) {
      const nextQuestion = remainingQuestions[0];
      // Double-check it's not already answered
      if (!this.session.responses[nextQuestion] && !this.session.skippedSections.has(nextQuestion)) {
        this.session.currentStep = nextQuestion;
        return nextQuestion;
      }
    }
    
    // Check if complete
    if (this.isAssessmentComplete()) {
      return null;
    }
    
    // Try mandatory questions
    const mandatoryQuestion = this.getNextMandatoryQuestion();
    if (mandatoryQuestion && 
        !this.session.responses[mandatoryQuestion] && 
        !this.session.skippedSections.has(mandatoryQuestion)) {
      this.session.currentStep = mandatoryQuestion;
      return mandatoryQuestion;
    }
    
    return null;
  }

  private getNextQuestionSafe(): string | null {
    // Process queue with a safe loop
    let attempts = 0;
    const maxAttempts = 5;
    
    while (this.session.questionQueue.length > 0 && attempts < maxAttempts) {
      attempts++;
      const nextQuestionId = this.session.questionQueue.shift()!;
      
      // If this question is not skipped and not already answered
      if (!this.session.skippedSections.has(nextQuestionId) && 
          !this.session.responses[nextQuestionId]) {
        this.session.currentStep = nextQuestionId;
        return nextQuestionId;
      }
      // Continue loop to check next question in queue
    }
    
    // If no questions in queue, check if we need to generate more
    const remainingQuestions = this.generateRemainingQuestions();
    if (remainingQuestions.length > 0) {
      const nextQuestion = remainingQuestions[0];
      this.session.currentStep = nextQuestion;
      return nextQuestion;
    }
    
    // Check if assessment is complete
    if (this.isAssessmentComplete()) {
      return null;
    }
    
    // Try mandatory questions as fallback
    const mandatoryQuestion = this.getNextMandatoryQuestion();
    if (mandatoryQuestion) {
      this.session.currentStep = mandatoryQuestion;
      return mandatoryQuestion;
    }
    
    return null;
  }

  private generateRemainingQuestions(): string[] {
    const remaining: string[] = [];
    
    // Check if we need ADL scoring (this seems to be the problematic final question)
    if (!this.session.responses['adl_scoring']) {
      remaining.push('adl_scoring');
    }
    
    // Check other remaining assessments
    if (this.session.activatedPathways.has(PathwayType.PAIN) && 
        !this.session.responses['tenderness_assessment']) {
      remaining.push('tenderness_assessment');
    }
    
    if (this.session.activatedPathways.has(PathwayType.MOTOR) && 
        !this.session.responses['mmt_assessment']) {
      remaining.push('mmt_assessment');
    }
    
    if (this.needsGaitAssessment() && !this.session.responses['gait_analysis']) {
      remaining.push('gait_analysis');
    }
    
    if (this.needsPostureAssessment() && !this.session.responses['posture_assessment']) {
      remaining.push('posture_assessment');
    }
    
    return remaining.filter(questionId => 
      !this.session.skippedSections.has(questionId) && 
      !this.session.responses[questionId]
    );
  }

  private determineNextSteps(questionId: string, response: any): string[] {
    const steps: string[] = [];
    
    switch (questionId) {
      case 'chief_complaint':
        // After chief complaint, first get onset information (critical for condition classification)
        steps.push('symptom_onset', 'onset_nature', 'symptom_progression', 'previous_episodes');
        
        const chiefComplaintSteps = this.analyzeChiefComplaint(response);
        // Then proceed to relevant assessments
        steps.push(...chiefComplaintSteps);
        // Add objective assessments that should follow
        steps.push(...this.getInitialObjectiveAssessments());
        return steps;

      case 'pain_screening':
        if (response === 'yes') {
          this.session.activatedPathways.add(PathwayType.PAIN);
          steps.push('pain_location');
        }
        // Always continue to next screening
        steps.push('weakness_screening');
        break;

      case 'weakness_screening':
        if (response === 'yes') {
          this.session.activatedPathways.add(PathwayType.MOTOR);
          steps.push('weakness_location');
        }
        steps.push('sensation_screening');
        break;

      case 'sensation_screening':
        if (response === 'yes') {
          this.session.activatedPathways.add(PathwayType.SENSORY);
          this.session.activatedPathways.add(PathwayType.NEUROLOGICAL);
          steps.push('sensations_assessment');
        }
        steps.push('mobility_screening');
        break;

      case 'mobility_screening':
        if (response === 'yes') {
          this.session.activatedPathways.add(PathwayType.MOBILITY);
          steps.push('mobility_limitations');
        }
        // After all screening, start detailed assessments
        steps.push(...this.getDetailedAssessmentSequence());
        break;
        
      case 'pain_location':
        steps.push('pain_nature', 'vas_score');
        // After pain location, add tenderness assessment if pain pathway is activated
        if (this.session.activatedPathways.has(PathwayType.PAIN)) {
          steps.push('tenderness_assessment');
        }
        break;
        
      case 'vas_score':
        return this.determinePainDepth(parseInt(response));
        
      case 'pain_movement':
        const conditional = this.questionTemplates[questionId].conditional;
        if (conditional && conditional[response]) {
          steps.push(...conditional[response]);
        }
        break;
        
      case 'weakness_location':
        return this.determineMotorTests(response);
        
      case 'sensation_type':
        return this.determineNeuroTests(response);
        
      case 'tenderness_assessment':
        // Check for swelling if injury suspected
        if (this.hasTraumaIndicators()) {
          steps.push('swelling_assessment');
        }
        break;
        
      case 'swelling_assessment':
        if (response !== 'absent') {
          steps.push('girth_measurement');
        }
        break;
        
      default:
        // Only add assessment sequence if queue is empty and we're not in a critical section
        // Avoid adding to queue if we're already processing questions
        if (!this.session.questionQueue.length && 
            !this.hasMoreCriticalQuestions() &&
            !this.session.responses[questionId]) {
          const nextAssessments = this.getNextAssessmentSequence();
          // Filter out already answered questions to prevent loops
          const newAssessments = nextAssessments.filter(
            q => !this.session.responses[q] && !this.session.skippedSections.has(q)
          );
          steps.push(...newAssessments);
        }
        break;
    }
    
    return steps;
  }

  private analyzeChiefComplaint(complaint: string): string[] {
    const text = complaint.toLowerCase();
    const steps: string[] = [];
    
    console.log('Analyzing chief complaint:', text);
    
    // For comprehensive physiotherapy assessment, we ALWAYS start with systematic screening
    // regardless of chief complaint to ensure nothing is missed
    
    // Start with pain screening (most common)
    steps.push('pain_screening');
    
    // Optional keyword analysis for immediate pathway activation
    const painKeywords = ['pain', 'hurt', 'ache', 'sore', 'burning', 'sharp', 'throbbing'];
    const weaknessKeywords = ['weak', 'weakness', 'strength', 'cant lift', 'difficulty', 'paralysis', 'unable to lift', 'no strength'];
    const sensoryKeywords = ['numb', 'numbness', 'tingling', 'pins and needles', 'sensation', 'feeling'];
    const mobilityKeywords = ['stiff', 'stiffness', 'tight', 'tightness', 'cant move', 'restricted', 'frozen', 'unable to walk', 'cant walk', 'walking difficulty', 'not able to walk', 'difficulty walking'];
    const balanceKeywords = ['balance', 'fall', 'falling', 'unsteady', 'dizzy', 'vertigo', 'unstable'];
    const inflammationKeywords = ['swelling', 'swollen', 'inflammation', 'inflamed'];
    const functionalKeywords = ['walk', 'walking', 'moving', 'movement', 'stairs', 'standing', 'sitting', 'getting up'];
    
    // Pre-activate pathways based on keywords for efficiency, but we'll assess everything anyway
    if (painKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.PAIN);
    }
    
    if (weaknessKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.MOTOR);
    }
    
    if (sensoryKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.SENSORY);
    }
    
    if (mobilityKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.MOBILITY);
    }
    
    if (balanceKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.BALANCE);
    }
    
    if (inflammationKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.INFLAMMATION);
    }
    
    if (functionalKeywords.some(keyword => text.includes(keyword))) {
      this.session.activatedPathways.add(PathwayType.FUNCTIONAL);
    }

    // Always activate these core assessment pathways for comprehensive evaluation
    this.session.activatedPathways.add(PathwayType.OBJECTIVE);
    this.session.activatedPathways.add(PathwayType.FUNCTIONAL);
    
    console.log('Activated pathways:', Array.from(this.session.activatedPathways));
    console.log('Next steps:', steps);
    
    return steps;
  }

  private skipPainPathway(): void {
    const painSteps = [
      'pain_location', 'pain_nature', 'pain_timing', 'vas_score',
      'pain_movement', 'aggravating_factors', 'relieving_factors'
    ];
    
    painSteps.forEach(step => this.session.skippedSections.add(step));
    
    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      this.session.questionQueue.push('weakness_location');
    } else if (this.session.activatedPathways.has(PathwayType.SENSORY)) {
      this.session.questionQueue.push('sensation_type');
    } else {
      this.session.questionQueue.push('functional_impact');
    }
  }

  private determinePainDepth(vasScore: number): string[] {
    if (vasScore <= 3) {
      this.session.skippedSections.add('detailed_pain_analysis');
      return ['pain_movement', 'functional_impact'];
    } else if (vasScore <= 6) {
      return ['pain_nature', 'pain_timing', 'pain_movement'];
    } else {
      return ['pain_nature', 'pain_timing', 'pain_movement', 'aggravating_factors', 'relieving_factors'];
    }
  }

  private determineMotorTests(locations: string[]): string[] {
    const tests: string[] = [];
    
    if (locations.includes('upper_limb')) {
      tests.push('shoulder_strength', 'grip_strength');
      this.session.skippedSections.add('gait_analysis');
    }
    
    if (locations.includes('lower_limb')) {
      tests.push('leg_strength', 'gait_analysis');
    }
    
    if (locations.includes('core')) {
      tests.push('core_strength', 'posture_assessment');
    }
    
    return tests;
  }

  private determineNeuroTests(sensationTypes: string[]): string[] {
    const tests: string[] = [];
    
    if (sensationTypes.includes('numbness') || sensationTypes.includes('tingling')) {
      tests.push('dermatome_assessment');
    }
    
    if (sensationTypes.includes('complete_loss')) {
      tests.push('neurological_screening');
    }
    
    return tests;
  }

  private hasMoreCriticalQuestions(): boolean {
    const criticalSections = ['pain', 'motor', 'sensory'];
    return criticalSections.some(section => 
      this.session.activatedPathways.has(section as PathwayType) &&
      !this.session.skippedSections.has(section)
    );
  }

  private hasTraumaIndicators(): boolean {
    const complaint = this.session.responses['chief_complaint']?.toLowerCase() || '';
    return complaint.includes('injury') || 
           complaint.includes('trauma') || 
           complaint.includes('fell') ||
           complaint.includes('twisted') ||
           complaint.includes('sprained');
  }

  private isRomLimited(romResponse: any): boolean {
    // This would analyze ROM measurements to determine if limited
    // For now, assume limited if any measurement is provided
    return romResponse && Object.keys(romResponse).length > 0;
  }

  private getNextAssessmentSequence(): string[] {
    const steps: string[] = [];
    
    // Determine what assessments are still needed
    if (this.session.activatedPathways.has(PathwayType.PAIN) && 
        !this.session.responses['tenderness_assessment']) {
      steps.push('tenderness_assessment');
    }
    
    if (this.session.activatedPathways.has(PathwayType.MOTOR) && 
        !this.session.responses['mmt_assessment']) {
      steps.push('mmt_assessment');
    }
    
    if (this.session.activatedPathways.has(PathwayType.MOTOR) && 
        !this.session.responses['active_rom']) {
      steps.push('active_rom');
    }
    
    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL) && 
        !this.session.responses['reflex_testing']) {
      steps.push('reflex_testing');
    }
    
    // Add functional assessments
    if (this.needsGaitAssessment() && !this.session.responses['gait_analysis']) {
      steps.push('gait_analysis');
    }
    
    if (this.needsPostureAssessment() && !this.session.responses['posture_assessment']) {
      steps.push('posture_assessment');
    }
    
    if (this.needsSpecialTests() && !this.session.responses['special_tests']) {
      steps.push('special_tests');
    }
    
    // Final functional assessment
    if (steps.length === 0 && !this.session.responses['adl_scoring']) {
      steps.push('adl_scoring');
    }
    
    return steps;
  }

  private needsGaitAssessment(): boolean {
    if (this.session.activatedPathways.has(PathwayType.MOTOR) ||
        this.session.activatedPathways.has(PathwayType.BALANCE)) {
      return true;
    }
    
    const painLocation = this.session.responses['pain_location'];
    if (Array.isArray(painLocation)) {
      return painLocation.includes('back') ||
             painLocation.includes('leg') ||
             painLocation.includes('hip') ||
             painLocation.includes('knee') ||
             painLocation.includes('ankle');
    }
    if (typeof painLocation === 'string') {
      const location = painLocation.toLowerCase();
      return location.includes('back') ||
             location.includes('leg') ||
             location.includes('hip') ||
             location.includes('knee') ||
             location.includes('ankle');
    }
    return false;
  }

  private needsPostureAssessment(): boolean {
    const painLocation = this.session.responses['pain_location'];
    // Safely check if pain_location is an array and contains specific values
    if (Array.isArray(painLocation)) {
      return painLocation.includes('back') ||
             painLocation.includes('neck') ||
             painLocation.includes('shoulder');
    }
    // If it's a string, check if it contains the keywords
    if (typeof painLocation === 'string') {
      const location = painLocation.toLowerCase();
      return location.includes('back') ||
             location.includes('neck') ||
             location.includes('shoulder');
    }
    // Otherwise check if mobility pathway is activated
    return this.session.activatedPathways.has(PathwayType.MOBILITY);
  }

  private needsSpecialTests(): boolean {
    const painLocation = this.session.responses['pain_location'];
    // Check if pain_location exists and has content
    if (Array.isArray(painLocation)) {
      return painLocation.length > 0;
    }
    if (typeof painLocation === 'string') {
      return painLocation.trim().length > 0;
    }
    return false;
  }

  private getInitialObjectiveAssessments(): string[] {
    const assessments: string[] = [];
    
    // Always check for swelling as an initial objective finding
    assessments.push('swelling_assessment');
    
    return assessments;
  }

  private getDetailedAssessmentSequence(): string[] {
    const assessments: string[] = [];
    
    // Add assessments based on activated pathways
    if (this.session.activatedPathways.has(PathwayType.PAIN)) {
      assessments.push('tenderness_assessment');
    }
    
    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      assessments.push('mmt_assessment', 'active_rom');
    }
    
    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
      assessments.push('dermatome_assessment', 'myotome_assessment', 'reflex_testing');
    }
    
    // Always include these comprehensive assessments
    assessments.push('posture_assessment', 'gait_analysis', 'special_tests', 'adl_scoring');
    
    return assessments;
  }

  private isAssessmentComplete(): boolean {
    // Define mandatory assessments for physiotherapists
    const mandatoryAssessments = [
      'chief_complaint',
      'functional_impact'
    ];

    // Check pathway-specific mandatory assessments
    if (this.session.activatedPathways.has(PathwayType.PAIN)) {
      mandatoryAssessments.push('pain_location', 'vas_score', 'tenderness_assessment');
    }

    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      mandatoryAssessments.push('weakness_location', 'mmt_assessment', 'active_rom');
    }

    if (this.session.activatedPathways.has(PathwayType.SENSORY)) {
      mandatoryAssessments.push('sensations_assessment', 'dermatome_assessment');
    }

    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
      mandatoryAssessments.push('myotome_assessment', 'reflex_testing');
    }

    // Always include these objective assessments
    mandatoryAssessments.push('posture_assessment', 'adl_scoring');
    
    // Add condition classification as final mandatory question
    mandatoryAssessments.push('condition_classification');

    // Check if all mandatory assessments are completed
    return mandatoryAssessments.every(assessment => 
      this.session.responses[assessment] || this.session.skippedSections.has(assessment)
    );
  }

  private getNextMandatoryQuestion(): string | null {
    // Define the complete assessment sequence for physiotherapists
    const fullAssessmentSequence = [
      'chief_complaint',
      // Systematic screening (always)
      'pain_screening',
      'weakness_screening', 
      'sensation_screening',
      'mobility_screening',
      // Objective assessments (always)
      'swelling_assessment',
      // Pain pathway (if activated)
      ...(this.session.activatedPathways.has(PathwayType.PAIN) ? [
        'pain_location', 'pain_nature', 'vas_score', 'pain_timing', 
        'pain_movement', 'tenderness_assessment'
      ] : []),
      // Motor pathway (if activated)
      ...(this.session.activatedPathways.has(PathwayType.MOTOR) ? [
        'weakness_location', 'mmt_assessment', 'active_rom'
      ] : []),
      // Sensory pathway (if activated)
      ...(this.session.activatedPathways.has(PathwayType.SENSORY) ? [
        'sensations_assessment', 'dermatome_assessment'
      ] : []),
      // Neurological assessments (if activated)
      ...(this.session.activatedPathways.has(PathwayType.NEUROLOGICAL) ? [
        'myotome_assessment', 'reflex_testing', 'neurodynamic_tests'
      ] : []),
      // Always include comprehensive assessments
      'posture_assessment',
      'gait_analysis',
      'special_tests',
      'functional_impact',
      'adl_scoring'
    ];

    // Find the next unanswered question
    for (const questionId of fullAssessmentSequence) {
      if (!this.session.responses[questionId] && 
          !this.session.skippedSections.has(questionId) &&
          this.questionTemplates[questionId]) {
        return questionId;
      }
    }

    return null;
  }

  private updateCompletionPercentage(): void {
    // Calculate based on relevant assessment sequence, not all possible questions
    const relevantQuestions = this.getRelevantAssessmentSequence();
    const answeredQuestions = relevantQuestions.filter(q => this.session.responses[q]).length;
    const totalRelevant = relevantQuestions.length;
    
    this.session.completionPercentage = totalRelevant > 0 ? 
      Math.round((answeredQuestions / totalRelevant) * 100) : 0;
  }

  private getRelevantAssessmentSequence(): string[] {
    const sequence = ['chief_complaint'];
    
    // Add pathway-specific questions
    if (this.session.activatedPathways.has(PathwayType.PAIN)) {
      sequence.push('pain_location', 'pain_nature', 'vas_score', 'pain_timing', 
                   'pain_movement', 'tenderness_assessment');
    }
    
    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      sequence.push('weakness_location', 'mmt_assessment', 'active_rom');
    }
    
    if (this.session.activatedPathways.has(PathwayType.SENSORY)) {
      sequence.push('sensations_assessment', 'dermatome_assessment');
    }
    
    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
      sequence.push('myotome_assessment', 'reflex_testing');
    }
    
    // Always include these
    sequence.push('swelling_assessment', 'posture_assessment', 'functional_impact', 'adl_scoring');
    
    // Add conditional assessments
    if (this.needsGaitAssessment()) {
      sequence.push('gait_analysis');
    }
    
    if (this.needsSpecialTests()) {
      sequence.push('special_tests');
    }
    
    // Add condition classification as the final question
    sequence.push('condition_classification');
    
    return sequence;
  }

  getNextQuestion(): string | null {
    // Direct implementation to avoid any recursion
    let attempts = 0;
    const maxAttempts = 10; // Increased to handle larger queues
    
    while (this.session.questionQueue.length > 0 && attempts < maxAttempts) {
      attempts++;
      const nextQuestionId = this.session.questionQueue.shift()!;
      
      if (!this.session.skippedSections.has(nextQuestionId) && 
          !this.session.responses[nextQuestionId]) {
        this.session.currentStep = nextQuestionId;
        return nextQuestionId;
      }
    }
    
    // Clear queue if we've exhausted attempts to prevent stale queue
    if (attempts >= maxAttempts && this.session.questionQueue.length > 0) {
      this.session.questionQueue = [];
    }
    
    // Check for remaining questions
    const remainingQuestions = this.generateRemainingQuestions();
    if (remainingQuestions.length > 0) {
      const nextQuestion = remainingQuestions[0];
      // Double-check it's not already answered
      if (!this.session.responses[nextQuestion] && !this.session.skippedSections.has(nextQuestion)) {
        this.session.currentStep = nextQuestion;
        return nextQuestion;
      }
    }
    
    // Check if complete
    if (this.isAssessmentComplete()) {
      return null;
    }
    
    // Try mandatory questions
    const mandatoryQuestion = this.getNextMandatoryQuestion();
    if (mandatoryQuestion && 
        !this.session.responses[mandatoryQuestion] && 
        !this.session.skippedSections.has(mandatoryQuestion)) {
      this.session.currentStep = mandatoryQuestion;
      return mandatoryQuestion;
    }
    
    return null;
  }

  getCurrentQuestion(): QuestionTemplate | null {
    if (this.session.currentStep && this.questionTemplates[this.session.currentStep]) {
      return this.questionTemplates[this.session.currentStep];
    }
    return null;
  }

  getSession(): AssessmentSession {
    return { ...this.session };
  }

  generateSummary(): any {
    const summary = {
      sessionId: this.session.id,
      patientId: this.session.patientId,
      assessmentDate: new Date().toISOString(),
      completionPercentage: this.session.completionPercentage,
      
      // Clinical Data Structure
      clinicalFindings: this.generateClinicalFindings(),
      activatedPathways: Array.from(this.session.activatedPathways),
      skippedSections: Array.from(this.session.skippedSections),
      
      // Technical Assessment Data
      subjective: this.generateSubjectiveFindings(),
      objective: this.generateObjectiveFindings(),
      functional: this.generateFunctionalFindings(),
      
      // Clinical Reasoning
      provisionalDiagnosis: this.generateProvisionalDiagnosis(),
      redFlags: this.checkRedFlags(),
      recommendations: this.generateRecommendations(),
      
      // Raw Data
      responses: this.session.responses
    };
    
    return summary;
  }

  private generateClinicalFindings(): any {
    const findings = {
      chiefComplaint: this.session.responses['chief_complaint'] || 'Not specified',
      painPresent: this.session.responses['pain_screening'] === 'yes',
      weaknessPresent: this.session.responses['weakness_screening'] === 'yes',
      sensoryChanges: this.session.responses['sensation_screening'] === 'yes',
      mobilityLimitations: this.session.responses['mobility_screening'] === 'yes',
      pathwaysAssessed: Array.from(this.session.activatedPathways),
      assessmentCompleteness: this.session.completionPercentage
    };
    
    return findings;
  }

  private generateSubjectiveFindings(): any {
    const subjective = {
      chiefComplaint: this.session.responses['chief_complaint'],
    };

    // Pain Assessment
    if (this.session.activatedPathways.has(PathwayType.PAIN)) {
      subjective.pain = {
        present: this.session.responses['pain_screening'] === 'yes',
        location: this.session.responses['pain_location'],
        nature: this.session.responses['pain_nature'],
        vasScore: this.session.responses['vas_score'],
        timing: this.session.responses['pain_timing'],
        movementRelation: this.session.responses['pain_movement'],
        aggravatingFactors: this.session.responses['aggravating_factors'],
        relievingFactors: this.session.responses['relieving_factors']
      };
    }

    // Motor Assessment
    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      subjective.motor = {
        weaknessPresent: this.session.responses['weakness_screening'] === 'yes',
        weaknessLocation: this.session.responses['weakness_location'],
        functionalImpact: this.session.responses['functional_impact']
      };
    }

    // Sensory Assessment
    if (this.session.activatedPathways.has(PathwayType.SENSORY)) {
      subjective.sensory = {
        changesPresent: this.session.responses['sensation_screening'] === 'yes',
        sensationType: this.session.responses['sensation_type'],
        sensationsAssessment: this.session.responses['sensations_assessment']
      };
    }

    return subjective;
  }

  private generateObjectiveFindings(): any {
    const objective = {
      observation: {
        swelling: this.session.responses['swelling_assessment'],
        posture: this.session.responses['posture_assessment'],
        gait: this.session.responses['gait_analysis']
      },
      palpation: {
        tenderness: this.session.responses['tenderness_assessment']
      },
      measurements: {
        girth: this.session.responses['girth_measurement'],
        activeROM: this.session.responses['active_rom'],
        passiveROM: this.session.responses['passive_rom']
      },
      neurological: {
        sensation: this.session.responses['sensations_assessment'],
        dermatomes: this.session.responses['dermatome_assessment'],
        myotomes: this.session.responses['myotome_assessment'],
        reflexes: this.session.responses['reflex_testing'],
        neurodynamicTests: this.session.responses['neurodynamic_tests']
      },
      strength: {
        manualMuscleTesting: this.session.responses['mmt_assessment']
      },
      specialTests: this.session.responses['special_tests'],
      flexibility: this.session.responses['tightness_assessment']
    };

    return objective;
  }

  private generateFunctionalFindings(): any {
    return {
      adlScoring: this.session.responses['adl_scoring'],
      functionalImpact: this.session.responses['functional_impact'],
      mobilityLimitations: this.session.responses['mobility_limitations'],
      gaitAnalysis: this.session.responses['gait_analysis'],
      balanceAssessment: this.session.responses['balance_assessment']
    };
  }

  private generateProvisionalDiagnosis(): string[] {
    const diagnosis: string[] = [];
    const responses = this.session.responses;
    
    // Comprehensive pain-based diagnoses
    if (this.session.activatedPathways.has(PathwayType.PAIN)) {
      const painLocation = responses['pain_location'];
      const vasScore = responses['vas_score'];
      const painNature = responses['pain_nature'];
      const aggravatingFactors = responses['aggravating_factors'];
      const specialTests = responses['special_tests'];
      
      // Shoulder conditions
      if (this.isPainInLocation(painLocation, ['shoulder'])) {
        if (aggravatingFactors?.includes('overhead') && specialTests?.includes('neer')) {
          diagnosis.push('🎯 Shoulder Impingement Syndrome (high probability)');
        } else if (painNature?.includes('sharp') && vasScore > 6) {
          diagnosis.push('🎯 Rotator Cuff Pathology (moderate probability)');
        } else {
          diagnosis.push('🎯 Shoulder dysfunction requiring further assessment');
        }
      }
      
      // Spinal conditions
      if (this.isPainInLocation(painLocation, ['back', 'spine', 'lumbar'])) {
        if (aggravatingFactors?.includes('bending_forward') && responses['neurodynamic_tests']?.includes('slr')) {
          diagnosis.push('🎯 Lumbar Disc Herniation with radiculopathy (high probability)');
        } else if (responses['posture_assessment']?.includes('increased_lordosis')) {
          diagnosis.push('🎯 Mechanical Lower Back Pain with postural dysfunction');
        } else if (responses['pain_timing'] === 'morning') {
          diagnosis.push('🎯 Inflammatory Spinal Condition (consider further evaluation)');
        } else {
          diagnosis.push('🎯 Non-specific Lower Back Pain');
        }
      }
      
      // Knee conditions
      if (this.isPainInLocation(painLocation, ['knee'])) {
        if (specialTests?.includes('mcmurray')) {
          diagnosis.push('🎯 Meniscal Pathology (positive test)');
        } else if (specialTests?.includes('lachman')) {
          diagnosis.push('🎯 ACL Insufficiency (positive test)');
        } else if (responses['swelling_assessment'] !== 'absent') {
          diagnosis.push('🎯 Knee Joint Inflammation/Effusion');
        } else {
          diagnosis.push('🎯 Patellofemoral Pain Syndrome (probable)');
        }
      }
      
      // Neck conditions
      if (this.isPainInLocation(painLocation, ['neck', 'cervical'])) {
        if (responses['posture_assessment']?.includes('forward_head')) {
          diagnosis.push('🎯 Cervical Postural Dysfunction');
        } else if (specialTests?.includes('spurling')) {
          diagnosis.push('🎯 Cervical Radiculopathy (positive test)');
        } else {
          diagnosis.push('🎯 Mechanical Neck Pain');
        }
      }
    }
    
    // Neurological conditions
    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
      const dermatomes = responses['dermatome_assessment'];
      const myotomes = responses['myotome_assessment'];
      const reflexes = responses['reflex_testing'];
      
      if (dermatomes?.length > 0 || myotomes) {
        diagnosis.push('🧠 Peripheral Nervous System Dysfunction');
        
        if (dermatomes?.includes('L5') || myotomes?.L5 < 4) {
          diagnosis.push('🧠 L5 Nerve Root Involvement (likely)');
        }
        if (dermatomes?.includes('S1') || myotomes?.S1 < 4) {
          diagnosis.push('🧠 S1 Nerve Root Involvement (likely)');
        }
      }
      
      if (reflexes && Object.values(reflexes).some(reflex => reflex === 'absent' || reflex === 'reduced')) {
        diagnosis.push('🧠 Neurological Deficit - requires medical evaluation');
      }
    }
    
    // Motor function conditions
    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      const weaknessLocation = responses['weakness_location'];
      const mmtResults = responses['mmt_assessment'];
      
      if (weaknessLocation?.includes('upper_limb')) {
        diagnosis.push('💪 Upper Limb Motor Dysfunction');
      }
      if (weaknessLocation?.includes('lower_limb')) {
        diagnosis.push('💪 Lower Limb Motor Dysfunction');
      }
      if (weaknessLocation?.includes('core')) {
        diagnosis.push('💪 Core Stability Dysfunction');
      }
      
      if (mmtResults && Object.values(mmtResults).some(grade => grade < 3)) {
        diagnosis.push('💪 Significant Muscle Weakness - detailed assessment required');
      }
    }
    
    // Functional limitations
    const adlScore = responses['adl_scoring'];
    if (adlScore) {
      const avgScore = Object.values(adlScore).reduce((a, b) => a + b, 0) / Object.values(adlScore).length;
      if (avgScore < 5) {
        diagnosis.push('⚠️ Severe Functional Limitation - comprehensive rehabilitation required');
      } else if (avgScore < 7) {
        diagnosis.push('🔄 Moderate Functional Limitation - targeted intervention needed');
      }
    }
    
    // Balance and mobility
    if (responses['gait_analysis'] && responses['gait_analysis'] !== 'normal') {
      diagnosis.push('🚶 Gait Dysfunction - mobility training indicated');
    }
    
    // Postural dysfunction
    if (responses['posture_assessment']?.length > 0 && !responses['posture_assessment']?.includes('normal')) {
      diagnosis.push('📐 Postural Dysfunction - ergonomic assessment recommended');
    }
    
    // If no specific diagnosis identified
    if (diagnosis.length === 0) {
      diagnosis.push('🔍 Condition requires further detailed assessment for differential diagnosis');
    }
    
    return diagnosis;
  }
  
  private isPainInLocation(painLocation: any, searchTerms: string[]): boolean {
    if (Array.isArray(painLocation)) {
      return searchTerms.some(term => 
        painLocation.some(loc => loc.toLowerCase().includes(term.toLowerCase()))
      );
    }
    if (typeof painLocation === 'string') {
      return searchTerms.some(term => 
        painLocation.toLowerCase().includes(term.toLowerCase())
      );
    }
    return false;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const responses = this.session.responses;
    
    // Pain management recommendations
    const vasScore = responses['vas_score'];
    if (vasScore > 7) {
      recommendations.push('🚨 Immediate pain management strategies required');
      recommendations.push('🔍 Consider imaging studies if pain persists >6 weeks');
      recommendations.push('💊 Discuss pharmacological options with primary care physician');
    } else if (vasScore > 4) {
      recommendations.push('📋 Implement structured pain management program');
      recommendations.push('🎯 Focus on activity modification and movement re-education');
    }
    
    // Neurological recommendations
    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
      const reflexes = responses['reflex_testing'];
      const dermatomes = responses['dermatome_assessment'];
      
      if (reflexes && Object.values(reflexes).some(reflex => reflex === 'absent')) {
        recommendations.push('🚨 URGENT: Neurological evaluation required - consider medical referral');
      } else if (dermatomes?.length > 0) {
        recommendations.push('🧠 Neural mobilization techniques indicated');
        recommendations.push('📊 Monitor neurological symptoms progression');
      }
    }
    
    // Motor function recommendations  
    if (this.session.activatedPathways.has(PathwayType.MOTOR)) {
      const mmtResults = responses['mmt_assessment'];
      const weaknessLocation = responses['weakness_location'];
      
      if (mmtResults && Object.values(mmtResults).some(grade => grade < 3)) {
        recommendations.push('💪 Progressive strengthening program essential');
        recommendations.push('🔄 Regular strength monitoring and progression');
      }
      
      if (weaknessLocation?.includes('core')) {
        recommendations.push('🏋️ Core stabilization exercises priority');
        recommendations.push('📐 Postural re-education program');
      }
    }
    
    // Functional rehabilitation
    const functionalImpact = responses['functional_impact'];
    const adlScore = responses['adl_scoring'];
    
    if (functionalImpact?.length > 3 || (adlScore && Object.values(adlScore).some(score => score < 6))) {
      recommendations.push('🎯 Comprehensive functional rehabilitation program');
      recommendations.push('🏠 Home exercise program with family education');
      recommendations.push('🔄 Weekly functional progress monitoring');
    }
    
    // Gait and mobility
    if (responses['gait_analysis'] && responses['gait_analysis'] !== 'normal') {
      if (responses['gait_analysis'].includes('antalgic')) {
        recommendations.push('🚶 Gait re-training with pain management focus');
      } else {
        recommendations.push('🚶 Balance and mobility training program');
      }
      recommendations.push('🦽 Consider assistive devices if appropriate');
    }
    
    // Postural recommendations
    if (responses['posture_assessment']?.length > 0 && !responses['posture_assessment']?.includes('normal')) {
      recommendations.push('📐 Ergonomic workplace/home environment assessment');
      recommendations.push('🪑 Postural awareness and correction training');
      
      if (responses['posture_assessment']?.includes('forward_head')) {
        recommendations.push('💻 Computer workstation optimization');
      }
    }
    
    // Special tests follow-up
    const specialTests = responses['special_tests'];
    if (specialTests?.length > 0) {
      recommendations.push('🔬 Further diagnostic testing based on positive special tests');
      recommendations.push('🎯 Condition-specific treatment protocol implementation');
    }
    
    // Range of motion recommendations
    const activeROM = responses['active_rom'];
    if (activeROM && Object.keys(activeROM).length > 0) {
      recommendations.push('🤸 Range of motion restoration program');
      recommendations.push('🔄 Progressive mobilization techniques');
    }
    
    // Swelling management
    if (responses['swelling_assessment'] !== 'absent' && responses['swelling_assessment']) {
      recommendations.push('🧊 Inflammation management protocol (ICE/compression)');
      recommendations.push('📏 Regular girth measurements for progress monitoring');
    }
    
    // General clinical recommendations
    recommendations.push('📅 Follow-up assessment in 2-3 sessions to monitor progress');
    recommendations.push('📖 Patient education regarding condition and self-management');
    
    // Red flag follow-up
    const redFlags = this.checkRedFlags();
    if (redFlags.length > 0) {
      recommendations.push('🚨 ADDRESS RED FLAGS IMMEDIATELY - Medical consultation required');
    }
    
    // If minimal findings
    if (recommendations.length === 0) {
      recommendations.push('✅ Continue current activity level with gradual progression');
      recommendations.push('🔄 Preventive exercise program to maintain function');
    }
    
    return recommendations;
  }

  checkRedFlags(): string[] {
    const redFlags: string[] = [];
    
    if (this.session.responses['pain_timing'] === 'constant' && 
        this.session.responses['vas_score'] > 8) {
      redFlags.push('Severe constant pain - requires immediate evaluation');
    }
    
    if (this.session.responses['sensation_type']?.includes('complete_loss')) {
      redFlags.push('Complete sensory loss - neurological evaluation required');
    }
    
    const complaint = this.session.responses['chief_complaint']?.toLowerCase() || '';
    if (complaint.includes('bowel') || complaint.includes('bladder')) {
      redFlags.push('Bowel/bladder dysfunction - urgent referral required');
    }
    
    return redFlags;
  }

  getIntegratedDecisionTree(bodyRegion: string): any {
    const trees = decisionTrees.decision_trees;
    
    if (bodyRegion === 'shoulder') {
      return trees.TREE_001;
    } else if (bodyRegion === 'lumbar_spine' || bodyRegion === 'back') {
      return trees.TREE_002;
    }
    
    return null;
  }

  generateDiagnosticData(): any {
    const responses = this.session.responses;
    const diagnosticData: any = {
      assessmentId: this.session.id,
      timestamp: new Date().toISOString(),
      clinicalFindings: {}
    };

    // Only include data that was actually assessed (not undefined/null)
    
    // PAIN ASSESSMENT
    if (responses['pain_screening'] === 'yes' || responses['vas_score'] !== undefined) {
      diagnosticData.clinicalFindings.pain = {};
      
      if (responses['vas_score'] !== undefined) {
        diagnosticData.clinicalFindings.pain.vas_score = responses['vas_score'];
      }
      
      if (responses['pain_location']) {
        diagnosticData.clinicalFindings.pain.location = responses['pain_location'];
      }
      
      if (responses['pain_nature']) {
        diagnosticData.clinicalFindings.pain.nature = responses['pain_nature'];
      }
      
      if (responses['pain_timing']) {
        diagnosticData.clinicalFindings.pain.timing = responses['pain_timing'];
      }
      
      if (responses['pain_movement']) {
        diagnosticData.clinicalFindings.pain.movement_relation = responses['pain_movement'];
      }
      
      if (responses['aggravating_factors']) {
        diagnosticData.clinicalFindings.pain.aggravating_factors = responses['aggravating_factors'];
      }
      
      if (responses['relieving_factors']) {
        diagnosticData.clinicalFindings.pain.relieving_factors = responses['relieving_factors'];
      }
    }

    // NEUROLOGICAL ASSESSMENT
    if (responses['sensation_screening'] === 'yes' || 
        responses['dermatome_assessment'] || 
        responses['myotome_assessment'] || 
        responses['reflex_testing']) {
      
      diagnosticData.clinicalFindings.neurological = {};
      
      if (responses['dermatome_assessment']) {
        diagnosticData.clinicalFindings.neurological.dermatomes_affected = responses['dermatome_assessment'];
      }
      
      if (responses['myotome_assessment']) {
        diagnosticData.clinicalFindings.neurological.myotome_testing = responses['myotome_assessment'];
      }
      
      if (responses['reflex_testing']) {
        diagnosticData.clinicalFindings.neurological.reflexes = responses['reflex_testing'];
      }
      
      if (responses['neurodynamic_tests']) {
        diagnosticData.clinicalFindings.neurological.neurodynamic_tests = responses['neurodynamic_tests'];
      }
      
      if (responses['sensations_assessment']) {
        diagnosticData.clinicalFindings.neurological.sensation_changes = responses['sensations_assessment'];
      }
    }

    // MOTOR FUNCTION ASSESSMENT
    if (responses['weakness_screening'] === 'yes' || responses['mmt_assessment']) {
      diagnosticData.clinicalFindings.motor = {};
      
      if (responses['weakness_location']) {
        diagnosticData.clinicalFindings.motor.weakness_location = responses['weakness_location'];
      }
      
      if (responses['mmt_assessment']) {
        diagnosticData.clinicalFindings.motor.muscle_testing = responses['mmt_assessment'];
      }
    }

    // RANGE OF MOTION
    if (responses['active_rom'] || responses['passive_rom']) {
      diagnosticData.clinicalFindings.range_of_motion = {};
      
      if (responses['active_rom']) {
        diagnosticData.clinicalFindings.range_of_motion.active = responses['active_rom'];
      }
      
      if (responses['passive_rom']) {
        diagnosticData.clinicalFindings.range_of_motion.passive = responses['passive_rom'];
      }
    }

    // FUNCTIONAL ASSESSMENT
    if (responses['functional_impact'] || responses['adl_scoring']) {
      diagnosticData.clinicalFindings.functional = {};
      
      if (responses['functional_impact']) {
        diagnosticData.clinicalFindings.functional.activities_affected = responses['functional_impact'];
      }
      
      if (responses['adl_scoring']) {
        diagnosticData.clinicalFindings.functional.adl_scores = responses['adl_scoring'];
        
        // Calculate average ADL score for diagnostic significance
        const scores = Object.values(responses['adl_scoring']);
        if (scores.length > 0) {
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          diagnosticData.clinicalFindings.functional.adl_average = parseFloat(avgScore.toFixed(1));
        }
      }
    }

    // OBJECTIVE FINDINGS
    if (responses['tenderness_assessment'] || 
        responses['swelling_assessment'] || 
        responses['special_tests'] ||
        responses['gait_analysis'] ||
        responses['posture_assessment']) {
      
      diagnosticData.clinicalFindings.objective = {};
      
      if (responses['tenderness_assessment']) {
        diagnosticData.clinicalFindings.objective.tenderness = responses['tenderness_assessment'];
      }
      
      if (responses['swelling_assessment'] && responses['swelling_assessment'] !== 'absent') {
        diagnosticData.clinicalFindings.objective.swelling = responses['swelling_assessment'];
      }
      
      if (responses['special_tests']) {
        diagnosticData.clinicalFindings.objective.positive_special_tests = responses['special_tests'];
      }
      
      if (responses['gait_analysis'] && responses['gait_analysis'] !== 'normal') {
        diagnosticData.clinicalFindings.objective.gait_deviations = responses['gait_analysis'];
      }
      
      if (responses['posture_assessment'] && !responses['posture_assessment'].includes('normal')) {
        diagnosticData.clinicalFindings.objective.postural_deviations = responses['posture_assessment'];
      }
      
      if (responses['girth_measurement']) {
        diagnosticData.clinicalFindings.objective.measurements = responses['girth_measurement'];
      }
    }

    // PATIENT DEMOGRAPHICS & CONTEXT
    diagnosticData.clinicalFindings.chief_complaint = responses['chief_complaint'];
    diagnosticData.clinicalFindings.activated_pathways = Array.from(this.session.activatedPathways);
    
    return diagnosticData;
  }

  async loadAvailableConditions(): Promise<any[]> {
    try {
      // Import conditions data from new agent-optimized file
      const conditionsData = await import('../../database/conditions_for_agent.json');
      const conditions = conditionsData.conditions;
      
      // Extract condition data for AI processing - conditions is now an array
      const conditionsList = conditions.map((condition: any) => ({
        id: condition.id,
        name: condition.name,
        body_region: condition.body_region,
        specialty: condition.specialty,
        prevalence_rank: condition.prevalence_rank || 999,
        chronicity: condition.chronicity
      }));
      
      console.log(`📋 Loaded ${conditionsList.length} total conditions for diagnostic filtering`);
      return conditionsList;
      
    } catch (error) {
      console.error('❌ Failed to load conditions data:', error);
      return [];
    }
  }

  filterRelevantConditions(allConditions: any[], clinicalFindings: any): any[] {
    const responses = this.session.responses;
    let relevantConditions = [...allConditions];
    
    console.log('🔍 Filtering conditions based on clinical findings...');
    
    // 1. BODY REGION FILTERING
    if (responses['pain_location'] || responses['weakness_location']) {
      const bodyRegions = new Set<string>();
      
      // Extract body regions from pain location
      if (responses['pain_location']) {
        const painLocations = Array.isArray(responses['pain_location']) 
          ? responses['pain_location'] 
          : [responses['pain_location']];
          
        painLocations.forEach((location: string) => {
          const loc = location.toLowerCase();
          if (loc.includes('back') || loc.includes('spine') || loc.includes('lumbar')) {
            bodyRegions.add('lumbar_spine');
            bodyRegions.add('thoracic_spine');
          }
          if (loc.includes('neck') || loc.includes('cervical')) {
            bodyRegions.add('cervical_spine');
          }
          if (loc.includes('shoulder')) {
            bodyRegions.add('shoulder');
          }
          if (loc.includes('knee')) {
            bodyRegions.add('knee');
          }
          if (loc.includes('hip')) {
            bodyRegions.add('hip');
          }
          if (loc.includes('ankle') || loc.includes('foot')) {
            bodyRegions.add('ankle');
            bodyRegions.add('foot');
          }
          if (loc.includes('wrist') || loc.includes('hand')) {
            bodyRegions.add('wrist');
            bodyRegions.add('hand');
          }
          if (loc.includes('elbow')) {
            bodyRegions.add('elbow');
          }
        });
      }
      
      // Extract body regions from weakness location
      if (responses['weakness_location']) {
        const weaknessLocs = Array.isArray(responses['weakness_location']) 
          ? responses['weakness_location'] 
          : [responses['weakness_location']];
          
        weaknessLocs.forEach((loc: string) => {
          if (loc.includes('upper_limb')) {
            bodyRegions.add('shoulder');
            bodyRegions.add('elbow');
            bodyRegions.add('wrist');
            bodyRegions.add('hand');
          }
          if (loc.includes('lower_limb')) {
            bodyRegions.add('hip');
            bodyRegions.add('knee');
            bodyRegions.add('ankle');
            bodyRegions.add('foot');
          }
          if (loc.includes('core')) {
            bodyRegions.add('lumbar_spine');
            bodyRegions.add('thoracic_spine');
          }
        });
      }
      
      if (bodyRegions.size > 0) {
        relevantConditions = relevantConditions.filter(condition => 
          bodyRegions.has(condition.body_region) || 
          condition.body_region === 'systemic' || 
          condition.body_region === 'general'
        );
        console.log(`🎯 Body region filter: ${relevantConditions.length} conditions match regions [${Array.from(bodyRegions).join(', ')}]`);
      }
    }
    
    // 2. NEUROLOGICAL CONDITIONS FILTER
    if (this.session.activatedPathways.has(PathwayType.NEUROLOGICAL)) {
      // Include neurological conditions if neurological symptoms present
      const neuroConditions = allConditions.filter(condition => 
        condition.specialty === 'neurological' || 
        condition.name.toLowerCase().includes('nerve') ||
        condition.name.toLowerCase().includes('radiculopathy') ||
        condition.name.toLowerCase().includes('neuropathy')
      );
      
      relevantConditions = [...new Set([...relevantConditions, ...neuroConditions])];
      console.log(`🧠 Added neurological conditions: ${neuroConditions.length} conditions`);
    }
    
    // 3. PAIN SEVERITY FILTER
    const vasScore = responses['vas_score'];
    if (vasScore !== undefined) {
      if (vasScore <= 3) {
        // Mild pain - exclude severe/systemic conditions
        relevantConditions = relevantConditions.filter(condition => 
          !condition.name.toLowerCase().includes('fracture') &&
          !condition.name.toLowerCase().includes('rupture') &&
          condition.specialty !== 'emergency'
        );
        console.log(`😌 Mild pain filter: excluded severe conditions`);
      } else if (vasScore >= 8) {
        // Severe pain - prioritize acute/severe conditions
        const severeConditions = allConditions.filter(condition =>
          condition.name.toLowerCase().includes('acute') ||
          condition.name.toLowerCase().includes('severe') ||
          condition.name.toLowerCase().includes('disc') ||
          condition.chronicity === 'acute'
        );
        relevantConditions = [...new Set([...relevantConditions, ...severeConditions])];
        console.log(`🚨 Severe pain filter: added acute conditions`);
      }
    }
    
    // 4. SPECIAL TESTS FILTER
    if (responses['special_tests']) {
      const specialTests = Array.isArray(responses['special_tests']) 
        ? responses['special_tests'] 
        : [responses['special_tests']];
        
      specialTests.forEach((test: string) => {
        const testConditions = allConditions.filter(condition => {
          const conditionName = condition.name.toLowerCase();
          
          if (test.includes('slr') || test.includes('slump')) {
            return conditionName.includes('disc') || 
                   conditionName.includes('sciatica') || 
                   conditionName.includes('radiculopathy');
          }
          if (test.includes('neer') || test.includes('hawkins')) {
            return conditionName.includes('impingement') || 
                   conditionName.includes('shoulder');
          }
          if (test.includes('lachman') || test.includes('anterior_drawer')) {
            return conditionName.includes('acl') || 
                   conditionName.includes('ligament');
          }
          if (test.includes('mcmurray')) {
            return conditionName.includes('meniscus') || 
                   conditionName.includes('knee');
          }
          
          return false;
        });
        
        relevantConditions = [...new Set([...relevantConditions, ...testConditions])];
      });
      
      console.log(`🔬 Special tests filter: ${specialTests.join(', ')}`);
    }
    
    // 5. SORT BY RELEVANCE
    relevantConditions = relevantConditions.sort((a, b) => {
      // Sort by prevalence rank (lower number = more common)
      const aRank = a.prevalence_rank || 999;
      const bRank = b.prevalence_rank || 999;
      
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      
      // Secondary sort by name
      return a.name.localeCompare(b.name);
    });
    
    // 6. LIMIT TO TOP CONDITIONS FOR AI EFFICIENCY
    const maxConditions = 50; // Send only top 50 most relevant conditions to AI
    relevantConditions = relevantConditions.slice(0, maxConditions);
    
    console.log(`✅ Final filtered conditions: ${relevantConditions.length} (from ${allConditions.length} total)`);
    console.log(`🏆 Top 5 conditions: ${relevantConditions.slice(0, 5).map(c => c.name).join(', ')}`);
    
    return relevantConditions;
  }

  async prepareDiagnosticPayload(): Promise<any> {
    const diagnosticData = this.generateDiagnosticData();
    const allConditions = await this.loadAvailableConditions();
    
    // Filter and sort conditions based on clinical findings
    const relevantConditions = this.filterRelevantConditions(allConditions, diagnosticData.clinicalFindings);
    
    const payload = {
      assessment_data: diagnosticData,
      available_conditions: relevantConditions, // Now using filtered conditions
      filtering_summary: {
        total_conditions_available: allConditions.length,
        filtered_conditions_sent: relevantConditions.length,
        reduction_percentage: Math.round((1 - relevantConditions.length / allConditions.length) * 100)
      },
      request_type: "differential_diagnosis",
      max_conditions: 5,
      confidence_threshold: 0.3
    };
    
    // LOG THE COMPLETE PAYLOAD THAT WOULD BE SENT TO AI
    console.log('🤖 OPTIMIZED DIAGNOSTIC DATA FOR AI API:');
    console.log('=====================================');
    console.log(JSON.stringify(payload, null, 2));
    console.log('=====================================');
    console.log(`📊 Clinical domains assessed: ${Object.keys(diagnosticData.clinicalFindings).length}`);
    console.log(`📋 Total conditions available: ${allConditions.length}`);
    console.log(`🎯 Filtered conditions sent to AI: ${relevantConditions.length}`);
    console.log(`⚡ Efficiency gain: ${payload.filtering_summary.reduction_percentage}% reduction in AI payload size`);
    
    return payload;
  }

  async getAIDifferentialDiagnosis(): Promise<any> {
    try {
      // Import the AI service dynamically to avoid build issues
      const { aiDiagnosticService } = await import('./aiDiagnosticService');
      
      console.log('🧠 Initiating AI differential diagnosis...');
      
      // Prepare diagnostic payload
      const diagnosticPayload = await this.prepareDiagnosticPayload();
      
      // Call AI service for differential diagnosis
      const aiResponse = await aiDiagnosticService.getDifferentialDiagnosis(diagnosticPayload);
      
      console.log('🎯 AI Differential Diagnosis Complete:', aiResponse);
      
      return {
        success: true,
        aiDiagnosis: aiResponse,
        diagnosticPayload: diagnosticPayload
      };
      
    } catch (error) {
      console.error('❌ AI Differential Diagnosis Failed:', error);
      
      return {
        success: false,
        error: error.message,
        fallback: 'AI diagnosis temporarily unavailable. Please proceed with clinical assessment findings.'
      };
    }
  }

  resetSession(): void {
    this.session.responses = {};
    this.session.activatedPathways = new Set();
    this.session.skippedSections = new Set();
    this.session.questionQueue = [];
    this.session.currentStep = 'chief_complaint';
    this.session.completionPercentage = 0;
    this.session.provisionalDiagnosis = [];
  }
}