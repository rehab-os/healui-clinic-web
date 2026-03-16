'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, ArrowRight, CheckCircle, Brain, Home, Activity, Zap, Target, Plus, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ApiManager from '@/services/api/api.service'
import { toast } from 'sonner'
import { AIBubbleLoader } from '@/components/ui/AIBubbleLoader'
import {
  ProtocolGenerationRequest,
  DirectProtocolGenerationRequest,
  GeneratedProtocol,
  ProtocolGenerationStep,
  TreatmentPhase,
  ExerciseProtocol,
  ModalityProtocol,
  ProtocolPreferences,
  EditableProtocol,
  EditableTreatmentPhase,
  EditableExercise,
  RedFlag,
  ContraindicationWarning,
  ProtocolLoggingType,
  ManualExerciseFormData,
  ManualModalityFormData,
  ManualTherapyFormData,
  CreateProtocolLoggingRequest,
} from '@/lib/types/protocol-generator.types'
import SafetyWarnings from './SafetyWarnings'
import ProtocolCustomizationStep from './ProtocolCustomizationStep'

interface ProtocolGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  conditionId: string
  conditionName: string
  patientName?: string
  visitId?: string
  visitConditionId?: string
}

// Cycling messages for the generating step
const GENERATING_MESSAGES = [
  'Analyzing patient profile...',
  'Reviewing condition assessment...',
  'Building treatment protocol...',
  'Selecting evidence-based exercises...',
  'Optimizing exercise prescription...',
  'Structuring treatment phases...',
  'Finalizing protocol...',
]

const ProtocolGeneratorModal: React.FC<ProtocolGeneratorModalProps> = ({
  isOpen,
  onClose,
  patientId,
  conditionId,
  conditionName,
  patientName,
  visitId,
  visitConditionId
}) => {
  const [step, setStep] = useState<ProtocolGenerationStep>('selection')
  const [protocol, setProtocol] = useState<GeneratedProtocol | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includeHEP, setIncludeHEP] = useState(true)

  // Data for direct protocol generation
  const [patientData, setPatientData] = useState<any>(null)
  const [conditionData, setConditionData] = useState<any>(null)
  const [staticConditionData, setStaticConditionData] = useState<any>(null)
  const [insightsData, setInsightsData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Customization state
  const [customizedProtocol, setCustomizedProtocol] = useState<GeneratedProtocol | null>(null)
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0)

  // Generating animation
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0)

  // Clinical configuration for protocol generation
  const [preferences, setPreferences] = useState<ProtocolPreferences>({
    primaryFocus: 'function',
    progressionApproach: 'standard',
    patientEngagement: 'moderate',
    programDuration: 6,
    setting: 'clinic'
  })

  // Save state
  const [saving, setSaving] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('selection')
      setProtocol(null)
      setLoading(false)
      setError(null)
      setIncludeHEP(true)
      setPatientData(null)
      setConditionData(null)
      setStaticConditionData(null)
      setInsightsData([])
      setDataLoading(false)
      setCustomizedProtocol(null)
      setGeneratingMessageIndex(0)
    }
  }, [isOpen])

  // Fetch all required data when modal opens
  useEffect(() => {
    if (isOpen && patientId && conditionId) {
      fetchAllRequiredData()
    }
  }, [isOpen, patientId, conditionId])

  // Cycle generating messages
  useEffect(() => {
    if (step !== 'generating') return
    const interval = setInterval(() => {
      setGeneratingMessageIndex(prev => (prev + 1) % GENERATING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [step])

  // Local condition lookup function using the database file
  const findConditionIdByName = async (conditionName: string): Promise<string | null> => {
    try {
      const response = await fetch('/database/conditions_for_agent.json')
      if (!response.ok) {
        console.warn('Failed to load local conditions database')
        return null
      }

      const conditionsData = await response.json()
      const conditions = conditionsData.conditions || conditionsData

      const searchVariations = [
        conditionName,
        conditionName.toLowerCase(),
        conditionName.replace(/\s+/g, ' ').trim(),
        conditionName.replace('Ankle Lateral Ligament Sprain', 'Ankle Sprain (Lateral)'),
        conditionName.replace('Lateral Ankle Sprain', 'Ankle Sprain (Lateral)'),
        conditionName.replace('Ankle Sprain Lateral', 'Ankle Sprain (Lateral)'),
      ]

      for (const variation of searchVariations) {
        const match = conditions.find((condition: any) => {
          const condName = (condition.name || '').toLowerCase()
          const varLower = variation.toLowerCase()
          return condName === varLower || condName.includes(varLower) || varLower.includes(condName)
        })

        if (match) {
          return match.id
        }
      }

      return null
    } catch (error) {
      console.error('Error loading local conditions database:', error)
      return null
    }
  }

  const fetchAllRequiredData = async () => {
    try {
      setDataLoading(true)
      setError(null)

      const patientResponse = await ApiManager.getPatient(patientId)
      if (!patientResponse.success) {
        throw new Error('Failed to fetch patient data')
      }

      const conditionResponse = await ApiManager.getPatientConditions(patientId)
      if (!conditionResponse.success) {
        throw new Error('Failed to fetch condition data')
      }

      const condition = conditionResponse.data.find((c: any) => c.id === conditionId)
      if (!condition) {
        throw new Error('Condition not found')
      }

      let staticResponse = null
      if (condition.condition_id) {
        staticResponse = await ApiManager.getConditionByIdentifier(condition.condition_id)
        if (!staticResponse.success) {
          console.warn('Failed to fetch static condition data, will use basic data')
        }
      } else {
        try {
          const foundConditionId = await findConditionIdByName(condition.condition_name)

          if (foundConditionId) {
            staticResponse = await ApiManager.getConditionByIdentifier(foundConditionId)
          } else {
            const searchResponse = await ApiManager.searchConditions({ query: condition.condition_name })
            if (searchResponse.success && searchResponse.data.length > 0) {
              const matchedCondition = searchResponse.data[0]
              if (matchedCondition.condition_id) {
                staticResponse = await ApiManager.getConditionByIdentifier(matchedCondition.condition_id)
              }
            }
          }
        } catch (searchError) {
          console.error('Error searching for condition:', searchError)
        }
      }

      // Fetch clinical insights for the condition
      let insights: any[] = []
      try {
        const insightsResponse = await ApiManager.getClinicalInsights(conditionId)
        if (insightsResponse.success && insightsResponse.data) {
          insights = insightsResponse.data.insights || insightsResponse.data || []
        }
      } catch (insightErr) {
        console.warn('Could not fetch clinical insights, proceeding without:', insightErr)
      }

      setPatientData(patientResponse.data)
      setConditionData(condition)
      setStaticConditionData(staticResponse?.data || null)
      setInsightsData(insights)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(error.message || 'Failed to load required data')
      toast.error(error.message || 'Failed to load required data for protocol generation')
    } finally {
      setDataLoading(false)
    }
  }

  const generateProtocol = async () => {
    try {
      if (!patientData || !conditionData) {
        throw new Error('Required patient or condition data not loaded')
      }

      const calculateAge = (dateOfBirth: string): number => {
        if (!dateOfBirth) return 0
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        return age
      }

      const directRequest: DirectProtocolGenerationRequest = {
        patient: {
          fullName: patientData.full_name || 'Unknown Patient',
          age: calculateAge(patientData.date_of_birth),
          gender: patientData.gender || 'Unknown',
          occupation: patientData.occupation || 'Not specified',
          activityLevel: patientData.activity_level || 'MODERATE',
          medicalHistory: patientData.medical_history || [],
          previousSurgeries: patientData.previous_surgeries || [],
          medications: patientData.medications || [],
          chronicConditions: patientData.chronic_conditions || []
        },
        patientCondition: {
          name: conditionData.condition_name || conditionName,
          severity: conditionData.severity_level || 'moderate',
          painLevel: conditionData.vas_score || 5,
          functionalLimitations: conditionData.functional_limitation_level || {},
          redFlags: conditionData.red_flag_notes || {},
          differentialDiagnosis: conditionData.initial_assessment_data?.differential_diagnosis || null,
          initialAssessment: conditionData.initial_assessment_data || null,
          description: conditionData.description || '',
          onsetDate: conditionData.onset_date || '',
          chiefComplaint: conditionData.chief_complaint || '',
          clinicalObservations: insightsData.length > 0 ? insightsData.map((insight: any) => ({
            text: insight.insight_text,
            type: insight.insight_type,
            date: insight.created_at,
            painLevel: insight.context_metadata?.pain_level,
            functionalStatus: insight.context_metadata?.functional_status,
            patientCompliance: insight.context_metadata?.patient_compliance,
          })) : undefined,
        },
        staticCondition: {
          conditionName: staticConditionData?.condition_name || conditionName,
          exercises: staticConditionData?.exercise_prescriptions || [],
          modalities: staticConditionData?.modalities || [],
          manualTherapy: staticConditionData?.manual_therapy || [],
          contraindications: staticConditionData?.contraindications || {},
          redFlags: staticConditionData?.red_flags || {},
          yellowFlags: staticConditionData?.yellow_flags || [],
          specialTests: staticConditionData?.special_tests || {},
          outcomeMeasures: staticConditionData?.outcome_measures || {},
          prognosisTimeline: staticConditionData?.prognosis_timeline || {},
          icd10Codes: staticConditionData?.icd10_codes || {},
          cptCodes: staticConditionData?.cpt_codes || []
        },
        planType: 'clinical',
        preferences: {
          ...preferences,
          includeHEP,
          programDuration: preferences.programDuration || 6,
        } as any
      }

      const response = await ApiManager.generateProtocolDirect(directRequest)

      if (response.success && response.data) {
        setProtocol(response.data)
        setCustomizedProtocol(response.data)

        toast.success('Treatment protocol successfully generated')
      } else {
        throw new Error(response.message || 'Failed to generate protocol')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate protocol')
      toast.error(err.message || 'Failed to generate protocol')
      throw err // re-throw so handleGenerate can catch
    }
  }

  const handleGenerate = async () => {
    if (dataLoading) {
      toast.info('Loading required data for protocol generation...')
      return
    }

    if (!patientData || !conditionData) {
      toast.error('Required patient or condition data is not available. Please try again.')
      return
    }

    setLoading(true)
    setError(null)
    setStep('generating')
    setGeneratingMessageIndex(0)

    try {
      await generateProtocol()
      setStep('results')
    } catch (err) {
      console.error('Error generating protocol:', err)
      setStep('selection')
    } finally {
      setLoading(false)
    }
  }

  const handleProtocolUpdate = (updatedProtocol: GeneratedProtocol) => {
    setCustomizedProtocol(updatedProtocol)
  }

  // Log manual entries to protocol_loggings table
  const handleManualEntryLog = async (
    type: ProtocolLoggingType,
    itemName: string,
    itemData: ManualExerciseFormData | ManualModalityFormData | ManualTherapyFormData,
    treatmentPhaseName: string,
    treatmentPhaseIndex: number
  ) => {
    try {
      const logData: CreateProtocolLoggingRequest = {
        patientId,
        conditionId,
        conditionName,
        visitId,
        type,
        protocolType: 'clinical',
        treatmentPhaseName,
        treatmentPhaseIndex,
        itemName,
        itemData,
      }
      await ApiManager.createProtocolLogging(logData)
    } catch (error) {
      console.error('Failed to log manual entry:', error)
    }
  }

  // Save protocol and log AI vs physio comparison
  const handleSaveProtocol = async () => {
    setSaving(true)

    try {
      const originalProtocol = protocol
      const finalProtocol = customizedProtocol || originalProtocol

      if (!originalProtocol || !finalProtocol) {
        toast.error('No protocol data available to save.')
        setSaving(false)
        return
      }

      if (!visitId) {
        toast.warning('Protocol can only be saved during a visit. Please open from an appointment/visit page.')
        setSaving(false)
        return
      }

      // Build ai_sent (what AI suggested)
      const aiSent = {
        phases: originalProtocol.treatmentPhases.map(phase => ({
          phaseName: phase.phaseName,
          durationWeeks: phase.durationWeeks,
          goals: phase.primaryGoals || [],
          exercises: phase.exercises.map(ex => ({
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            repetitions: ex.repetitions,
            frequency: ex.frequency,
          })),
          modalities: phase.modalities.map(mod => ({
            modalityName: mod.modalityName,
            duration: mod.duration,
            frequency: mod.frequency,
          })),
          manualTherapy: phase.manualTherapy?.map(mt => ({
            technique: mt.technique,
            frequency: mt.frequency,
            sessionDuration: mt.sessionDuration,
          })) || [],
        })),
        goals: originalProtocol.treatmentPhases.flatMap(p => p.primaryGoals || []),
        preferences: {
          primaryFocus: preferences.primaryFocus,
          progressionApproach: preferences.progressionApproach,
          patientEngagement: preferences.patientEngagement,
          programDuration: preferences.programDuration,
        },
      }

      // Build physio_prescribed (what physio finalized)
      const physioPrescribed = {
        selectedPhases: finalProtocol.treatmentPhases.map(p => p.phaseName),
        selectedGoals: finalProtocol.treatmentPhases.flatMap(p => p.primaryGoals || []),
        exercises: finalProtocol.treatmentPhases.flatMap(phase =>
          phase.exercises.map(ex => ({
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            repetitions: ex.repetitions,
            frequency: ex.frequency,
            instructions: ex.instructions,
          }))
        ),
        modalities: finalProtocol.treatmentPhases.flatMap(phase =>
          phase.modalities.map(mod => ({
            modalityName: mod.modalityName,
            duration: mod.duration,
            frequency: mod.frequency,
          }))
        ),
        manualTherapy: finalProtocol.treatmentPhases.flatMap(phase =>
          (phase.manualTherapy || []).map(mt => ({
            technique: mt.technique,
            frequency: mt.frequency,
            sessionDuration: mt.sessionDuration,
          }))
        ),
      }

      await ApiManager.createProtocolGenerationLog({
        patientId,
        conditionId,
        conditionName,
        visitId,
        protocolType: 'clinical',
        aiSent,
        physioPrescribed,
      })

      // Helper functions
      const parseReps = (reps: any): number => {
        if (!reps) return 10
        if (typeof reps === 'number') return Math.max(1, Math.min(100, Math.floor(reps)))
        if (typeof reps === 'string') {
          const num = parseInt(reps)
          if (isNaN(num)) return 10
          return Math.max(1, Math.min(100, num))
        }
        return 10
      }

      const parseSets = (sets: any): number => {
        if (!sets) return 3
        if (typeof sets === 'number') return Math.max(1, Math.min(20, Math.floor(sets)))
        if (typeof sets === 'string') {
          const num = parseInt(sets)
          if (isNaN(num)) return 3
          return Math.max(1, Math.min(20, num))
        }
        return 3
      }

      const parseDurationToSeconds = (duration: any): number => {
        if (!duration) return 60
        if (typeof duration === 'number') return Math.max(5, Math.min(3600, duration))
        if (typeof duration === 'string') {
          const str = duration.toLowerCase().trim()
          const num = parseFloat(str)
          if (isNaN(num)) return 60
          if (str.includes('min')) return Math.max(5, Math.min(3600, num * 60))
          return Math.max(5, Math.min(3600, num))
        }
        return 60
      }

      const mapExercise = (ex: ExerciseProtocol, phaseIndex: number, exIndex: number) => ({
        exercise_name: ex.exerciseName,
        exercise_description: ex.instructions || '',
        custom_reps: parseReps(ex.repetitions),
        custom_sets: parseSets(ex.sets),
        custom_duration_seconds: parseDurationToSeconds(ex.holdDuration),
        custom_notes: ex.safetyNotes || '',
        frequency: ex.frequency || 'Daily',
        order_index: phaseIndex * 100 + exIndex,
      })

      const allExercises = finalProtocol.treatmentPhases.flatMap((phase, phaseIndex) =>
        phase.exercises.map((ex, exIndex) => ({ ...mapExercise(ex, phaseIndex, exIndex), _isHome: ex.isHomeExercise ?? false }))
      )

      const clinicalExercises = allExercises.map(({ _isHome, ...rest }) => rest)

      const homeExercises = allExercises
        .filter(ex => ex._isHome)
        .map(({ _isHome, ...rest }, idx) => ({ ...rest, order_index: idx }))

      const modalities = finalProtocol.treatmentPhases.flatMap(phase =>
        phase.modalities.map(mod => ({
          modalityName: mod.modalityName,
          duration: mod.duration,
          frequency: mod.frequency,
          parameters: mod.parameters || '',
          applicationMethod: mod.applicationMethod || '',
          clinicalSupervisionRequired: mod.clinicalSupervisionRequired || false,
        }))
      )

      const manualTherapy = finalProtocol.treatmentPhases.flatMap(phase =>
        (phase.manualTherapy || []).map(mt => ({
          technique: mt.technique,
          frequency: mt.frequency,
          sessionDuration: mt.sessionDuration,
          clinicalOnly: mt.clinicalOnly || false,
          expectedOutcome: mt.expectedOutcome || '',
        }))
      )

      const treatmentPhases = finalProtocol.treatmentPhases.map(phase => ({
        phaseName: phase.phaseName,
        durationWeeks: phase.durationWeeks,
        goals: phase.primaryGoals || [],
      }))

      const goals = finalProtocol.treatmentPhases.flatMap(p => p.primaryGoals || [])

      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }

      const staticConditionId = conditionData?.condition_id || staticConditionData?.id
      const validConditionId = staticConditionId && isValidUUID(staticConditionId)
        ? staticConditionId
        : undefined

      const baseProtocolData: any = {
        visit_id: visitId,
        visit_condition_id: visitConditionId,
        patient_condition_id: conditionId,
        current_complaint: conditionData?.chief_complaint || '',
        general_notes: (finalProtocol as any).clinicalNotes || '',
        show_explanations: true,
        condition_name: conditionName,
        modalities: modalities,
        manual_therapy: manualTherapy,
        treatment_phases: treatmentPhases,
        goals: goals,
        program_duration_weeks: preferences.programDuration || 6,
      }

      if (validConditionId) {
        baseProtocolData.condition_id = validConditionId
      }

      // 1. Save clinical protocol (all exercises)
      const clinicalProtocolData = {
        ...baseProtocolData,
        protocol_title: `${conditionName} - Treatment Protocol`,
        protocol_type: 'clinical',
        exercises: clinicalExercises,
      }

      const response = await ApiManager.createTreatmentProtocol(clinicalProtocolData)

      if (!response.success) {
        throw new Error(response.message || 'Failed to save clinical protocol')
      }

      // 2. Save separate HEP protocol (only home exercises)
      if (includeHEP && homeExercises.length > 0) {
        const hepProtocolData = {
          ...baseProtocolData,
          protocol_title: `${conditionName} - Home Exercise Program`,
          protocol_type: 'home',
          exercises: homeExercises,
          // HEP doesn't include modalities or manual therapy (clinic-only)
          modalities: [],
          manual_therapy: [],
        }

        const hepResponse = await ApiManager.createTreatmentProtocol(hepProtocolData)

        if (!hepResponse.success) {
          console.warn('Failed to save HEP protocol:', hepResponse.message)
        }
      }

      // Mark insights as used in protocol generation
      const savedProtocolId = response.data?.id
      if (savedProtocolId && insightsData.length > 0) {
        const markPromises = insightsData.map((insight: any) =>
          ApiManager.markInsightAsUsed(insight.id, savedProtocolId).catch((err: any) => {
            console.warn(`Failed to mark insight ${insight.id} as used:`, err)
          })
        )
        await Promise.allSettled(markPromises)
      }

      toast.success(includeHEP && homeExercises.length > 0
        ? 'Clinical protocol and Home Exercise Program saved successfully'
        : 'Treatment protocol has been saved successfully')
      setSaving(false)
      onClose()
    } catch (error) {
      console.error('Failed to save protocol:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save protocol. Please try again.')
      setSaving(false)
    }
  }

  const handleExport = (format: 'pdf' | 'json') => {
    const exportProtocol = customizedProtocol || protocol
    if (!exportProtocol) return

    if (format === 'json') {
      const dataStr = JSON.stringify(exportProtocol, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = `protocol-${conditionName.replace(/\s+/g, '-').toLowerCase()}.json`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    }
  }

  const renderProtocolPhase = (phase: TreatmentPhase, index: number) => {
    const currentProtocol = customizedProtocol || protocol

    return (
      <Card key={index} className="mb-3">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm">{phase.phaseName}</h4>
            <Badge variant="outline" className="text-xs">{phase.durationWeeks}w</Badge>
          </div>

          {/* Phase Goals */}
          {phase.primaryGoals && phase.primaryGoals.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {phase.primaryGoals.map((goal, gIdx) => (
                <span key={gIdx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  <Target className="w-2.5 h-2.5 mr-1" />
                  {goal}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {phase.exercises.length > 0 && (
              <div>
                <div className="space-y-1">
                  {phase.exercises.map((exercise, idx) => (
                    <div key={idx} className="bg-blue-50 p-2 rounded text-sm group hover:bg-blue-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{exercise.exerciseName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-600">
                              {exercise.sets} sets x {exercise.repetitions}, {exercise.frequency}
                            </span>
                            {includeHEP && (
                              <button
                                onClick={() => {
                                  if (!currentProtocol) return
                                  const updatedProtocol = {
                                    ...currentProtocol,
                                    treatmentPhases: currentProtocol.treatmentPhases.map((p, pIndex) =>
                                      pIndex === index
                                        ? {
                                            ...p,
                                            exercises: p.exercises.map((e, eIndex) =>
                                              eIndex === idx
                                                ? { ...e, isHomeExercise: !e.isHomeExercise }
                                                : e
                                            )
                                          }
                                        : p
                                    )
                                  }
                                  handleProtocolUpdate(updatedProtocol)
                                }}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors shrink-0 ${
                                  exercise.isHomeExercise
                                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200 hover:text-gray-600'
                                }`}
                                title={exercise.homeExerciseNotes || (exercise.isHomeExercise ? 'Home exercise' : 'Click to mark as home exercise')}
                              >
                                <Home className="w-3 h-3" />
                                Home
                              </button>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!currentProtocol) return
                            const updatedProtocol = {
                              ...currentProtocol,
                              treatmentPhases: currentProtocol.treatmentPhases.map((p, pIndex) =>
                                pIndex === index
                                  ? { ...p, exercises: p.exercises.filter((_, eIndex) => eIndex !== idx) }
                                  : p
                              )
                            }
                            handleProtocolUpdate(updatedProtocol)
                          }}
                          className="text-red-600 hover:bg-red-50 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase.modalities.length > 0 && (
              <div>
                <div className="space-y-1">
                  {phase.modalities.map((modality, idx) => (
                    <div key={idx} className="bg-amber-50 p-2 rounded text-sm group hover:bg-amber-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{modality.modalityName}</div>
                          <div className="text-xs text-gray-600">{modality.duration}, {modality.frequency}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!currentProtocol) return
                            const updatedProtocol = {
                              ...currentProtocol,
                              treatmentPhases: currentProtocol.treatmentPhases.map((p, pIndex) =>
                                pIndex === index
                                  ? { ...p, modalities: p.modalities.filter((_, mIndex) => mIndex !== idx) }
                                  : p
                              )
                            }
                            handleProtocolUpdate(updatedProtocol)
                          }}
                          className="text-red-600 hover:bg-red-50 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase.manualTherapy && phase.manualTherapy.length > 0 && (
              <div>
                <div className="space-y-1">
                  {phase.manualTherapy.map((therapy, idx) => (
                    <div key={idx} className="bg-green-50 p-2 rounded text-sm group hover:bg-green-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{therapy.technique}</div>
                          <div className="text-xs text-gray-600">{therapy.frequency}, {therapy.sessionDuration}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!currentProtocol) return
                            const updatedProtocol = {
                              ...currentProtocol,
                              treatmentPhases: currentProtocol.treatmentPhases.map((p, pIndex) =>
                                pIndex === index
                                  ? { ...p, manualTherapy: (p.manualTherapy || []).filter((_, tIndex) => tIndex !== idx) }
                                  : p
                              )
                            }
                            handleProtocolUpdate(updatedProtocol)
                          }}
                          className="text-red-600 hover:bg-red-50 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  const renderProtocolDisplay = (displayProtocol: GeneratedProtocol) => (
    <div className="space-y-3">
      {displayProtocol.treatmentPhases.map((phase, index) => renderProtocolPhase(phase, index))}
    </div>
  )

  if (!isOpen) return null

  const currentProtocol = customizedProtocol || protocol

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <div className="bg-white w-full h-full overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-healui-physio to-healui-primary text-white">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span className="font-medium text-sm">AI</span>
              </div>
              <div className="text-white/80">•</div>
              <div>
                <div className="font-medium text-sm truncate max-w-[200px]">{patientName}</div>
                <div className="text-blue-100 text-xs truncate max-w-[200px]">{conditionName}</div>
              </div>

              {/* Phase Selection in Header */}
              {(step === 'results' || step === 'customization') && currentProtocol && (
                <>
                  <div className="text-white/80">•</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-100">Phase:</span>
                    <div className="flex bg-white/20 rounded-md gap-1 p-1">
                      {currentProtocol.treatmentPhases?.map((phase, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedPhaseIndex(index)}
                          className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                            index === selectedPhaseIndex
                              ? 'bg-white text-healui-primary'
                              : 'text-white hover:bg-white/20'
                          }`}
                        >
                          {phase.phaseName.replace('Phase ', '').replace(':', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* HEP Badge */}
              {(step === 'results' || step === 'customization') && includeHEP && (
                <div className="bg-green-500/20 border border-green-400/30 rounded-full px-2.5 py-0.5 flex items-center gap-1.5">
                  <Home className="w-3 h-3 text-green-200" />
                  <span className="text-xs font-medium text-green-100">HEP Included</span>
                </div>
              )}

              {/* Stage Indicator */}
              <div className="bg-white/20 rounded-full px-3 py-1">
                <span className="text-xs font-medium">
                  {step === 'selection' && 'Configure'}
                  {step === 'generating' && 'Generating...'}
                  {(step === 'results' || step === 'customization') && 'Review & Customize'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">

          {/* ═══════════════════════════════════════
              STEP 1: SELECTION / CONFIGURE
          ═══════════════════════════════════════ */}
          {step === 'selection' && (
            <div className="p-6">
              {dataLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AIBubbleLoader />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-8">Loading Patient Data</h3>
                  <p className="text-gray-500 text-sm text-center max-w-md">
                    Fetching patient demographics, condition details, and treatment options...
                  </p>
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-6">
                  {/* Header */}
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">Generate Treatment Protocol</h2>
                    <p className="text-sm text-gray-500 mt-1">{conditionName}</p>
                  </div>

                  {/* Primary Focus */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Primary Focus</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'pain_relief', label: 'Pain Relief', color: 'bg-red-100 text-red-700 border-red-200' },
                        { value: 'function', label: 'Function', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                        { value: 'performance', label: 'Performance', color: 'bg-green-100 text-green-700 border-green-200' }
                      ].map((focus) => (
                        <button
                          key={focus.value}
                          onClick={() => setPreferences(prev => ({ ...prev, primaryFocus: focus.value as any }))}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                            preferences.primaryFocus === focus.value
                              ? focus.color
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {focus.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Progression Approach */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Progression Approach</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'conservative', label: 'Conservative' },
                        { value: 'standard', label: 'Standard' },
                        { value: 'aggressive', label: 'Aggressive' }
                      ].map((approach) => (
                        <button
                          key={approach.value}
                          onClick={() => setPreferences(prev => ({ ...prev, progressionApproach: approach.value as any }))}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                            preferences.progressionApproach === approach.value
                              ? 'bg-healui-primary text-white border-healui-primary'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {approach.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Protocol Complexity (renamed from Patient Engagement) */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Protocol Complexity</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'low', label: 'Simple', sub: '3-4 exercises' },
                        { value: 'moderate', label: 'Standard', sub: '5-7 exercises' },
                        { value: 'high', label: 'Comprehensive', sub: '8-10+ exercises' }
                      ].map((complexity) => (
                        <button
                          key={complexity.value}
                          onClick={() => setPreferences(prev => ({ ...prev, patientEngagement: complexity.value as any }))}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors text-center ${
                            preferences.patientEngagement === complexity.value
                              ? 'bg-healui-primary text-white border-healui-primary'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div>{complexity.label}</div>
                          <div className={`text-xs mt-0.5 ${
                            preferences.patientEngagement === complexity.value ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            {complexity.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HEP Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${includeHEP ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Include Home Exercise Program</h4>
                        <p className="text-xs text-gray-500">Exercises the patient can do at home between visits</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIncludeHEP(!includeHEP)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        includeHEP ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          includeHEP ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!preferences.primaryFocus || !preferences.progressionApproach || !preferences.patientEngagement}
                      className="bg-healui-primary hover:bg-healui-primary-dark"
                    >
                      Generate Protocol
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 2: GENERATING — AI Bubble Loader
          ═══════════════════════════════════════ */}
          {step === 'generating' && (
            <div className="h-full bg-white flex flex-col items-center justify-center relative overflow-hidden">
              {/* Ambient glow */}
              <motion.div
                className="pointer-events-none absolute h-[500px] w-[500px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.03) 40%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Loader */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div style={{ transform: 'scale(2.5)' }}>
                  <AIBubbleLoader />
                </div>
              </motion.div>

              {/* Condition name */}
              <motion.div
                className="mt-16 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-medium text-gray-900 mb-3">{conditionName}</h3>

                {/* Cycling status message */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={generatingMessageIndex}
                    className="text-sm text-gray-400"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {GENERATING_MESSAGES[generatingMessageIndex]}
                  </motion.p>
                </AnimatePresence>

                {/* Animated dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-teal-500"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              STEP 3: RESULTS / CUSTOMIZATION
          ═══════════════════════════════════════ */}
          {(step === 'results' || step === 'customization') && currentProtocol && (
            <div className="h-full flex flex-col">

              {/* Control Bar */}
              <div className="h-8 px-6 border-b border-gray-200 bg-white flex items-center justify-between">
                <SafetyWarnings
                  redFlags={staticConditionData?.red_flags}
                  contraindications={staticConditionData?.contraindications}
                  yellowFlags={staticConditionData?.yellow_flags}
                  planType="clinical"
                />

                <Button
                  onClick={handleSaveProtocol}
                  disabled={saving}
                  className="bg-healui-primary hover:bg-healui-primary-dark text-white px-4 py-1.5 text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Protocol'}
                </Button>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-2 h-full">
                  {/* Left: Customization Panel */}
                  {staticConditionData && (
                    <div className="h-full overflow-y-auto p-4 border-r border-gray-200">
                      <ProtocolCustomizationStep
                        protocol={currentProtocol}
                        staticConditionData={staticConditionData ? {
                          ...staticConditionData,
                          phases: staticConditionData?.phases || [],
                          goals: staticConditionData?.goals || [],
                          allExercises: staticConditionData?.exercise_prescriptions?.map((exerciseName: string, index: number) => ({
                            id: `ex_${index}`,
                            name: exerciseName || `Exercise ${index + 1}`,
                            category: 'therapeutic',
                            bodyRegion: 'lumbar',
                            description: '',
                            instructions: [],
                            equipment: [],
                            difficulty: 'intermediate',
                            contraindications: [],
                            indications: [],
                            evidenceLevel: 'moderate'
                          })) || [],
                          allModalities: staticConditionData?.modalities?.raw?.map((modalityName: string, index: number) => {
                            let modalityCategory = 'other';

                            if (staticConditionData.modalities.categorized) {
                              for (const [category, modalities] of Object.entries(staticConditionData.modalities.categorized)) {
                                if ((modalities as string[]).includes(modalityName)) {
                                  modalityCategory = category;
                                  break;
                                }
                              }
                            }

                            const categoryColors: Record<string, string> = {
                              electrotherapy: 'blue',
                              cryotherapy: 'cyan',
                              laser_phototherapy: 'red',
                              ultrasound: 'purple',
                              other: 'gray'
                            };

                            return {
                              id: `mod_${index}`,
                              name: modalityName,
                              category: modalityCategory,
                              categoryColor: categoryColors[modalityCategory] || 'gray',
                              description: '',
                              indications: [],
                              contraindications: [],
                              parameters: {
                                intensity: 'moderate',
                                duration: '15 minutes',
                                frequency: '3x per week'
                              },
                              clinicalSupervisionRequired: modalityCategory === 'electrotherapy',
                              evidenceLevel: 'moderate'
                            }
                          }) || [],
                          allManualTherapy: staticConditionData?.manual_therapy?.map((therapyName: string, index: number) => ({
                            id: `mt_${index}`,
                            name: therapyName,
                            technique: therapyName,
                            category: 'mobilization',
                            description: '',
                            indications: [],
                            contraindications: [],
                            parameters: {
                              frequency: '2x per week',
                              sessionDuration: '30 minutes',
                              intensity: 'moderate'
                            },
                            clinicalSupervisionRequired: true,
                            evidenceLevel: 'moderate'
                          })) || []
                        } : null}
                        onProtocolUpdate={(updatedProtocol) => handleProtocolUpdate(updatedProtocol)}
                        planType="clinical"
                        selectedPhaseIndex={selectedPhaseIndex}
                        onPhaseChange={setSelectedPhaseIndex}
                        patientId={patientId}
                        conditionId={conditionId}
                        conditionName={conditionName}
                        onManualEntryLog={handleManualEntryLog}
                      />
                    </div>
                  )}

                  {/* Right: Protocol Preview */}
                  <div className="h-full overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500">Protocol Preview</div>
                      {includeHEP && (
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                          <Home className="w-3 h-3 mr-1" />
                          HEP Enabled
                        </Badge>
                      )}
                    </div>
                    {renderProtocolDisplay(currentProtocol)}
                  </div>
                </div>
              </div>

            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 mx-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProtocolGeneratorModal
