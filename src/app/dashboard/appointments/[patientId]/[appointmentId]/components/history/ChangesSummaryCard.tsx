'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

interface ChangesSummaryCardProps {
  changeSummary: string
  changeDetails?: {
    exercises_changed?: number
    modalities_changed?: number
    phase_changed?: boolean
    goals_changed?: number
  }
  clinicalRationale?: string
  collapsible?: boolean
}

/**
 * ChangesSummaryCard - Human-readable change description
 * Icon indicators for change types, clinical rationale display
 * Collapsible details section
 */
export default function ChangesSummaryCard({
  changeSummary,
  changeDetails,
  clinicalRationale,
  collapsible = true
}: ChangesSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible)

  const hasDetails = changeDetails && (
    (changeDetails.exercises_changed && changeDetails.exercises_changed > 0) ||
    (changeDetails.modalities_changed && changeDetails.modalities_changed > 0) ||
    changeDetails.phase_changed ||
    (changeDetails.goals_changed && changeDetails.goals_changed > 0)
  )

  return (
    <div className="bg-[#eff8ff] border border-[#1e5f79]/20 rounded-lg overflow-hidden">
      {/* Main Summary */}
      <div
        className={`p-3 ${collapsible && hasDetails ? 'cursor-pointer hover:bg-[#c8eaeb]/30' : ''}`}
        onClick={() => collapsible && hasDetails && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-[#1e5f79]" />
              <h4 className="text-sm font-semibold text-[#000000]">Changes Summary</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {changeSummary}
            </p>
          </div>
          {collapsible && hasDetails && (
            <button className="p-1 text-[#1e5f79] hover:bg-white rounded transition-colors ml-2">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Detailed Changes */}
      {isExpanded && hasDetails && (
        <div className="px-3 pb-3 space-y-2">
          <div className="pt-2 border-t border-[#1e5f79]/20">
            <p className="text-xs font-semibold text-gray-600 mb-2">Change Details:</p>
            <div className="grid grid-cols-2 gap-2">
              {changeDetails.exercises_changed && changeDetails.exercises_changed > 0 && (
                <div className="bg-white rounded px-2 py-1 border border-[#000000]/10">
                  <p className="text-xs text-gray-600">Exercises</p>
                  <p className="text-sm font-medium text-[#000000]">
                    {changeDetails.exercises_changed} changed
                  </p>
                </div>
              )}
              {changeDetails.modalities_changed && changeDetails.modalities_changed > 0 && (
                <div className="bg-white rounded px-2 py-1 border border-[#000000]/10">
                  <p className="text-xs text-gray-600">Modalities</p>
                  <p className="text-sm font-medium text-[#000000]">
                    {changeDetails.modalities_changed} changed
                  </p>
                </div>
              )}
              {changeDetails.phase_changed && (
                <div className="bg-white rounded px-2 py-1 border border-[#000000]/10">
                  <p className="text-xs text-gray-600">Phase</p>
                  <p className="text-sm font-medium text-[#000000]">Updated</p>
                </div>
              )}
              {changeDetails.goals_changed && changeDetails.goals_changed > 0 && (
                <div className="bg-white rounded px-2 py-1 border border-[#000000]/10">
                  <p className="text-xs text-gray-600">Goals</p>
                  <p className="text-sm font-medium text-[#000000]">
                    {changeDetails.goals_changed} changed
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Rationale */}
      {clinicalRationale && (
        <div className="px-3 pb-3">
          <div className="bg-white border border-[#1e5f79]/20 rounded p-2">
            <p className="text-xs font-semibold text-[#1e5f79] mb-1">Clinical Rationale</p>
            <p className="text-xs text-gray-700 leading-relaxed">{clinicalRationale}</p>
          </div>
        </div>
      )}
    </div>
  )
}
