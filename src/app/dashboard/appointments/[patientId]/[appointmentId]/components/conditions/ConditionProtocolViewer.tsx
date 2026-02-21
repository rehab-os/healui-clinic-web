'use client'

import React, { useState } from 'react'
import { Package, History, Sparkles, Activity, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

interface ConditionProtocolViewerProps {
  protocolType: 'home' | 'clinical'
  protocol?: {
    id?: string
    protocol_title?: string
    version?: number
    exercises?: any[]
    goals?: string[]
    program_duration_weeks?: number
    created_at?: string
    updated_at?: string
  } | null
  isFromPreviousVisit?: boolean
  onGenerateNew?: () => void
  onViewHistory?: () => void
}

export default function ConditionProtocolViewer({
  protocolType,
  protocol,
  isFromPreviousVisit = false,
  onGenerateNew,
  onViewHistory
}: ConditionProtocolViewerProps) {
  const [expanded, setExpanded] = useState(false)
  const label = protocolType === 'home' ? 'Home Protocol' : 'Clinical Protocol'

  // Empty state — no protocol at all
  if (!protocol) {
    return (
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-300" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-xs text-gray-300 italic">Not generated</span>
          </div>
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="text-xs text-brand-teal hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate
            </button>
          )}
        </div>
      </div>
    )
  }

  const exerciseCount = protocol.exercises?.length || 0

  return (
    <div className={`border-b border-gray-200 ${isFromPreviousVisit ? 'border-l-2 border-l-amber-400' : ''}`}>
      {/* Protocol Header — clickable to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-5 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors ${
          isFromPreviousVisit ? 'bg-amber-50/30' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Package className={`h-4 w-4 ${isFromPreviousVisit ? 'text-amber-600' : 'text-gray-500'}`} />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
          {isFromPreviousVisit && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
              <History className="h-3 w-3" />
              Previous
            </span>
          )}
          <span className="text-xs text-gray-500">
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
            {protocol.program_duration_weeks ? ` · ${protocol.program_duration_weeks}w` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isFromPreviousVisit && onGenerateNew && (
            <span
              onClick={(e) => { e.stopPropagation(); onGenerateNew() }}
              className="text-xs text-brand-teal hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              New
            </span>
          )}
          {onViewHistory && (
            <span
              onClick={(e) => { e.stopPropagation(); onViewHistory() }}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1"
            >
              <History className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Protocol Content — collapsed by default */}
      {expanded && (
        <div className={`px-5 py-3 space-y-3 ${isFromPreviousVisit ? 'bg-amber-50/30' : 'bg-white'}`}>
          {isFromPreviousVisit && protocol.created_at && (
            <div className="text-xs text-amber-600 font-medium">
              Prescribed {format(new Date(protocol.created_at), 'MMM dd, yyyy')}
            </div>
          )}

          {/* Goals — compact */}
          {protocol.goals && protocol.goals.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {protocol.goals.map((goal: string, idx: number) => (
                <span key={idx} className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md">
                  {goal}
                </span>
              ))}
            </div>
          )}

          {/* Exercises — compact table-like layout */}
          {protocol.exercises && protocol.exercises.length > 0 && (
            <div className="space-y-1.5">
              {protocol.exercises.map((exercise: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    isFromPreviousVisit ? 'bg-amber-50/40 border border-amber-100' : 'bg-teal-50/30 border border-teal-100/50'
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
          )}

          {(!protocol.exercises || protocol.exercises.length === 0) && (
            <p className="text-xs text-gray-400 py-1">No exercises in this protocol</p>
          )}
        </div>
      )}
    </div>
  )
}
