'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchAppointmentDetails,
  fetchVisitConditions,
  fetchClinicalInsights,
  fetchTreatmentHistory,
  fetchDietaryProfile,
  fetchAllContraindications,
  addClinicalInsight,
  updateVisitConditionPhaseGoals,
  generateDietaryProfile,
  addContraindication,
  compareProtocolVersions,
  selectAppointment,
  selectPatient,
  selectVisitConditions,
  selectClinicalInsights,
  selectUnusedInsights,
  selectTreatmentHistory,
  selectVersionComparison,
  selectDietaryProfile,
  selectContraindications,
  selectLoadingStates,
  selectErrors,
  setPatient,
  clearVersionComparison,
} from '@/store/slices/appointmentDetails.slice'
import { Toaster, toast } from 'sonner'
import ApiManager from '@/services/api/api.service'
import {
  ArrowLeft, User, Calendar, Clock, Stethoscope, Activity,
  FileText, Heart, Brain, Target, Plus, ChevronRight, AlertCircle,
  TrendingUp, Package, Utensils, History, ChevronDown, ChevronUp,
  Sparkles, LogOut, Check, Edit, X, Download
} from 'lucide-react'
import { format } from 'date-fns'
import NutritionSuggestions from '@/components/features/nutrition/NutritionSuggestions'
import AddInsightModal from './components/AddInsightModal'
import AddNoteModal from './components/AddNoteModal'
import EnhancedPatientDetailsModal from '@/components/features/patients/EnhancedPatientDetailsModal'
import ProtocolGeneratorModal from '@/components/features/conditions/ProtocolGeneratorModal'
import DischargeConditionDialog from '@/components/features/conditions/DischargeConditionDialog'
import { generatePatientReport } from '@/lib/utils/patientReportGenerator'

/**
 * Compact EMR Appointment Details Page
 * Features floating panels and optimized space usage
 */
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
  const treatmentHistory = useAppSelector(selectTreatmentHistory)
  const versionComparison = useAppSelector(selectVersionComparison)
  const dietaryProfile = useAppSelector(selectDietaryProfile)
  const contraindications = useAppSelector(selectContraindications)
  const loading = useAppSelector(selectLoadingStates)
  const errors = useAppSelector(selectErrors)

  // Local UI state
  const [expandedProtocols, setExpandedProtocols] = useState<Record<string, boolean>>({})
  const [conditionProtocols, setConditionProtocols] = useState<Record<string, any>>({})
  const [patientVisits, setPatientVisits] = useState<any[]>([])
  const [nutritionData, setNutritionData] = useState<any>(null)

  // Floating panel states
  const [showVisitHistory, setShowVisitHistory] = useState(false)
  const [showNutrition, setShowNutrition] = useState(false)
  const [visitNoteModalOpen, setVisitNoteModalOpen] = useState(false)

  // Modal states
  const [insightModal, setInsightModal] = useState<{
    open: boolean
    conditionId: string | null
    conditionName: string
    patientConditionId: string | null
  }>({
    open: false,
    conditionId: null,
    conditionName: '',
    patientConditionId: null
  })

  const [noteModal, setNoteModal] = useState<{
    open: boolean
    visitConditionId: string | null
    conditionName: string | null
  }>({
    open: false,
    visitConditionId: null,
    conditionName: null
  })

  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)

  // Protocol & Discharge states
  const [showProtocolGenerator, setShowProtocolGenerator] = useState(false)
  const [selectedConditionForProtocol, setSelectedConditionForProtocol] = useState<{
    conditionId: string
    conditionName: string
    patientConditionId: string
  } | null>(null)
  const [showDischargeDialog, setShowDischargeDialog] = useState(false)
  const [conditionToDischarge, setConditionToDischarge] = useState<any>(null)

  // Fetch initial data
  useEffect(() => {
    if (params.appointmentId && params.patientId) {
      dispatch(fetchAppointmentDetails({
        patientId: params.patientId as string,
        appointmentId: params.appointmentId as string
      }))
    }
  }, [params.appointmentId, params.patientId, dispatch])

  // Fetch visit conditions
  useEffect(() => {
    if (appointment?.id) {
      dispatch(fetchVisitConditions(appointment.id))
    }
  }, [appointment?.id, dispatch])

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      if (appointment?.visit_source === 'MARKETPLACE') {
        if (appointment.patientUser) {
          dispatch(setPatient(appointment.patientUser))
        }
      } else if (appointment?.patient_id) {
        const response = await ApiManager.getPatient(appointment.patient_id)
        if (response.success && response.data) {
          dispatch(setPatient(response.data))
          fetchPatientVisits(response.data.id)
        }
      }
    }
    if (appointment) {
      fetchPatient()
    }
  }, [appointment, dispatch])

  // Fetch patient visits
  const fetchPatientVisits = async (patientId: string) => {
    try {
      const response = await ApiManager.getPatientVisits(patientId)
      if (response.success && response.data) {
        setPatientVisits(response.data.visits || [])
      }
    } catch (error) {
      console.error('Failed to fetch patient visits:', error)
    }
  }

  // Fetch protocols for this visit
  useEffect(() => {
    const fetchProtocols = async () => {
      if (!params.appointmentId) return

      try {
        const response = await ApiManager.getTreatmentProtocols({
          visit_id: params.appointmentId as string
        })

        if (response.success && response.data) {
          const protocols = response.data.protocols || response.data || []
          const protocolMap: Record<string, { home?: any; clinical?: any }> = {}

          protocols.forEach((protocol: any) => {
            let matchingCondition = visitConditions.find(vc =>
              protocol.visit_condition_id && vc.id === protocol.visit_condition_id
            )

            if (!matchingCondition && protocol.patient_condition_id) {
              matchingCondition = visitConditions.find(vc =>
                vc.patient_condition_id === protocol.patient_condition_id
              )
            }

            if (!matchingCondition && protocol.condition_id) {
              matchingCondition = visitConditions.find(vc =>
                vc.condition_id === protocol.condition_id
              )
            }

            if (matchingCondition) {
              if (!protocolMap[matchingCondition.id]) {
                protocolMap[matchingCondition.id] = {}
              }
              const protocolType = protocol.protocol_type || 'home'
              protocolMap[matchingCondition.id][protocolType] = protocol
            }
          })

          setConditionProtocols(protocolMap)
        }
      } catch (error) {
        console.error('Failed to fetch protocols:', error)
      }
    }

    if (params.appointmentId && visitConditions.length > 0) {
      fetchProtocols()
    }
  }, [params.appointmentId, visitConditions])

  // Calculate age for nutrition
  const calculateAge = (dob: string) => {
    if (!dob) return null
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Get status badge style
  const getStatusBadge = (status: string) => {
    const styles = {
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
      CHECKED_IN: 'bg-purple-100 text-purple-800 border-purple-200',
      IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // Get condition border color based on focus
  const getConditionBorderColor = (treatmentFocus: string) => {
    return treatmentFocus === 'PRIMARY' ? 'border-l-brand-teal' : 'border-l-purple-500'
  }

  // Handler: Add clinical insight
  const handleAddInsight = async (data: any) => {
    if (!insightModal.patientConditionId) return
    try {
      const response = await ApiManager.addClinicalInsight(insightModal.patientConditionId, {
        ...data,
        visit_id: appointment.id,
        visit_condition_id: insightModal.conditionId
      })
      if (response.success) {
        toast.success('Clinical insight added successfully')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add insight')
      throw error
    }
  }

  // Handler: Open insight modal
  const openInsightModal = (condition: any) => {
    setInsightModal({
      open: true,
      conditionId: condition.id,
      conditionName: condition.condition_name,
      patientConditionId: condition.patient_condition_id
    })
  }

  // Handler: Close insight modal
  const closeInsightModal = () => {
    setInsightModal({
      open: false,
      conditionId: null,
      conditionName: '',
      patientConditionId: null
    })
  }

  // Handler: Open condition note modal
  const openConditionNoteModal = (condition: any) => {
    setNoteModal({
      open: true,
      visitConditionId: condition.id,
      conditionName: condition.condition_name
    })
  }

  // Handler: Close note modal
  const closeNoteModal = () => {
    setNoteModal({
      open: false,
      visitConditionId: null,
      conditionName: null
    })
  }

  // Handler: Note success
  const handleNoteSuccess = () => {
    toast.success('Note added successfully')
  }

  // Handler: Generate Protocol
  const handleGenerateProtocol = (condition: any) => {
    setSelectedConditionForProtocol({
      conditionId: condition.id,
      conditionName: condition.condition_name,
      patientConditionId: condition.patient_condition_id
    })
    setShowProtocolGenerator(true)
  }

  // Handler: Discharge Condition
  const handleDischargeCondition = (condition: any) => {
    setConditionToDischarge(condition)
    setShowDischargeDialog(true)
  }

  // Handler: Discharge Success
  const handleDischargeSuccess = async () => {
    toast.success('Condition discharged successfully')
    setShowDischargeDialog(false)
    setConditionToDischarge(null)
    if (appointment?.id) {
      dispatch(fetchVisitConditions(appointment.id))
    }
  }

  // Handler: Export PDF Report
  const handleExportPDF = async () => {
    try {
      // Helper to ensure array format
      const ensureArray = (value: any) => {
        if (Array.isArray(value)) return value
        if (typeof value === 'string') return [value]
        return []
      }

      // Prepare data for PDF
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
          name: 'HealUI Physiotherapy Clinic', // Replace with actual clinic data
          address: '123 Health Street, Medical District',
          phone: '+1 (555) 123-4567',
          email: 'contact@healui.clinic',
        },
        physiotherapist: {
          full_name: appointment.physiotherapist?.full_name || 'Dr. Physiotherapist',
          license_number: 'PT-12345',
        },
        visitConditions: visitConditions.map(vc => ({
          condition_name: vc.condition_name,
          body_region: vc.body_region,
          treatment_focus: vc.treatment_focus,
          chief_complaint: vc.chief_complaint,
          condition: vc.condition,
        })),
        clinicalInsights: clinicalInsights || [],
        protocols: conditionProtocols,
        dietaryProfile: dietaryProfile || undefined,
        contraindications: contraindications || [],
      }

      generatePatientReport(reportData)
      toast.success('Patient report generated successfully!')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate report. Please try again.')
    }
  }

  if (loading.appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-brand-teal animate-pulse mx-auto mb-3" />
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    )
  }

  if (errors.appointment || !appointment || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load appointment</h2>
          <p className="text-gray-600 mb-6">{errors.appointment || 'Appointment not found'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" richColors />

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(appointment.scheduled_date), 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {appointment.scheduled_time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {appointment.visit_type}
                    </span>
                    {patient.date_of_birth && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {calculateAge(patient.date_of_birth)}y • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-teal to-teal-600 hover:from-brand-teal/90 hover:to-teal-600/90 rounded-lg transition-all shadow-sm hover:shadow-md"
                  title="Export Patient Report"
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
                <button
                  onClick={() => setShowPatientDetailsModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-brand-teal bg-brand-teal/5 hover:bg-brand-teal/10 rounded-lg transition-colors border border-brand-teal/20"
                >
                  <User className="h-4 w-4" />
                  Full Profile
                </button>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusBadge(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Conditions Grid - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {visitConditions.length === 0 ? (
              <div className="col-span-2 text-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-200">
                <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-1">No conditions added</p>
                <p className="text-sm text-gray-500">Add conditions to start tracking treatment</p>
              </div>
            ) : (
              visitConditions.map((condition) => (
                <div
                  key={condition.id}
                  className={`bg-white rounded-lg border-l-4 border-t border-r border-b border-gray-200 shadow-sm hover:shadow-md transition-all ${getConditionBorderColor(condition.treatment_focus)}`}
                >
                  {/* Compact Condition Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-base">
                            {condition.condition_name}
                          </h3>
                          {condition.condition?.status && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              condition.condition.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                              condition.condition.status === 'DISCHARGED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {condition.condition.status}
                            </span>
                          )}
                        </div>
                        {condition.body_region && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {condition.body_region}
                          </span>
                        )}
                      </div>
                    </div>
                    {condition.chief_complaint && (
                      <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-gray-800">
                          "{condition.chief_complaint}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Compact Protocols */}
                  <div className="border-b border-gray-100">
                    {/* Home Protocol */}
                    {conditionProtocols[condition.id]?.home ? (
                      <div className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => setExpandedProtocols(prev => ({
                            ...prev,
                            [`${condition.id}-home`]: !prev[`${condition.id}-home`]
                          }))}
                          className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-700" />
                              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Home Protocol
                              </span>
                              <span className="text-xs text-gray-600">
                                • {conditionProtocols[condition.id].home.exercises?.length || 0} exercises
                                • {conditionProtocols[condition.id].home.program_duration_weeks || 0} weeks
                              </span>
                            </div>
                            {expandedProtocols[`${condition.id}-home`] ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </button>

                        {expandedProtocols[`${condition.id}-home`] && (
                          <div className="px-4 py-3 bg-white text-xs space-y-3">
                            {conditionProtocols[condition.id].home.goals && conditionProtocols[condition.id].home.goals.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Goals</div>
                                <ul className="space-y-0.5">
                                  {conditionProtocols[condition.id].home.goals.map((goal: string, idx: number) => (
                                    <li key={idx} className="text-gray-600 flex items-start gap-1.5">
                                      <span className="text-gray-400">•</span>
                                      <span>{goal}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {conditionProtocols[condition.id].home.exercises && conditionProtocols[condition.id].home.exercises.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Exercises</div>
                                <div className="space-y-2">
                                  {conditionProtocols[condition.id].home.exercises.map((exercise: any, idx: number) => (
                                    <div key={idx} className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                      <div className="font-semibold text-gray-900 mb-1 text-xs">{exercise.exercise_name}</div>
                                      <div className="flex items-center gap-3 text-[11px] text-gray-600">
                                        <span>Sets: {exercise.custom_sets}</span>
                                        <span>Reps: {exercise.custom_reps}</span>
                                        <span>Duration: {exercise.custom_duration_seconds}s</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-b border-gray-100 last:border-b-0 px-4 py-2.5 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Home Protocol
                            </span>
                            <span className="text-xs text-gray-500 italic">• Not generated</span>
                          </div>
                          <button
                            onClick={() => handleGenerateProtocol(condition)}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            Generate
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Clinical Protocol */}
                    {conditionProtocols[condition.id]?.clinical ? (
                      <div className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => setExpandedProtocols(prev => ({
                            ...prev,
                            [`${condition.id}-clinical`]: !prev[`${condition.id}-clinical`]
                          }))}
                          className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-700" />
                              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Clinical Protocol
                              </span>
                              <span className="text-xs text-gray-600">
                                • {conditionProtocols[condition.id].clinical.exercises?.length || 0} exercises
                                • {conditionProtocols[condition.id].clinical.program_duration_weeks || 0} weeks
                              </span>
                            </div>
                            {expandedProtocols[`${condition.id}-clinical`] ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </button>

                        {expandedProtocols[`${condition.id}-clinical`] && (
                          <div className="px-4 py-3 bg-white text-xs space-y-3">
                            {conditionProtocols[condition.id].clinical.goals && conditionProtocols[condition.id].clinical.goals.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Goals</div>
                                <ul className="space-y-0.5">
                                  {conditionProtocols[condition.id].clinical.goals.map((goal: string, idx: number) => (
                                    <li key={idx} className="text-gray-600 flex items-start gap-1.5">
                                      <span className="text-gray-400">•</span>
                                      <span>{goal}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {conditionProtocols[condition.id].clinical.exercises && conditionProtocols[condition.id].clinical.exercises.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Exercises</div>
                                <div className="space-y-2">
                                  {conditionProtocols[condition.id].clinical.exercises.map((exercise: any, idx: number) => (
                                    <div key={idx} className="bg-gray-50 p-2.5 rounded border border-gray-200">
                                      <div className="font-semibold text-gray-900 mb-1 text-xs">{exercise.exercise_name}</div>
                                      <div className="flex items-center gap-3 text-[11px] text-gray-600">
                                        <span>Sets: {exercise.custom_sets}</span>
                                        <span>Reps: {exercise.custom_reps}</span>
                                        <span>Duration: {exercise.custom_duration_seconds}s</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border-b border-gray-100 last:border-b-0 px-4 py-2.5 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Clinical Protocol
                            </span>
                            <span className="text-xs text-gray-500 italic">• Not generated</span>
                          </div>
                          <button
                            onClick={() => handleGenerateProtocol(condition)}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            Generate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compact Action Buttons */}
                  <div className="p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openInsightModal(condition)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-brand-teal border border-brand-teal/20 rounded-lg hover:bg-brand-teal hover:text-white transition-colors text-xs font-medium"
                      >
                        <Brain className="h-3.5 w-3.5" />
                        Insight
                      </button>
                      <button
                        onClick={() => openConditionNoteModal(condition)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-xs font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Note
                      </button>
                      <button
                        onClick={() => handleGenerateProtocol(condition)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-600 hover:text-white transition-colors text-xs font-medium"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Protocol
                      </button>
                      {condition.condition?.status !== 'DISCHARGED' ? (
                        <button
                          onClick={() => handleDischargeCondition(condition)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-600 hover:text-white transition-colors text-xs font-medium"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Discharge
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              const response = await ApiManager.reactivateCondition(patient.id, condition.patient_condition_id)
                              if (response.success) {
                                toast.success('Condition reactivated')
                                dispatch(fetchVisitConditions(appointment.id))
                              }
                            } catch (err) {
                              toast.error('Failed to reactivate')
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-green-600 border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition-colors text-xs font-medium"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
        {/* Visit History Button */}
        <button
          onClick={() => setShowVisitHistory(true)}
          className="group relative p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110"
          title="Visit History"
        >
          <History className="h-5 w-5" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Visit History
          </span>
        </button>

        {/* Add Visit Note Button (Primary) */}
        <button
          onClick={() => setVisitNoteModalOpen(true)}
          className="group relative p-5 bg-brand-teal text-white rounded-full shadow-lg hover:bg-brand-teal/90 transition-all hover:scale-110"
          title="Add Visit Note"
        >
          <FileText className="h-6 w-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Add Visit Note
          </span>
        </button>

        {/* Nutrition Button */}
        <button
          onClick={() => setShowNutrition(true)}
          className="group relative p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110"
          title="Nutrition Guide"
        >
          <Utensils className="h-5 w-5" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Nutrition Guide
          </span>
        </button>
      </div>

      {/* Slide-in Panel: Visit History */}
      {showVisitHistory && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-50 transition-opacity"
            onClick={() => setShowVisitHistory(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <History className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Visit History</h2>
                  <p className="text-sm text-gray-600">{patientVisits.length} visit{patientVisits.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={() => setShowVisitHistory(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5">
              {patientVisits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No visit history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientVisits
                    .filter(visit => visit.id !== appointment.id)
                    .map((visit) => {
                      const visitDate = new Date(visit.scheduled_date)

                      return (
                        <div
                          key={visit.id}
                          onClick={() => {
                            setShowVisitHistory(false)
                            router.push(`/dashboard/appointments/${patient.id}/${visit.id}`)
                          }}
                          className="group bg-white border border-gray-200 rounded-lg hover:border-brand-teal hover:shadow-md transition-all cursor-pointer p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {visit.visit_type?.split('_').map(word =>
                                    word.charAt(0) + word.slice(1).toLowerCase()
                                  ).join(' ')}
                                </h4>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(visit.status)}`}>
                                  {visit.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-1.5">
                                {format(visitDate, 'MMM dd, yyyy')} • {visit.scheduled_time}
                              </div>
                              {visit.chief_complaint && (
                                <p className="text-xs text-gray-600 italic line-clamp-2">
                                  "{visit.chief_complaint}"
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-brand-teal transition-colors flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Slide-in Panel: Nutrition */}
      {showNutrition && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-50 transition-opacity"
            onClick={() => setShowNutrition(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Utensils className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Nutrition Guide</h2>
                  <p className="text-sm text-gray-600">Dietary recommendations</p>
                </div>
              </div>
              <button
                onClick={() => setShowNutrition(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5">
              {patient && (
                <NutritionSuggestions
                  patientData={{
                    age: calculateAge(patient.date_of_birth),
                    gender: patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other',
                    allergies: patient.allergies,
                    currentMedications: patient.current_medications,
                    medicalHistory: patient.medical_history,
                    chiefComplaints: appointment.chief_complaint ? [appointment.chief_complaint] : [],
                    recentNotes: patientVisits
                      .filter(visit => visit.note)
                      .slice(0, 5)
                      .map(visit => JSON.stringify(visit.note?.note_data)),
                    visitHistory: patientVisits.slice(0, 10)
                  }}
                  onDataChange={setNutritionData}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <AddInsightModal
        open={insightModal.open}
        onClose={closeInsightModal}
        onSubmit={handleAddInsight}
        conditionName={insightModal.conditionName}
        visitId={appointment.id}
      />

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
          onPatientUpdate={() => {
            const fetchPatient = async () => {
              if (appointment?.patient_id) {
                const response = await ApiManager.getPatient(appointment.patient_id)
                if (response.success && response.data) {
                  dispatch(setPatient(response.data))
                }
              }
            }
            fetchPatient()
          }}
        />
      )}

      {selectedConditionForProtocol && (
        <ProtocolGeneratorModal
          isOpen={showProtocolGenerator}
          onClose={async () => {
            setShowProtocolGenerator(false)
            setSelectedConditionForProtocol(null)

            try {
              const response = await ApiManager.getTreatmentProtocols({
                visit_id: params.appointmentId as string
              })

              if (response.success && response.data) {
                const protocols = response.data.protocols || response.data || []
                const protocolMap: Record<string, { home?: any; clinical?: any }> = {}

                protocols.forEach((protocol: any) => {
                  let matchingCondition = visitConditions.find(vc =>
                    protocol.visit_condition_id && vc.id === protocol.visit_condition_id
                  )

                  if (!matchingCondition && protocol.patient_condition_id) {
                    matchingCondition = visitConditions.find(vc =>
                      vc.patient_condition_id === protocol.patient_condition_id
                    )
                  }

                  if (!matchingCondition && protocol.condition_id) {
                    matchingCondition = visitConditions.find(vc =>
                      vc.condition_id === protocol.condition_id
                    )
                  }

                  if (matchingCondition) {
                    if (!protocolMap[matchingCondition.id]) {
                      protocolMap[matchingCondition.id] = {}
                    }
                    const protocolType = protocol.protocol_type || 'home'
                    protocolMap[matchingCondition.id][protocolType] = protocol
                  }
                })

                setConditionProtocols(protocolMap)
              }
            } catch (error) {
              console.error('Failed to refresh protocols:', error)
            }
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
          onClose={() => {
            setShowDischargeDialog(false)
            setConditionToDischarge(null)
          }}
          patientId={patient?.id}
          conditionId={conditionToDischarge.patient_condition_id}
          conditionName={conditionToDischarge.condition_name}
          onSuccess={handleDischargeSuccess}
        />
      )}
    </>
  )
}
