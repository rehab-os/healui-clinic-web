'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface PhaseGoalSelectorProps {
  visitConditionId: string
  currentPhase?: string
  currentGoals?: string[]
  phaseOptions?: string[]
  goalOptions?: string[]
  onSave?: (data: { selected_phase?: string; custom_phase?: string; selected_goals?: string[]; custom_goals?: string[] }) => Promise<void>
}

/**
 * PhaseGoalSelector - Dropdown for phase selection and multi-select for goals
 * Auto-saves on change with toast notifications
 */
export default function PhaseGoalSelector({
  visitConditionId,
  currentPhase = '',
  currentGoals = [],
  phaseOptions = ['Acute', 'Subacute', 'Chronic', 'Recovery', 'Maintenance'],
  goalOptions = ['Reduce Pain', 'Improve ROM', 'Increase Strength', 'Restore Function', 'Prevent Recurrence'],
  onSave
}: PhaseGoalSelectorProps) {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase)
  const [customPhase, setCustomPhase] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>(currentGoals)
  const [customGoal, setCustomGoal] = useState('')
  const [showCustomPhase, setShowCustomPhase] = useState(false)
  const [showCustomGoal, setShowCustomGoal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSelectedPhase(currentPhase)
  }, [currentPhase])

  useEffect(() => {
    setSelectedGoals(currentGoals)
  }, [currentGoals])

  const handlePhaseChange = async (phase: string) => {
    setSelectedPhase(phase)
    setShowCustomPhase(false)
    await saveChanges({ selected_phase: phase, custom_phase: undefined })
  }

  const handleCustomPhaseAdd = async () => {
    if (!customPhase.trim()) return
    await saveChanges({ custom_phase: customPhase.trim(), selected_phase: undefined })
    setCustomPhase('')
    setShowCustomPhase(false)
  }

  const handleGoalToggle = async (goal: string) => {
    const newGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter(g => g !== goal)
      : [...selectedGoals, goal]
    setSelectedGoals(newGoals)
    await saveChanges({ selected_goals: newGoals })
  }

  const handleCustomGoalAdd = async () => {
    if (!customGoal.trim()) return
    const newGoals = [...selectedGoals, customGoal.trim()]
    setSelectedGoals(newGoals)
    await saveChanges({ selected_goals: newGoals, custom_goals: [customGoal.trim()] })
    setCustomGoal('')
    setShowCustomGoal(false)
  }

  const saveChanges = async (data: any) => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave(data)
      toast.success('Updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save changes')
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-5 space-y-5">
      {/* Phase Selection */}
      <div>
        <label className="block text-sm font-semibold text-[#000000] mb-2">
          Treatment Phase
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
          {phaseOptions.map((phase) => (
            <button
              key={phase}
              onClick={() => handlePhaseChange(phase)}
              disabled={isSaving}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                selectedPhase === phase
                  ? 'bg-[#1e5f79] text-white border-[#1e5f79]'
                  : 'bg-white text-gray-700 border-[#000000]/10 hover:bg-[#eff8ff]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {phase}
            </button>
          ))}
        </div>

        {/* Custom Phase Input */}
        {!showCustomPhase ? (
          <button
            onClick={() => setShowCustomPhase(true)}
            className="text-sm text-[#1e5f79] hover:text-[#164557] font-medium flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add custom phase
          </button>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={customPhase}
              onChange={(e) => setCustomPhase(e.target.value)}
              placeholder="Enter custom phase"
              className="flex-1 px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomPhaseAdd()
                if (e.key === 'Escape') setShowCustomPhase(false)
              }}
              autoFocus
            />
            <button
              onClick={handleCustomPhaseAdd}
              disabled={!customPhase.trim() || isSaving}
              className="p-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#164557] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowCustomPhase(false)
                setCustomPhase('')
              }}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Goals Selection */}
      <div>
        <label className="block text-sm font-semibold text-[#000000] mb-2">
          Treatment Goals ({selectedGoals.length} selected)
        </label>
        <div className="space-y-2 mb-2">
          {goalOptions.map((goal) => {
            const isSelected = selectedGoals.includes(goal)
            return (
              <label
                key={goal}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#c8eaeb] border-[#1e5f79] text-[#000000]'
                    : 'bg-white border-[#000000]/10 hover:bg-[#eff8ff]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleGoalToggle(goal)}
                  disabled={isSaving}
                  className="h-4 w-4 text-[#1e5f79] border-gray-300 rounded focus:ring-[#1e5f79]"
                />
                <span className="text-sm font-medium">{goal}</span>
              </label>
            )
          })}
        </div>

        {/* Custom Goal Input */}
        {!showCustomGoal ? (
          <button
            onClick={() => setShowCustomGoal(true)}
            className="text-sm text-[#1e5f79] hover:text-[#164557] font-medium flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add custom goal
          </button>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="Enter custom goal"
              className="flex-1 px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomGoalAdd()
                if (e.key === 'Escape') setShowCustomGoal(false)
              }}
              autoFocus
            />
            <button
              onClick={handleCustomGoalAdd}
              disabled={!customGoal.trim() || isSaving}
              className="p-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#164557] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setShowCustomGoal(false)
                setCustomGoal('')
              }}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e5f79]"></div>
          Saving...
        </div>
      )}
    </div>
  )
}
