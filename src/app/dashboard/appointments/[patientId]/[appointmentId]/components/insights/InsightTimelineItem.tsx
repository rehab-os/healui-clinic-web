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

const typeConfig: Record<string, { bg: string; text: string; dot: string }> = {
  OBSERVATION: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  PROGRESS: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  SETBACK: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  MILESTONE: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },
  PATIENT_FEEDBACK: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
}

export default function InsightTimelineItem({
  insight,
  onEdit,
  onDelete,
  showActions = true
}: InsightTimelineItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  const config = typeConfig[insight.insight_type] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' }

  const formatType = (type: string) =>
    type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')

  const hasMetadata = insight.context_metadata && (
    insight.context_metadata.pain_level !== undefined ||
    insight.context_metadata.functional_status ||
    insight.context_metadata.patient_compliance
  )

  return (
    <div className="relative flex gap-3 py-2.5 group">
      {/* Timeline dot + connector */}
      <div className="flex flex-col items-center pt-1.5">
        <div className={`w-2 h-2 rounded-full ${config.dot} ring-2 ring-white`} />
        <div className="flex-1 w-px bg-gray-200 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${config.bg} ${config.text}`}>
            {formatType(insight.insight_type)}
          </span>
          {insight.used_in_protocol_generation && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-brand-teal text-white">
              <CheckCircle className="h-3 w-3" />
              Used
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
            {format(new Date(insight.created_at), 'MMM dd · h:mm a')}
          </span>

          {/* Actions */}
          {showActions && (onEdit || onDelete) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-0.5 text-gray-400 hover:text-brand-teal rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {onEdit && (
                      <button
                        onClick={() => { onEdit(insight); setShowMenu(false) }}
                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-teal-50 flex items-center gap-2"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                    )}
                    {onDelete && !insight.used_in_protocol_generation && (
                      <button
                        onClick={() => { onDelete(insight.id); setShowMenu(false) }}
                        className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Insight text */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {insight.insight_text}
        </p>

        {/* Metadata chips */}
        {hasMetadata && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {insight.context_metadata.pain_level !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-0.5">
                Pain <span className="font-mono font-semibold text-gray-800">{insight.context_metadata.pain_level}/10</span>
              </span>
            )}
            {insight.context_metadata.patient_compliance && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-0.5">
                Compliance <span className="font-semibold text-gray-700">{insight.context_metadata.patient_compliance}</span>
              </span>
            )}
            {insight.context_metadata.functional_status && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-0.5">
                {insight.context_metadata.functional_status}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
