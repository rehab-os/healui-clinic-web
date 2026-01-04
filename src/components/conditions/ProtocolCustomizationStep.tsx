'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Minus, Info, AlertTriangle, CheckCircle, X, Activity, Zap, Target } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  GeneratedProtocol, 
  StaticConditionForCustomization,
  StaticExercise,
  StaticModality,
  StaticManualTherapy,
  ExerciseProtocol,
  ModalityProtocol,
  ManualTherapyProtocol
} from '../../types/protocol-generator.types'

interface ProtocolCustomizationStepProps {
  protocol: GeneratedProtocol
  staticConditionData: StaticConditionForCustomization | null
  onProtocolUpdate: (updatedProtocol: GeneratedProtocol) => void
  planType: 'home' | 'clinical'
  selectedPhaseIndex?: number
  onPhaseChange?: (index: number) => void
}

const ProtocolCustomizationStep: React.FC<ProtocolCustomizationStepProps> = ({
  protocol,
  staticConditionData,
  onProtocolUpdate,
  planType,
  selectedPhaseIndex = 0,
  onPhaseChange
}) => {
  const [selectedStaticPhases, setSelectedStaticPhases] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

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
        </TabsContent>
        
        <TabsContent value="modalities" className="space-y-2 max-h-96 overflow-y-auto mt-3">
          {availableModalities.length > 0 ? (
            availableModalities.map(renderModalityCard)
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">
              No additional modalities available.
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-2 max-h-96 overflow-y-auto mt-3">
          {planType === 'home' ? (
            <p className="text-gray-500 text-center py-4 text-sm">
              Manual therapy only available for clinical protocols.
            </p>
          ) : availableManualTherapy.length > 0 ? (
            availableManualTherapy.map(renderManualTherapyCard)
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">
              No additional manual therapy techniques available.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProtocolCustomizationStep