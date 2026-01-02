'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Minus, Info, AlertTriangle, CheckCircle, Search, Filter, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
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
}

const ProtocolCustomizationStep: React.FC<ProtocolCustomizationStepProps> = ({
  protocol,
  staticConditionData,
  onProtocolUpdate,
  planType
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0)

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
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
      
      // Check if exercise is already used (with flexible matching)
      const exerciseNameLower = exercise.name.toLowerCase()
      const simplifiedExerciseName = exerciseNameLower.replace(/[()]/g, '').replace(/\s+/g, ' ').trim()
      const notUsed = !getUsedExerciseNames.has(exerciseNameLower) && !getUsedExerciseNames.has(simplifiedExerciseName)
      
      const suitableForPlan = planType === 'clinical' || !exercise.equipment.some(eq => 
        eq.toLowerCase().includes('clinical') || eq.toLowerCase().includes('professional')
      )
      
      console.log(`Exercise: ${exercise.name}, notUsed: ${notUsed}, matchesSearch: ${matchesSearch}`)
      
      return matchesSearch && matchesCategory && notUsed && suitableForPlan
    })
    
    console.log('Filtered exercises:', filtered.map(ex => ex.name))
    return filtered
  }, [staticConditionData, searchTerm, selectedCategory, getUsedExerciseNames, planType])

  const availableModalities = useMemo(() => {
    if (!staticConditionData?.allModalities) return []
    
    return staticConditionData.allModalities.filter(modality => {
      const matchesSearch = modality.name.toLowerCase().includes(searchTerm.toLowerCase())
      const notUsed = !getUsedModalityNames.has(modality.name.toLowerCase())
      const suitableForPlan = planType === 'clinical' || !modality.clinicalSupervisionRequired
      
      return matchesSearch && notUsed && suitableForPlan
    })
  }, [staticConditionData, searchTerm, getUsedModalityNames, planType])

  const availableManualTherapy = useMemo(() => {
    if (!staticConditionData?.allManualTherapy || planType === 'home') return []
    
    return staticConditionData.allManualTherapy.filter(therapy => {
      const matchesSearch = therapy.name.toLowerCase().includes(searchTerm.toLowerCase())
      const notUsed = !getUsedManualTherapyNames.has(therapy.technique.toLowerCase())
      
      return matchesSearch && notUsed
    })
  }, [staticConditionData, searchTerm, getUsedManualTherapyNames, planType])

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

  const categories = useMemo(() => {
    const cats = new Set(['all'])
    staticConditionData?.allExercises.forEach(ex => cats.add(ex.category))
    return Array.from(cats)
  }, [staticConditionData])

  const checkSafetyContraindications = (item: StaticExercise | StaticModality | StaticManualTherapy) => {
    const hasContraindications = item.contraindications.length > 0
    return hasContraindications
  }

  const renderExerciseCard = (exercise: StaticExercise) => (
    <Card 
      key={exercise.id} 
      className="p-3 hover:shadow-md transition-shadow cursor-move"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'exercise',
          data: exercise
        }))
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{exercise.name}</h4>
          <div className="flex gap-1 mt-1">
            <Badge variant="outline" className="text-xs">{exercise.category}</Badge>
            <Badge variant="outline" className="text-xs">{exercise.evidenceLevel}</Badge>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => addExerciseToPhase(exercise, selectedPhaseIndex)}
          className="bg-healui-primary hover:bg-healui-primary-dark ml-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {checkSafetyContraindications(exercise) && (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
          <AlertTriangle className="w-3 h-3" />
          Contraindications present
        </div>
      )}
    </Card>
  )

  const renderModalityCard = (modality: StaticModality) => (
    <Card 
      key={modality.id} 
      className="p-3 hover:shadow-md transition-shadow cursor-move"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'modality',
          data: modality
        }))
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{modality.name}</h4>
          <div className="flex gap-1 mt-1">
            <Badge variant="outline" className="text-xs">{modality.category}</Badge>
            <Badge variant="outline" className="text-xs">{modality.evidenceLevel}</Badge>
            {modality.clinicalSupervisionRequired && (
              <Badge variant="outline" className="text-xs">Clinical Only</Badge>
            )}
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => addModalityToPhase(modality, selectedPhaseIndex)}
          className="bg-healui-primary hover:bg-healui-primary-dark ml-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {checkSafetyContraindications(modality) && (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
          <AlertTriangle className="w-3 h-3" />
          Contraindications present
        </div>
      )}
    </Card>
  )

  const renderManualTherapyCard = (therapy: StaticManualTherapy) => (
    <Card 
      key={therapy.id} 
      className="p-3 hover:shadow-md transition-shadow cursor-move"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'manual-therapy',
          data: therapy
        }))
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{therapy.name}</h4>
          <div className="flex gap-1 mt-1">
            <Badge variant="outline" className="text-xs">{therapy.category}</Badge>
            <Badge variant="outline" className="text-xs">{therapy.evidenceLevel}</Badge>
            <Badge variant="outline" className="text-xs">Clinical Only</Badge>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => addManualTherapyToPhase(therapy, selectedPhaseIndex)}
          className="bg-healui-primary hover:bg-healui-primary-dark ml-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {checkSafetyContraindications(therapy) && (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
          <AlertTriangle className="w-3 h-3" />
          Contraindications present
        </div>
      )}
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
  console.log('All Exercises:', staticConditionData?.allExercises)
  console.log('All Modalities:', staticConditionData?.allModalities)
  console.log('All Manual Therapy:', staticConditionData?.allManualTherapy)
  console.log('Protocol Structure:', protocol)
  console.log('Protocol Treatment Phases:', protocol.treatmentPhases)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Customize Protocol</h3>
        <p className="text-gray-600">
          Add exercises, modalities, or manual therapy from the static condition database to enhance the AI-generated protocol.
        </p>
      </div>

      {/* Phase Selection */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Select Phase to Customize</h4>
        <div className="flex gap-2 flex-wrap">
          {protocol.treatmentPhases.map((phase, index) => (
            <Button
              key={index}
              variant={index === selectedPhaseIndex ? "default" : "outline"}
              onClick={() => setSelectedPhaseIndex(index)}
              className={index === selectedPhaseIndex ? "bg-healui-primary hover:bg-healui-primary-dark" : ""}
            >
              {phase.phaseName} ({phase.durationWeeks}w)
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Protocol - Left Side */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Current Protocol - {protocol.treatmentPhases[selectedPhaseIndex]?.phaseName}</h4>
          
          <Tabs defaultValue="exercises" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="modalities">Modalities</TabsTrigger>
              <TabsTrigger value="manual">Manual Therapy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="exercises" className="space-y-4">
              {renderCurrentPhaseExercises()}
            </TabsContent>
            
            <TabsContent value="modalities" className="space-y-4">
              {renderCurrentPhaseModalities()}
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Current Manual Therapy</h4>
                {protocol.treatmentPhases[selectedPhaseIndex]?.manualTherapy?.map((therapy, index) => (
                  <Card key={index} className="p-3 bg-green-50 border-green-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{therapy.technique}</h5>
                        <p className="text-sm text-gray-600">
                          {therapy.frequency}, {therapy.sessionDuration}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeManualTherapyFromPhase(index, selectedPhaseIndex)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Available Options - Right Side */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900">Available Options</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Tabs defaultValue="exercises" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exercises">
                Exercises ({availableExercises.length})
              </TabsTrigger>
              <TabsTrigger value="modalities">
                Modalities ({availableModalities.length})
              </TabsTrigger>
              <TabsTrigger value="manual">
                Manual Therapy ({availableManualTherapy.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="exercises" className="space-y-3 max-h-96 overflow-y-auto">
              {availableExercises.length > 0 ? (
                availableExercises.map(renderExerciseCard)
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No additional exercises available for this phase type.
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="modalities" className="space-y-3 max-h-96 overflow-y-auto">
              {availableModalities.length > 0 ? (
                availableModalities.map(renderModalityCard)
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No additional modalities available for this phase type.
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-3 max-h-96 overflow-y-auto">
              {planType === 'home' ? (
                <p className="text-gray-500 text-center py-4">
                  Manual therapy is only available for clinical protocols.
                </p>
              ) : availableManualTherapy.length > 0 ? (
                availableManualTherapy.map(renderManualTherapyCard)
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No additional manual therapy techniques available.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default ProtocolCustomizationStep