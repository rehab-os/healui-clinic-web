'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  ManualExerciseFormData,
  ManualModalityFormData,
  ManualTherapyFormData,
  ProtocolLoggingType,
  ExerciseProtocol,
  ModalityProtocol,
  ManualTherapyProtocol,
} from '../../types/protocol-generator.types'

interface ManualEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  onExerciseAdded: (exercise: ExerciseProtocol) => void
  onModalityAdded: (modality: ModalityProtocol) => void
  onManualTherapyAdded: (therapy: ManualTherapyProtocol) => void
  onLogEntry: (type: ProtocolLoggingType, itemName: string, itemData: ManualExerciseFormData | ManualModalityFormData | ManualTherapyFormData) => void
  planType: 'home' | 'clinical'
  defaultTab?: ProtocolLoggingType
}

const FREQUENCY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: '2x daily', label: '2x daily' },
  { value: '3x weekly', label: '3x weekly' },
  { value: '2x weekly', label: '2x weekly' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'As needed', label: 'As needed' },
]

const initialExerciseForm: ManualExerciseFormData = {
  exerciseName: '',
  instructions: '',
  frequency: 'Daily',
  sets: 3,
  repetitions: '10-12',
  holdDuration: '',
  equipment: [],
  progressionCues: '',
  safetyNotes: '',
}

const initialModalityForm: ManualModalityFormData = {
  modalityName: '',
  parameters: '',
  duration: '15 minutes',
  frequency: '3x per week',
  applicationMethod: '',
  clinicalSupervisionRequired: false,
}

const initialTherapyForm: ManualTherapyFormData = {
  technique: '',
  frequency: '2x per week',
  sessionDuration: '30 minutes',
  clinicalOnly: true,
  expectedOutcome: '',
}

const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({
  isOpen,
  onClose,
  onExerciseAdded,
  onModalityAdded,
  onManualTherapyAdded,
  onLogEntry,
  planType,
  defaultTab = 'exercise',
}) => {
  const [activeTab, setActiveTab] = useState<ProtocolLoggingType>(defaultTab)
  const [exerciseForm, setExerciseForm] = useState<ManualExerciseFormData>(initialExerciseForm)
  const [modalityForm, setModalityForm] = useState<ManualModalityFormData>(initialModalityForm)
  const [therapyForm, setTherapyForm] = useState<ManualTherapyFormData>(initialTherapyForm)
  const [equipmentInput, setEquipmentInput] = useState('')

  const resetForms = () => {
    setExerciseForm(initialExerciseForm)
    setModalityForm(initialModalityForm)
    setTherapyForm(initialTherapyForm)
    setEquipmentInput('')
  }

  const handleClose = () => {
    resetForms()
    onClose()
  }

  const handleAddExercise = () => {
    if (!exerciseForm.exerciseName.trim()) return

    const equipment = equipmentInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0)

    const formData: ManualExerciseFormData = {
      ...exerciseForm,
      equipment,
    }

    const exerciseProtocol: ExerciseProtocol = {
      exerciseName: formData.exerciseName,
      instructions: formData.instructions,
      frequency: formData.frequency,
      sets: formData.sets,
      repetitions: formData.repetitions,
      holdDuration: formData.holdDuration || 'N/A',
      equipment: formData.equipment,
      progressionCues: formData.progressionCues,
      safetyNotes: formData.safetyNotes,
    }

    onExerciseAdded(exerciseProtocol)
    onLogEntry('exercise', formData.exerciseName, formData)
    handleClose()
  }

  const handleAddModality = () => {
    if (!modalityForm.modalityName.trim()) return

    const modalityProtocol: ModalityProtocol = {
      modalityName: modalityForm.modalityName,
      parameters: modalityForm.parameters,
      duration: modalityForm.duration,
      frequency: modalityForm.frequency,
      applicationMethod: modalityForm.applicationMethod,
      clinicalSupervisionRequired: modalityForm.clinicalSupervisionRequired,
    }

    onModalityAdded(modalityProtocol)
    onLogEntry('modality', modalityForm.modalityName, modalityForm)
    handleClose()
  }

  const handleAddTherapy = () => {
    if (!therapyForm.technique.trim()) return

    const therapyProtocol: ManualTherapyProtocol = {
      technique: therapyForm.technique,
      frequency: therapyForm.frequency,
      sessionDuration: therapyForm.sessionDuration,
      clinicalOnly: therapyForm.clinicalOnly,
      expectedOutcome: therapyForm.expectedOutcome,
    }

    onManualTherapyAdded(therapyProtocol)
    onLogEntry('manual_therapy', therapyForm.technique, therapyForm)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Custom Item</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProtocolLoggingType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exercise">Exercise</TabsTrigger>
            <TabsTrigger value="modality">Modality</TabsTrigger>
            <TabsTrigger value="manual_therapy" disabled={planType === 'home'}>
              Manual Therapy
            </TabsTrigger>
          </TabsList>

          {/* Exercise Form */}
          <TabsContent value="exercise" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="exerciseName">Exercise Name *</Label>
              <Input
                id="exerciseName"
                placeholder="e.g., Hamstring Stretch"
                value={exerciseForm.exerciseName}
                onChange={(e) => setExerciseForm({ ...exerciseForm, exerciseName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions *</Label>
              <Textarea
                id="instructions"
                placeholder="Step-by-step instructions for performing the exercise..."
                rows={3}
                value={exerciseForm.instructions}
                onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sets">Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  min={1}
                  max={10}
                  value={exerciseForm.sets}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repetitions">Repetitions</Label>
                <Input
                  id="repetitions"
                  placeholder="10-12"
                  value={exerciseForm.repetitions}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, repetitions: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holdDuration">Hold Duration</Label>
                <Input
                  id="holdDuration"
                  placeholder="30 seconds"
                  value={exerciseForm.holdDuration}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, holdDuration: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={exerciseForm.frequency}
                onValueChange={(value) => setExerciseForm({ ...exerciseForm, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment (comma-separated)</Label>
              <Input
                id="equipment"
                placeholder="yoga mat, resistance band"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="progressionCues">Progression Cues</Label>
              <Textarea
                id="progressionCues"
                placeholder="How to progress this exercise over time..."
                rows={2}
                value={exerciseForm.progressionCues}
                onChange={(e) => setExerciseForm({ ...exerciseForm, progressionCues: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="safetyNotes">Safety Notes</Label>
              <Textarea
                id="safetyNotes"
                placeholder="Important safety considerations..."
                rows={2}
                value={exerciseForm.safetyNotes}
                onChange={(e) => setExerciseForm({ ...exerciseForm, safetyNotes: e.target.value })}
              />
            </div>
          </TabsContent>

          {/* Modality Form */}
          <TabsContent value="modality" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="modalityName">Modality Name *</Label>
              <Input
                id="modalityName"
                placeholder="e.g., TENS, Ultrasound"
                value={modalityForm.modalityName}
                onChange={(e) => setModalityForm({ ...modalityForm, modalityName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameters">Parameters</Label>
              <Input
                id="parameters"
                placeholder="e.g., Frequency: 100Hz, Intensity: moderate"
                value={modalityForm.parameters}
                onChange={(e) => setModalityForm({ ...modalityForm, parameters: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modalityDuration">Duration</Label>
                <Input
                  id="modalityDuration"
                  placeholder="15 minutes"
                  value={modalityForm.duration}
                  onChange={(e) => setModalityForm({ ...modalityForm, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modalityFrequency">Frequency</Label>
                <Input
                  id="modalityFrequency"
                  placeholder="3x per week"
                  value={modalityForm.frequency}
                  onChange={(e) => setModalityForm({ ...modalityForm, frequency: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationMethod">Application Method</Label>
              <Textarea
                id="applicationMethod"
                placeholder="How to apply this modality..."
                rows={3}
                value={modalityForm.applicationMethod}
                onChange={(e) => setModalityForm({ ...modalityForm, applicationMethod: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  setModalityForm({ ...modalityForm, clinicalSupervisionRequired: !modalityForm.clinicalSupervisionRequired })
                }
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  modalityForm.clinicalSupervisionRequired
                    ? 'bg-healui-primary border-healui-primary text-white'
                    : 'bg-white border-gray-300'
                }`}
              >
                {modalityForm.clinicalSupervisionRequired && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <Label htmlFor="clinicalSupervision" className="text-sm font-normal cursor-pointer" onClick={() =>
                setModalityForm({ ...modalityForm, clinicalSupervisionRequired: !modalityForm.clinicalSupervisionRequired })
              }>
                Clinical supervision required
              </Label>
            </div>
          </TabsContent>

          {/* Manual Therapy Form */}
          <TabsContent value="manual_therapy" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="technique">Technique Name *</Label>
              <Input
                id="technique"
                placeholder="e.g., Myofascial Release"
                value={therapyForm.technique}
                onChange={(e) => setTherapyForm({ ...therapyForm, technique: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="therapyFrequency">Frequency</Label>
                <Input
                  id="therapyFrequency"
                  placeholder="2x per week"
                  value={therapyForm.frequency}
                  onChange={(e) => setTherapyForm({ ...therapyForm, frequency: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Session Duration</Label>
                <Input
                  id="sessionDuration"
                  placeholder="30 minutes"
                  value={therapyForm.sessionDuration}
                  onChange={(e) => setTherapyForm({ ...therapyForm, sessionDuration: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedOutcome">Expected Outcome</Label>
              <Textarea
                id="expectedOutcome"
                placeholder="What results to expect from this therapy..."
                rows={3}
                value={therapyForm.expectedOutcome}
                onChange={(e) => setTherapyForm({ ...therapyForm, expectedOutcome: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  setTherapyForm({ ...therapyForm, clinicalOnly: !therapyForm.clinicalOnly })
                }
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  therapyForm.clinicalOnly
                    ? 'bg-healui-primary border-healui-primary text-white'
                    : 'bg-white border-gray-300'
                }`}
              >
                {therapyForm.clinicalOnly && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <Label htmlFor="clinicalOnly" className="text-sm font-normal cursor-pointer" onClick={() =>
                setTherapyForm({ ...therapyForm, clinicalOnly: !therapyForm.clinicalOnly })
              }>
                Clinical setting only
              </Label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {activeTab === 'exercise' && (
            <Button
              onClick={handleAddExercise}
              disabled={!exerciseForm.exerciseName.trim()}
              className="bg-healui-primary hover:bg-healui-primary-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          )}
          {activeTab === 'modality' && (
            <Button
              onClick={handleAddModality}
              disabled={!modalityForm.modalityName.trim()}
              className="bg-healui-primary hover:bg-healui-primary-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Modality
            </Button>
          )}
          {activeTab === 'manual_therapy' && (
            <Button
              onClick={handleAddTherapy}
              disabled={!therapyForm.technique.trim()}
              className="bg-healui-primary hover:bg-healui-primary-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Therapy
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManualEntryDialog
