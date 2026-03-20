import { ApiMethods } from '../../lib/data-access/api-client';
import { ENDPOINTS } from '../../lib/data-access/endpoints';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://healui-backend-core.onrender.com/api/v1/').replace(/\/$/, '') + '/';

export class ClinicalDxVoiceService {
  /** Create a new voice session */
  static async createSession(clinicId: string, patientId: string, conditionId?: string) {
    const url = BASE_URL + ENDPOINTS.CLINICAL_DX_VOICE_SESSION();
    return ApiMethods.post(url, { clinic_id: clinicId, patient_id: patientId, condition_id: conditionId });
  }

  /**
   * Get an ephemeral OpenAI Realtime token.
   * The frontend uses this to connect WebSocket directly to OpenAI.
   * Real API key never leaves the server.
   */
  static async getEphemeralToken(sessionId: string) {
    const url = BASE_URL + ENDPOINTS.CLINICAL_DX_VOICE_TOKEN();
    return ApiMethods.post(url, { session_id: sessionId });
  }

  /**
   * Extract clinical fields from a transcript turn.
   * Called after each speech turn completes (OpenAI VAD fires turn.completed).
   */
  static async extractFields(
    sessionId: string,
    transcript: string,
    existingFields: Record<string, any> = {},
  ) {
    const url = BASE_URL + ENDPOINTS.CLINICAL_DX_VOICE_EXTRACT();
    return ApiMethods.post(url, {
      session_id: sessionId,
      transcript,
      existing_fields: existingFields,
    });
  }

  /** Get gap questions for missing fields after recording */
  static async getGapQuestions(
    sessionId: string,
    extractedFields: Record<string, any>,
    painRegions?: any[],
  ) {
    const url = BASE_URL + ENDPOINTS.CLINICAL_DX_VOICE_GAPS();
    return ApiMethods.post(url, {
      session_id: sessionId,
      extracted_fields: extractedFields,
      pain_regions: painRegions,
    });
  }

  /** Finalize session — merge voice fields + gap answers, derive chief complaint */
  static async finalize(
    sessionId: string,
    voiceFields: Record<string, any>,
    gapAnswers: Record<string, any>,
    painRegions?: any[],
  ) {
    const url = BASE_URL + ENDPOINTS.CLINICAL_DX_VOICE_FINALIZE();
    return ApiMethods.post(url, {
      session_id: sessionId,
      voice_extracted_fields: voiceFields,
      gap_answers: gapAnswers,
      pain_regions: painRegions,
    });
  }

  static async getSession(sessionId: string) {
    const url = BASE_URL + ENDPOINTS.CLINICAL_DX_VOICE_SESSION_BY_ID(sessionId);
    return ApiMethods.get(url);
  }
}
