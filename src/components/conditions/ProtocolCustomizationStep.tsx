'use client'

import React, { useState, useMemo, useRef } from 'react'
import { Plus, Info, X, Activity, Zap, Target, PlusCircle, CornerDownLeft } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  GeneratedProtocol,
  StaticConditionForCustomization,
  StaticExercise,
  StaticModality,
  StaticManualTherapy,
  ExerciseProtocol,
  ModalityProtocol,
  ManualTherapyProtocol,
  ProtocolLoggingType,
  ManualExerciseFormData,
  ManualModalityFormData,
  ManualTherapyFormData,
} from '../../types/protocol-generator.types'

interface ProtocolCustomizationStepProps {
  protocol: GeneratedProtocol
  staticConditionData: StaticConditionForCustomization | null
  onProtocolUpdate: (updatedProtocol: GeneratedProtocol) => void
  planType: 'home' | 'clinical'
  selectedPhaseIndex?: number
  onPhaseChange?: (index: number) => void
  // Context for logging manual entries
  patientId?: string
  conditionId?: string
  conditionName?: string
  visitId?: string
  onManualEntryLog?: (
    type: ProtocolLoggingType,
    itemName: string,
    itemData: ManualExerciseFormData | ManualModalityFormData | ManualTherapyFormData,
    treatmentPhaseName: string,
    treatmentPhaseIndex: number
  ) => void
}

const ProtocolCustomizationStep: React.FC<ProtocolCustomizationStepProps> = ({
  protocol,
  staticConditionData,
  onProtocolUpdate,
  planType,
  selectedPhaseIndex = 0,
  onPhaseChange,
  patientId,
  conditionId,
  conditionName,
  visitId,
  onManualEntryLog,
}) => {
  const [selectedStaticPhases, setSelectedStaticPhases] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  // Inline custom input states
  const [exerciseInput, setExerciseInput] = useState({ name: '', expanded: false, sets: 3, reps: '10-12', frequency: 'Daily' })
  const [modalityInput, setModalityInput] = useState({ name: '', expanded: false, duration: '15 minutes', frequency: '3x per week' })
  const [manualTherapyInput, setManualTherapyInput] = useState({ name: '', expanded: false, duration: '30 minutes', frequency: '2x per week' })

  const exerciseInputRef = useRef<HTMLInputElement>(null)
  const modalityInputRef = useRef<HTMLInputElement>(null)
  const manualTherapyInputRef = useRef<HTMLInputElement>(null)

  // Handle phase selection from static data
  const toggleStaticPhase = (phase: string) => {
    setSelectedStaticPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    )
  }

  // Handle goal selection from static data
  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    )
  }

  // Filter available exercises/modalities that aren't already used by AI
  const getUsedExerciseNames = useMemo(() => {
    const usedNames = new Set<string>()
    protocol.treatmentPhases.forEach(phase => {
      phase.exercises.forEach(exercise => {
        // Add exact match and simplified versions for better matching
        usedNames.add(exercise.exerciseName.toLowerCase())
        // Also add partial matches to catch similar exercises
        const simplifiedName = exercise.exerciseName.toLowerCase()
          .replace(/[()]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        usedNames.add(simplifiedName)
      })
    })
    console.log('Used exercise names:', Array.from(usedNames))
    return usedNames
  }, [protocol])

  const getUsedModalityNames = useMemo(() => {
    const usedNames = new Set<string>()
    protocol.treatmentPhases.forEach(phase => {
      phase.modalities.forEach(modality => {
        usedNames.add(modality.modalityName.toLowerCase())
      })
    })
    return usedNames
  }, [protocol])

  const getUsedManualTherapyNames = useMemo(() => {
    const usedNames = new Set<string>()
    protocol.treatmentPhases.forEach(phase => {
      phase.manualTherapy?.forEach(therapy => {
        usedNames.add(therapy.technique.toLowerCase())
      })
    })
    return usedNames
  }, [protocol])

  const availableExercises = useMemo(() => {
    if (!staticConditionData?.allExercises) {
      console.log('No static condition data or exercises available')
      return []
    }
    
    console.log('All available exercises:', staticConditionData.allExercises.map(ex => ex.name))
    
    const filtered = staticConditionData.allExercises.filter(exercise => {
      // Check if exercise is already used (with flexible matching)
      const exerciseNameLower = exercise.name.toLowerCase()
      const simplifiedExerciseName = exerciseNameLower.replace(/[()]/g, '').replace(/\s+/g, ' ').trim()
      const notUsed = !getUsedExerciseNames.has(exerciseNameLower) && !getUsedExerciseNames.has(simplifiedExerciseName)
      
      const suitableForPlan = planType === 'clinical' || !exercise.equipment.some(eq => 
        eq.toLowerCase().includes('clinical') || eq.toLowerCase().includes('professional')
      )
      
      console.log(`Exercise: ${exercise.name}, notUsed: ${notUsed}`)
      
      return notUsed && suitableForPlan
    })
    
    console.log('Filtered exercises:', filtered.map(ex => ex.name))
    return filtered
  }, [staticConditionData, getUsedExerciseNames, planType])

  const availableModalities = useMemo(() => {
    if (!staticConditionData?.allModalities) return []
    
    return staticConditionData.allModalities.filter(modality => {
      const notUsed = !getUsedModalityNames.has(modality.name.toLowerCase())
      const suitableForPlan = planType === 'clinical' || !modality.clinicalSupervisionRequired
      
      return notUsed && suitableForPlan
    })
  }, [staticConditionData, getUsedModalityNames, planType])

  const availableManualTherapy = useMemo(() => {
    if (!staticConditionData?.allManualTherapy || planType === 'home') return []
    
    return staticConditionData.allManualTherapy.filter(therapy => {
      const notUsed = !getUsedManualTherapyNames.has(therapy.technique.toLowerCase())
      
      return notUsed
    })
  }, [staticConditionData, getUsedManualTherapyNames, planType])

  const addExerciseToPhase = (exercise: StaticExercise, phaseIndex: number) => {
    const newExercise: ExerciseProtocol = {
      exerciseName: exercise.name,
      instructions: exercise.instructions.join('. '),
      frequency: 'Daily',
      sets: 2,
      repetitions: '10-15',
      holdDuration: '30 seconds',
      equipment: exercise.equipment,
      progressionCues: `Progress based on ${exercise.difficulty} level`,
      safetyNotes: exercise.contraindications.join('. ')
    }

    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) => 
        index === phaseIndex 
          ? { ...phase, exercises: [...phase.exercises, newExercise] }
          : phase
      )
    }

    onProtocolUpdate(updatedProtocol)
  }

  const addModalityToPhase = (modality: StaticModality, phaseIndex: number) => {
    const newModality: ModalityProtocol = {
      modalityName: modality.name,
      parameters: `Intensity: ${modality.parameters.intensity || 'Moderate'}`,
      duration: modality.parameters.duration || '15 minutes',
      frequency: modality.parameters.frequency || '3x per week',
      applicationMethod: modality.description,
      clinicalSupervisionRequired: modality.clinicalSupervisionRequired
    }

    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) => 
        index === phaseIndex 
          ? { ...phase, modalities: [...phase.modalities, newModality] }
          : phase
      )
    }

    onProtocolUpdate(updatedProtocol)
  }

  const addManualTherapyToPhase = (therapy: StaticManualTherapy, phaseIndex: number) => {
    const newTherapy: ManualTherapyProtocol = {
      technique: therapy.technique,
      frequency: therapy.parameters.frequency || '2x per week',
      sessionDuration: therapy.parameters.sessionDuration || '30 minutes',
      clinicalOnly: therapy.clinicalSupervisionRequired,
      expectedOutcome: therapy.description
    }

    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) =>
        index === phaseIndex
          ? { ...phase, manualTherapy: [...(phase.manualTherapy || []), newTherapy] }
          : phase
      )
    }

    onProtocolUpdate(updatedProtocol)
  }

  // Manual entry handlers (for custom items not in database)
  const handleManualExerciseAdded = (exercise: ExerciseProtocol) => {
    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) =>
        index === selectedPhaseIndex
          ? { ...phase, exercises: [...phase.exercises, exercise] }
          : phase
      )
    }
    onProtocolUpdate(updatedProtocol)
  }

  const handleManualModalityAdded = (modality: ModalityProtocol) => {
    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) =>
        index === selectedPhaseIndex
          ? { ...phase, modalities: [...phase.modalities, modality] }
          : phase
      )
    }
    onProtocolUpdate(updatedProtocol)
  }

  const handleManualTherapyAdded = (therapy: ManualTherapyProtocol) => {
    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) =>
        index === selectedPhaseIndex
          ? { ...phase, manualTherapy: [...(phase.manualTherapy || []), therapy] }
          : phase
      )
    }
    onProtocolUpdate(updatedProtocol)
  }

  const handleManualEntryLog = (
    type: ProtocolLoggingType,
    itemName: string,
    itemData: ManualExerciseFormData | ManualModalityFormData | ManualTherapyFormData
  ) => {
    const currentPhase = protocol.treatmentPhases[selectedPhaseIndex]
    if (onManualEntryLog && currentPhase) {
      onManualEntryLog(type, itemName, itemData, currentPhase.phaseName, selectedPhaseIndex)
    }
  }

  // Inline custom input handlers
  const handleExerciseInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && exerciseInput.name.trim()) {
      e.preventDefault()
      if (!exerciseInput.expanded) {
        setExerciseInput({ ...exerciseInput, expanded: true })
      } else {
        handleAddCustomExercise()
      }
    }
    if (e.key === 'Escape') {
      setExerciseInput({ name: '', expanded: false, sets: 3, reps: '10-12', frequency: 'Daily' })
    }
  }

  const handleAddCustomExercise = () => {
    if (!exerciseInput.name.trim()) return

    const formData: ManualExerciseFormData = {
      exerciseName: exerciseInput.name,
      instructions: '',
      frequency: exerciseInput.frequency,
      sets: exerciseInput.sets,
      repetitions: exerciseInput.reps,
      holdDuration: '',
      equipment: [],
      progressionCues: '',
      safetyNotes: '',
    }

    const exerciseProtocol: ExerciseProtocol = {
      exerciseName: formData.exerciseName,
      instructions: formData.instructions,
      frequency: formData.frequency,
      sets: formData.sets,
      repetitions: formData.repetitions,
      holdDuration: 'N/A',
      equipment: [],
      progressionCues: '',
      safetyNotes: '',
    }

    handleManualExerciseAdded(exerciseProtocol)
    handleManualEntryLog('exercise', formData.exerciseName, formData)
    setExerciseInput({ name: '', expanded: false, sets: 3, reps: '10-12', frequency: 'Daily' })
  }

  const handleModalityInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && modalityInput.name.trim()) {
      e.preventDefault()
      if (!modalityInput.expanded) {
        setModalityInput({ ...modalityInput, expanded: true })
      } else {
        handleAddCustomModality()
      }
    }
    if (e.key === 'Escape') {
      setModalityInput({ name: '', expanded: false, duration: '15 minutes', frequency: '3x per week' })
    }
  }

  const handleAddCustomModality = () => {
    if (!modalityInput.name.trim()) return

    const formData: ManualModalityFormData = {
      modalityName: modalityInput.name,
      parameters: '',
      duration: modalityInput.duration,
      frequency: modalityInput.frequency,
      applicationMethod: '',
      clinicalSupervisionRequired: false,
    }

    const modalityProtocol: ModalityProtocol = {
      modalityName: formData.modalityName,
      parameters: '',
      duration: formData.duration,
      frequency: formData.frequency,
      applicationMethod: '',
      clinicalSupervisionRequired: false,
    }

    handleManualModalityAdded(modalityProtocol)
    handleManualEntryLog('modality', formData.modalityName, formData)
    setModalityInput({ name: '', expanded: false, duration: '15 minutes', frequency: '3x per week' })
  }

  const handleManualTherapyInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && manualTherapyInput.name.trim()) {
      e.preventDefault()
      if (!manualTherapyInput.expanded) {
        setManualTherapyInput({ ...manualTherapyInput, expanded: true })
      } else {
        handleAddCustomManualTherapy()
      }
    }
    if (e.key === 'Escape') {
      setManualTherapyInput({ name: '', expanded: false, duration: '30 minutes', frequency: '2x per week' })
    }
  }

  const handleAddCustomManualTherapy = () => {
    if (!manualTherapyInput.name.trim()) return

    const formData: ManualTherapyFormData = {
      technique: manualTherapyInput.name,
      frequency: manualTherapyInput.frequency,
      sessionDuration: manualTherapyInput.duration,
      clinicalOnly: true,
      expectedOutcome: '',
    }

    const therapyProtocol: ManualTherapyProtocol = {
      technique: formData.technique,
      frequency: formData.frequency,
      sessionDuration: formData.sessionDuration,
      clinicalOnly: true,
      expectedOutcome: '',
    }

    handleManualTherapyAdded(therapyProtocol)
    handleManualEntryLog('manual_therapy', formData.technique, formData)
    setManualTherapyInput({ name: '', expanded: false, duration: '30 minutes', frequency: '2x per week' })
  }

  const FREQUENCY_OPTIONS = [
    { value: 'Daily', label: 'Daily' },
    { value: '2x daily', label: '2x daily' },
    { value: '3x per week', label: '3x/week' },
    { value: '2x per week', label: '2x/week' },
    { value: 'Weekly', label: 'Weekly' },
  ]

  const removeExerciseFromPhase = (exerciseIndex: number, phaseIndex: number) => {
    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) => 
        index === phaseIndex 
          ? { 
              ...phase, 
              exercises: phase.exercises.filter((_, idx) => idx !== exerciseIndex) 
            }
          : phase
      )
    }

    onProtocolUpdate(updatedProtocol)
  }

  const removeModalityFromPhase = (modalityIndex: number, phaseIndex: number) => {
    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) => 
        index === phaseIndex 
          ? { 
              ...phase, 
              modalities: phase.modalities.filter((_, idx) => idx !== modalityIndex) 
            }
          : phase
      )
    }

    onProtocolUpdate(updatedProtocol)
  }

  const removeManualTherapyFromPhase = (therapyIndex: number, phaseIndex: number) => {
    const updatedProtocol = {
      ...protocol,
      treatmentPhases: protocol.treatmentPhases.map((phase, index) => 
        index === phaseIndex 
          ? { 
              ...phase, 
              manualTherapy: (phase.manualTherapy || []).filter((_, idx) => idx !== therapyIndex) 
            }
          : phase
      )
    }

    onProtocolUpdate(updatedProtocol)
  }


  const checkSafetyContraindications = (item: StaticExercise | StaticModality | StaticManualTherapy) => {
    const hasContraindications = item.contraindications.length > 0
    return hasContraindications
  }

  const renderExerciseCard = (exercise: StaticExercise) => (
    <Card 
      key={exercise.id} 
      className="p-3 hover:shadow-sm transition-all border border-gray-200 hover:border-healui-primary/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm leading-tight">{exercise.name}</h4>
        </div>
        <Button
          size="sm"
          onClick={() => addExerciseToPhase(exercise, selectedPhaseIndex)}
          className="bg-healui-primary hover:bg-healui-primary-dark ml-3 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )

  const renderModalityCard = (modality: StaticModality) => {
    // Get category colors for clean badge display
    const getCategoryBadgeColors = (category: string) => {
      const colorMap = {
        electrotherapy: 'bg-blue-100 text-blue-700',
        cryotherapy: 'bg-cyan-100 text-cyan-700',
        laser_phototherapy: 'bg-red-100 text-red-700',
        ultrasound: 'bg-purple-100 text-purple-700',
        other: 'bg-gray-100 text-gray-700'
      };
      return colorMap[category] || colorMap.other;
    };

    const getCategoryDisplayName = (category: string) => {
      const nameMap = {
        electrotherapy: 'Electrotherapy',
        cryotherapy: 'Cryotherapy',
        laser_phototherapy: 'Laser',
        ultrasound: 'Ultrasound',
        other: 'Other'
      };
      return nameMap[category] || 'Other';
    };

    return (
      <Card 
        key={modality.id} 
        className="p-3 hover:shadow-sm transition-all border border-gray-200 hover:border-healui-primary/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm leading-tight truncate">{modality.name}</h4>
            <Badge 
              className={`text-xs mt-1 font-medium ${getCategoryBadgeColors(modality.category)}`}
            >
              {getCategoryDisplayName(modality.category)}
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={() => addModalityToPhase(modality, selectedPhaseIndex)}
            className="bg-healui-primary hover:bg-healui-primary-dark ml-3 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  const renderManualTherapyCard = (therapy: StaticManualTherapy) => (
    <Card 
      key={therapy.id} 
      className="p-3 hover:shadow-sm transition-all border border-gray-200 hover:border-healui-primary/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm leading-tight">{therapy.name}</h4>
        </div>
        <Button
          size="sm"
          onClick={() => addManualTherapyToPhase(therapy, selectedPhaseIndex)}
          className="bg-healui-primary hover:bg-healui-primary-dark ml-3 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      if (dragData.type === 'exercise') {
        addExerciseToPhase(dragData.data, selectedPhaseIndex)
      } else if (dragData.type === 'modality') {
        addModalityToPhase(dragData.data, selectedPhaseIndex)
      } else if (dragData.type === 'manual-therapy') {
        addManualTherapyToPhase(dragData.data, selectedPhaseIndex)
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  const renderCurrentPhaseExercises = () => {
    const currentPhase = protocol.treatmentPhases[selectedPhaseIndex]
    if (!currentPhase) return null

    return (
      <div 
        className="space-y-3"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <h4 className="font-medium text-gray-900">Current Exercises</h4>
        <div className="min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/50">
          <p className="text-xs text-gray-500 mb-2">Drop exercises here or use the + button</p>
          {currentPhase.exercises.map((exercise, index) => (
            <Card key={index} className="p-3 bg-blue-50 border-blue-200 mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-gray-900">{exercise.exerciseName}</h5>
                  <p className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.repetitions} reps, {exercise.frequency}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeExerciseFromPhase(index, selectedPhaseIndex)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
          {currentPhase.exercises.length === 0 && (
            <p className="text-gray-400 text-center py-4">No exercises added yet</p>
          )}
        </div>
      </div>
    )
  }

  const renderCurrentPhaseModalities = () => {
    const currentPhase = protocol.treatmentPhases[selectedPhaseIndex]
    if (!currentPhase) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Current Modalities</h4>
        {currentPhase.modalities.map((modality, index) => (
          <Card key={index} className="p-3 bg-amber-50 border-amber-200">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium text-gray-900">{modality.modalityName}</h5>
                <p className="text-sm text-gray-600">
                  {modality.duration}, {modality.frequency}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeModalityFromPhase(index, selectedPhaseIndex)}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!staticConditionData) {
    return (
      <div className="text-center py-8">
        <Info className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Static Data Available</h3>
        <p className="text-gray-600">
          Static condition data is required for customization. The AI protocol will be used as-is.
        </p>
      </div>
    )
  }

  // Debug: Log the structure of static condition data
  console.log('Static Condition Data Structure:', staticConditionData)
  console.log('Phases from static data:', staticConditionData?.phases)
  console.log('Goals from static data:', staticConditionData?.goals)
  console.log('All Exercises:', staticConditionData?.allExercises)
  console.log('All Modalities:', staticConditionData?.allModalities)
  console.log('All Manual Therapy:', staticConditionData?.allManualTherapy)
  console.log('Protocol Structure:', protocol)
  console.log('Protocol Treatment Phases:', protocol.treatmentPhases)

  return (
    <div className="space-y-4">
      {/* Phase & Goals Selection */}
      {staticConditionData && (
        <div className="space-y-3">
          {/* Phase Selection from Static Data */}
          {staticConditionData.phases && staticConditionData.phases.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-800">Treatment Phases</h4>
              <div className="flex flex-wrap gap-1.5">
                {staticConditionData.phases.map((phase: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => toggleStaticPhase(phase)}
                    className={`px-2 py-1 text-xs border rounded-full transition-colors ${
                      selectedStaticPhases.includes(phase)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Goals Selection from Static Data */}
          {staticConditionData.goals && staticConditionData.goals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-800">Treatment Goals</h4>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {staticConditionData.goals.map((goal: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => toggleGoal(goal)}
                    className={`px-2 py-1 text-xs border rounded-full transition-colors ${
                      selectedGoals.includes(goal)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Summary */}
          {(selectedStaticPhases.length > 0 || selectedGoals.length > 0) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-semibold text-gray-800">Selected for Protocol</h4>
              
              {selectedStaticPhases.length > 0 && (
                <div>
                  <span className="text-xs text-gray-600">Phases: </span>
                  <span className="text-xs font-medium text-blue-700">
                    {selectedStaticPhases.join(', ')}
                  </span>
                </div>
              )}
              
              {selectedGoals.length > 0 && (
                <div>
                  <span className="text-xs text-gray-600">Goals: </span>
                  <span className="text-xs font-medium text-green-700">
                    {selectedGoals.slice(0, 3).join(', ')}
                    {selectedGoals.length > 3 && ` +${selectedGoals.length - 3} more`}
                  </span>
                </div>
              )}
              
              <Button
                size="sm"
                onClick={() => {
                  // Here you could add logic to update the protocol with selected phases/goals
                  console.log('Selected phases:', selectedStaticPhases)
                  console.log('Selected goals:', selectedGoals)
                }}
                className="bg-healui-primary hover:bg-healui-primary-dark text-white mt-2"
              >
                Apply to Protocol
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Clean Treatment Options */}
      <Tabs defaultValue="exercises" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="exercises" 
            className="data-[state=active]:bg-white data-[state=active]:text-healui-primary data-[state=active]:shadow-sm text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Exercises</span>
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{availableExercises.length}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="modalities" 
            className="data-[state=active]:bg-white data-[state=active]:text-healui-primary data-[state=active]:shadow-sm text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Modalities</span>
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{availableModalities.length}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="manual" 
            className="data-[state=active]:bg-white data-[state=active]:text-healui-primary data-[state=active]:shadow-sm text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Manual</span>
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{availableManualTherapy.length}</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="exercises" className="space-y-2 max-h-96 overflow-y-auto mt-3">
          {availableExercises.length > 0 ? (
            availableExercises.map(renderExerciseCard)
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">
              No additional exercises available.
            </p>
          )}
          {/* Inline Custom Exercise Input */}
          <div className="pt-3 border-t border-gray-200 mt-3">
            <div className={`border rounded-lg transition-all ${exerciseInput.expanded ? 'border-purple-400 bg-purple-50/50 p-3' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <Input
                  ref={exerciseInputRef}
                  type="text"
                  placeholder="Add custom exercise..."
                  value={exerciseInput.name}
                  onChange={(e) => setExerciseInput({ ...exerciseInput, name: e.target.value })}
                  onKeyDown={handleExerciseInputKeyDown}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm placeholder:text-gray-400"
                />
                {exerciseInput.name && !exerciseInput.expanded && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" /> enter
                  </span>
                )}
              </div>

              {exerciseInput.expanded && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={exerciseInput.sets}
                        onChange={(e) => setExerciseInput({ ...exerciseInput, sets: parseInt(e.target.value) || 1 })}
                        className="w-14 h-8 text-sm text-center"
                      />
                      <span className="text-xs text-gray-500">sets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={exerciseInput.reps}
                        onChange={(e) => setExerciseInput({ ...exerciseInput, reps: e.target.value })}
                        className="w-16 h-8 text-sm text-center"
                        placeholder="10-12"
                      />
                      <span className="text-xs text-gray-500">reps</span>
                    </div>
                    <Select
                      value={exerciseInput.frequency}
                      onValueChange={(value) => setExerciseInput({ ...exerciseInput, frequency: value })}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddCustomExercise}
                      className="h-8 bg-purple-600 hover:bg-purple-700 text-white ml-auto"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Press Enter to add, Esc to cancel</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modalities" className="space-y-2 max-h-96 overflow-y-auto mt-3">
          {availableModalities.length > 0 ? (
            availableModalities.map(renderModalityCard)
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">
              No additional modalities available.
            </p>
          )}
          {/* Inline Custom Modality Input */}
          <div className="pt-3 border-t border-gray-200 mt-3">
            <div className={`border rounded-lg transition-all ${modalityInput.expanded ? 'border-purple-400 bg-purple-50/50 p-3' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <Input
                  ref={modalityInputRef}
                  type="text"
                  placeholder="Add custom modality..."
                  value={modalityInput.name}
                  onChange={(e) => setModalityInput({ ...modalityInput, name: e.target.value })}
                  onKeyDown={handleModalityInputKeyDown}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm placeholder:text-gray-400"
                />
                {modalityInput.name && !modalityInput.expanded && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" /> enter
                  </span>
                )}
              </div>

              {modalityInput.expanded && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={modalityInput.duration}
                        onChange={(e) => setModalityInput({ ...modalityInput, duration: e.target.value })}
                        className="w-20 h-8 text-sm text-center"
                        placeholder="15 min"
                      />
                      <span className="text-xs text-gray-500">duration</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={modalityInput.frequency}
                        onChange={(e) => setModalityInput({ ...modalityInput, frequency: e.target.value })}
                        className="w-24 h-8 text-sm text-center"
                        placeholder="3x/week"
                      />
                      <span className="text-xs text-gray-500">freq</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddCustomModality}
                      className="h-8 bg-purple-600 hover:bg-purple-700 text-white ml-auto"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Press Enter to add, Esc to cancel</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-2 max-h-96 overflow-y-auto mt-3">
          {planType === 'home' ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Manual therapy requires hands-on treatment by a physiotherapist.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Available in clinical protocols only.
              </p>
            </div>
          ) : (
            <>
              {availableManualTherapy.length > 0 ? (
                availableManualTherapy.map(renderManualTherapyCard)
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">
                  No additional manual therapy techniques available.
                </p>
              )}
              {/* Inline Custom Manual Therapy Input */}
              <div className="pt-3 border-t border-gray-200 mt-3">
                <div className={`border rounded-lg transition-all ${manualTherapyInput.expanded ? 'border-purple-400 bg-purple-50/50 p-3' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <Input
                      ref={manualTherapyInputRef}
                      type="text"
                      placeholder="Add custom technique..."
                      value={manualTherapyInput.name}
                      onChange={(e) => setManualTherapyInput({ ...manualTherapyInput, name: e.target.value })}
                      onKeyDown={handleManualTherapyInputKeyDown}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm placeholder:text-gray-400"
                    />
                    {manualTherapyInput.name && !manualTherapyInput.expanded && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CornerDownLeft className="w-3 h-3" /> enter
                      </span>
                    )}
                  </div>

                  {manualTherapyInput.expanded && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            value={manualTherapyInput.duration}
                            onChange={(e) => setManualTherapyInput({ ...manualTherapyInput, duration: e.target.value })}
                            className="w-20 h-8 text-sm text-center"
                            placeholder="30 min"
                          />
                          <span className="text-xs text-gray-500">duration</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            value={manualTherapyInput.frequency}
                            onChange={(e) => setManualTherapyInput({ ...manualTherapyInput, frequency: e.target.value })}
                            className="w-24 h-8 text-sm text-center"
                            placeholder="2x/week"
                          />
                          <span className="text-xs text-gray-500">freq</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleAddCustomManualTherapy}
                          className="h-8 bg-purple-600 hover:bg-purple-700 text-white ml-auto"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Press Enter to add, Esc to cancel</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

    </div>
  )
}

export default ProtocolCustomizationStep