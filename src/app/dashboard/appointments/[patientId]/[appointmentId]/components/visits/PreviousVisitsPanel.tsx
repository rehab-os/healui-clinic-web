'use client'

import React from 'react'
import { Calendar, ArrowRight } from 'lucide-react'
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

export default function PreviousVisitsPanel({
  visits,
  currentVisitId,
  onVisitClick,
  loading = false
}: PreviousVisitsPanelProps) {
  const previousVisits = visits
    .filter(visit => visit.id !== currentVisitId)
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
    )
  }

  if (previousVisits.length === 0) {
    return (
      <div className="py-4 text-center">
        <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">No previous visits</p>
      </div>
    )
  }

  const formatVisitType = (type: string) =>
    type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')

  return (
    <div className="space-y-1.5">
      {previousVisits.map((visit, idx) => {
        const isLatest = idx === 0

        return (
          <button
            key={visit.id}
            onClick={() => onVisitClick?.(visit.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${
              isLatest
                ? 'bg-teal-50/50 hover:bg-teal-50 border border-teal-100/60'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center self-stretch py-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isLatest ? 'bg-brand-teal' : 'bg-gray-300'
              }`} />
              {idx < previousVisits.length - 1 && (
                <div className="flex-1 w-px bg-gray-200 mt-1" />
              )}
            </div>

            {/* Visit info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${isLatest ? 'text-gray-900' : 'text-gray-700'}`}>
                  {format(new Date(visit.scheduled_date), 'MMM dd, yyyy')}
                </span>
                <span className="text-xs text-gray-400">
                  {visit.scheduled_time}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">
                  {formatVisitType(visit.visit_type)}
                </span>
                {visit.conditions_treated && visit.conditions_treated > 0 && (
                  <span className="text-xs text-gray-400">
                    · {visit.conditions_treated} condition{visit.conditions_treated !== 1 ? 's' : ''}
                  </span>
                )}
                {visit.note && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-400 flex-shrink-0" title="Has notes" />
                )}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </button>
        )
      })}
    </div>
  )
}
