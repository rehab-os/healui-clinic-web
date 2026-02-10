'use client'

import React, { useState } from 'react'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

interface Visit {
  id: string
  scheduled_date: string
  scheduled_time: string
  visit_type: string
  status: string
  chief_complaint?: string
  note?: any
  conditions_treated?: number
}

interface PreviousVisitsPanelProps {
  visits: Visit[]
  currentVisitId: string
  onVisitClick?: (visitId: string) => void
  loading?: boolean
}

/**
 * PreviousVisitsPanel - Chronological list of past visits
 * Each visit shows: date, conditions treated, notes count
 * Click to expand inline or jump to visit details
 */
export default function PreviousVisitsPanel({
  visits,
  currentVisitId,
  onVisitClick,
  loading = false
}: PreviousVisitsPanelProps) {
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null)

  // Filter out current visit and sort by date (newest first)
  const previousVisits = visits
    .filter(visit => visit.id !== currentVisitId)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())

  const toggleExpand = (visitId: string) => {
    setExpandedVisitId(expandedVisitId === visitId ? null : visitId)
  }

  if (loading) {
    return (
      <div className="p-5 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (previousVisits.length === 0) {
    return (
      <div className="p-5 text-center">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No previous visits found</p>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-2">
      {previousVisits.map((visit) => {
        const isExpanded = expandedVisitId === visit.id

        return (
          <div
            key={visit.id}
            className="bg-white border border-[#000000]/10 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
          >
            {/* Visit Header */}
            <div
              className="p-3 cursor-pointer hover:bg-[#eff8ff] transition-colors"
              onClick={() => toggleExpand(visit.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-[#000000]">
                      {format(new Date(visit.scheduled_date), 'MMM dd, yyyy')}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {visit.scheduled_time}
                    </span>
                    {visit.note && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Note
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {visit.visit_type.split('_').map(word =>
                      word.charAt(0) + word.slice(1).toLowerCase()
                    ).join(' ')}
                    {visit.conditions_treated && ` • ${visit.conditions_treated} condition${visit.conditions_treated !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button className="p-1 text-[#1e5f79] hover:bg-white rounded transition-colors">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-[#000000]/10 bg-[#eff8ff]">
                <div className="pt-3 space-y-2">
                  {/* Chief Complaint */}
                  {visit.chief_complaint && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">Chief Complaint</p>
                      <p className="text-sm text-[#000000]">{visit.chief_complaint}</p>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-0.5">Status</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border border-[#000000]/10">
                      {visit.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>

                  {/* View Details Button */}
                  {onVisitClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onVisitClick(visit.id)
                      }}
                      className="w-full mt-2 px-3 py-1.5 bg-white text-[#1e5f79] rounded-lg hover:bg-[#c8eaeb] transition-colors border border-[#1e5f79]/20 text-sm font-medium"
                    >
                      View Full Details
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
