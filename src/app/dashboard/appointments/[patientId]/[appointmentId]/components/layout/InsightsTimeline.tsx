'use client'

import React, { useState } from 'react'
import { Lightbulb, History, Apple, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface InsightsTimelineProps {
  children: React.ReactNode
  loading?: boolean
  activeTab?: 'insights' | 'history' | 'dietary' | 'visits'
  onTabChange?: (tab: 'insights' | 'history' | 'dietary' | 'visits') => void
}

/**
 * InsightsTimeline - Right column container (40% width on desktop)
 * Sticky behavior, displays clinical insights, treatment history, and dietary profile
 */
export default function InsightsTimeline({
  children,
  loading = false,
  activeTab = 'insights',
  onTabChange
}: InsightsTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const tabs = [
    { id: 'insights' as const, label: 'Insights', icon: Lightbulb },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'dietary' as const, label: 'Dietary', icon: Apple },
    { id: 'visits' as const, label: 'Visits', icon: Clock },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#000000]/10 p-5 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:sticky lg:top-3">
      <div className="bg-white rounded-lg border border-[#000000]/10 overflow-hidden shadow-sm">
        {/* Header with Tabs */}
        <div className="border-b border-[#000000]/10">
          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="text-lg font-semibold text-[#000000]">
              Clinical Timeline
            </h2>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden p-1 text-[#000000] hover:text-[#1e5f79] hover:bg-[#eff8ff] rounded transition-colors"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          </div>

          {/* Tab Navigation */}
          {!isCollapsed && (
            <div className="flex items-center gap-1 px-3 pb-3">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1e5f79] text-white'
                        : 'bg-[#eff8ff] text-gray-700 hover:bg-[#c8eaeb]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        )}
      </div>

      {/* Quick Stats Card (Below Timeline) */}
      {!isCollapsed && (
        <div className="mt-3 bg-gradient-to-br from-[#1e5f79] to-[#164557] rounded-lg p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 bg-[#c8eaeb] rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold">Session Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[#c8eaeb] mb-0.5">Duration</p>
              <p className="text-lg font-semibold">45 min</p>
            </div>
            <div>
              <p className="text-xs text-[#c8eaeb] mb-0.5">Progress</p>
              <p className="text-lg font-semibold">Good</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
