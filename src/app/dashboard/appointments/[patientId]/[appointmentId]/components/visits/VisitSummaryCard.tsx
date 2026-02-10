'use client'

import React from 'react'
import { Calendar, Clock, FileText, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

interface VisitSummaryCardProps {
  visit: {
    id: string
    scheduled_date: string
    scheduled_time: string
    visit_type: string
    status: string
    duration_minutes?: number
    chief_complaint?: string
    note?: any
    conditions_treated?: number
    protocols_changed?: number
  }
  onViewDetails?: () => void
}

/**
 * VisitSummaryCard - Compact visit overview
 * Key metrics (duration, conditions, protocols changed)
 * Quick "View Full Details" link
 */
export default function VisitSummaryCard({
  visit,
  onViewDetails
}: VisitSummaryCardProps) {
  const formatVisitType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="bg-white border border-[#000000]/10 rounded-lg p-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-[#000000]">
              {format(new Date(visit.scheduled_date), 'MMMM dd, yyyy')}
            </h4>
            {visit.note && (
              <FileText className="h-3.5 w-3.5 text-green-600" title="Has clinical note" />
            )}
          </div>
          <p className="text-xs text-gray-600">
            {formatVisitType(visit.visit_type)} • {visit.scheduled_time}
          </p>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(visit.status)}`}>
          {visit.status.replace('_', ' ').toLowerCase()}
        </span>
      </div>

      {/* Chief Complaint */}
      {visit.chief_complaint && (
        <div className="bg-[#eff8ff] rounded p-2 mb-3">
          <p className="text-xs text-gray-700 line-clamp-2">
            {visit.chief_complaint}
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {visit.duration_minutes && (
          <div className="bg-[#eff8ff] rounded p-2 text-center">
            <Clock className="h-4 w-4 text-[#1e5f79] mx-auto mb-0.5" />
            <p className="text-xs font-semibold text-[#000000]">{visit.duration_minutes}m</p>
            <p className="text-xs text-gray-600">Duration</p>
          </div>
        )}
        {visit.conditions_treated !== undefined && (
          <div className="bg-[#eff8ff] rounded p-2 text-center">
            <div className="text-lg font-bold text-[#1e5f79] mb-0.5">{visit.conditions_treated}</div>
            <p className="text-xs text-gray-600">Condition{visit.conditions_treated !== 1 ? 's' : ''}</p>
          </div>
        )}
        {visit.protocols_changed !== undefined && visit.protocols_changed > 0 && (
          <div className="bg-[#eff8ff] rounded p-2 text-center">
            <div className="text-lg font-bold text-[#1e5f79] mb-0.5">{visit.protocols_changed}</div>
            <p className="text-xs text-gray-600">Protocol{visit.protocols_changed !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* View Details Link */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#eff8ff] text-[#1e5f79] rounded-lg hover:bg-[#c8eaeb] transition-colors text-sm font-medium"
        >
          View Full Details
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
