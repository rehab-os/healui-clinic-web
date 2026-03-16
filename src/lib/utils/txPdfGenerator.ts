import React from 'react'
import { format } from 'date-fns'
import ApiManager from '@/services/api/api.service'
import { preloadTxImages } from '@/components/pdf/utils/imageLoader'
import type {
  TxPlanData,
  TxProtocolData,
  PhysiotherapistProfileResponse,
  ProfilePhotosResponse,
} from '@/components/pdf/documents/types'

// Re-export the type for callers
export type { TxProtocolData }

// ── Input params (caller provides what they have) ────────────────

interface TxPdfParams {
  patient: TxPlanData['patient']
  clinic: TxPlanData['clinic']
  visit: TxPlanData['visit']
  conditions: TxPlanData['conditions']
  protocols: TxPlanData['protocols']
  dietaryProfile?: TxPlanData['dietaryProfile']
  contraindications?: TxPlanData['contraindications']
  notes?: string
  therapistName: string
  therapistPhone?: string
  therapistEmail?: string
}

// ── Modal exercise format → PDF protocol format mapper ───────────

interface ModalExercise {
  name: string
  description: string
  sets: string
  frequency: string
  customReps?: number
  customSets?: number
  customTime?: number
  customNotes?: string
}

export function mapModalExercisesToProtocol(
  exercises: ModalExercise[],
  title: string,
): TxProtocolData {
  return {
    protocol_title: title || 'Treatment Protocol',
    exercises: exercises.map((ex, i) => ({
      exercise_name: ex.name,
      exercise_description: ex.description,
      custom_sets: ex.customSets ?? (parseInt(ex.sets, 10) || 3),
      custom_reps: ex.customReps ?? 10,
      custom_duration_seconds: ex.customTime ?? 30,
      frequency: ex.frequency,
      order_index: i,
    })),
  }
}

// ── Build qualifications from education ──────────────────────────

const EDUCATION_LEVEL_ORDER: Record<string, number> = {
  BACHELOR: 1,
  MASTER: 2,
  POST_GRADUATE: 3,
  DOCTORATE: 4,
  CERTIFICATE: 5,
}

function buildQualifications(
  education?: PhysiotherapistProfileResponse['education'],
): string[] {
  if (!education || education.length === 0) return []

  return education
    .filter(e => e.education_type === 'DEGREE' || e.education_type === 'SPECIALIZATION')
    .sort((a, b) => {
      const orderA = EDUCATION_LEVEL_ORDER[a.education_level] ?? 99
      const orderB = EDUCATION_LEVEL_ORDER[b.education_level] ?? 99
      return orderA - orderB
    })
    .map(e => e.degree_name)
}

// ── Main generator ───────────────────────────────────────────────

export async function generateTxPlanPDF(params: TxPdfParams): Promise<Blob> {
  // 1. Fetch physiotherapist profile + photos in parallel
  //    Using allSettled so partial failure doesn't block the PDF
  const [profileRes, photosRes] = await Promise.allSettled([
    ApiManager.getPhysiotherapistProfile(),
    ApiManager.getProfilePhotos(),
  ])

  const profile: PhysiotherapistProfileResponse | null =
    profileRes.status === 'fulfilled' && profileRes.value.success
      ? profileRes.value.data
      : null

  const photos: ProfilePhotosResponse | null =
    photosRes.status === 'fulfilled' && photosRes.value.success
      ? photosRes.value.data
      : null

  // 2. Build qualifications from education
  const qualifications = buildQualifications(profile?.education)

  // 3. Pre-load images as base64 (CORS-safe for react-pdf)
  const { signatureBase64, clinicLogoBase64 } = await preloadTxImages({
    signatureUrl: photos?.signature?.url,
    clinicLogoUrl: params.clinic.logo_url,
  })

  // 4. Build TxPlanData
  const txData: TxPlanData = {
    patient: params.patient,
    clinic: params.clinic,
    therapist: {
      full_name: params.therapistName,
      license_number: profile?.license_number,
      qualifications,
      specializations: profile?.specializations ?? [],
      phone: params.therapistPhone,
      email: params.therapistEmail,
    },
    visit: params.visit,
    conditions: params.conditions,
    protocols: params.protocols,
    dietaryProfile: params.dietaryProfile,
    contraindications: params.contraindications,
    notes: params.notes,
    generatedDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }

  // 5. Dynamic import for code splitting (react-pdf is large)
  const [{ pdf }, { default: TxPlanPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/pdf/documents/TxPlanPDF'),
  ])

  // 6. Render to blob
  const blob = await pdf(
    React.createElement(TxPlanPDF, {
      data: txData,
      signatureBase64,
      clinicLogoBase64,
    }),
  ).toBlob()

  return blob
}

// ── Download convenience wrapper ─────────────────────────────────

export async function downloadTxPlanPDF(params: TxPdfParams): Promise<void> {
  const blob = await generateTxPlanPDF(params)

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Tx_${params.patient.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
