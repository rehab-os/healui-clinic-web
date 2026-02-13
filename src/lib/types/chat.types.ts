/**
 * Chat Type Definitions
 * TypeScript types for the patient intake chatbot
 */

export enum ChatStep {
  BASIC_INFO = 1,           // Name, Age/DOB, Gender, Phone
  REGISTRATION = 2,         // Create patient in DB
  MEDICAL_HISTORY = 3,      // Optional: Medical info
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ExtractedData {
  // Step 1: Welcome
  name?: string;

  // Step 2: Personal Details
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };

  // Step 3: Medical History
  existingConditions?: string[];
  currentMedications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
  allergies?: string[];
  previousSurgeries?: Array<{
    procedure: string;
    date?: string;
    bodyPart?: string;
  }>;

  // Step 4: Current Complaint
  chiefComplaint?: string;
  duration?: string;
  painLevel?: number;
  affectedBodyPart?: string;
  symptoms?: string[];
  previousTreatments?: string[];

  // Step 5: Scheduling
  preferredDate?: string;
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'any';
  appointmentType?: 'in-person' | 'telehealth' | 'home-visit';
  doctorPreference?: string;

  // Step 6: Confirmation
  confirmed?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ChatResponse {
  reply: string;
  extractedData?: ExtractedData;
  nextStep: ChatStep | null;
  validationErrors?: ValidationError[];
  stepComplete?: boolean;
  sessionId?: string;
}

export interface SendMessageRequest {
  message: string;
  conversationHistory: ChatMessage[];
  currentStep: ChatStep;
  clinicId: string;
  clinicName?: string;
  sessionId?: string;
}

export interface CompleteIntakeRequest {
  patientData: ExtractedData;
  clinicId: string;
  clinicCode?: string;
  sessionId?: string;
}

export interface CompleteIntakeResponse {
  patientId: string;
  success: boolean;
  appointmentId?: string;
  message?: string;
  qrCode?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  currentStep: ChatStep;
  extractedData: ExtractedData;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  isOpen: boolean;
  isComplete: boolean;
}

export const STEP_NAMES: Record<ChatStep, string> = {
  [ChatStep.BASIC_INFO]: 'Basic Information',
  [ChatStep.REGISTRATION]: 'Registration',
  [ChatStep.MEDICAL_HISTORY]: 'Medical History',
};

export const TOTAL_STEPS = 3;
