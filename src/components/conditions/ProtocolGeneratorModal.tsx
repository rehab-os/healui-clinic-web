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
  ModalityProtocol 
} from '../../types/protocol-generator.types'

interface ProtocolGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  conditionId: string
  conditionName: string
  patientName?: string
}

const ProtocolGeneratorModal: React.FC<ProtocolGeneratorModalProps> = ({
  isOpen,
  onClose,
  patientId,
  conditionId,
  conditionName,
  patientName
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
  
  // Data for direct protocol generation
  const [patientData, setPatientData] = useState<any>(null)
  const [conditionData, setConditionData] = useState<any>(null)
  const [staticConditionData, setStaticConditionData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(false)

  // Generation phases with medical terminology
  const generationPhases = [
    {
      name: "Biomechanical Analysis",
      description: "Analyzing patient demographics, anthropometrics, and functional capacity",
      icon: <Database className="w-5 h-5" />,
      duration: 2000
    },
    {
      name: "Pathophysiological Assessment", 
      description: "Processing condition severity, tissue healing phases, and contraindications",
      icon: <Activity className="w-5 h-5" />,
      duration: 2500
    },
    {
      name: "Evidence Synthesis",
      description: "Cross-referencing clinical guidelines, systematic reviews, and treatment algorithms",
      icon: <Brain className="w-5 h-5" />,
      duration: 3000
    },
    {
      name: "Protocol Optimization",
      description: "Personalizing interventions using machine learning and clinical decision trees",
      icon: <Cpu className="w-5 h-5" />,
      duration: 2500
    },
    {
      name: "Safety Validation",
      description: "Screening for red flags, contraindications, and risk stratification",
      icon: <CheckCircle className="w-5 h-5" />,
      duration: 1500
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

  // Simulate generation phases with realistic timing
  const simulateGenerationPhases = async () => {
    setCurrentPhase(0)
    setPhaseProgress(0)
    setGenerationLogs([])
    
    for (let i = 0; i < generationPhases.length; i++) {
      const phase = generationPhases[i]
      setCurrentPhase(i)
      
      // Add initial log
      setGenerationLogs(prev => [...prev, `Initiating ${phase.name}...`])
      
      // Simulate phase progress
      const progressInterval = setInterval(() => {
        setPhaseProgress(prev => {
          const newProgress = prev + (100 / (phase.duration / 100))
          return Math.min(newProgress, 100)
        })
      }, 100)
      
      // Add mid-phase logs
      setTimeout(() => {
        setGenerationLogs(prev => [...prev, `Processing ${phase.description.toLowerCase()}`])
      }, phase.duration * 0.3)
      
      setTimeout(() => {
        setGenerationLogs(prev => [...prev, `Validating ${phase.name.toLowerCase()} parameters`])
      }, phase.duration * 0.7)
      
      // Wait for phase completion
      await new Promise(resolve => setTimeout(resolve, phase.duration))
      
      clearInterval(progressInterval)
      setPhaseProgress(100)
      
      // Add completion log
      setGenerationLogs(prev => [...prev, `✓ ${phase.name} completed successfully`])
      
      // Reset progress for next phase
      setPhaseProgress(0)
    }
    
    // Final completion
    setGenerationLogs(prev => [...prev, `🎉 Protocol generation completed with clinical precision`])
  }

  const handlePlanTypeToggle = (planType: 'home' | 'clinical') => {
    setSelectedPlanTypes(prev => {
      if (prev.includes(planType)) {
        return prev.filter(type => type !== planType)
      } else {
        return [...prev, planType]
      }
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
        preferences: {
          duration: 6,
          intensity: 'moderate',
          frequency: 3
        }
      }

      console.log('Direct protocol generation request:', directRequest)

      const response = await ApiManager.generateProtocolDirect(directRequest)
      
      if (response.success && response.data) {
        if (planType === 'home') {
          setHomeProtocol(response.data)
        } else {
          setClinicalProtocol(response.data)
        }
        
        showNotification({
          title: 'Protocol Generated!',
          message: `${planType.charAt(0).toUpperCase() + planType.slice(1)} protocol successfully generated using direct flow`,
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
    <Card key={index} className="mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">{phase.phaseName}</h4>
          <Badge variant="outline">{phase.durationWeeks} weeks</Badge>
        </div>
        
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Goals:</h5>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {phase.primaryGoals.map((goal, idx) => (
                <li key={idx}>{goal}</li>
              ))}
            </ul>
          </div>

          {phase.exercises.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Exercises:</h5>
              <div className="grid gap-2">
                {phase.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-sm text-gray-900">{exercise.exerciseName}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {exercise.sets} sets × {exercise.repetitions} reps, {exercise.frequency}
                    </div>
                    {exercise.equipment.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Equipment: {exercise.equipment.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase.modalities.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Modalities:</h5>
              <div className="grid gap-2">
                {phase.modalities.map((modality, idx) => (
                  <div key={idx} className="bg-amber-50 p-3 rounded-lg">
                    <div className="font-medium text-sm text-gray-900">{modality.modalityName}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {modality.duration}, {modality.frequency}
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
    <div className="space-y-4 pr-2">
      {/* Protocol Header */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {protocol.protocolMetadata.planType.charAt(0).toUpperCase() + protocol.protocolMetadata.planType.slice(1)} Protocol
              </h3>
              <p className="text-sm text-gray-600">{protocol.protocolMetadata.conditionName}</p>
            </div>
            <Badge 
              variant={protocol.safetyAssessment.emergencyReferralNeeded ? "destructive" : "default"}
              className="flex items-center gap-1"
            >
              {protocol.safetyAssessment.emergencyReferralNeeded ? (
                <><AlertTriangle className="w-3 h-3" /> Referral Needed</>
              ) : (
                <><CheckCircle className="w-3 h-3" /> Safe</>
              )}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Duration:</span>
              <div className="font-medium">{protocol.protocolMetadata.totalDurationWeeks} weeks</div>
            </div>
            <div>
              <span className="text-gray-500">Generated:</span>
              <div className="font-medium">{new Date(protocol.protocolMetadata.generatedDateTime).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-gray-500">Confidence:</span>
              <div className="font-medium">{Math.round(protocol.protocolMetadata.aiConfidenceScore * 100)}%</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Safety Assessment */}
      {(protocol.safetyAssessment.redFlagsIdentified.length > 0 || protocol.safetyAssessment.contraindications.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <h4 className="font-semibold text-red-900 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Safety Considerations
            </h4>
            {protocol.safetyAssessment.redFlagsIdentified.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium text-red-800">Red Flags:</p>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {protocol.safetyAssessment.redFlagsIdentified.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
            {protocol.safetyAssessment.contraindications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-800">Contraindications:</p>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {protocol.safetyAssessment.contraindications.map((contra, idx) => (
                    <li key={idx}>{contra}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Treatment Phases */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Treatment Phases</h4>
        {protocol.treatmentPhases.map((phase, index) => renderProtocolPhase(phase, index))}
      </div>

      {/* Patient Education */}
      <Card>
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Patient Education</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">Condition:</span> {protocol.patientEducation.conditionExplanation}
            </div>
            <div>
              <span className="font-medium">Expected Timeline:</span> {protocol.patientEducation.healingTimeline}
            </div>
            <div>
              <span className="font-medium">Lifestyle Factors:</span> {protocol.patientEducation.lifestyleFactors}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50">
      <div className="bg-white w-full h-full overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-healui-physio to-healui-primary text-white">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Protocol Generator
              </h2>
              <p className="text-blue-100 text-sm">
                {patientName} • {conditionName}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 pb-4">
            <div className="flex items-center space-x-4">
              {[
                { key: 'selection', label: 'Plan Selection', icon: Users },
                { key: 'generating', label: 'Generating', icon: Clock },
                { key: 'results', label: 'Results', icon: FileText }
              ].map(({ key, label, icon: Icon }, index) => (
                <div key={key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step === key ? 'bg-white text-healui-primary border-white' :
                    ['selection', 'generating', 'results'].indexOf(step) > index ? 'bg-white/20 text-white border-white/20' :
                    'bg-transparent text-white/70 border-white/50'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 text-sm ${
                    step === key ? 'text-white font-medium' : 'text-white/70'
                  }`}>{label}</span>
                  {index < 2 && <ArrowRight className="w-4 h-4 text-white/50 mx-3" />}
                </div>
              ))}
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
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Protocol Types</h3>
                    <p className="text-gray-600">Choose the type(s) of treatment protocols you want to generate.</p>
                    {/* Data loading status */}
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-blue-600">
                        ✓ Patient data loaded: {patientData?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-blue-600">
                        ✓ Condition data loaded: {conditionData?.condition_name || 'Unknown'}
                      </div>
                      {conditionData?.condition_id && (
                        <div className="text-sm text-blue-600">
                          ✓ Condition ID: {conditionData.condition_id}
                        </div>
                      )}
                      {!conditionData?.condition_id && (
                        <div className="text-sm text-orange-600">
                          ⚠ No condition_id found - will search by name
                        </div>
                      )}
                      {staticConditionData ? (
                        <div className="text-sm text-green-600">
                          ✓ Static data loaded: {staticConditionData.exercise_prescriptions?.length || 0} exercises, {staticConditionData.modalities?.length || 0} modalities
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          ✗ No static condition data found
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                {renderPlanTypeCard(
                  'home',
                  'Home Protocol',
                  'Self-guided treatment plan for patients to follow at home',
                  <Home className="w-5 h-5" />,
                  ['Portable equipment only', 'Self-administered exercises', 'Patient education focus', 'Progress tracking guidance']
                )}
                
                {renderPlanTypeCard(
                  'clinical',
                  'Clinical Protocol',
                  'Professional treatment plan for clinic-based therapy',
                  <Building2 className="w-5 h-5" />,
                  ['Advanced equipment usage', 'Manual therapy techniques', 'Clinical supervision', 'Professional modalities']
                )}
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleGenerate}
                      disabled={selectedPlanTypes.length === 0 || dataLoading}
                      className="bg-healui-primary hover:bg-healui-primary-dark"
                    >
                      Generate Protocol{selectedPlanTypes.length > 1 ? 's' : ''}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'generating' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-healui-physio to-healui-primary rounded-full blur opacity-20 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-healui-physio to-healui-primary text-white rounded-full p-6">
                    <Brain className="w-12 h-12 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-healui-physio to-healui-primary bg-clip-text text-transparent">
                  AI Protocol Generation in Progress
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Our advanced clinical AI is processing multidimensional patient data through evidence-based algorithms to synthesize personalized treatment protocols.
                </p>
                {currentGenerating && (
                  <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
                    <Zap className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span className="text-blue-800 font-medium">
                      Generating {currentGenerating} protocol
                    </span>
                  </div>
                )}
              </div>

              {/* Phase Progress Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Clinical Processing Pipeline
                </h3>
                
                <div className="space-y-4">
                  {generationPhases.map((phase, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl border transition-all duration-500 ${
                        index === currentPhase 
                          ? 'bg-blue-50 border-blue-200 shadow-md scale-102' 
                          : index < currentPhase 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg transition-colors ${
                            index === currentPhase 
                              ? 'bg-blue-100 text-blue-600' 
                              : index < currentPhase 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-400'
                          }`}>
                            {phase.icon}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                            <p className="text-sm text-gray-600">{phase.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {index < currentPhase ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : index === currentPhase ? (
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      {index === currentPhase && (
                        <div className="space-y-2">
                          <div className="w-full bg-blue-100 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${phaseProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-blue-600 font-medium">{Math.round(phaseProgress)}% complete</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Processing Logs */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Processing Logs
                </h3>
                <div className="bg-gray-900 rounded-xl p-4 h-32 overflow-y-auto">
                  <div className="font-mono text-sm space-y-1">
                    {generationLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 ${
                          log.includes('✓') 
                            ? 'text-green-400' 
                            : log.includes('🎉')
                              ? 'text-yellow-400 font-semibold'
                              : 'text-blue-300'
                        }`}
                      >
                        <span className="text-gray-500 text-xs">
                          {new Date().toLocaleTimeString()}
                        </span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{currentPhase + 1}</div>
                  <div className="text-sm text-blue-600">Phases Completed</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-b from-green-50 to-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{generationLogs.length}</div>
                  <div className="text-sm text-green-600">Operations Processed</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(((currentPhase * 100 + phaseProgress) / generationPhases.length))}%
                  </div>
                  <div className="text-sm text-purple-600">Overall Progress</div>
                </div>
              </div>
            </div>
          )}

          {step === 'results' && (homeProtocol || clinicalProtocol) && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Generated Protocols</h3>
                <div className="flex gap-2">
                  {homeProtocol && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport(homeProtocol, 'json')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export Home
                    </Button>
                  )}
                  {clinicalProtocol && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport(clinicalProtocol, 'json')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export Clinical
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0">
                {homeProtocol && clinicalProtocol ? (
                  <Tabs defaultValue="home" className="w-full h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                      <TabsTrigger value="home">Home Protocol</TabsTrigger>
                      <TabsTrigger value="clinical">Clinical Protocol</TabsTrigger>
                    </TabsList>
                    <TabsContent value="home" className="flex-1 min-h-0">
                      <div className="h-full overflow-y-auto">
                        {renderProtocolDisplay(homeProtocol)}
                      </div>
                    </TabsContent>
                    <TabsContent value="clinical" className="flex-1 min-h-0">
                      <div className="h-full overflow-y-auto">
                        {renderProtocolDisplay(clinicalProtocol)}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : homeProtocol ? (
                  <div className="h-full overflow-y-auto">
                    {renderProtocolDisplay(homeProtocol)}
                  </div>
                ) : clinicalProtocol ? (
                  <div className="h-full overflow-y-auto">
                    {renderProtocolDisplay(clinicalProtocol)}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-between pt-6 flex-shrink-0">
                <Button variant="outline" onClick={() => setStep('selection')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Generate More
                </Button>
                <Button onClick={onClose}>
                  Done
                </Button>
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