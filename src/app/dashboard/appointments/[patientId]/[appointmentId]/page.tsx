'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchAppointmentDetails,
  fetchVisitConditions,
  fetchClinicalInsights,
  addClinicalInsight,
  compareProtocolVersions,
  selectAppointment,
  selectPatient,
  selectVisitConditions,
  selectClinicalInsights,
  selectUnusedInsights,
  selectLoadingStates,
  selectErrors,
  setPatient,
} from '@/store/slices/appointmentDetails.slice'
import { Toaster, toast } from 'sonner'
import ApiManager from '@/services/api/api.service'
import { FileText } from 'lucide-react'
import { format } from 'date-fns'
import NutritionSuggestions from '@/components/features/nutrition/NutritionSuggestions'
import InlineFindingInput from './components/conditions/InlineFindingInput'
import AddNoteModal from './components/AddNoteModal'
import EnhancedPatientDetailsModal from '@/components/features/patients/EnhancedPatientDetailsModal'
import ProtocolGeneratorModal from '@/components/features/conditions/ProtocolGeneratorModal'
import DischargeConditionDialog from '@/components/features/conditions/DischargeConditionDialog'
import TreatmentHistoryViewer from './components/history/TreatmentHistoryViewer'
import InsightTimelineItem from './components/insights/InsightTimelineItem'
import PreviousVisitsPanel from './components/visits/PreviousVisitsPanel'
import { pdf } from '@react-pdf/renderer'
import ClinicalReportPDF from '@/components/pdf/documents/ClinicalReportPDF'

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

export default function AppointmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Redux state
  const appointment = useAppSelector(selectAppointment)
  const patient = useAppSelector(selectPatient)
  const visitConditions = useAppSelector(selectVisitConditions)
  const clinicalInsights = useAppSelector(selectClinicalInsights)
  const unusedInsights = useAppSelector(selectUnusedInsights)
  const loading = useAppSelector(selectLoadingStates)
  const errors = useAppSelector(selectErrors)
  const userClinic = useAppSelector(state => state.user.currentClinic)
  const clinicSlice = useAppSelector(state => state.clinic)
  const currentClinic = clinicSlice.clinics.find(c => c.id === userClinic?.id) || clinicSlice.currentClinic

  // Local state: condition focus
  const [activeConditionId, setActiveConditionId] = useState<string | null>(null)

  // Protocol & history data
  const [conditionProtocols, setConditionProtocols] = useState<Record<string, any>>({})
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({})
  const [conditionHistory, setConditionHistory] = useState<Record<string, { data: any[]; loading: boolean }>>({})
  const [patientVisits, setPatientVisits] = useState<any[]>([])
  const [nutritionData, setNutritionData] = useState<any>(null)
  const [visitNotes, setVisitNotes] = useState<{ notes: any[]; loading: boolean }>({ notes: [], loading: false })

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

  // ── Data fetching ──────────────────────────────────────────────

  useEffect(() => {
    if (params.appointmentId && params.patientId) {
      dispatch(fetchAppointmentDetails({
        patientId: params.patientId as string,
        appointmentId: params.appointmentId as string,
      }))
    }
  }, [params.appointmentId, params.patientId, dispatch])

  useEffect(() => {
    if (appointment?.id) {
      dispatch(fetchVisitConditions(appointment.id))
    }
  }, [appointment?.id, dispatch])

  useEffect(() => {
    const fetchPatient = async () => {
      if (appointment?.visit_source === 'MARKETPLACE') {
        if (appointment.patientUser) dispatch(setPatient(appointment.patientUser))
      } else if (appointment?.patient_id) {
        const response = await ApiManager.getPatient(appointment.patient_id)
        if (response.success && response.data) {
          dispatch(setPatient(response.data))
          fetchPatientVisits(response.data.id)
        }
      }
    }
    if (appointment) fetchPatient()
  }, [appointment, dispatch])

  const fetchPatientVisits = async (patientId: string) => {
    try {
      const response = await ApiManager.getPatientVisits(patientId)
      if (response.success && response.data) setPatientVisits(response.data.visits || [])
    } catch (error) {
      console.error('Failed to fetch patient visits:', error)
    }
  }

  useEffect(() => {
    const fetchProtocols = async () => {
      if (!params.appointmentId) return
      try {
        const response = await ApiManager.getTreatmentProtocols({ visit_id: params.appointmentId as string })
        if (response.success && response.data) {
          const protocols = response.data.protocols || response.data || []
          const protocolMap: Record<string, { home?: any; clinical?: any }> = {}
          protocols.forEach((protocol: any) => {
            let match = visitConditions.find(vc => protocol.visit_condition_id && vc.id === protocol.visit_condition_id)
            if (!match && protocol.patient_condition_id) match = visitConditions.find(vc => vc.patient_condition_id === protocol.patient_condition_id)
            if (!match && protocol.condition_id) match = visitConditions.find(vc => vc.condition_id === protocol.condition_id)
            if (match) {
              if (!protocolMap[match.id]) protocolMap[match.id] = {}
              protocolMap[match.id][protocol.protocol_type || 'home'] = protocol
            }
          })
          setConditionProtocols(protocolMap)
        }
      } catch (error) {
        console.error('Failed to fetch protocols:', error)
      }
    }
    if (params.appointmentId && visitConditions.length > 0) fetchProtocols()
  }, [params.appointmentId, visitConditions])

  // Auto-select first condition (PRIMARY priority)
  useEffect(() => {
    if (visitConditions.length > 0 && !activeConditionId) {
      const primary = visitConditions.find(vc => vc.treatment_focus === 'PRIMARY')
      setActiveConditionId(primary?.id || visitConditions[0].id)
    }
  }, [visitConditions, activeConditionId])

  // Fetch clinical insights when active condition changes
  useEffect(() => {
    const vc = visitConditions.find(c => c.id === activeConditionId)
    if (vc?.patient_condition_id) {
      dispatch(fetchClinicalInsights({ patientConditionId: vc.patient_condition_id }))
    }
  }, [activeConditionId, visitConditions, dispatch])

  // Fetch visit notes when appointment loads
  useEffect(() => {
    if (!appointment?.id) return
    setVisitNotes(prev => ({ ...prev, loading: true }))
    ApiManager.getVisitNotes(appointment.id)
      .then(response => {
        if (response.success && response.data) {
          setVisitNotes({ notes: response.data.notes || [], loading: false })
        } else {
          setVisitNotes({ notes: [], loading: false })
        }
      })
      .catch(() => setVisitNotes({ notes: [], loading: false }))
  }, [appointment?.id])

  // ── Derived data ───────────────────────────────────────────────

  const activeCondition = useMemo(
    () => visitConditions.find(vc => vc.id === activeConditionId) || null,
    [visitConditions, activeConditionId]
  )

  // All insights for the active patient_condition (fetched via Redux)
  const allInsights: any[] = clinicalInsights?.data || []

  // All insights for active condition (already scoped by patient_condition_id via fetchClinicalInsights)
  const activeConditionInsights = allInsights

  const activeUnusedInsights = useMemo(
    () => (unusedInsights || []).filter((i: any) => {
      const pcId = activeCondition?.patient_condition_id
      return pcId && i.patient_condition_id === pcId
    }),
    [unusedInsights, activeCondition?.patient_condition_id]
  )

  // Notes filtered to active condition (condition-specific notes + visit-level notes)
  const activeConditionNotes = useMemo(
    () => visitNotes.notes.filter((n: any) => n.visit_condition_id === activeConditionId),
    [visitNotes.notes, activeConditionId]
  )

  const visitLevelNotes = useMemo(
    () => visitNotes.notes.filter((n: any) => !n.visit_condition_id),
    [visitNotes.notes]
  )

  // All notes for sidebar (condition + visit-level)
  const allNotes = useMemo(
    () => [...activeConditionNotes, ...visitLevelNotes].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [activeConditionNotes, visitLevelNotes]
  )

  // Insights sorted newest first (already scoped to condition via fetchClinicalInsights)
  const sortedInsights = useMemo(
    () => [...activeConditionInsights].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [activeConditionInsights]
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
    // Refresh visit notes to show the new note in sidebar
    if (appointment?.id) {
      ApiManager.getVisitNotes(appointment.id)
        .then(response => {
          if (response.success && response.data) {
            setVisitNotes({ notes: response.data.notes || [], loading: false })
          }
        })
        .catch(() => {})
    }
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
    if (appointment?.id) dispatch(fetchVisitConditions(appointment.id))
  }

  const handleReactivateCondition = async (condition: any) => {
    try {
      const response = await ApiManager.reactivateCondition(patient.id, condition.patient_condition_id)
      if (response.success) {
        toast.success('Condition reactivated')
        dispatch(fetchVisitConditions(appointment.id))
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
        clinicalInsights: clinicalInsights?.data || [],
        protocols: conditionProtocols,
      }

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

  const refreshProtocols = async () => {
    try {
      const response = await ApiManager.getTreatmentProtocols({ visit_id: params.appointmentId as string })
      if (response.success && response.data) {
        const protocols = response.data.protocols || response.data || []
        const protocolMap: Record<string, { home?: any; clinical?: any }> = {}
        protocols.forEach((protocol: any) => {
          let match = visitConditions.find(vc => protocol.visit_condition_id && vc.id === protocol.visit_condition_id)
          if (!match && protocol.patient_condition_id) match = visitConditions.find(vc => vc.patient_condition_id === protocol.patient_condition_id)
          if (!match && protocol.condition_id) match = visitConditions.find(vc => vc.condition_id === protocol.condition_id)
          if (match) {
            if (!protocolMap[match.id]) protocolMap[match.id] = {}
            protocolMap[match.id][protocol.protocol_type || 'home'] = protocol
          }
        })
        setConditionProtocols(protocolMap)
      }
    } catch (error) {
      console.error('Failed to refresh protocols:', error)
    }
  }

  // ── Loading / Error states ─────────────────────────────────────

  if (loading.appointment) {
    return <AppointmentPageShell loading />
  }

  if (errors.appointment || !appointment || !patient) {
    return <AppointmentPageShell error={errors.appointment || 'Appointment not found'} />
  }

  // ── Active condition protocol helpers ──────────────────────────

  const currentHomeProtocol = activeCondition ? conditionProtocols[activeCondition.id]?.home : null
  const previousHomeProtocol = activeCondition && !currentHomeProtocol ? activeCondition.condition?.active_home_protocol : null
  const currentClinicalProtocol = activeCondition ? conditionProtocols[activeCondition.id]?.clinical : null
  const previousClinicalProtocol = activeCondition && !currentClinicalProtocol ? activeCondition.condition?.active_clinical_protocol : null

  // ── Render ─────────────────────────────────────────────────────

  return (
    <>
      <Toaster position="top-right" richColors />

      <div className="min-h-screen bg-gray-50 pb-10">
        <PatientVisitHeader
          patient={patient}
          appointment={appointment}
          onExportPDF={handleExportPDF}
          onShowFullProfile={() => setShowPatientDetailsModal(true)}
        />

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* LEFT: Focused Condition (60%) */}
            <div className="lg:col-span-3">
              <ConditionsSection
                conditions={visitConditions}
                activeConditionId={activeConditionId}
                onConditionChange={setActiveConditionId}
                loading={loading.visitConditions}
              >
                {activeCondition && (
                  <>
                    {/* Compact condition overview */}
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

                    {/* Primary work surface — tracking always visible */}
                    <ConditionTrackingPanel
                      conditionName={activeCondition.condition_name}
                      visitConditionId={activeCondition.id}
                      patientConditionId={activeCondition.patient_condition_id}
                      visitId={activeCondition.visit_id}
                    />

                    {/* Progress visualization */}
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

                    {/* Treatment History (expandable below condition) */}
                    {expandedHistory[activeCondition.id] && (
                      <div className="mt-3 bg-white rounded-lg">
                        <TreatmentHistoryViewer
                          history={conditionHistory[activeCondition.patient_condition_id]?.data || []}
                          loading={conditionHistory[activeCondition.patient_condition_id]?.loading || false}
                          onCompare={(currentId, previousId) => dispatch(compareProtocolVersions({ currentId, previousId }))}
                        />
                      </div>
                    )}
                  </>
                )}
              </ConditionsSection>
            </div>

            {/* RIGHT: Sidebar (40%) */}
            <div className="lg:col-span-2">
              <InsightsTimeline>
                {/* Quick Observation — always visible at sidebar top */}
                {activeCondition && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-teal-50/30">
                    <InlineFindingInput
                      label="Quick Observation"
                      onSubmit={async (text) => {
                        await dispatch(addClinicalInsight({
                          patientConditionId: activeCondition.patient_condition_id,
                          data: {
                            insight_text: text,
                            insight_type: 'OBSERVATION',
                            visit_id: appointment.id,
                            visit_condition_id: activeCondition.id,
                          },
                        })).unwrap()
                      }}
                    />
                  </div>
                )}

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

                {/* ── NOTES (this visit's notes — always expanded) ── */}
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

                {/* ── INSIGHTS (full condition timeline — always expanded) ── */}
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

                {/* ── DIETARY (collapsed by default) ── */}
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

                {/* ── PAST VISITS (collapsed by default) ── */}
                {patientVisits.length > 0 && (
                  <CollapsibleSection title="Past Visits" count={patientVisits.length}>
                    <PreviousVisitsPanel
                      visits={patientVisits}
                      currentVisitId={appointment.id}
                      onVisitClick={(visitId) => router.push(`/dashboard/appointments/${patient.id}/${visitId}`)}
                    />
                  </CollapsibleSection>
                )}
              </InsightsTimeline>
            </div>

          </div>
        </div>
      </div>

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
              const response = await ApiManager.getPatient(appointment.patient_id)
              if (response.success && response.data) dispatch(setPatient(response.data))
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
            await refreshProtocols()
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
