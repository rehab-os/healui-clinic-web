import { ApiMethods } from '../../lib/data-access/api-client';
import { ENDPOINTS } from '../../lib/data-access/endpoints';
import type { DocumentType, PatientDocumentResponseDto } from '../../lib/types';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://healui-backend-core.onrender.com/api/v1/').replace(/\/$/, '') + '/';

export class PatientDocumentService {
  /** Step 1: Get pre-signed upload URL from backend */
  static async getUploadUrl(
    patientId: string,
    dto: {
      filename: string;
      mime_type: string;
      type: DocumentType;
      title: string;
      condition_id?: string;
      imaging_order_label?: string;
    },
  ) {
    const url = BASE_URL + ENDPOINTS.PATIENT_DOCUMENT_UPLOAD_URL(patientId);
    return ApiMethods.post(url, dto);
  }

  /** Step 2: Upload file directly to R2 using the pre-signed URL */
  static async uploadFileToR2(uploadUrl: string, file: File): Promise<boolean> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    return res.ok;
  }

  /** Step 3: Register document record after successful R2 upload */
  static async create(
    patientId: string,
    dto: {
      storage_key: string;
      type: DocumentType;
      title: string;
      mime_type: string;
      file_size_bytes?: number;
      condition_id?: string;
      imaging_order_label?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const url = BASE_URL + ENDPOINTS.PATIENT_DOCUMENTS(patientId);
    return ApiMethods.post(url, dto);
  }

  /** List documents for a patient, optionally filtered by condition */
  static async list(patientId: string, conditionId?: string) {
    let url = BASE_URL + ENDPOINTS.PATIENT_DOCUMENTS(patientId);
    if (conditionId) url += `?condition_id=${conditionId}`;
    return ApiMethods.get(url);
  }

  /** Get a signed view/download URL (15 min expiry) */
  static async getViewUrl(patientId: string, documentId: string) {
    const url = BASE_URL + ENDPOINTS.PATIENT_DOCUMENT_VIEW_URL(patientId, documentId);
    return ApiMethods.get(url);
  }

  /** Soft-delete a document */
  static async delete(patientId: string, documentId: string) {
    const url = BASE_URL + ENDPOINTS.PATIENT_DOCUMENT_DELETE(patientId, documentId);
    return ApiMethods.delete(url);
  }

  /** List documents linked to a specific imaging order */
  static async listByImagingOrder(
    patientId: string,
    conditionId: string,
    orderLabel: string,
  ) {
    const url = BASE_URL + ENDPOINTS.PATIENT_DOCUMENTS_BY_IMAGING(patientId)
      + `?condition_id=${conditionId}&order_label=${encodeURIComponent(orderLabel)}`;
    return ApiMethods.get(url);
  }
}
