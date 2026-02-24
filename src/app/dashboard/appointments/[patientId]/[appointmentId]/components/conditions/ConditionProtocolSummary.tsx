'use client'

import React, { useState } from 'react'
import { Package, History, Sparkles, ChevronDown, Zap, Hand, Target } from 'lucide-react'
import { format } from 'date-fns'

interface ProtocolModality {
  modalityName: string
  duration: string
  frequency: string
  parameters?: string
  applicationMethod?: string
  clinicalSupervisionRequired?: boolean
}

interface ProtocolManualTherapy {
  technique: string
  frequency: string
  sessionDuration: string
  clinicalOnly?: boolean
  expectedOutcome?: string
}

interface ProtocolPhase {
  phaseName: string
  durationWeeks: number
  goals?: string[]
}

interface ProtocolData {
  id?: string
  protocol_title?: string
  version?: number
  exercises?: any[]
  goals?: string[]
  treatment_phases?: ProtocolPhase[]
  modalities?: ProtocolModality[]
  manual_therapy?: ProtocolManualTherapy[]
  program_duration_weeks?: number
  created_at?: string
  updated_at?: string
}

interface ConditionProtocolSummaryProps {
  homeProtocol?: ProtocolData | null
  clinicalProtocol?: ProtocolData | null
  isHomePrevious?: boolean
  isClinicalPrevious?: boolean
  onGenerateNew?: () => void
  onViewHistory?: () => void
}

export default function ConditionProtocolSummary({
  homeProtocol,
  clinicalProtocol,
  isHomePrevious = false,
  isClinicalPrevious = false,
  onGenerateNew,
  onViewHistory,
}: ConditionProtocolSummaryProps) {
  const [expandedSection, setExpandedSection] = useState<'home' | 'clinical' | null>(null)

  const homeCount = homeProtocol?.exercises?.length || 0
  const clinicalCount = clinicalProtocol?.exercises?.length || 0

  const toggleSection = (section: 'home' | 'clinical') => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  const getSummaryCounts = (protocol: ProtocolData | null | undefined) => {
    if (!protocol) return ''
    const parts: string[] = []
    const exCount = protocol.exercises?.length || 0
    parts.push(`${exCount} ex`)
    if (protocol.modalities && protocol.modalities.length > 0) {
      parts.push(`${protocol.modalities.length} mod`)
    }
    if (protocol.manual_therapy && protocol.manual_therapy.length > 0) {
      parts.push(`${protocol.manual_therapy.length} MT`)
    }
    return parts.join(' · ')
  }

  // Group exercises by phase using order_index (phaseIndex * 100 + exIndex)
  const groupExercisesByPhase = (protocol: ProtocolData) => {
    const phases = protocol.treatment_phases || []
    const exercises = protocol.exercises || []

    if (phases.length === 0) {
      return [{ phase: null, exercises }]
    }

    return phases.map((phase, phaseIdx) => {
      const phaseExercises = exercises.filter(ex => {
        const idx = ex.order_index ?? 0
        return Math.floor(idx / 100) === phaseIdx
      })
      return { phase, exercises: phaseExercises }
    })
  }

  const renderProtocolContent = (protocol: ProtocolData, isPrevious: boolean) => {
    const phaseGroups = groupExercisesByPhase(protocol)
    const modalities = protocol.modalities || []
    const manualTherapy = protocol.manual_therapy || []

    return (
      <div className={`px-5 py-3 space-y-3 ${isPrevious ? 'bg-amber-50/30' : 'bg-gray-50/30'}`}>
        {isPrevious && protocol.created_at && (
          <div className="text-xs text-amber-600 font-medium">
            From {format(new Date(protocol.created_at), 'MMM dd, yyyy')}
          </div>
        )}

        {/* Phases with grouped exercises */}
        {phaseGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {/* Phase header */}
            {group.phase && (
              <div className="mb-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{group.phase.phaseName}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{group.phase.durationWeeks}w</span>
                </div>
                {group.phase.goals && group.phase.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {group.phase.goals.map((goal: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded">
                        <Target className="h-2.5 w-2.5" />
                        {goal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Phase exercises */}
            {group.exercises.length > 0 ? (
              <div className="space-y-1">
                {group.exercises.map((exercise: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                      isPrevious ? 'bg-amber-50/40 border border-amber-100' : 'bg-blue-50/50 border border-blue-100/50'
                    }`}
                  >
                    <span className="text-sm text-gray-800 truncate flex-1 mr-3">
                      {exercise.exercise_name || exercise.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                      <span className="font-mono">
                        {(exercise.custom_sets || exercise.sets) && `${exercise.custom_sets || exercise.sets}s`}
                        {(exercise.custom_sets || exercise.sets) && (exercise.custom_reps || exercise.reps) && ' × '}
                        {(exercise.custom_reps || exercise.reps) && `${exercise.custom_reps || exercise.reps}r`}
                      </span>
                      {exercise.frequency && (
                        <span className="text-gray-400">{exercise.frequency}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : group.phase ? (
              <p className="text-[10px] text-gray-300 pl-3">No exercises in this phase</p>
            ) : null}

            {/* Divider between phases */}
            {gIdx < phaseGroups.length - 1 && (
              <div className="border-t border-gray-100 mt-2.5" />
            )}
          </div>
        ))}

        {/* No exercises at all */}
        {(!protocol.exercises || protocol.exercises.length === 0) && phaseGroups.every(g => g.exercises.length === 0) && (
          <p className="text-xs text-gray-400 py-1">No exercises</p>
        )}

        {/* Modalities */}
        {modalities.length > 0 && (
          <div>
            <div className="border-t border-gray-100 pt-2 mt-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Modalities</div>
              <div className="space-y-1">
                {modalities.map((mod, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                      isPrevious ? 'bg-amber-50/40 border border-amber-100' : 'bg-amber-50/50 border border-amber-100/50'
                    }`}
                  >
                    <span className="text-sm text-gray-800 truncate flex-1 mr-3 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      {mod.modalityName}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {mod.duration}{mod.frequency ? `, ${mod.frequency}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manual Therapy */}
        {manualTherapy.length > 0 && (
          <div>
            <div className="border-t border-gray-100 pt-2 mt-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Manual Therapy</div>
              <div className="space-y-1">
                {manualTherapy.map((mt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                      isPrevious ? 'bg-amber-50/40 border border-amber-100' : 'bg-green-50/50 border border-green-100/50'
                    }`}
                  >
                    <span className="text-sm text-gray-800 truncate flex-1 mr-3 flex items-center gap-1.5">
                      <Hand className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {mt.technique}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {mt.frequency}{mt.sessionDuration ? `, ${mt.sessionDuration}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100">
      {/* Compact summary row */}
      <div className="px-5 py-2.5 flex items-center gap-3 text-xs">
        <Package className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />

        {/* Home protocol */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Home:</span>
          {homeProtocol ? (
            <button
              onClick={() => toggleSection('home')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
            >
              {getSummaryCounts(homeProtocol)}
              {isHomePrevious && (
                <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                  <History className="h-2.5 w-2.5" />
                  prev
                </span>
              )}
              <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${expandedSection === 'home' ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button
              onClick={onGenerateNew}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Generate
            </button>
          )}
        </div>

        <span className="text-gray-200">|</span>

        {/* Clinical protocol */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Clinical:</span>
          {clinicalProtocol ? (
            <button
              onClick={() => toggleSection('clinical')}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
            >
              {getSummaryCounts(clinicalProtocol)}
              {isClinicalPrevious && (
                <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                  <History className="h-2.5 w-2.5" />
                  prev
                </span>
              )}
              <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${expandedSection === 'clinical' ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <span className="text-gray-300 italic">None</span>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {(isHomePrevious || isClinicalPrevious) && onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              New
            </button>
          )}
        </div>
      </div>

      {/* Expanded protocol content */}
      {expandedSection === 'home' && homeProtocol && (
        renderProtocolContent(homeProtocol, isHomePrevious)
      )}
      {expandedSection === 'clinical' && clinicalProtocol && (
        renderProtocolContent(clinicalProtocol, isClinicalPrevious)
      )}
    </div>
  )
}
