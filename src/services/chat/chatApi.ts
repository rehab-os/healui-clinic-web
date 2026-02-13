/**
 * Chat API Client
 * Handles API calls to the chat backend
 */

import {
  SendMessageRequest,
  ChatResponse,
  CompleteIntakeRequest,
  CompleteIntakeResponse,
  ExtractedData,
} from '@/lib/types/chat.types';
import ApiManager from '@/services/api/api.service';
import { PublicPatientRegistrationDto } from '@/lib/types';

// Remove trailing slash since chat paths use leading slashes (/chat/message)
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1').replace(/\/$/, '');

/**
 * Send a chat message to the backend
 */
export async function sendChatMessage(
  request: SendMessageRequest
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Extract data from the wrapped response
    return data.data || data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Map ExtractedData gender to API format
 */
function mapGender(gender?: string): 'M' | 'F' | 'OTHER' {
  if (!gender) return 'OTHER';
  const normalized = gender.toLowerCase();
  if (normalized === 'male') return 'M';
  if (normalized === 'female') return 'F';
  return 'OTHER';
}

/**
 * Map ExtractedData to PublicPatientRegistrationDto
 */
function mapChatDataToRegistration(
  data: ExtractedData,
  clinicCode: string
): PublicPatientRegistrationDto {
  return {
    clinic_code: clinicCode,
    full_name: data.name || '',
    phone: data.phone || '',
    date_of_birth: data.dateOfBirth || '',
    gender: mapGender(data.gender),
    email: data.email,
    chronic_conditions: data.existingConditions?.join(', '),
    allergies: data.allergies?.join(', '),
    current_medications: data.currentMedications?.map((m) => m.name).join(', '),
    medical_history: data.chiefComplaint
      ? `Chief Complaint: ${data.chiefComplaint}${data.duration ? ` (Duration: ${data.duration})` : ''}${data.painLevel ? ` - Pain Level: ${data.painLevel}/10` : ''}`
      : undefined,
    emergency_contact_name: data.emergencyContact?.name,
    emergency_contact_phone: data.emergencyContact?.phone,
    emergency_contact_relationship: data.emergencyContact?.relationship,
  };
}

/**
 * Complete patient intake
 */
export async function completeIntake(
  request: CompleteIntakeRequest
): Promise<CompleteIntakeResponse> {
  try {
    // Validate required fields
    if (!request.clinicCode) {
      throw new Error('Clinic code is required to complete registration');
    }

    if (!request.patientData.name || !request.patientData.phone) {
      throw new Error('Patient name and phone are required');
    }

    // Map chat data to registration format
    const registrationData = mapChatDataToRegistration(
      request.patientData,
      request.clinicCode
    );

    // Call the public patient registration API
    const response = await ApiManager.publicPatientRegister(registrationData);

    if (response.success && response.data) {
      return {
        patientId: response.data.patient_code || response.data.id,
        success: true,
        message: response.data.message || 'Registration completed successfully',
      };
    } else {
      throw new Error(response.message || 'Failed to register patient');
    }
  } catch (error) {
    console.error('Error completing intake:', error);
    throw error;
  }
}

/**
 * Check chat service health
 */
export async function checkChatHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Chat service health check failed:', error);
    return false;
  }
}
