'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  count?: number
  defaultExpanded?: boolean
  badge?: string
  badgeColor?: string
  children: React.ReactNode
}

function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  badge,
  badgeColor = 'bg-gray-100 text-gray-600',
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="border-t border-gray-100 first:border-t-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-teal-50/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
          {count !== undefined && count > 0 && (
            <span className="text-xs font-medium text-gray-400">({count})</span>
          )}
          {badge && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expanded && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

interface InsightsTimelineProps {
  children: React.ReactNode
  loading?: boolean
}

export default function InsightsTimeline({
  children,
  loading = false,
}: InsightsTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
      </div>
    )
  }

  return (
    <div className="lg:sticky lg:top-[76px]">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Clinical Timeline
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden p-1 text-gray-600 hover:text-brand-teal hover:bg-teal-50 rounded transition-colors"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export { CollapsibleSection }
