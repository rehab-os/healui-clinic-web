'use client'

import React from 'react'
import { format } from 'date-fns'
import { GitBranch, User, Calendar, FileText } from 'lucide-react'
import type { TreatmentHistoryResponseDto, TreatmentChangeType } from '@/types/treatment-history.types'

interface TreatmentHistoryViewerProps {
  history: TreatmentHistoryResponseDto[]
  onCompare?: (currentId: string, previousId: string) => void
  loading?: boolean
}

/**
 * TreatmentHistoryViewer - Timeline view of all protocol versions
 * Version cards with date, change type, creator
 * "Compare with Previous" button per version
 */
export default function TreatmentHistoryViewer({
  history,
  onCompare,
  loading = false
}: TreatmentHistoryViewerProps) {
  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'INITIAL_CREATION':
        return 'bg-blue-100 text-blue-800'
      case 'AI_GENERATED_FROM_INSIGHTS':
        return 'bg-purple-100 text-purple-800'
      case 'MANUAL_UPDATE':
        return 'bg-green-100 text-green-800'
      case 'PHASE_PROGRESSION':
        return 'bg-teal-100 text-teal-800'
      case 'GOAL_ADJUSTMENT':
        return 'bg-indigo-100 text-indigo-800'
      case 'EXERCISE_MODIFICATION':
        return 'bg-amber-100 text-amber-800'
      case 'MODALITY_CHANGE':
        return 'bg-orange-100 text-orange-800'
      case 'PATIENT_REQUEST':
        return 'bg-cyan-100 text-cyan-800'
      case 'ADVERSE_REACTION':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatChangeType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="p-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="p-5 text-center">
        <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No treatment history available</p>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-3">
      {history.map((entry, index) => {
        const isLatest = index === 0
        const hasPrevious = index < history.length - 1
        const previousEntry = hasPrevious ? history[index + 1] : null

        return (
          <div
            key={entry.id}
            className="relative bg-[#eff8ff] border border-[#000000]/10 rounded-lg p-3 hover:shadow-md transition-shadow"
          >
            {/* Version Badge */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-[#000000]/10">
                v{entry.version}
              </span>
            </div>

            {/* Change Type Badge */}
            <div className="mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getChangeTypeColor(entry.change_type)}`}>
                {formatChangeType(entry.change_type)}
              </span>
              {isLatest && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1e5f79] text-white">
                  Current
                </span>
              )}
            </div>

            {/* Date and Creator */}
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(entry.created_at), 'MMM dd, yyyy • h:mm a')}
              </span>
              {entry.creator && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {entry.creator.name}
                  </span>
                </>
              )}
            </div>

            {/* Change Reason */}
            {entry.change_reason && (
              <p className="text-sm text-[#000000] mb-2">
                <span className="font-medium">Reason:</span> {entry.change_reason}
              </p>
            )}

            {/* Clinical Rationale */}
            {entry.clinical_rationale && (
              <div className="mt-2 p-2 bg-white rounded border border-[#1e5f79]/20">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-[#1e5f79] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-0.5">Clinical Rationale</p>
                    <p className="text-xs text-gray-700">{entry.clinical_rationale}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Compare Button */}
            {hasPrevious && onCompare && previousEntry && (
              <button
                onClick={() => onCompare(entry.id, previousEntry.id)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white text-[#1e5f79] rounded-lg hover:bg-[#c8eaeb] transition-colors border border-[#1e5f79]/20 text-sm font-medium"
              >
                <GitBranch className="h-4 w-4" />
                Compare with v{previousEntry.version}
              </button>
            )}

            {/* Timeline Connector */}
            {index < history.length - 1 && (
              <div className="absolute left-1/2 -bottom-3 w-0.5 h-3 bg-[#c8eaeb] transform -translate-x-1/2"></div>
            )}
          </div>
        )
      })}
    </div>
  )
}
