'use client'

import React, { useState, useEffect } from 'react'
import { X, Sparkles, Home, Building2, ArrowLeft, ArrowRight, Download, FileText, Clock, Users, CheckCircle, AlertTriangle, Brain, Database, Zap, Activity, Cpu } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import ApiManager from '../../services/api'
import { showNotification } from '@mantine/notifications'
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
} from '../../types/protocol-generator.types'
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
}

const ProtocolGeneratorModal: React.FC<ProtocolGeneratorModalProps> = ({
  isOpen,
  onClose,
  patientId,
  conditionId,
  conditionName,
  patientName,
  visitId
}) => {
  const [step, setStep] = useState<ProtocolGenerationStep>('selection')
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<('home' | 'clinical')[]>([])
  const [homeProtocol, setHomeProtocol] = useState<GeneratedProtocol | null>(null)
  const [clinicalProtocol, setClinicalProtocol] = useState<GeneratedProtocol | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentGenerating, setCurrentGenerating] = useState<'home' | 'clinical' | null>(null)
  
  // Generation phase tracking
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [generationLogs, setGenerationLogs] = useState<string[]>([])
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null)
  
  // Data for direct protocol generation
  const [patientData, setPatientData] = useState<any>(null)
  const [conditionData, setConditionData] = useState<any>(null)
  const [staticConditionData, setStaticConditionData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(false)
  
  // Customization state
  const [customizedHomeProtocol, setCustomizedHomeProtocol] = useState<GeneratedProtocol | null>(null)
  const [customizedClinicalProtocol, setCustomizedClinicalProtocol] = useState<GeneratedProtocol | null>(null)
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0)
  
  // Clinical configuration for protocol generation
  const [preferences, setPreferences] = useState<ProtocolPreferences>({
    primaryFocus: 'function',
    progressionApproach: 'standard',
    patientEngagement: 'moderate',
    programDuration: 6,
    setting: 'home'
  })

  // Save state
  const [saving, setSaving] = useState(false)

  // Generation phases with physiotherapy-specific terminology
  const generationPhases = [
    {
      name: "Physiotherapy Assessment Agent",
      description: "Analyzing movement patterns, functional capacity, and biomechanical deficits",
      tasks: [
        "Interacting with Movement Analysis Agent",
        "Processing gait parameters and postural alignment",
        "Evaluating range of motion limitations",
        "Calculating functional movement scores"
      ],
      icon: <Activity className="w-5 h-5" />,
      duration: 2500
    },
    {
      name: "Exercise Prescription Engine", 
      description: "Generating therapeutic exercises based on tissue healing phases",
      tasks: [
        "Connecting to Exercise Database Agent",
        "Cross-referencing 2,847 evidence-based exercises",
        "Applying tissue healing timeline algorithms",
        "Customizing progression parameters"
      ],
      icon: <Zap className="w-5 h-5" />,
      duration: 3000
    },
    {
      name: "Manual Therapy Protocol Generator",
      description: "Synthesizing hands-on treatment techniques and modality recommendations",
      tasks: [
        "Querying Manual Therapy Knowledge Base",
        "Processing joint mobilization protocols",
        "Analyzing soft tissue manipulation techniques",
        "Validating contraindication matrices"
      ],
      icon: <Brain className="w-5 h-5" />,
      duration: 2800
    },
    {
      name: "Rehabilitation Timeline Optimizer",
      description: "Structuring phased recovery protocols with outcome predictions",
      tasks: [
        "Interfacing with Prognosis Prediction Agent",
        "Calculating expected recovery trajectories",
        "Optimizing treatment frequency and intensity",
        "Generating milestone checkpoints"
      ],
      icon: <Cpu className="w-5 h-5" />,
      duration: 2200
    },
    {
      name: "Clinical Safety Validator",
      description: "Screening protocols against red flags and safety parameters",
      tasks: [
        "Running Safety Screening Algorithms",
        "Cross-checking contraindication databases",
        "Validating exercise load parameters",
        "Generating risk stratification scores"
      ],
      icon: <CheckCircle className="w-5 h-5" />,
      duration: 1800
    }
  ]

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('selection')
      setSelectedPlanTypes([])
      setHomeProtocol(null)
      setClinicalProtocol(null)
      setLoading(false)
      setError(null)
      setCurrentGenerating(null)
      setCurrentPhase(0)
      setPhaseProgress(0)
      setGenerationLogs([])
      setPatientData(null)
      setConditionData(null)
      setStaticConditionData(null)
      setDataLoading(false)
      setCustomizedHomeProtocol(null)
      setCustomizedClinicalProtocol(null)
    }
  }, [isOpen])

  // Fetch all required data when modal opens
  useEffect(() => {
    if (isOpen && patientId && conditionId) {
      fetchAllRequiredData()
    }
  }, [isOpen, patientId, conditionId])

  // Local condition lookup function using the database file
  const findConditionIdByName = async (conditionName: string): Promise<string | null> => {
    try {
      // Load the local conditions database
      const response = await fetch('/database/conditions_for_agent.json')
      if (!response.ok) {
        console.warn('Failed to load local conditions database')
        return null
      }
      
      const conditionsData = await response.json()
      const conditions = conditionsData.conditions || conditionsData
      
      // Create variations of the condition name to improve matching
      const searchVariations = [
        conditionName,
        conditionName.toLowerCase(),
        conditionName.replace(/\s+/g, ' ').trim(),
        
        // Special mappings for common variations
        conditionName.replace('Ankle Lateral Ligament Sprain', 'Ankle Sprain (Lateral)'),
        conditionName.replace('Lateral Ankle Sprain', 'Ankle Sprain (Lateral)'),
        conditionName.replace('Ankle Sprain Lateral', 'Ankle Sprain (Lateral)'),
      ]
      
      console.log('Searching for condition variations:', searchVariations)
      
      for (const variation of searchVariations) {
        const match = conditions.find((condition: any) => {
          const condName = (condition.name || '').toLowerCase()
          const varLower = variation.toLowerCase()
          
          return condName === varLower || 
                 condName.includes(varLower) || 
                 varLower.includes(condName)
        })
        
        if (match) {
          console.log(`Found match: "${variation}" -> ${match.id} (${match.name})`)
          return match.id
        }
      }
      
      console.log('No matching condition found in local database')
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

      // Fetch patient demographics
      const patientResponse = await ApiManager.getPatient(patientId)
      if (!patientResponse.success) {
        throw new Error('Failed to fetch patient data')
      }

      // Fetch patient condition details
      const conditionResponse = await ApiManager.getPatientConditions(patientId)
      if (!conditionResponse.success) {
        throw new Error('Failed to fetch condition data')
      }

      // Find the specific condition
      const condition = conditionResponse.data.find((c: any) => c.id === conditionId)
      if (!condition) {
        throw new Error('Condition not found')
      }

      // Debug: Log the condition data
      console.log('Patient condition data:', condition)
      console.log('Condition ID for static lookup:', condition.condition_id)

      // Fetch static condition data using the condition_id
      let staticResponse = null
      if (condition.condition_id) {
        console.log(`Fetching static data for condition_id: ${condition.condition_id}`)
        staticResponse = await ApiManager.getConditionByIdentifier(condition.condition_id)
        console.log('Static data response:', staticResponse)
        if (!staticResponse.success) {
          console.warn('Failed to fetch static condition data, will use basic data')
        }
      } else {
        console.warn('Patient condition has no condition_id, trying to find by name:', condition.condition_name)
        
        // Try to find static condition using local database first
        try {
          const conditionId = await findConditionIdByName(condition.condition_name)
          console.log('Local lookup found condition_id:', conditionId)
          
          if (conditionId) {
            staticResponse = await ApiManager.getConditionByIdentifier(conditionId)
            console.log('Static data from local lookup:', staticResponse)
          } else {
            // Fallback to API search
            const searchResponse = await ApiManager.searchConditions({ query: condition.condition_name })
            console.log('API search response:', searchResponse)
            
            if (searchResponse.success && searchResponse.data.length > 0) {
              const matchedCondition = searchResponse.data[0]
              console.log('Found matching condition:', matchedCondition)
              
              if (matchedCondition.condition_id) {
                staticResponse = await ApiManager.getConditionByIdentifier(matchedCondition.condition_id)
                console.log('Static data from API search:', staticResponse)
              }
            }
          }
        } catch (searchError) {
          console.error('Error searching for condition:', searchError)
        }
      }

      setPatientData(patientResponse.data)
      setConditionData(condition)
      setStaticConditionData(staticResponse?.data || null)
      
      // Debug: Log what we're setting
      console.log('Final static condition data:', staticResponse?.data || null)

    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(error.message || 'Failed to load required data')
      showNotification({
        title: 'Data Loading Failed',
        message: error.message || 'Failed to load required data for protocol generation',
        color: 'red'
      })
    } finally {
      setDataLoading(false)
    }
  }

  // Auto-scroll to center latest log
  const scrollToLatestLog = () => {
    if (scrollContainerRef) {
      const logs = scrollContainerRef.querySelectorAll('.log-line')
      if (logs.length > 0) {
        const latestLog = logs[logs.length - 1] as HTMLElement
        const containerHeight = scrollContainerRef.clientHeight
        const logTop = latestLog.offsetTop
        const logHeight = latestLog.offsetHeight
        
        // Center the latest log
        const scrollPosition = logTop - (containerHeight / 2) + (logHeight / 2)
        scrollContainerRef.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        })
      }
    }
  }

  // Simulate generation phases with 10-second timing and auto-scroll
  const simulateGenerationPhases = async () => {
    setCurrentPhase(0)
    setPhaseProgress(0)
    setGenerationLogs([])
    
    for (let i = 0; i < generationPhases.length; i++) {
      const phase = generationPhases[i]
      setCurrentPhase(i)
      
      // Add initial log
      setGenerationLogs(prev => {
        const newLogs = [...prev, `[SYSTEM] Initializing ${phase.name}...`]
        // Auto-scroll after state update
        setTimeout(scrollToLatestLog, 100)
        return newLogs
      })
      
      // Wait 2 seconds before showing task logs
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Process each task with 2-second intervals
      for (let taskIndex = 0; taskIndex < phase.tasks.length; taskIndex++) {
        const task = phase.tasks[taskIndex]
        
        // Update progress
        const taskProgress = ((taskIndex + 1) / phase.tasks.length) * 100
        setPhaseProgress(taskProgress)
        
        // Add task log
        setGenerationLogs(prev => {
          const newLogs = [...prev, `[${phase.name.split(' ')[0].toUpperCase()}] ${task}...`]
          // Auto-scroll after state update
          setTimeout(scrollToLatestLog, 100)
          return newLogs
        })
        
        // Wait 2 seconds for next task
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Add completion log for final task
        if (taskIndex === phase.tasks.length - 1) {
          setGenerationLogs(prev => {
            const newLogs = [...prev, `[SUCCESS] ${phase.name} processing complete`]
            // Auto-scroll after state update
            setTimeout(scrollToLatestLog, 100)
            return newLogs
          })
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      // Reset progress for next phase
      setPhaseProgress(0)
    }
    
    // Final completion
    setGenerationLogs(prev => {
      const newLogs = [...prev, `[COMPLETE] All physiotherapy protocols generated successfully`]
      // Auto-scroll after state update
      setTimeout(scrollToLatestLog, 100)
      return newLogs
    })
  }

  const handlePlanTypeToggle = (planType: 'home' | 'clinical') => {
    setSelectedPlanTypes(prev => {
      const newPlanTypes = prev.includes(planType)
        ? prev.filter(type => type !== planType)
        : [...prev, planType]
      
      // Update preferences setting based on selected plan types
      if (newPlanTypes.length === 1) {
        setPreferences(prevPrefs => ({ ...prevPrefs, setting: newPlanTypes[0] }))
      } else if (newPlanTypes.length > 1) {
        setPreferences(prevPrefs => ({ ...prevPrefs, setting: 'home' })) // Default to home when both selected
      }
      
      return newPlanTypes
    })
  }

  const generateProtocol = async (planType: 'home' | 'clinical') => {
    try {
      setCurrentGenerating(planType)

      // Check if all required data is available
      if (!patientData || !conditionData) {
        throw new Error('Required patient or condition data not loaded')
      }

      // Calculate patient age
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

      // Prepare direct protocol generation request
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
          chiefComplaint: conditionData.chief_complaint || ''
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
        planType,
        preferences
      }

      console.log('Direct protocol generation request:', directRequest)

      const response = await ApiManager.generateProtocolDirect(directRequest)
      
      if (response.success && response.data) {
        if (planType === 'home') {
          setHomeProtocol(response.data)
          setCustomizedHomeProtocol(response.data) // Initialize customized version
        } else {
          setClinicalProtocol(response.data)
          setCustomizedClinicalProtocol(response.data) // Initialize customized version
        }
        
        showNotification({
          title: 'Protocol Generated!',
          message: `${planType.charAt(0).toUpperCase() + planType.slice(1)} protocol successfully generated`,
          color: 'green'
        })
      } else {
        throw new Error(response.message || 'Failed to generate protocol')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate protocol')
      showNotification({
        title: 'Generation Failed',
        message: err.message || 'Failed to generate protocol',
        color: 'red'
      })
    } finally {
      setCurrentGenerating(null)
    }
  }

  const handleGenerate = async () => {
    if (selectedPlanTypes.length === 0) return

    // Ensure data is loaded
    if (dataLoading) {
      showNotification({
        title: 'Please Wait',
        message: 'Loading required data for protocol generation...',
        color: 'blue'
      })
      return
    }

    if (!patientData || !conditionData) {
      showNotification({
        title: 'Data Not Available',
        message: 'Required patient or condition data is not available. Please try again.',
        color: 'red'
      })
      return
    }

    setLoading(true)
    setError(null)
    setStep('generating')

    try {
      // Start phase simulation
      const phaseSimulation = simulateGenerationPhases()
      
      // Generate protocols sequentially
      for (const planType of selectedPlanTypes) {
        await generateProtocol(planType)
      }
      
      // Wait for phase simulation to complete
      await phaseSimulation
      
      setStep('results')
    } catch (err) {
      console.error('Error generating protocols:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProtocolUpdate = (updatedProtocol: GeneratedProtocol, planType: 'home' | 'clinical') => {
    if (planType === 'home') {
      setCustomizedHomeProtocol(updatedProtocol)
    } else {
      setCustomizedClinicalProtocol(updatedProtocol)
    }
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
        protocolType: homeProtocol ? 'home' : 'clinical',
        treatmentPhaseName,
        treatmentPhaseIndex,
        itemName,
        itemData,
      }

      await ApiManager.createProtocolLogging(logData)
      console.log('Protocol manual entry logged:', logData)
    } catch (error) {
      console.error('Failed to log manual entry:', error)
      // Silent fail - don't disrupt user workflow for logging failures
    }
  }

  // Save protocol and log AI vs physio comparison
  const handleSaveProtocol = async () => {
    console.log('handleSaveProtocol called', { visitId, homeProtocol: !!homeProtocol, clinicalProtocol: !!clinicalProtocol })

    setSaving(true)

    try {
      // Determine which protocol type we're saving
      const protocolType: 'home' | 'clinical' = homeProtocol ? 'home' : 'clinical'

      // Original AI-generated protocol
      const originalProtocol = homeProtocol || clinicalProtocol

      // Final customized protocol (or original if no customization)
      const finalProtocol = customizedHomeProtocol || customizedClinicalProtocol || originalProtocol

      if (!originalProtocol || !finalProtocol) {
        console.error('No protocol to save - originalProtocol:', !!originalProtocol, 'finalProtocol:', !!finalProtocol)
        showNotification({
          title: 'No Protocol',
          message: 'No protocol data available to save.',
          color: 'red',
        })
        setSaving(false)
        return
      }

      // Check if visitId is available - required for saving protocol
      if (!visitId) {
        console.warn('No visitId available for saving protocol')
        showNotification({
          title: 'Cannot Save Protocol',
          message: 'Protocol can only be saved during a visit. Please open from an appointment/visit page.',
          color: 'orange',
          autoClose: 5000,
        })
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

      // Log the protocol generation (AI vs physio comparison)
      await ApiManager.createProtocolGenerationLog({
        patientId,
        conditionId,
        conditionName,
        visitId,
        protocolType,
        aiSent,
        physioPrescribed,
      })

      // Now save the actual treatment protocol
      // Build exercises for the protocol
      const exercises = finalProtocol.treatmentPhases.flatMap((phase, phaseIndex) =>
        phase.exercises.map((ex, exIndex) => ({
          exercise_name: ex.exerciseName,
          exercise_description: ex.instructions || '',
          custom_reps: parseInt(ex.repetitions) || 10,
          custom_sets: ex.sets || 3,
          custom_duration_seconds: ex.holdDuration ? parseInt(ex.holdDuration) * 60 : 60,
          custom_notes: ex.safetyNotes || '',
          frequency: ex.frequency,
          order_index: phaseIndex * 100 + exIndex,
        }))
      )

      // Build modalities for the protocol (JSONB format)
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

      // Build manual therapy for the protocol (JSONB format)
      const manualTherapy = finalProtocol.treatmentPhases.flatMap(phase =>
        (phase.manualTherapy || []).map(mt => ({
          technique: mt.technique,
          frequency: mt.frequency,
          sessionDuration: mt.sessionDuration,
          clinicalOnly: mt.clinicalOnly || false,
          expectedOutcome: mt.expectedOutcome || '',
        }))
      )

      // Build treatment phases (JSONB format)
      const treatmentPhases = finalProtocol.treatmentPhases.map(phase => ({
        phaseName: phase.phaseName,
        durationWeeks: phase.durationWeeks,
        goals: phase.primaryGoals || [],
      }))

      // Build goals array
      const goals = finalProtocol.treatmentPhases.flatMap(p => p.primaryGoals || [])

      // Create the treatment protocol
      const protocolData = {
        visit_id: visitId,
        protocol_title: `${conditionName} - ${protocolType === 'home' ? 'Home' : 'Clinical'} Protocol`,
        current_complaint: conditionData?.chief_complaint || '',
        general_notes: finalProtocol.protocolMetadata?.additionalNotes || '',
        show_explanations: true,
        protocol_type: protocolType as 'home' | 'clinical',
        condition_id: conditionId,
        condition_name: conditionName,
        modalities: modalities,
        manual_therapy: manualTherapy,
        treatment_phases: treatmentPhases,
        goals: goals,
        program_duration_weeks: preferences.programDuration || 6,
        exercises: exercises,
      }

      const response = await ApiManager.createTreatmentProtocol(protocolData)

      if (response.success) {
        showNotification({
          title: 'Protocol Saved',
          message: 'Treatment protocol has been saved successfully',
          color: 'green',
        })
        console.log('Protocol saved successfully:', response.data)
        setSaving(false)
        onClose()
      } else {
        throw new Error(response.message || 'Failed to save protocol')
      }

    } catch (error) {
      console.error('Failed to save protocol:', error)
      showNotification({
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save protocol. Please try again.',
        color: 'red',
        autoClose: 5000,
      })
      setSaving(false)
      // Don't auto-close on error so user can see the message
    }
  }

  const handleExport = (protocol: GeneratedProtocol, format: 'pdf' | 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(protocol, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      const exportFileDefaultName = `protocol-${protocol.protocolMetadata.planType}-${conditionName.replace(/\s+/g, '-').toLowerCase()}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    }
    // PDF export would be implemented separately
  }

  const renderPlanTypeCard = (type: 'home' | 'clinical', title: string, description: string, icon: React.ReactNode, features: string[]) => {
    const isSelected = selectedPlanTypes.includes(type)
    
    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isSelected ? 'ring-2 ring-healui-primary bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => handlePlanTypeToggle(type)}
      >
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${isSelected ? 'bg-healui-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600 mt-1">{description}</p>
              <ul className="mt-3 space-y-1">
                {features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected ? 'border-healui-primary bg-healui-primary' : 'border-gray-300'
            }`}>
              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const renderProtocolPhase = (phase: TreatmentPhase, index: number) => (
    <Card key={index} className="mb-3">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">{phase.phaseName}</h4>
          <Badge variant="outline" className="text-xs">{phase.durationWeeks}w</Badge>
        </div>
        
        <div className="space-y-2">
          {phase.exercises.length > 0 && (
            <div>
              <div className="space-y-1">
                {phase.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-blue-50 p-2 rounded text-sm group hover:bg-blue-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{exercise.exerciseName}</div>
                        <div className="text-xs text-gray-600">
                          {exercise.sets} sets × {exercise.repetitions}, {exercise.frequency}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const updatedProtocol = {
                            ...(customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol),
                            treatmentPhases: (customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol).treatmentPhases.map((p, pIndex) => 
                              pIndex === index 
                                ? { ...p, exercises: p.exercises.filter((_, eIndex) => eIndex !== idx) }
                                : p
                            )
                          };
                          handleProtocolUpdate(updatedProtocol, homeProtocol ? 'home' : 'clinical');
                        }}
                        className="text-red-600 hover:bg-red-50 ml-2"
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
                          const updatedProtocol = {
                            ...(customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol),
                            treatmentPhases: (customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol).treatmentPhases.map((p, pIndex) => 
                              pIndex === index 
                                ? { ...p, modalities: p.modalities.filter((_, mIndex) => mIndex !== idx) }
                                : p
                            )
                          };
                          handleProtocolUpdate(updatedProtocol, homeProtocol ? 'home' : 'clinical');
                        }}
                        className="text-red-600 hover:bg-red-50 ml-2"
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
                          const updatedProtocol = {
                            ...(customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol),
                            treatmentPhases: (customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol).treatmentPhases.map((p, pIndex) => 
                              pIndex === index 
                                ? { ...p, manualTherapy: (p.manualTherapy || []).filter((_, tIndex) => tIndex !== idx) }
                                : p
                            )
                          };
                          handleProtocolUpdate(updatedProtocol, homeProtocol ? 'home' : 'clinical');
                        }}
                        className="text-red-600 hover:bg-red-50 ml-2"
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

  const renderProtocolDisplay = (protocol: GeneratedProtocol) => (
    <div className="space-y-3">
      {/* Treatment Phases */}
      <div>
        {protocol.treatmentPhases.map((phase, index) => renderProtocolPhase(phase, index))}
      </div>
    </div>
  )

  if (!isOpen) return null

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
              
              {/* Compact Phase Selection in Header */}
              {(step === 'results' || step === 'customization') && (homeProtocol || clinicalProtocol) && (
                <>
                  <div className="text-white/80">•</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-100">Phase:</span>
                    <div className="flex bg-white/20 rounded-md gap-1 p-1">
                      {(customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol)?.treatmentPhases?.map((phase, index) => (
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
              {/* Current Stage Indicator */}
              <div className="bg-white/20 rounded-full px-3 py-1">
                <span className="text-xs font-medium">
                  {(step === 'selection' || step === 'configuration') && 'Setup'}
                  {step === 'generating' && 'Generating...'}
                  {(step === 'results' || step === 'customization') && 'Review'}
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
          <div className="flex-1 overflow-y-auto p-6">
          {step === 'selection' && (
            <div className="space-y-6">
              {dataLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative mb-8">
                    <div className="w-16 h-16 border-4 border-healui-primary/20 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-healui-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Required Data</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Fetching patient demographics, condition details, and treatment options...
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left Side - Protocol Types */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Protocol Types</h3>
                    <div className="space-y-3">
                      {renderPlanTypeCard(
                        'home',
                        'Home Protocol',
                        'Self-guided treatment plan',
                        <Home className="w-4 h-4" />,
                        ['Portable equipment', 'Self-administered', 'Patient education']
                      )}
                      {renderPlanTypeCard(
                        'clinical',
                        'Clinical Protocol', 
                        'Professional treatment plan',
                        <Building2 className="w-4 h-4" />,
                        ['Advanced equipment', 'Manual therapy', 'Clinical supervision']
                      )}
                    </div>
                  </div>

                  {/* Right Side - Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Treatment Preferences</h3>
                    
                    {/* Primary Focus */}
                    <Card className="p-4">
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
                            className={`p-2 rounded-lg border-2 text-xs font-medium transition-colors ${
                              preferences.primaryFocus === focus.value 
                                ? focus.color
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {focus.label}
                          </button>
                        ))}
                      </div>
                    </Card>

                    {/* Duration */}
                    <Card className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Duration</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 4, label: '4w' },
                          { value: 6, label: '6w' },
                          { value: 8, label: '8w' },
                          { value: 12, label: '12w' }
                        ].map((duration) => (
                          <button
                            key={duration.value}
                            onClick={() => setPreferences(prev => ({ ...prev, programDuration: duration.value }))}
                            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                              preferences.programDuration === duration.value
                                ? 'bg-healui-primary text-white border-healui-primary'
                                : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {duration.label}
                          </button>
                        ))}
                      </div>
                    </Card>

                    {/* Progression */}
                    <Card className="p-4">
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
                            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                              preferences.progressionApproach === approach.value
                                ? 'bg-healui-primary text-white border-healui-primary'
                                : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {approach.label}
                          </button>
                        ))}
                      </div>
                    </Card>

                    {/* Patient Engagement */}
                    <Card className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Patient Engagement</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'low', label: 'Low' },
                          { value: 'moderate', label: 'Moderate' },
                          { value: 'high', label: 'High' }
                        ].map((engagement) => (
                          <button
                            key={engagement.value}
                            onClick={() => setPreferences(prev => ({ ...prev, patientEngagement: engagement.value as any }))}
                            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                              preferences.patientEngagement === engagement.value
                                ? 'bg-healui-primary text-white border-healui-primary'
                                : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {engagement.label}
                          </button>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {!dataLoading && (
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerate}
                    disabled={selectedPlanTypes.length === 0 || !preferences.primaryFocus || !preferences.progressionApproach || !preferences.patientEngagement}
                    className="bg-healui-primary hover:bg-healui-primary-dark"
                  >
                    Generate Protocol{selectedPlanTypes.length > 1 ? 's' : ''}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}


          {step === 'generating' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Clinical Protocol Development Header */}
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-medium text-gray-900">
                  Clinical Protocol Development
                </h2>
                <p className="text-gray-600">
                  Evidence-based analysis in progress for {conditionName}
                </p>
              </div>

              {/* Clinical Assessment Progress */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-3">
                  Clinical Assessment & Protocol Synthesis
                </h3>
                
                {/* Progress Phases */}
                <div className="space-y-4">
                  {generationPhases.map((phase, index) => {
                    const isActive = currentPhase === index
                    const isCompleted = currentPhase > index
                    const isUpcoming = currentPhase < index
                    
                    return (
                      <div key={index} className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${
                        isActive ? 'bg-blue-50 border-l-blue-500' :
                        isCompleted ? 'bg-green-50 border-l-green-500' :
                        'bg-gray-50 border-l-gray-300'
                      }`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isActive ? 'bg-blue-500 text-white' :
                          isCompleted ? 'bg-green-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`font-medium ${
                              isActive ? 'text-blue-900' : 
                              isCompleted ? 'text-green-900' : 
                              'text-gray-700'
                            }`}>
                              {phase.name}
                            </h4>
                            {isActive && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-blue-600 font-medium">Processing</span>
                              </div>
                            )}
                          </div>
                          
                          <p className={`text-sm mb-3 ${
                            isActive ? 'text-blue-700' : 
                            isCompleted ? 'text-green-700' : 
                            'text-gray-600'
                          }`}>
                            {phase.description}
                          </p>
                          
                          {/* Current Task Indicator */}
                          {isActive && (
                            <div className="space-y-1">
                              {phase.tasks.map((task, taskIndex) => {
                                const currentTaskProgress = Math.floor((phaseProgress / 100) * phase.tasks.length)
                                const isCurrentTask = taskIndex === currentTaskProgress
                                const isTaskComplete = taskIndex < currentTaskProgress
                                
                                return (
                                  <div key={taskIndex} className={`text-xs flex items-center gap-2 ${
                                    isCurrentTask ? 'text-blue-700 font-medium' :
                                    isTaskComplete ? 'text-green-600' :
                                    'text-gray-500'
                                  }`}>
                                    {isTaskComplete ? (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    ) : isCurrentTask ? (
                                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                    ) : (
                                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                    )}
                                    {task}
                                  </div>
                                )
                              })}
                              
                              {/* Progress Bar */}
                              <div className="mt-3 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${phaseProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Evidence Base Reference */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Evidence Sources</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>• Clinical Practice Guidelines</div>
                    <div>• Cochrane Reviews</div>
                    <div>• PEDro Database</div>
                    <div>• Systematic Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(step === 'results' || step === 'customization') && (homeProtocol || clinicalProtocol) && (
            <div className="h-full flex flex-col">

              {/* Simplified Control Bar */}
              <div className="h-8 px-6 border-b border-gray-200 bg-white flex items-center justify-between">
                <SafetyWarnings
                  redFlags={staticConditionData?.red_flags}
                  contraindications={staticConditionData?.contraindications}
                  yellowFlags={staticConditionData?.yellow_flags}
                  planType={homeProtocol ? "home" : "clinical"}
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
                        protocol={customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol}
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
                            // Determine category from the categorized data
                            let modalityCategory = 'other';
                            let categoryColor = 'gray';
                            
                            if (staticConditionData.modalities.categorized) {
                              for (const [category, modalities] of Object.entries(staticConditionData.modalities.categorized)) {
                                if (modalities.includes(modalityName)) {
                                  modalityCategory = category;
                                  break;
                                }
                              }
                            }
                            
                            // Set category colors for visual distinction
                            const categoryColors = {
                              electrotherapy: 'blue',
                              cryotherapy: 'cyan',
                              laser_phototherapy: 'red',
                              ultrasound: 'purple',
                              other: 'gray'
                            };
                            categoryColor = categoryColors[modalityCategory] || 'gray';
                            
                            return {
                              id: `mod_${index}`,
                              name: modalityName,
                              category: modalityCategory,
                              categoryColor: categoryColor,
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
                          allManualTherapy: (homeProtocol && !clinicalProtocol) ? [] : staticConditionData?.manual_therapy?.map((therapyName: string, index: number) => ({
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
                        onProtocolUpdate={(updatedProtocol) => handleProtocolUpdate(updatedProtocol, homeProtocol ? 'home' : 'clinical')}
                        planType={homeProtocol ? "home" : "clinical"}
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
                    <div className="text-xs text-gray-500 mb-2">Protocol Preview</div>
                    {renderProtocolDisplay(customizedHomeProtocol || customizedClinicalProtocol || homeProtocol || clinicalProtocol)}
                  </div>
                </div>
              </div>

            </div>
          )}


          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
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