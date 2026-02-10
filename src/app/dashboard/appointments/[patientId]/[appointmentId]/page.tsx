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
  Sparkles, LogOut, Check, Edit
} from 'lucide-react'
import { format } from 'date-fns'
import NutritionSuggestions from '@/components/features/nutrition/NutritionSuggestions'
import AddInsightModal from './components/AddInsightModal'
import AddNoteModal from './components/AddNoteModal'
import EnhancedPatientDetailsModal from '@/components/features/patients/EnhancedPatientDetailsModal'
import ProtocolGeneratorModal from '@/components/features/conditions/ProtocolGeneratorModal'
import DischargeConditionDialog from '@/components/features/conditions/DischargeConditionDialog'

/**
 * Improved Appointment Details Page
 * Clean, organized UI matching patients page design
 * Features:
 * - Condition management with protocols
 * - Clinical insights and notes
 * - Nutrition/dietary recommendations
 * - Visit history timeline
 * - Treatment progress tracking
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
  const [expandedSections, setExpandedSections] = useState({
    conditions: true,
    nutrition: true,
    visits: true,
    insights: false
  })
  const [conditionProtocols, setConditionProtocols] = useState<Record<string, any>>({})
  const [patientVisits, setPatientVisits] = useState<any[]>([])
  const [nutritionData, setNutritionData] = useState<any>(null)

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

  const [visitNoteModalOpen, setVisitNoteModalOpen] = useState(false)
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)

  // Protocol & Discharge states
  const [showProtocolGenerator, setShowProtocolGenerator] = useState(false)
  const [expandedProtocols, setExpandedProtocols] = useState<Record<string, boolean>>({})
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
          // Fetch patient visits for history
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

        console.log('Initial protocol fetch response:', response)

        if (response.success && response.data) {
          // Backend returns { protocols: [], total, page, limit, totalPages }
          const protocols = response.data.protocols || response.data || []

          console.log('Initial protocols array:', protocols)

          // Map protocols by visit_condition_id (most specific) with fallbacks
          const protocolMap: Record<string, { home?: any; clinical?: any }> = {}

          protocols.forEach((protocol: any) => {
            console.log('Mapping protocol:', {
              protocolId: protocol.id,
              protocolType: protocol.protocol_type,
              visitConditionId: protocol.visit_condition_id,
              patientConditionId: protocol.patient_condition_id,
              conditionId: protocol.condition_id
            })

            // Match by visit_condition_id first (most specific and accurate)
            let matchingCondition = visitConditions.find(vc =>
              protocol.visit_condition_id && vc.id === protocol.visit_condition_id
            )

            // Fallback: match by patient_condition_id
            if (!matchingCondition && protocol.patient_condition_id) {
              matchingCondition = visitConditions.find(vc =>
                vc.patient_condition_id === protocol.patient_condition_id
              )
            }

            // Fallback: match by static condition_id
            if (!matchingCondition && protocol.condition_id) {
              matchingCondition = visitConditions.find(vc =>
                vc.condition_id === protocol.condition_id
              )
            }

            if (matchingCondition) {
              const matchType = protocol.visit_condition_id ? 'visit_condition_id' :
                               protocol.patient_condition_id ? 'patient_condition_id' : 'condition_id'
              console.log('Matched to condition:', {
                visitConditionId: matchingCondition.id,
                conditionName: matchingCondition.condition_name,
                protocolType: protocol.protocol_type,
                matchType
              })

              // Initialize if not exists
              if (!protocolMap[matchingCondition.id]) {
                protocolMap[matchingCondition.id] = {}
              }

              // Store by protocol type (home or clinical)
              const protocolType = protocol.protocol_type || 'home'
              protocolMap[matchingCondition.id][protocolType] = protocol
            } else {
              console.log('No matching condition found for protocol')
            }
          })

          console.log('Final protocol map:', protocolMap)
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

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
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
        // Refresh insights if needed
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
    // Optionally refresh notes list
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
    // Refresh visit conditions
    if (appointment?.id) {
      dispatch(fetchVisitConditions(appointment.id))
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
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  <p className="text-sm text-gray-600">
                    {appointment.visit_type} • {format(new Date(appointment.scheduled_date), 'MMM dd, yyyy')} at {appointment.scheduled_time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusBadge(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column - Main Content (2/3) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Patient Info Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand-teal to-teal-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {patient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-xl font-semibold text-gray-900">{patient.full_name}</h2>
                      <button
                        onClick={() => setShowPatientDetailsModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-teal bg-brand-teal/5 hover:bg-brand-teal/10 rounded-lg transition-colors border border-brand-teal/20"
                      >
                        <User className="h-4 w-4" />
                        View Full Details
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.date_of_birth && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{calculateAge(patient.date_of_birth)} years</span>
                        </div>
                      )}
                      {patient.gender && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Heart className="h-4 w-4 text-gray-400" />
                          <span>{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditions Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleSection('conditions')}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-brand-teal" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">Conditions Being Treated</h3>
                      <p className="text-sm text-gray-600">{visitConditions.length} condition{visitConditions.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {expandedSections.conditions ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.conditions && (
                  <div className="px-6 pb-6 space-y-4">
                    {visitConditions.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium mb-1">No conditions added</p>
                        <p className="text-sm text-gray-500">Add conditions to start tracking treatment</p>
                      </div>
                    ) : (
                      <>
                        {/* DEBUG INFO */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs font-mono">
                          <div className="font-bold mb-2">🐛 Debug Info:</div>
                          <div>Total Conditions: {visitConditions.length}</div>
                          <div>Total Protocols Loaded: {Object.keys(conditionProtocols).length}</div>
                          <div className="mt-2">
                            <div className="font-bold">Condition Protocols:</div>
                            {visitConditions.map(c => (
                              <div key={c.id} className="ml-2">
                                • {c.id} → {c.condition_name}
                                {conditionProtocols[c.id] ? (
                                  <div className="ml-4 text-green-700">
                                    {conditionProtocols[c.id].home && '✅ Home Protocol'}
                                    {conditionProtocols[c.id].clinical && '✅ Clinical Protocol'}
                                    {!conditionProtocols[c.id].home && !conditionProtocols[c.id].clinical && '⚠️ Empty'}
                                  </div>
                                ) : ' ❌ NO PROTOCOLS'}
                              </div>
                            ))}
                          </div>
                          <div className="mt-2">
                            <div className="font-bold">Protocol Map:</div>
                            <pre className="text-xs overflow-auto max-h-32">
                              {JSON.stringify(conditionProtocols, null, 2)}
                            </pre>
                          </div>
                        </div>

                        {visitConditions.map((condition) => (
                        <div
                          key={condition.id}
                          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                          {/* Header */}
                          <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-gray-900 text-lg">
                                    {condition.condition_name}
                                  </h4>
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  {condition.body_region && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-gray-300 text-gray-700">
                                      📍 {condition.body_region}
                                    </span>
                                  )}
                                  {condition.treatment_focus && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                                      condition.treatment_focus === 'PRIMARY'
                                        ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/30'
                                        : 'bg-purple-50 text-purple-700 border-purple-200'
                                    }`}>
                                      {condition.treatment_focus === 'PRIMARY' ? '⭐ Primary' : '◐ Secondary'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {condition.chief_complaint && (
                              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm text-gray-800 font-medium">
                                  💬 "{condition.chief_complaint}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Active Protocols Display (Home & Clinical) */}
                          {conditionProtocols[condition.id] && (
                            <div className="border-y border-gray-200">
                              {/* Home Protocol */}
                              {conditionProtocols[condition.id].home && (
                                <div className="border-b border-gray-200 last:border-b-0">
                                  <button
                                    onClick={() => setExpandedProtocols(prev => ({
                                      ...prev,
                                      [`${condition.id}-home`]: !prev[`${condition.id}-home`]
                                    }))}
                                    className="w-full px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Package className="h-4 w-4 text-gray-700" />
                                          <p className="text-xs font-mono font-semibold text-gray-700 uppercase tracking-wider">
                                            Active Home Protocol
                                          </p>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-200 text-gray-800 border border-gray-300">
                                            HOME
                                          </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mb-1 font-mono">
                                          {conditionProtocols[condition.id].home.protocol_title}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
                                          {conditionProtocols[condition.id].home.exercises?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Activity className="h-3 w-3" />
                                              {conditionProtocols[condition.id].home.exercises.length} exercises
                                            </span>
                                          )}
                                          {conditionProtocols[condition.id].home.program_duration_weeks && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {conditionProtocols[condition.id].home.program_duration_weeks} weeks
                                            </span>
                                          )}
                                          {conditionProtocols[condition.id].home.goals?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Target className="h-3 w-3" />
                                              {conditionProtocols[condition.id].home.goals.length} goals
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {expandedProtocols[`${condition.id}-home`] ? (
                                        <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                      )}
                                    </div>
                                  </button>

                                  {/* Expandable Content */}
                                  {expandedProtocols[`${condition.id}-home`] && (
                                    <div className="px-5 py-4 bg-white border-t border-gray-200 font-mono text-xs">
                                      {/* Protocol Header */}
                                      <div className="mb-4 pb-3 border-b border-gray-200">
                                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                                          <div><span className="text-gray-400">Duration:</span> {conditionProtocols[condition.id].home.program_duration_weeks} weeks</div>
                                          <div><span className="text-gray-400">Status:</span> {conditionProtocols[condition.id].home.status}</div>
                                        </div>
                                      </div>

                                      {/* Goals */}
                                      {conditionProtocols[condition.id].home.goals && conditionProtocols[condition.id].home.goals.length > 0 && (
                                        <div className="mb-4">
                                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Treatment Goals</div>
                                          <ul className="space-y-1">
                                            {conditionProtocols[condition.id].home.goals.map((goal: string, idx: number) => (
                                              <li key={idx} className="text-gray-600 flex items-start gap-2">
                                                <span className="text-gray-400">→</span>
                                                <span>{goal}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Exercises */}
                                      {conditionProtocols[condition.id].home.exercises && conditionProtocols[condition.id].home.exercises.length > 0 && (
                                        <div className="mb-4">
                                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Exercise Protocol</div>
                                          <div className="space-y-3">
                                            {conditionProtocols[condition.id].home.exercises.map((exercise: any, idx: number) => (
                                              <div key={idx} className="bg-gray-50 p-3 border border-gray-200">
                                                <div className="font-semibold text-gray-900 mb-1">{exercise.exercise_name}</div>
                                                {exercise.exercise_description && (
                                                  <div className="text-gray-600 mb-2 text-[11px]">{exercise.exercise_description}</div>
                                                )}
                                                <div className="grid grid-cols-3 gap-2 text-gray-600 text-[11px]">
                                                  <div><span className="text-gray-400">Sets:</span> {exercise.custom_sets}</div>
                                                  <div><span className="text-gray-400">Reps:</span> {exercise.custom_reps}</div>
                                                  <div><span className="text-gray-400">Duration:</span> {exercise.custom_duration_seconds}s</div>
                                                </div>
                                                {exercise.frequency && (
                                                  <div className="mt-1 text-gray-600 text-[11px]"><span className="text-gray-400">Frequency:</span> {exercise.frequency}</div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Treatment Phases */}
                                      {conditionProtocols[condition.id].home.treatment_phases && conditionProtocols[condition.id].home.treatment_phases.length > 0 && (
                                        <div className="mb-4">
                                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Treatment Phases</div>
                                          <div className="space-y-2">
                                            {conditionProtocols[condition.id].home.treatment_phases.map((phase: any, idx: number) => (
                                              <div key={idx} className="bg-gray-50 p-2 border-l-2 border-gray-400">
                                                <div className="font-semibold text-gray-900">{phase.phase_name || `Phase ${idx + 1}`}</div>
                                                {phase.duration_weeks && (
                                                  <div className="text-gray-600 text-[11px]">Duration: {phase.duration_weeks} weeks</div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Clinical Protocol */}
                              {conditionProtocols[condition.id].clinical && (
                                <div className="border-b border-gray-200 last:border-b-0">
                                  <button
                                    onClick={() => setExpandedProtocols(prev => ({
                                      ...prev,
                                      [`${condition.id}-clinical`]: !prev[`${condition.id}-clinical`]
                                    }))}
                                    className="w-full px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Package className="h-4 w-4 text-gray-700" />
                                          <p className="text-xs font-mono font-semibold text-gray-700 uppercase tracking-wider">
                                            Active Clinical Protocol
                                          </p>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-200 text-gray-800 border border-gray-300">
                                            CLINICAL
                                          </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mb-1 font-mono">
                                          {conditionProtocols[condition.id].clinical.protocol_title}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-600 font-mono">
                                          {conditionProtocols[condition.id].clinical.exercises?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Activity className="h-3 w-3" />
                                              {conditionProtocols[condition.id].clinical.exercises.length} exercises
                                            </span>
                                          )}
                                          {conditionProtocols[condition.id].clinical.program_duration_weeks && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {conditionProtocols[condition.id].clinical.program_duration_weeks} weeks
                                            </span>
                                          )}
                                          {conditionProtocols[condition.id].clinical.goals?.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Target className="h-3 w-3" />
                                              {conditionProtocols[condition.id].clinical.goals.length} goals
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {expandedProtocols[`${condition.id}-clinical`] ? (
                                        <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                                      )}
                                    </div>
                                  </button>

                                  {/* Expandable Content */}
                                  {expandedProtocols[`${condition.id}-clinical`] && (
                                    <div className="px-5 py-4 bg-white border-t border-gray-200 font-mono text-xs">
                                      {/* Protocol Header */}
                                      <div className="mb-4 pb-3 border-b border-gray-200">
                                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                                          <div><span className="text-gray-400">Duration:</span> {conditionProtocols[condition.id].clinical.program_duration_weeks} weeks</div>
                                          <div><span className="text-gray-400">Status:</span> {conditionProtocols[condition.id].clinical.status}</div>
                                        </div>
                                      </div>

                                      {/* Goals */}
                                      {conditionProtocols[condition.id].clinical.goals && conditionProtocols[condition.id].clinical.goals.length > 0 && (
                                        <div className="mb-4">
                                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Treatment Goals</div>
                                          <ul className="space-y-1">
                                            {conditionProtocols[condition.id].clinical.goals.map((goal: string, idx: number) => (
                                              <li key={idx} className="text-gray-600 flex items-start gap-2">
                                                <span className="text-gray-400">→</span>
                                                <span>{goal}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Exercises */}
                                      {conditionProtocols[condition.id].clinical.exercises && conditionProtocols[condition.id].clinical.exercises.length > 0 && (
                                        <div className="mb-4">
                                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Exercise Protocol</div>
                                          <div className="space-y-3">
                                            {conditionProtocols[condition.id].clinical.exercises.map((exercise: any, idx: number) => (
                                              <div key={idx} className="bg-gray-50 p-3 border border-gray-200">
                                                <div className="font-semibold text-gray-900 mb-1">{exercise.exercise_name}</div>
                                                {exercise.exercise_description && (
                                                  <div className="text-gray-600 mb-2 text-[11px]">{exercise.exercise_description}</div>
                                                )}
                                                <div className="grid grid-cols-3 gap-2 text-gray-600 text-[11px]">
                                                  <div><span className="text-gray-400">Sets:</span> {exercise.custom_sets}</div>
                                                  <div><span className="text-gray-400">Reps:</span> {exercise.custom_reps}</div>
                                                  <div><span className="text-gray-400">Duration:</span> {exercise.custom_duration_seconds}s</div>
                                                </div>
                                                {exercise.frequency && (
                                                  <div className="mt-1 text-gray-600 text-[11px]"><span className="text-gray-400">Frequency:</span> {exercise.frequency}</div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Treatment Phases */}
                                      {conditionProtocols[condition.id].clinical.treatment_phases && conditionProtocols[condition.id].clinical.treatment_phases.length > 0 && (
                                        <div className="mb-4">
                                          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Treatment Phases</div>
                                          <div className="space-y-2">
                                            {conditionProtocols[condition.id].clinical.treatment_phases.map((phase: any, idx: number) => (
                                              <div key={idx} className="bg-gray-50 p-2 border-l-2 border-gray-400">
                                                <div className="font-semibold text-gray-900">{phase.phase_name || `Phase ${idx + 1}`}</div>
                                                {phase.duration_weeks && (
                                                  <div className="text-gray-600 text-[11px]">Duration: {phase.duration_weeks} weeks</div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons Grid */}
                          <div className="p-4 bg-gray-50">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => openInsightModal(condition)}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-brand-teal border border-brand-teal/20 rounded-lg hover:bg-brand-teal hover:text-white transition-colors text-sm font-medium shadow-sm"
                                title="Add Clinical Insight"
                              >
                                <Brain className="h-4 w-4" />
                                Insight
                              </button>
                              <button
                                onClick={() => openConditionNoteModal(condition)}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-sm font-medium shadow-sm"
                                title="Add Note"
                              >
                                <FileText className="h-4 w-4" />
                                Note
                              </button>
                              <button
                                onClick={() => handleGenerateProtocol(condition)}
                                className={`flex items-center justify-center gap-2 px-3 py-2.5 bg-white border rounded-lg transition-colors text-sm font-medium shadow-sm ${
                                  conditionProtocols[condition.id]
                                    ? 'text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white'
                                    : 'text-purple-600 border-purple-200 hover:bg-purple-600 hover:text-white'
                                }`}
                                title={conditionProtocols[condition.id] ? 'Generate New Protocol' : 'Generate AI Protocol'}
                              >
                                <Sparkles className="h-4 w-4" />
                                {conditionProtocols[condition.id] ? 'New Protocol' : 'AI Protocol'}
                              </button>
                              {condition.condition?.status !== 'DISCHARGED' ? (
                                <button
                                  onClick={() => handleDischargeCondition(condition)}
                                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-600 hover:text-white transition-colors text-sm font-medium shadow-sm"
                                  title="Discharge Condition"
                                >
                                  <LogOut className="h-4 w-4" />
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
                                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-green-600 border border-green-200 rounded-lg hover:bg-green-600 hover:text-white transition-colors text-sm font-medium shadow-sm"
                                  title="Reactivate Condition"
                                >
                                  <Check className="h-4 w-4" />
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Nutrition Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleSection('nutrition')}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">Nutrition & Dietary Guidance</h3>
                      <p className="text-sm text-gray-600">AI-powered recommendations</p>
                    </div>
                  </div>
                  {expandedSections.nutrition ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.nutrition && patient && (
                  <div className="px-6 pb-6">
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
                  </div>
                )}
              </div>

            </div>

            {/* Right Column - Sidebar (1/3) */}
            <div className="space-y-6">

              {/* Visit History Section - Clean UI */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleSection('visits')}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">Visit History</h3>
                      <p className="text-sm text-gray-600">{patientVisits.length} total visit{patientVisits.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {expandedSections.visits ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {expandedSections.visits && (
                  <div className="px-6 pb-6">
                    {patientVisits.length === 0 ? (
                      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">No visit history</p>
                        <p className="text-sm text-gray-500">This is the patient's first visit</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {patientVisits
                          .filter(visit => visit.id !== appointment.id)
                          .slice(0, 20)
                          .map((visit) => {
                            const visitDate = new Date(visit.scheduled_date)
                            const isCompleted = visit.status === 'COMPLETED'
                            const hasNote = visit.note

                            return (
                              <div
                                key={visit.id}
                                onClick={() => router.push(`/dashboard/appointments/${patient.id}/${visit.id}`)}
                                className="group bg-white border border-gray-200 rounded-lg hover:border-brand-teal hover:shadow-md transition-all cursor-pointer overflow-hidden"
                              >
                                <div className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      {/* Icon */}
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        isCompleted ? 'bg-green-100' :
                                        visit.status === 'SCHEDULED' ? 'bg-blue-100' :
                                        visit.status === 'CANCELLED' ? 'bg-red-100' :
                                        'bg-gray-100'
                                      }`}>
                                        <Calendar className={`h-5 w-5 ${
                                          isCompleted ? 'text-green-600' :
                                          visit.status === 'SCHEDULED' ? 'text-blue-600' :
                                          visit.status === 'CANCELLED' ? 'text-red-600' :
                                          'text-gray-600'
                                        }`} />
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          <h4 className="font-semibold text-gray-900 text-sm">
                                            {visit.visit_type?.split('_').map(word =>
                                              word.charAt(0) + word.slice(1).toLowerCase()
                                            ).join(' ')}
                                          </h4>
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(visit.status)}`}>
                                            {visit.status.replace('_', ' ')}
                                          </span>
                                          {hasNote && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                              <FileText className="h-3 w-3 mr-1" />
                                              Has Note
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {format(visitDate, 'MMM dd, yyyy')} • {visit.scheduled_time}
                                          </span>
                                          {visit.physiotherapist?.full_name && (
                                            <span className="flex items-center gap-1">
                                              <Stethoscope className="h-3.5 w-3.5" />
                                              Dr. {visit.physiotherapist.full_name}
                                            </span>
                                          )}
                                        </div>
                                        {visit.chief_complaint && (
                                          <p className="text-xs text-gray-600 mt-2 line-clamp-1 italic">
                                            "{visit.chief_complaint}"
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-brand-teal transition-colors flex-shrink-0" />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setVisitNoteModalOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-brand-teal/5 text-brand-teal rounded-lg hover:bg-brand-teal/10 transition-colors font-medium"
                  >
                    <FileText className="h-5 w-5" />
                    <span>Add Visit Note</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                    <Target className="h-5 w-5" />
                    <span>Update Treatment Goals</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                    <Brain className="h-5 w-5" />
                    <span>Generate Protocol</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

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

      {/* Patient Details Modal with Conditions & AI Protocol Generation */}
      {showPatientDetailsModal && patient && (
        <EnhancedPatientDetailsModal
          patient={patient as any}
          onClose={() => setShowPatientDetailsModal(false)}
          onScheduleVisit={() => {
            setShowPatientDetailsModal(false)
            toast.info('Schedule visit from appointments page')
          }}
          onPatientUpdate={() => {
            // Refresh patient data
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

      {/* Protocol Generator Modal */}
      {selectedConditionForProtocol && (
        <ProtocolGeneratorModal
          isOpen={showProtocolGenerator}
          onClose={async () => {
            setShowProtocolGenerator(false)
            setSelectedConditionForProtocol(null)

            // Refresh protocols after saving
            try {
              const response = await ApiManager.getTreatmentProtocols({
                visit_id: params.appointmentId as string
              })

              console.log('Protocol refresh response:', response)

              if (response.success && response.data) {
                // Backend returns { protocols: [], total, page, limit, totalPages }
                const protocols = response.data.protocols || response.data || []

                console.log('Protocols array:', protocols)

                const protocolMap: Record<string, { home?: any; clinical?: any }> = {}
                protocols.forEach((protocol: any) => {
                  // Match by visit_condition_id first (most specific)
                  let matchingCondition = visitConditions.find(vc =>
                    protocol.visit_condition_id && vc.id === protocol.visit_condition_id
                  )

                  // Fallback: match by patient_condition_id
                  if (!matchingCondition && protocol.patient_condition_id) {
                    matchingCondition = visitConditions.find(vc =>
                      vc.patient_condition_id === protocol.patient_condition_id
                    )
                  }

                  // Fallback: match by static condition_id
                  if (!matchingCondition && protocol.condition_id) {
                    matchingCondition = visitConditions.find(vc =>
                      vc.condition_id === protocol.condition_id
                    )
                  }

                  if (matchingCondition) {
                    console.log('Matched protocol:', {
                      protocolId: protocol.id,
                      protocolType: protocol.protocol_type,
                      visitConditionId: matchingCondition.id,
                      matchType: protocol.visit_condition_id ? 'visit_condition_id' :
                                 protocol.patient_condition_id ? 'patient_condition_id' : 'condition_id'
                    })

                    // Initialize if not exists
                    if (!protocolMap[matchingCondition.id]) {
                      protocolMap[matchingCondition.id] = {}
                    }

                    // Store by protocol type (home or clinical)
                    const protocolType = protocol.protocol_type || 'home'
                    protocolMap[matchingCondition.id][protocolType] = protocol
                  }
                })

                console.log('Final protocol map:', protocolMap)
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

      {/* Discharge Condition Dialog */}
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
