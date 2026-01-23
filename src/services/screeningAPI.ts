import ApiManager from './api';
import ApiMethods from '../lib/data-access/api-client';

// Remove trailing slash if present to avoid double slashes in URL construction
const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export interface VoiceTranscriptionResult {
  transcription: string;
  confidence?: number;
  duration?: number;
}

export interface ParsedScreeningData {
  chiefComplaint?: string;
  painLocation?: string;
  painLevel?: number;
  symptomDuration?: string;
  functionalImpact?: string;
  redFlags?: string[];
  additionalInfo?: string;
}

export interface ScreeningQuestionContext {
  questionId: string;
  questionType: 'text' | 'single_choice' | 'multi_choice' | 'number' | 'scale';
  options?: string[];
  currentValue?: any;
}

/**
 * Service for handling voice input in the screening chatbot
 */
class ScreeningAPIService {
  /**
   * Transcribe audio blob to text using Whisper API
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Convert blob to File object with proper extension
      const mimeType = audioBlob.type || 'audio/webm';
      const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'm4a' : 'wav';
      const file = new File([audioBlob], `recording.${extension}`, { type: mimeType });

      const response = await ApiManager.transcribeAudio(file);

      if (response.success && response.data?.transcription) {
        return response.data.transcription;
      }

      throw new Error(response.message || 'Failed to transcribe audio');
    } catch (error: any) {
      console.error('Transcription error:', error);
      throw new Error(error.message || 'Failed to transcribe audio. Please try again.');
    }
  }

  /**
   * Parse natural language input for a specific screening question
   * This uses pattern matching for now, but can be extended to use AI parsing
   */
  parseNaturalLanguageResponse(
    input: string,
    context: ScreeningQuestionContext
  ): { value: any; confidence: number } {
    const normalizedInput = input.toLowerCase().trim();

    switch (context.questionType) {
      case 'scale':
        return this.parseScaleResponse(normalizedInput);

      case 'single_choice':
        return this.parseSingleChoiceResponse(normalizedInput, context.options || []);

      case 'multi_choice':
        return this.parseMultiChoiceResponse(normalizedInput, context.options || []);

      case 'number':
        return this.parseNumberResponse(normalizedInput);

      case 'text':
      default:
        return { value: input.trim(), confidence: 1.0 };
    }
  }

  /**
   * Parse pain scale (0-10) from natural language
   */
  private parseScaleResponse(input: string): { value: number; confidence: number } {
    // Direct number matching
    const numberMatch = input.match(/\b(\d+)\b/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      if (num >= 0 && num <= 10) {
        return { value: num, confidence: 0.95 };
      }
    }

    // Word to number mapping
    const wordToNumber: Record<string, number> = {
      'zero': 0, 'no': 0, 'none': 0, 'no pain': 0,
      'one': 1, 'mild': 2, 'slight': 2,
      'two': 2, 'three': 3, 'four': 4,
      'moderate': 5, 'five': 5, 'medium': 5,
      'six': 6, 'seven': 7,
      'severe': 8, 'eight': 8, 'bad': 7,
      'nine': 9, 'very bad': 9, 'terrible': 9,
      'ten': 10, 'worst': 10, 'extreme': 10, 'unbearable': 10
    };

    for (const [word, num] of Object.entries(wordToNumber)) {
      if (input.includes(word)) {
        return { value: num, confidence: 0.85 };
      }
    }

    return { value: 5, confidence: 0.3 };
  }

  /**
   * Parse single choice response by matching against options
   */
  private parseSingleChoiceResponse(
    input: string,
    options: string[]
  ): { value: string | null; confidence: number } {
    // Exact match (case insensitive)
    for (const option of options) {
      if (input.includes(option.toLowerCase())) {
        return { value: option, confidence: 0.95 };
      }
    }

    // Fuzzy match - check if any option words are in the input
    for (const option of options) {
      const optionWords = option.toLowerCase().split(/\s+/);
      const matchingWords = optionWords.filter(word =>
        word.length > 2 && input.includes(word)
      );

      if (matchingWords.length >= Math.ceil(optionWords.length / 2)) {
        return { value: option, confidence: 0.75 };
      }
    }

    return { value: null, confidence: 0 };
  }

  /**
   * Parse multi choice response - can match multiple options
   */
  private parseMultiChoiceResponse(
    input: string,
    options: string[]
  ): { value: string[]; confidence: number } {
    const matched: string[] = [];

    for (const option of options) {
      const optionLower = option.toLowerCase();
      // Check for option or any significant words from option
      const optionWords = optionLower.split(/\s+/).filter(w => w.length > 2);

      if (input.includes(optionLower) ||
          optionWords.some(word => input.includes(word))) {
        matched.push(option);
      }
    }

    // Check for "none" or "nothing" to indicate no selections
    if (matched.length === 0 &&
        (input.includes('none') || input.includes('nothing') || input.includes('no'))) {
      return { value: [], confidence: 0.9 };
    }

    return {
      value: matched,
      confidence: matched.length > 0 ? 0.85 : 0.3
    };
  }

  /**
   * Parse number from natural language
   */
  private parseNumberResponse(input: string): { value: number | null; confidence: number } {
    const match = input.match(/\b(\d+(?:\.\d+)?)\b/);
    if (match) {
      return { value: parseFloat(match[1]), confidence: 0.95 };
    }
    return { value: null, confidence: 0 };
  }

  /**
   * Map body region spoken names to standardized IDs
   */
  mapSpokenBodyRegion(input: string): string | null {
    const normalizedInput = input.toLowerCase().trim();

    const regionMappings: Record<string, string[]> = {
      'Head & Neck': ['head', 'neck', 'head and neck'],
      'Cervical Spine': ['cervical', 'cervical spine', 'upper spine', 'neck spine'],
      'Shoulder': ['shoulder', 'shoulders'],
      'Arm': ['arm', 'upper arm', 'bicep', 'tricep'],
      'Elbow': ['elbow', 'elbows'],
      'Wrist & Hand': ['wrist', 'hand', 'hands', 'wrist and hand', 'fingers'],
      'Thoracic Spine': ['thoracic', 'thoracic spine', 'upper back', 'mid back', 'middle back'],
      'Chest': ['chest', 'ribcage', 'ribs'],
      'Lumbar Spine': ['lumbar', 'lumbar spine', 'lower back', 'low back'],
      'Hip': ['hip', 'hips', 'groin'],
      'Thigh': ['thigh', 'thighs', 'quad', 'quadriceps', 'hamstring'],
      'Knee': ['knee', 'knees'],
      'Lower Leg': ['lower leg', 'calf', 'calves', 'shin', 'shins'],
      'Ankle & Foot': ['ankle', 'foot', 'feet', 'ankles', 'ankle and foot', 'toes']
    };

    for (const [region, aliases] of Object.entries(regionMappings)) {
      for (const alias of aliases) {
        if (normalizedInput.includes(alias)) {
          return region;
        }
      }
    }

    return null;
  }

  /**
   * Extract duration from natural language
   */
  parseDuration(input: string): { duration: string; confidence: number } {
    const normalizedInput = input.toLowerCase();

    // Check for acute indicators
    const acutePatterns = [
      /few days/i, /couple days/i, /this week/i, /yesterday/i, /today/i,
      /just started/i, /recently/i, /few weeks/i, /couple weeks/i,
      /less than.*month/i, /under.*month/i
    ];

    for (const pattern of acutePatterns) {
      if (pattern.test(normalizedInput)) {
        return { duration: 'ACUTE', confidence: 0.9 };
      }
    }

    // Check for subacute indicators
    const subacutePatterns = [
      /month or two/i, /couple months/i, /few months/i,
      /6.*weeks/i, /8.*weeks/i, /10.*weeks/i,
      /two months/i, /three months/i
    ];

    for (const pattern of subacutePatterns) {
      if (pattern.test(normalizedInput)) {
        return { duration: 'SUBACUTE', confidence: 0.85 };
      }
    }

    // Check for chronic indicators
    const chronicPatterns = [
      /months/i, /years/i, /long time/i, /forever/i,
      /chronic/i, /ongoing/i, /always/i,
      /more than.*months/i, /over.*months/i
    ];

    for (const pattern of chronicPatterns) {
      if (pattern.test(normalizedInput)) {
        return { duration: 'CHRONIC', confidence: 0.85 };
      }
    }

    return { duration: 'ACUTE', confidence: 0.5 };
  }

  /**
   * Extract functional impact level from natural language
   */
  parseFunctionalImpact(input: string): { impact: string; confidence: number } {
    const normalizedInput = input.toLowerCase();

    // Check for no impact
    if (/no.*(problem|issue|limit|impact)/i.test(normalizedInput) ||
        /fine|normal|okay|everything.*normal/i.test(normalizedInput)) {
      return { impact: 'NONE', confidence: 0.9 };
    }

    // Check for mild impact
    if (/little.*difficult|slight|minor|small|bit.*hard/i.test(normalizedInput) ||
        /some.*trouble|somewhat/i.test(normalizedInput)) {
      return { impact: 'MILD', confidence: 0.85 };
    }

    // Check for moderate impact
    if (/moderate|fairly|quite|pretty.*bad|difficult/i.test(normalizedInput) ||
        /hard.*do|struggle|challenging/i.test(normalizedInput)) {
      return { impact: 'MODERATE', confidence: 0.85 };
    }

    // Check for severe impact
    if (/severe|extreme|can.*not|cannot|unable|impossible/i.test(normalizedInput) ||
        /very.*hard|really.*difficult|major|significant/i.test(normalizedInput)) {
      return { impact: 'SEVERE', confidence: 0.9 };
    }

    return { impact: 'MILD', confidence: 0.5 };
  }

  /**
   * Detect red flags from natural language description
   */
  detectRedFlags(input: string): string[] {
    const normalizedInput = input.toLowerCase();
    const detectedFlags: string[] = [];

    const flagPatterns: Record<string, RegExp[]> = {
      'night_pain': [/night/i, /wake.*up/i, /sleep.*pain/i, /pain.*sleep/i],
      'weight_loss': [/weight.*loss/i, /losing.*weight/i, /lost.*weight/i],
      'fever': [/fever/i, /temperature/i, /chills/i],
      'numbness': [/numb/i, /tingling/i, /pins.*needles/i, /no.*feeling/i],
      'weakness': [/weak/i, /strength/i, /can.*lift/i, /drop.*things/i],
      'bowel_bladder': [/bowel/i, /bladder/i, /incontinence/i, /bathroom/i],
      'trauma': [/fall/i, /accident/i, /injury/i, /hit/i, /trauma/i, /hurt.*self/i]
    };

    for (const [flag, patterns] of Object.entries(flagPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedInput)) {
          detectedFlags.push(flag);
          break;
        }
      }
    }

    return detectedFlags;
  }

  // ============ AI Next-Question API Methods ============

  /**
   * Get the next best question based on current screening context
   */
  async getNextBestQuestion(context: ScreeningContext): Promise<NextQuestionResult> {
    try {
      const response = await ApiMethods.post(
        `${API_URL}/screening-ai/next-question`,
        context
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get next question');
    } catch (error: any) {
      console.error('Next question API error:', error);
      // Return a fallback result
      return this.getFallbackNextQuestion(context);
    }
  }

  /**
   * Get a batch of related questions to ask together
   */
  async getBatchQuestions(context: ScreeningContext, maxQuestions: number = 3): Promise<BatchQuestionsResult> {
    try {
      const response = await ApiMethods.post(
        `${API_URL}/screening-ai/batch-questions`,
        { ...context, maxQuestions }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to get batch questions');
    } catch (error: any) {
      console.error('Batch questions API error:', error);
      // Return fallback
      const nextQuestion = this.getFallbackNextQuestion(context);
      return {
        questions: [nextQuestion],
        groupLabel: 'Assessment',
        totalEstimatedTime: 15
      };
    }
  }

  /**
   * Analyze if screening is complete enough to proceed
   */
  async analyzeCompleteness(context: ScreeningContext): Promise<CompletenessResult> {
    try {
      const response = await ApiMethods.post(
        `${API_URL}/screening-ai/analyze-completeness`,
        context
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to analyze completeness');
    } catch (error: any) {
      console.error('Completeness analysis error:', error);
      // Return a conservative fallback
      return {
        isComplete: context.answeredQuestionIds.length >= 10,
        completenessScore: Math.min(100, context.answeredQuestionIds.length * 10),
        missingCritical: [],
        recommendation: 'Continue with assessment'
      };
    }
  }

  /**
   * Fallback next question when API is unavailable
   */
  private getFallbackNextQuestion(context: ScreeningContext): NextQuestionResult {
    const { answeredQuestionIds } = context;

    // Priority order of questions
    const questionPriority = [
      'red_flags_general',
      'pain_severity',
      'pain_location',
      'onset_mechanism',
      'aggravating_factors',
      'relieving_factors',
      'functional_impact',
      'previous_treatment',
      'medications'
    ];

    for (const questionId of questionPriority) {
      if (!answeredQuestionIds.includes(questionId)) {
        return {
          questionId,
          priority: questionPriority.indexOf(questionId) < 3 ? 'high' : 'medium',
          reasoning: 'Standard screening question',
          estimatedRelevance: 80 - (questionPriority.indexOf(questionId) * 5)
        };
      }
    }

    return {
      questionId: 'screening_complete',
      priority: 'low',
      reasoning: 'All standard questions answered',
      estimatedRelevance: 0
    };
  }
}

// ============ Types for AI Next-Question ============

export interface ScreeningContext {
  selectedRegions: Array<{
    mainRegion: string;
    laterality?: 'left' | 'right' | 'both' | 'center';
    subRegions?: string[];
  }>;
  collectedResponses: Record<string, any>;
  answeredQuestionIds: string[];
  redFlagsDetected: string[];
  sessionDuration: number;
}

export interface NextQuestionResult {
  questionId: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  estimatedRelevance: number;
  suggestedFollowUps?: string[];
  skipRecommendation?: {
    canSkip: boolean;
    reason: string;
  };
}

export interface BatchQuestionsResult {
  questions: NextQuestionResult[];
  groupLabel: string;
  totalEstimatedTime: number;
}

export interface CompletenessResult {
  isComplete: boolean;
  completenessScore: number;
  missingCritical: string[];
  recommendation: string;
}

export const screeningAPI = new ScreeningAPIService();
export default screeningAPI;
