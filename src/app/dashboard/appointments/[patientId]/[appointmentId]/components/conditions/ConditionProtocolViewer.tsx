'use client'

import React from 'react'
import { Activity, Zap, Hand, Clock, History } from 'lucide-react'

interface ConditionProtocolViewerProps {
  protocol: {
    id: string
    protocol_title?: string
    version?: number
    exercises?: any[]
    modalities?: any[]
    manual_therapy?: any[]
    treatment_phases?: string[]
    created_at?: string
    updated_at?: string
  }
  onViewHistory?: () => void
}

/**
 * ConditionProtocolViewer - Displays current active protocol details
 * Shows exercises, modalities, manual therapy, and version info
 */
export default function ConditionProtocolViewer({
  protocol,
  onViewHistory
}: ConditionProtocolViewerProps) {
  if (!protocol) {
    return (
      <div className="p-5 text-center">
        <p className="text-gray-600">No protocol available</p>
      </div>
    )
  }

  return (
    <div className="p-5">
      {/* Protocol Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h4 className="text-base font-semibold text-[#000000] mb-1">
            {protocol.protocol_title || 'Treatment Protocol'}
          </h4>
          <p className="text-sm text-gray-600">
            Version {protocol.version || 1} • Last updated{' '}
            {protocol.updated_at ? new Date(protocol.updated_at).toLocaleDateString() : 'Recently'}
          </p>
        </div>
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#1e5f79] hover:text-[#164557] hover:bg-[#eff8ff] rounded-lg transition-colors"
          >
            <History className="h-4 w-4" />
            History
          </button>
        )}
      </div>

      {/* Protocol Sections */}
      <div className="space-y-3">
        {/* Exercises */}
        {protocol.exercises && protocol.exercises.length > 0 && (
          <div className="bg-[#eff8ff] rounded-lg p-3 border border-[#1e5f79]/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-[#1e5f79]" />
              <h5 className="text-sm font-semibold text-[#000000]">
                Exercises ({protocol.exercises.length})
              </h5>
            </div>
            <ul className="space-y-2">
              {protocol.exercises.slice(0, 3).map((exercise: any, index: number) => (
                <li key={index} className="text-sm text-gray-700">
                  <span className="font-medium">{exercise.name || exercise.exercise_name}</span>
                  {(exercise.sets || exercise.reps || exercise.duration) && (
                    <span className="text-gray-500 ml-2">
                      {exercise.sets && `${exercise.sets} sets`}
                      {exercise.reps && ` × ${exercise.reps} reps`}
                      {exercise.duration && ` • ${exercise.duration}`}
                    </span>
                  )}
                </li>
              ))}
              {protocol.exercises.length > 3 && (
                <li className="text-sm text-[#1e5f79] font-medium">
                  +{protocol.exercises.length - 3} more exercises
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Modalities */}
        {protocol.modalities && protocol.modalities.length > 0 && (
          <div className="bg-[#eff8ff] rounded-lg p-3 border border-[#1e5f79]/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-[#1e5f79]" />
              <h5 className="text-sm font-semibold text-[#000000]">
                Modalities ({protocol.modalities.length})
              </h5>
            </div>
            <ul className="space-y-2">
              {protocol.modalities.slice(0, 3).map((modality: any, index: number) => (
                <li key={index} className="text-sm text-gray-700">
                  <span className="font-medium">{modality.name || modality.modality_name}</span>
                  {modality.duration && (
                    <span className="text-gray-500 ml-2">• {modality.duration}</span>
                  )}
                </li>
              ))}
              {protocol.modalities.length > 3 && (
                <li className="text-sm text-[#1e5f79] font-medium">
                  +{protocol.modalities.length - 3} more modalities
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Manual Therapy */}
        {protocol.manual_therapy && protocol.manual_therapy.length > 0 && (
          <div className="bg-[#eff8ff] rounded-lg p-3 border border-[#1e5f79]/20">
            <div className="flex items-center gap-2 mb-2">
              <Hand className="h-4 w-4 text-[#1e5f79]" />
              <h5 className="text-sm font-semibold text-[#000000]">
                Manual Therapy ({protocol.manual_therapy.length})
              </h5>
            </div>
            <ul className="space-y-2">
              {protocol.manual_therapy.slice(0, 3).map((therapy: any, index: number) => (
                <li key={index} className="text-sm text-gray-700">
                  <span className="font-medium">{therapy.name || therapy.technique_name}</span>
                  {therapy.duration && (
                    <span className="text-gray-500 ml-2">• {therapy.duration}</span>
                  )}
                </li>
              ))}
              {protocol.manual_therapy.length > 3 && (
                <li className="text-sm text-[#1e5f79] font-medium">
                  +{protocol.manual_therapy.length - 3} more techniques
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Treatment Phases */}
        {protocol.treatment_phases && protocol.treatment_phases.length > 0 && (
          <div className="bg-[#eff8ff] rounded-lg p-3 border border-[#1e5f79]/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-[#1e5f79]" />
              <h5 className="text-sm font-semibold text-[#000000]">Treatment Phases</h5>
            </div>
            <div className="flex flex-wrap gap-2">
              {protocol.treatment_phases.map((phase: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 border border-[#000000]/10"
                >
                  {phase}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {(!protocol.exercises || protocol.exercises.length === 0) &&
        (!protocol.modalities || protocol.modalities.length === 0) &&
        (!protocol.manual_therapy || protocol.manual_therapy.length === 0) && (
          <div className="text-center py-8">
            <p className="text-gray-600">No treatment details available</p>
          </div>
        )}
    </div>
  )
}
