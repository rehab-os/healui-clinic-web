'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/store/hooks'
import {
  useAppointment,
  useVisitConditions,
  useClinicalInsights,
  useAddClinicalInsight,
  usePatientDetails,
  usePatientVisits,
  useTreatmentProtocols,
  useVisitNotes,
  appointmentKeys,
} from '@/hooks/queries/useAppointmentQueries'
import { Toaster, toast } from 'sonner'
import ApiManager from '@/services/api/api.service'
import { FileText } from 'lucide-react'
import { format } from 'date-fns'
import NutritionSuggestions from '@/components/features/nutrition/NutritionSuggestions'
import InlineFindingInput, { DeepListenLoader } from './components/conditions/InlineFindingInput'
import AddNoteModal from './components/AddNoteModal'
import EnhancedPatientDetailsModal from '@/components/features/patients/EnhancedPatientDetailsModal'
import ProtocolGeneratorModal from '@/components/features/conditions/ProtocolGeneratorModal'
import DischargeConditionDialog from '@/components/features/conditions/DischargeConditionDialog'
import TreatmentHistoryViewer from './components/history/TreatmentHistoryViewer'
import InsightTimelineItem from './components/insights/InsightTimelineItem'
import PreviousVisitsPanel from './components/visits/PreviousVisitsPanel'

// Layout components
import AppointmentPageShell from './components/layout/AppointmentPageShell'
import PatientVisitHeader from './components/layout/PatientVisitHeader'
import ConditionsSection from './components/layout/ConditionsSection'
import InsightsTimeline, { CollapsibleSection } from './components/layout/InsightsTimeline'

// Condition components
import ConditionCard from './components/conditions/ConditionCard'
import ConditionProtocolSummary from './components/conditions/ConditionProtocolSummary'
import ConditionActionBar from './components/conditions/ConditionActionBar'
import ConditionTrackingPanel from './components/tracking/ConditionTrackingPanel'
import TrackingProgressView from '@/components/features/tracking-progress/TrackingProgressView'

// Mobile components
import MobileBottomBar, { type MobileTab } from './components/layout/MobileBottomBar'
import MobileConditionSwiper from './components/layout/MobileConditionSwiper'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'

export default function AppointmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Auth-level state stays in Redux
  const userClinic = useAppSelector(state => state.user.currentClinic)
  const clinicSlice = useAppSelector(state => state.clinic)
  const currentClinic = clinicSlice.clinics.find(c => c.id === userClinic?.id) || clinicSlice.currentClinic

  // ── TanStack Query: parallel data fetching ─────────────────

  const appointmentId = params.appointmentId as string | undefined
  const { data: appointment, isLoading: appointmentLoading, error: appointmentError } = useAppointment(appointmentId)

  // These fire in parallel as soon as appointment is available
  const { data: visitConditions = [], isLoading: conditionsLoading } = useVisitConditions(appointment?.id)

  // Patient: for marketplace visits use embedded patientUser, otherwise fetch
  const isMarketplace = appointment?.visit_source === 'MARKETPLACE'
  const patientIdToFetch = !isMarketplace ? appointment?.patient_id : undefined
  const { data: fetchedPatient } = usePatientDetails(patientIdToFetch)
  const patient = isMarketplace ? appointment?.patientUser : fetchedPatient

  const { data: patientVisits = [] } = usePatientVisits(patient?.id)
  const { data: conditionProtocols = {} } = useTreatmentProtocols(appointmentId, visitConditions)
  const { data: visitNotes = [] } = useVisitNotes(appointment?.id)

  // Local state: condition focus
  const [activeConditionId, setActiveConditionId] = useState<string | null>(null)

  // Treatment history (on-demand, stays local)
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({})
  const [conditionHistory, setConditionHistory] = useState<Record<string, { data: any[]; loading: boolean }>>({})
  const [nutritionData, setNutritionData] = useState<any>(null)

  // Modal states
  const [visitNoteModalOpen, setVisitNoteModalOpen] = useState(false)
  const [noteModal, setNoteModal] = useState<{
    open: boolean; visitConditionId: string | null; conditionName: string | null
  }>({ open: false, visitConditionId: null, conditionName: null })
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)
  const [showProtocolGenerator, setShowProtocolGenerator] = useState(false)
  const [selectedConditionForProtocol, setSelectedConditionForProtocol] = useState<{
    conditionId: string; conditionName: string; patientConditionId: string
  } | null>(null)
  const [showDischargeDialog, setShowDischargeDialog] = useState(false)
  const [conditionToDischarge, setConditionToDischarge] = useState<any>(null)

  // ── Mobile state ─────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<MobileTab>('track')
  const [mobileObservationText, setMobileObservationText] = useState('')
  const [mobileObsSubmitting, setMobileObsSubmitting] = useState(false)
  const [mobileObsSuccess, setMobileObsSuccess] = useState(false)
  const [mobileRecording, setMobileRecording] = useState(false)
  const [mobileTranscribing, setMobileTranscribing] = useState(false)

  // ── Mutations ────────────────────────────────────────────────
  const addInsightMutation = useAddClinicalInsight()

  // ── Auto-select first condition (PRIMARY priority) ───────────
  useEffect(() => {
    if (visitConditions.length > 0 && !activeConditionId) {
      const primary = visitConditions.find(vc => vc.treatment_focus === 'PRIMARY')
      setActiveConditionId(primary?.id || visitConditions[0].id)
    }
  }, [visitConditions, activeConditionId])

  // ── Clinical insights (reactive to active condition) ─────────
  const activeCondition = useMemo(
    () => visitConditions.find(vc => vc.id === activeConditionId) || null,
    [visitConditions, activeConditionId]
  )

  const { data: clinicalInsights } = useClinicalInsights(activeCondition?.patient_condition_id)

  // ── Derived data ───────────────────────────────────────────────

  const allInsights: any[] = clinicalInsights?.data || []

  const activeUnusedInsights = useMemo(
    () => allInsights.filter((i: any) => !i.used_in_protocol_generation),
    [allInsights]
  )

  // Notes filtered to active condition (condition-specific notes + visit-level notes)
  const activeConditionNotes = useMemo(
    () => visitNotes.filter((n: any) => n.visit_condition_id === activeConditionId),
    [visitNotes, activeConditionId]
  )

  const visitLevelNotes = useMemo(
    () => visitNotes.filter((n: any) => !n.visit_condition_id),
    [visitNotes]
  )

  // All notes for sidebar (condition + visit-level)
  const allNotes = useMemo(
    () => [...activeConditionNotes, ...visitLevelNotes].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [activeConditionNotes, visitLevelNotes]
  )

  // Insights sorted newest first
  const sortedInsights = useMemo(
    () => [...allInsights].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [allInsights]
  )

  // ── Handlers ───────────────────────────────────────────────────

  const calculateAge = (dob: string) => {
    if (!dob) return null
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const openConditionNoteModal = (condition: any) => {
    setNoteModal({ open: true, visitConditionId: condition.id, conditionName: condition.condition_name })
  }

  const closeNoteModal = () => {
    setNoteModal({ open: false, visitConditionId: null, conditionName: null })
  }

  const handleNoteSuccess = () => {
    toast.success('Note added successfully')
  }

  const handleToggleHistory = async (condition: any) => {
    const condId = condition.patient_condition_id
    if (expandedHistory[condition.id]) {
      setExpandedHistory(prev => ({ ...prev, [condition.id]: false }))
      return
    }
    setExpandedHistory(prev => ({ ...prev, [condition.id]: true }))
    if (!conditionHistory[condId]) {
      setConditionHistory(prev => ({ ...prev, [condId]: { data: [], loading: true } }))
      try {
        const response = await ApiManager.getTreatmentHistory(condId)
        setConditionHistory(prev => ({
          ...prev, [condId]: { data: response.success && response.data ? response.data.history || [] : [], loading: false },
        }))
      } catch {
        setConditionHistory(prev => ({ ...prev, [condId]: { data: [], loading: false } }))
      }
    }
  }

  const handleGenerateProtocol = (condition: any) => {
    setSelectedConditionForProtocol({
      conditionId: condition.id, conditionName: condition.condition_name, patientConditionId: condition.patient_condition_id,
    })
    setShowProtocolGenerator(true)
  }

  const handleDischargeCondition = (condition: any) => {
    setConditionToDischarge(condition)
    setShowDischargeDialog(true)
  }

  const handleDischargeSuccess = async () => {
    toast.success('Condition discharged successfully')
    setShowDischargeDialog(false)
    setConditionToDischarge(null)
    if (appointment?.id) {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.conditions(appointment.id) })
    }
  }

  const handleReactivateCondition = async (condition: any) => {
    try {
      const response = await ApiManager.reactivateCondition(patient.id, condition.patient_condition_id)
      if (response.success) {
        toast.success('Condition reactivated')
        queryClient.invalidateQueries({ queryKey: appointmentKeys.conditions(appointment.id) })
      }
    } catch {
      toast.error('Failed to reactivate')
    }
  }

  const handleExportPDF = async () => {
    try {
      const ensureArray = (v: any) => Array.isArray(v) ? v : typeof v === 'string' ? [v] : []
      const reportData = {
        patient: {
          full_name: patient.full_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          allergies: ensureArray(patient.allergies),
          current_medications: ensureArray(patient.current_medications),
          medical_history: ensureArray(patient.medical_history),
        },
        appointment: {
          scheduled_date: appointment.scheduled_date,
          scheduled_time: appointment.scheduled_time,
          visit_type: appointment.visit_type,
          status: appointment.status,
          chief_complaint: appointment.chief_complaint,
        },
        clinic: {
          name: currentClinic?.name || 'Clinic',
          address: currentClinic?.address,
          city: currentClinic?.city,
          state: currentClinic?.state,
          pincode: currentClinic?.pincode,
          phone: currentClinic?.phone,
          email: currentClinic?.email,
        },
        physiotherapist: {
          full_name: appointment.physiotherapist?.full_name || 'Physiotherapist',
          license_number: appointment.physiotherapist?.license_number,
        },
        visitConditions: visitConditions.map(vc => ({
          id: vc.id,
          condition_name: vc.condition_name,
          body_region: vc.body_region,
          treatment_focus: vc.treatment_focus,
          chief_complaint: vc.chief_complaint,
          condition: vc.condition,
        })),
        clinicalInsights: allInsights,
        protocols: conditionProtocols,
      }

      const [{ pdf }, { default: ClinicalReportPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/pdf/documents/ClinicalReportPDF'),
      ])
      const blob = await pdf(<ClinicalReportPDF data={reportData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${patient.full_name.replace(/\s+/g, '_')}_Clinical_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Patient report generated successfully!')
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Failed to generate report. Please try again.')
    }
  }

  // ── Mobile handlers ───────────────────────────────────────────

  const activeConditionIndex = useMemo(
    () => Math.max(0, visitConditions.findIndex(vc => vc.id === activeConditionId)),
    [visitConditions, activeConditionId]
  )

  const handleMobileConditionSwipe = (index: number) => {
    if (visitConditions[index]) setActiveConditionId(visitConditions[index].id)
  }

  const handleMobileObservationSubmit = async () => {
    if (!activeCondition || mobileObservationText.trim().length < 3 || mobileObsSubmitting) return
    setMobileObsSubmitting(true)
    try {
      await addInsightMutation.mutateAsync({
        patientConditionId: activeCondition.patient_condition_id,
        data: {
          insight_text: mobileObservationText.trim(),
          insight_type: 'OBSERVATION',
          visit_id: appointment!.id,
          visit_condition_id: activeCondition.id,
        },
      })
      setMobileObservationText('')
      setMobileObsSuccess(true)
      setTimeout(() => setMobileObsSuccess(false), 1200)
    } catch {
      toast.error('Failed to add observation')
    } finally {
      setMobileObsSubmitting(false)
    }
  }

  const handleMobileRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setMobileTranscribing(true)
    try {
      let filename = 'observation.webm'
      let mimeType = audioBlob.type || 'audio/webm'
      if (audioBlob.type.includes('wav')) { filename = 'observation.wav' }
      else if (audioBlob.type.includes('mp3')) { filename = 'observation.mp3' }
      else if (audioBlob.type.includes('m4a')) { filename = 'observation.m4a' }

      const audioFile = new File([audioBlob], filename, { type: mimeType })
      const response = await ApiManager.transcribeAudio(audioFile)
      if (response.success && response.data?.transcription) {
        setMobileObservationText(prev => {
          const trimmed = prev.trim()
          return trimmed ? `${trimmed}. ${response.data.transcription}` : response.data.transcription
        })
      }
    } catch (err) {
      console.error('[Mobile Voice] Error:', err)
    } finally {
      setMobileTranscribing(false)
      setMobileRecording(false)
    }
  }, [])

  const {
    state: mobileRecState,
    recordingTime: mobileRecordingTime,
    startRecording: mobileStartRecording,
    stopRecording: mobileStopRecording,
    cancelRecording: mobileCancelRecording,
    isSupported: mobileMicSupported,
  } = useMediaRecorder({
    onRecordingComplete: handleMobileRecordingComplete,
    maxDuration: 120000,
  })

  const handleMobileMicClick = () => {
    setMobileRecording(true)
    mobileStartRecording()
  }

  const handleMobileStopRecording = () => {
    mobileStopRecording()
  }

  const refreshProtocols = () => {
    if (appointmentId) {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.protocols(appointmentId) })
    }
  }

  // ── Loading / Error states ─────────────────────────────────────

  if (appointmentLoading) {
    return <AppointmentPageShell loading />
  }

  if (appointmentError || !appointment || !patient) {
    return <AppointmentPageShell error={appointmentError?.message || 'Appointment not found'} />
  }

  // ── Active condition protocol helpers ──────────────────────────

  const currentHomeProtocol = activeCondition ? conditionProtocols[activeCondition.id]?.home : null
  const previousHomeProtocol = activeCondition && !currentHomeProtocol ? activeCondition.condition?.active_home_protocol : null
  const currentClinicalProtocol = activeCondition ? conditionProtocols[activeCondition.id]?.clinical : null
  const previousClinicalProtocol = activeCondition && !currentClinicalProtocol ? activeCondition.condition?.active_clinical_protocol : null

  // ── Render ─────────────────────────────────────────────────────

  // Shared sidebar content (used in both desktop sidebar and mobile timeline tab)
  const renderNotesContent = () => (
    <>
      {/* Action Buttons */}
      {activeCondition && (
        <div className="flex gap-1.5 px-4 py-2.5 border-b border-gray-100">
          <button
            onClick={() => openConditionNoteModal(activeCondition)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-teal border border-brand-light-teal rounded-lg hover:bg-teal-50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Condition Note
          </button>
          <button
            onClick={() => setVisitNoteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Visit Note
          </button>
        </div>
      )}

      <CollapsibleSection
        title="Notes"
        count={allNotes.length}
        defaultExpanded
      >
        {allNotes.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No notes yet for this visit</p>
        ) : (
          <div className="space-y-2.5">
            {allNotes.map((note: any) => {
              const isConditionNote = !!note.visit_condition_id
              return (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${
                    isConditionNote
                      ? 'bg-teal-50/40 border-brand-light-teal'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className={`h-3.5 w-3.5 ${isConditionNote ? 'text-brand-teal' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold ${isConditionNote ? 'text-brand-teal' : 'text-gray-600'}`}>
                      {note.note_type || 'SOAP'}
                    </span>
                    {isConditionNote && (
                      <span className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded font-medium">
                        Condition
                      </span>
                    )}
                    {!isConditionNote && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
                        Visit
                      </span>
                    )}
                    {note.is_legacy_note && (
                      <span className="text-xs text-gray-400">(Legacy)</span>
                    )}
                    {note.created_at && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {format(new Date(note.created_at), 'h:mm a')}
                      </span>
                    )}
                  </div>
                  {note.note_data && (
                    <div className="text-sm text-gray-700 space-y-1 leading-relaxed">
                      {note.note_data.subjective && (
                        <p><span className="font-bold text-gray-500 text-xs uppercase tracking-wide">S</span> <span className="text-gray-700">{note.note_data.subjective}</span></p>
                      )}
                      {note.note_data.objective && (
                        <p><span className="font-bold text-gray-500 text-xs uppercase tracking-wide">O</span> <span className="text-gray-700">{note.note_data.objective}</span></p>
                      )}
                      {note.note_data.assessment && (
                        <p><span className="font-bold text-gray-500 text-xs uppercase tracking-wide">A</span> <span className="text-gray-700">{note.note_data.assessment}</span></p>
                      )}
                      {note.note_data.plan && (
                        <p><span className="font-bold text-gray-500 text-xs uppercase tracking-wide">P</span> <span className="text-gray-700">{note.note_data.plan}</span></p>
                      )}
                      {note.note_data.progress && (
                        <p><span className="font-bold text-gray-500 text-xs uppercase tracking-wide">Progress</span> <span className="text-gray-700">{note.note_data.progress}</span></p>
                      )}
                      {note.note_data.data && !note.note_data.subjective && (
                        <p><span className="font-bold text-gray-500 text-xs uppercase tracking-wide">Data</span> <span className="text-gray-700">{note.note_data.data}</span></p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CollapsibleSection>
    </>
  )

  const renderInsightsContent = () => (
    <CollapsibleSection
      title="Insights"
      count={sortedInsights.length}
      badge={activeCondition?.condition_name}
      badgeColor="bg-teal-50 text-teal-700"
      defaultExpanded
    >
      {sortedInsights.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No insights yet — add observations to track progress</p>
      ) : (
        <div className="space-y-1">
          {sortedInsights.map((insight: any) => (
            <InsightTimelineItem key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </CollapsibleSection>
  )

  const renderDietaryContent = () => (
    <CollapsibleSection title="Dietary" badge="AI" badgeColor="bg-purple-50 text-purple-600">
      <div>
        {patient && (
          <NutritionSuggestions
            patientData={{
              age: calculateAge(patient.date_of_birth),
              gender: patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other',
              allergies: patient.allergies,
              currentMedications: patient.current_medications,
              medicalHistory: patient.medical_history,
              chiefComplaints: appointment.chief_complaint ? [appointment.chief_complaint] : [],
              recentNotes: patientVisits.filter(v => v.note).slice(0, 5).map(v => JSON.stringify(v.note?.note_data)),
              visitHistory: patientVisits.slice(0, 10),
            }}
            onDataChange={setNutritionData}
          />
        )}
      </div>
    </CollapsibleSection>
  )

  const renderPastVisitsContent = () => (
    patientVisits.length > 0 ? (
      <CollapsibleSection title="Past Visits" count={patientVisits.length}>
        <PreviousVisitsPanel
          visits={patientVisits}
          currentVisitId={appointment.id}
          onVisitClick={(visitId) => router.push(`/dashboard/appointments/${patient.id}/${visitId}`)}
        />
      </CollapsibleSection>
    ) : null
  )

  return (
    <>
      <Toaster position="top-right" richColors />

      <div className="min-h-screen bg-gray-50 pb-[140px] lg:pb-10">
        <PatientVisitHeader
          patient={patient}
          appointment={appointment}
          onExportPDF={handleExportPDF}
          onShowFullProfile={() => setShowPatientDetailsModal(true)}
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">

          {/* ── Mobile: Condition Swiper ── */}
          <MobileConditionSwiper
            conditions={visitConditions}
            activeIndex={activeConditionIndex}
            onIndexChange={handleMobileConditionSwipe}
            onDischarge={activeCondition ? () => handleDischargeCondition(activeCondition) : undefined}
            onReactivate={activeCondition ? () => handleReactivateCondition(activeCondition) : undefined}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">

            {/* ─── LEFT COLUMN: Condition Content (60%) ─── */}
            {/* Desktop: always visible. Mobile: only when Track tab is active */}
            <div className={`lg:col-span-3 ${mobileTab !== 'track' ? 'hidden lg:block' : ''}`}>
              <ConditionsSection
                conditions={visitConditions}
                activeConditionId={activeConditionId}
                onConditionChange={setActiveConditionId}
                loading={conditionsLoading}
              >
                {activeCondition && (
                  <>
                    <ConditionCard
                      condition={activeCondition}
                      visitChiefComplaint={appointment.chief_complaint}
                      onDischarge={() => handleDischargeCondition(activeCondition)}
                      onReactivate={() => handleReactivateCondition(activeCondition)}
                    >
                      <ConditionProtocolSummary
                        homeProtocol={currentHomeProtocol || previousHomeProtocol}
                        clinicalProtocol={currentClinicalProtocol || previousClinicalProtocol}
                        isHomePrevious={!currentHomeProtocol && !!previousHomeProtocol}
                        isClinicalPrevious={!currentClinicalProtocol && !!previousClinicalProtocol}
                        onGenerateNew={() => handleGenerateProtocol(activeCondition)}
                        onViewHistory={() => handleToggleHistory(activeCondition)}
                      />
                    </ConditionCard>

                    <ConditionTrackingPanel
                      conditionName={activeCondition.condition_name}
                      visitConditionId={activeCondition.id}
                      patientConditionId={activeCondition.patient_condition_id}
                      visitId={activeCondition.visit_id}
                    />

                    <TrackingProgressView
                      patientConditionId={activeCondition.patient_condition_id}
                      conditionName={activeCondition.condition_name}
                    />

                    <ConditionActionBar
                      hasProtocol={!!currentHomeProtocol || !!currentClinicalProtocol}
                      hasUnusedInsights={activeUnusedInsights.length > 0}
                      unusedInsightsCount={activeUnusedInsights.length}
                      onGenerateFromInsights={() => handleGenerateProtocol(activeCondition)}
                    />
                  </>
                )}
              </ConditionsSection>
            </div>

            {/* ─── MOBILE: Notes Tab Content ─── */}
            {mobileTab === 'notes' && (
              <div className="lg:hidden">
                <InsightsTimeline bare>
                  {renderNotesContent()}
                </InsightsTimeline>
              </div>
            )}

            {/* ─── MOBILE: Timeline Tab Content ─── */}
            {mobileTab === 'timeline' && (
              <div className="lg:hidden">
                <InsightsTimeline bare>
                  {renderInsightsContent()}
                  {renderDietaryContent()}
                  {renderPastVisitsContent()}
                </InsightsTimeline>
              </div>
            )}

            {/* ─── RIGHT COLUMN: Desktop Sidebar (40%) ─── */}
            <div className="hidden lg:block lg:col-span-2">
              <InsightsTimeline>
                {/* Quick Observation — always visible at sidebar top */}
                {activeCondition && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-teal-50/30">
                    <InlineFindingInput
                      label="Quick Observation"
                      onSubmit={async (text) => {
                        await addInsightMutation.mutateAsync({
                          patientConditionId: activeCondition.patient_condition_id,
                          data: {
                            insight_text: text,
                            insight_type: 'OBSERVATION',
                            visit_id: appointment.id,
                            visit_condition_id: activeCondition.id,
                          },
                        })
                      }}
                    />
                  </div>
                )}

                {renderNotesContent()}
                {renderInsightsContent()}
                {renderDietaryContent()}
                {renderPastVisitsContent()}
              </InsightsTimeline>
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Bar ── */}
      <MobileBottomBar
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        observationText={mobileObservationText}
        onObservationChange={setMobileObservationText}
        onObservationSubmit={handleMobileObservationSubmit}
        onMicClick={handleMobileMicClick}
        isSubmitting={mobileObsSubmitting}
        showSuccess={mobileObsSuccess}
        micSupported={mobileMicSupported}
      />

      {/* ── Mobile Recording Overlay — same DeepListenLoader as desktop ── */}
      {mobileRecording && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center lg:hidden"
          onClick={() => { mobileCancelRecording(); setMobileRecording(false) }}
        >
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" />

          <div className="relative z-10 flex flex-col items-center gap-12" onClick={(e) => e.stopPropagation()}>
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute -top-32 h-[400px] w-[400px] rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
              }}
            />

            {/* Loader */}
            <div className="flex h-48 w-48 items-center justify-center">
              <div style={{ transform: 'scale(2.2)' }}>
                <DeepListenLoader />
              </div>
            </div>

            {/* Status text */}
            <div className="text-center">
              {mobileTranscribing ? (
                <>
                  <h2 className="text-3xl font-light tracking-wide text-white">Transcribing</h2>
                  <p className="mt-3 text-sm text-white/40">Converting speech to text...</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-light tracking-wide text-white">Listening</h2>
                  <p className="mt-3 text-sm text-white/40">Recording observation...</p>
                  {mobileRecState === 'recording' && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-mono text-white/50">
                        {Math.floor(mobileRecordingTime / 60)}:{(mobileRecordingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stop button */}
            {mobileRecState === 'recording' && (
              <button
                onClick={handleMobileStopRecording}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all active:scale-95"
              >
                <div className="h-6 w-6 bg-white rounded-sm" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}

      <AddNoteModal
        open={noteModal.open}
        onClose={closeNoteModal}
        visitId={appointment.id}
        visitConditionId={noteModal.visitConditionId || undefined}
        conditionName={noteModal.conditionName || undefined}
        onSuccess={handleNoteSuccess}
      />

      <AddNoteModal
        open={visitNoteModalOpen}
        onClose={() => setVisitNoteModalOpen(false)}
        visitId={appointment.id}
        onSuccess={handleNoteSuccess}
      />

      {showPatientDetailsModal && patient && (
        <EnhancedPatientDetailsModal
          patient={patient as any}
          onClose={() => setShowPatientDetailsModal(false)}
          onScheduleVisit={() => {
            setShowPatientDetailsModal(false)
            toast.info('Schedule visit from appointments page')
          }}
          onPatientUpdate={async () => {
            if (appointment?.patient_id) {
              queryClient.invalidateQueries({ queryKey: appointmentKeys.patient(appointment.patient_id) })
            }
          }}
        />
      )}

      {selectedConditionForProtocol && (
        <ProtocolGeneratorModal
          isOpen={showProtocolGenerator}
          onClose={async () => {
            setShowProtocolGenerator(false)
            setSelectedConditionForProtocol(null)
            refreshProtocols()
          }}
          patientId={patient?.id}
          conditionId={selectedConditionForProtocol.patientConditionId}
          visitConditionId={selectedConditionForProtocol.conditionId}
          conditionName={selectedConditionForProtocol.conditionName}
          patientName={patient?.full_name}
          visitId={params.appointmentId as string}
        />
      )}

      {conditionToDischarge && (
        <DischargeConditionDialog
          isOpen={showDischargeDialog}
          onClose={() => { setShowDischargeDialog(false); setConditionToDischarge(null) }}
          patientId={patient?.id}
          conditionId={conditionToDischarge.patient_condition_id}
          conditionName={conditionToDischarge.condition_name}
          onSuccess={handleDischargeSuccess}
        />
      )}
    </>
  )
}
