'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, TrendingUp, Target } from 'lucide-react'
import { format } from 'date-fns'

interface ConditionCardProps {
  condition: {
    id: string
    condition_name: string
    diagnosis_date?: string
    status: string
    selected_phase?: string
    selected_goals?: string[]
  }
  protocol?: any
  onViewProtocol?: () => void
  onGenerateProtocol?: () => void
  children?: React.ReactNode
}

/**
 * ConditionCard - Individual condition display with expandable protocol viewer
 * Ice Blue background, Brand Teal CTAs, expandable sections
 */
export default function ConditionCard({
  condition,
  protocol,
  onViewProtocol,
  onGenerateProtocol,
  children
}: ConditionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200'

    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'RESOLVED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CHRONIC':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'MONITORING':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="bg-[#eff8ff] border border-[#000000]/10 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-[#000000]">
                {condition.condition_name}
              </h3>
              {condition.status && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(condition.status)}`}>
                  {condition.status}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              {condition.diagnosis_date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Diagnosed {format(new Date(condition.diagnosis_date), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-[#000000] hover:text-[#1e5f79] hover:bg-white rounded transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Phase and Goals Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {condition.selected_phase && (
            <div className="bg-white rounded-lg p-3 border border-[#1e5f79]/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-[#1e5f79]" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phase
                </span>
              </div>
              <p className="text-sm font-medium text-[#000000]">
                {condition.selected_phase}
              </p>
            </div>
          )}

          {condition.selected_goals && condition.selected_goals.length > 0 && (
            <div className="bg-white rounded-lg p-3 border border-[#1e5f79]/20">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-[#1e5f79]" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Goals
                </span>
              </div>
              <p className="text-sm font-medium text-[#000000] line-clamp-2">
                {condition.selected_goals.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Protocol Status */}
        <div className="mt-3 pt-3 border-t border-[#000000]/10">
          {protocol ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Protocol Active • Version {protocol.version || 1}
              </span>
              <button
                onClick={onViewProtocol}
                className="text-sm font-medium text-[#1e5f79] hover:text-[#164557] transition-colors"
              >
                View Details →
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">No protocol assigned</span>
              {onGenerateProtocol && (
                <button
                  onClick={onGenerateProtocol}
                  className="text-sm font-medium text-[#1e5f79] hover:text-[#164557] transition-colors"
                >
                  Generate Protocol →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[#000000]/10 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}
