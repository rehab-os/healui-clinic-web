'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { ClinicalInsightType } from '@/types/clinical-insights.types'
import type { ClinicalInsightResponseDto } from '@/types/clinical-insights.types'

interface InsightTimelineItemProps {
  insight: ClinicalInsightResponseDto
  onEdit?: (insight: ClinicalInsightResponseDto) => void
  onDelete?: (insightId: string) => void
  showActions?: boolean
}

/**
 * InsightTimelineItem - Single insight display in timeline
 * Shows timestamp, type badge, insight text, context metadata
 * "Used in generation" indicator, hover actions (edit, delete)
 */
export default function InsightTimelineItem({
  insight,
  onEdit,
  onDelete,
  showActions = true
}: InsightTimelineItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getTypeColor = (type: ClinicalInsightType) => {
    switch (type) {
      case ClinicalInsightType.OBSERVATION:
        return 'bg-blue-100 text-blue-800'
      case ClinicalInsightType.PROGRESS:
        return 'bg-green-100 text-green-800'
      case ClinicalInsightType.SETBACK:
        return 'bg-red-100 text-red-800'
      case ClinicalInsightType.MILESTONE:
        return 'bg-purple-100 text-purple-800'
      case ClinicalInsightType.PATIENT_FEEDBACK:
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  return (
    <div className="relative p-3 hover:bg-[#eff8ff] rounded-lg transition-colors group">
      {/* Timeline Connector */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#c8eaeb]"></div>

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(insight.insight_type)}`}>
                {formatType(insight.insight_type)}
              </span>
              {insight.used_in_protocol_generation && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#1e5f79] text-white">
                  <CheckCircle className="h-3 w-3" />
                  Used in Protocol
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {format(new Date(insight.created_at), 'MMM dd, yyyy • h:mm a')}
            </p>
          </div>

          {/* Actions Menu */}
          {showActions && (onEdit || onDelete) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-[#1e5f79] hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-[#000000]/10 py-1 z-20">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(insight)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-[#eff8ff] flex items-center gap-2"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                    {onDelete && !insight.used_in_protocol_generation && (
                      <button
                        onClick={() => {
                          onDelete(insight.id)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Insight Text */}
        <p className="text-sm text-[#000000] mb-2 leading-relaxed">
          {insight.insight_text}
        </p>

        {/* Context Metadata */}
        {insight.context_metadata && Object.keys(insight.context_metadata).length > 0 && (
          <div className="mt-2 p-2 bg-white rounded border border-[#000000]/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {insight.context_metadata.pain_level !== undefined && (
                <div>
                  <span className="text-gray-500">Pain Level:</span>
                  <span className="ml-1 font-medium text-[#000000]">
                    {insight.context_metadata.pain_level}/10
                  </span>
                </div>
              )}
              {insight.context_metadata.functional_status && (
                <div>
                  <span className="text-gray-500">Functional Status:</span>
                  <span className="ml-1 font-medium text-[#000000]">
                    {insight.context_metadata.functional_status}
                  </span>
                </div>
              )}
              {insight.context_metadata.patient_compliance && (
                <div className="col-span-2">
                  <span className="text-gray-500">Compliance:</span>
                  <span className="ml-1 font-medium text-[#000000]">
                    {insight.context_metadata.patient_compliance}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase and Goals */}
        {(insight.current_phase || (insight.current_goals && insight.current_goals.length > 0)) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            {insight.current_phase && (
              <span className="px-2 py-0.5 bg-white rounded border border-[#000000]/10">
                Phase: {insight.current_phase}
              </span>
            )}
            {insight.current_goals && insight.current_goals.length > 0 && (
              <span className="px-2 py-0.5 bg-white rounded border border-[#000000]/10">
                {insight.current_goals.length} goal{insight.current_goals.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
