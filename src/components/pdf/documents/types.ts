// ── Tx Plan PDF Data Types ─────────────────────────────────────────

export interface TxPlanData {
  patient: {
    full_name: string
    date_of_birth?: string
    gender?: string
    phone?: string
    email?: string
    allergies?: string[]
    current_medications?: string[]
    medical_history?: string[]
  }
  clinic: {
    name: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    email?: string
    registration_number?: string
    logo_url?: string
  }
  therapist: {
    full_name: string
    license_number?: string
    qualifications: string[]
    specializations: string[]
    signature_url?: string
    phone?: string
    email?: string
  }
  visit: {
    date: string
    time?: string
    visit_type?: string
    chief_complaint?: string
  }
  conditions: Array<{
    condition_name: string
    body_region?: string
    treatment_focus?: string
    chief_complaint?: string
    status?: string
  }>
  protocols: Array<{
    condition_name: string
    home?: TxProtocolData
    clinical?: TxProtocolData
  }>
  dietaryProfile?: {
    recommended_foods?: Array<{ item: string; quantity?: string; frequency?: string; reason: string }>
    foods_to_avoid?: Array<{ item: string; reason: string }>
    supplements?: Array<{ item: string; quantity?: string; frequency?: string; reason: string }>
    hydration_guidelines?: string
    general_guidelines?: string
  }
  contraindications?: Array<{ item: string; type: string; reason: string; severity: string }>
  notes?: string
  generatedDate: string
}

export interface TxProtocolExercise {
  exercise_name: string
  exercise_description?: string
  custom_sets: number
  custom_reps: number
  custom_duration_seconds: number
  custom_notes?: string
  frequency?: string
  order_index?: number
}

export interface TxProtocolPhase {
  phaseName: string
  durationWeeks: number
  goals?: string[]
}

export interface TxProtocolModality {
  modalityName: string
  duration: string
  frequency: string
  parameters?: string
  applicationMethod?: string
  clinicalSupervisionRequired?: boolean
}

export interface TxProtocolManualTherapy {
  technique: string
  frequency: string
  sessionDuration: string
  clinicalOnly?: boolean
  expectedOutcome?: string
}

export interface TxProtocolData {
  protocol_title: string
  goals?: string[]
  exercises?: TxProtocolExercise[]
  treatment_phases?: TxProtocolPhase[]
  modalities?: TxProtocolModality[]
  manual_therapy?: TxProtocolManualTherapy[]
  program_duration_weeks?: number
}

// ── Backend Response Types ─────────────────────────────────────────

export interface PhysiotherapistProfileResponse {
  id: string
  user_id: string
  license_number?: string
  specializations: string[]
  bio?: string
  years_of_experience?: number
  experience_level?: string
  languages?: string[]
  is_profile_complete: boolean
  education?: PhysiotherapistEducationResponse[]
}

export interface PhysiotherapistEducationResponse {
  id: string
  degree_name: string
  institution_name: string
  education_type: string
  education_level: string
}

export interface ProfilePhotoResponse {
  id: string
  photoType: 'profile' | 'cover' | 'gallery' | 'signature'
  url: string
  storagePath: string
  metadata: {
    size: number
    format: string
    width: number
    height: number
  }
  uploadedAt: string
  isVerified: boolean
}

export interface ProfilePhotosResponse {
  profilePhoto?: ProfilePhotoResponse
  coverPhoto?: ProfilePhotoResponse
  galleryPhotos: ProfilePhotoResponse[]
  signature?: ProfilePhotoResponse
  allPhotosVerified: boolean
  totalPhotos: number
}
