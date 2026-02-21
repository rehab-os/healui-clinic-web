'use client'

import React, { useState } from 'react'
import { Package, History, Sparkles, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

interface ProtocolData {
  id?: string
  protocol_title?: string
  version?: number
  exercises?: any[]
  goals?: string[]
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
  const hasAny = !!homeProtocol || !!clinicalProtocol

  const toggleSection = (section: 'home' | 'clinical') => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  const renderExercises = (protocol: ProtocolData, isPrevious: boolean) => (
    <div className={`px-5 py-3 space-y-1.5 ${isPrevious ? 'bg-amber-50/30' : 'bg-gray-50/30'}`}>
      {isPrevious && protocol.created_at && (
        <div className="text-xs text-amber-600 font-medium mb-2">
          From {format(new Date(protocol.created_at), 'MMM dd, yyyy')}
        </div>
      )}
      {protocol.goals && protocol.goals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {protocol.goals.map((goal: string, idx: number) => (
            <span key={idx} className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md">
              {goal}
            </span>
          ))}
        </div>
      )}
      {protocol.exercises && protocol.exercises.length > 0 ? (
        <div className="space-y-1">
          {protocol.exercises.map((exercise: any, idx: number) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                isPrevious ? 'bg-amber-50/40 border border-amber-100' : 'bg-teal-50/30 border border-teal-100/50'
              }`}
            >
              <span className="text-sm text-gray-800 truncate flex-1 mr-3">
                {exercise.exercise_name || exercise.name}
              </span>
              <div className="flex items-center gap-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                {(exercise.custom_sets || exercise.sets) && (
                  <span>{exercise.custom_sets || exercise.sets}s</span>
                )}
                {(exercise.custom_reps || exercise.reps) && (
                  <span>{exercise.custom_reps || exercise.reps}r</span>
                )}
                {(exercise.custom_duration_seconds || exercise.duration) && (
                  <span>{exercise.custom_duration_seconds || exercise.duration}s</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 py-1">No exercises</p>
      )}
    </div>
  )

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
              {homeCount} exercise{homeCount !== 1 ? 's' : ''}
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
              {clinicalCount} exercise{clinicalCount !== 1 ? 's' : ''}
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
          {onViewHistory && (homeProtocol || clinicalProtocol) && (
            <button
              onClick={onViewHistory}
              className="text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1"
            >
              <History className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded exercise list */}
      {expandedSection === 'home' && homeProtocol && (
        renderExercises(homeProtocol, isHomePrevious)
      )}
      {expandedSection === 'clinical' && clinicalProtocol && (
        renderExercises(clinicalProtocol, isClinicalPrevious)
      )}
    </div>
  )
}
