'use client'

import React from 'react'
import { Activity, FileText, Clock, Mic, Plus, Loader2, Check } from 'lucide-react'

export type MobileTab = 'track' | 'notes' | 'timeline'

interface MobileBottomBarProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  /** Quick observation input */
  observationText: string
  onObservationChange: (text: string) => void
  onObservationSubmit: () => void
  onMicClick: () => void
  isSubmitting?: boolean
  showSuccess?: boolean
  micSupported?: boolean
}

const tabs: { key: MobileTab; label: string; icon: typeof Activity }[] = [
  { key: 'track', label: 'Track', icon: Activity },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'timeline', label: 'Timeline', icon: Clock },
]

export default function MobileBottomBar({
  activeTab,
  onTabChange,
  observationText,
  onObservationChange,
  onObservationSubmit,
  onMicClick,
  isSubmitting = false,
  showSuccess = false,
  micSupported = true,
}: MobileBottomBarProps) {
  const canSubmit = observationText.trim().length >= 3 && !isSubmitting

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      {/* Quick observation input row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <input
          type="text"
          value={observationText}
          onChange={(e) => onObservationChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmit) onObservationSubmit()
          }}
          placeholder="Quick observation..."
          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal placeholder:text-gray-400"
        />
        {micSupported && (
          <button
            onClick={onMicClick}
            disabled={isSubmitting}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-sm active:scale-95 disabled:opacity-40"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onObservationSubmit}
          disabled={!canSubmit}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95 ${
            showSuccess
              ? 'bg-emerald-500 text-white'
              : canSubmit
                ? 'bg-brand-teal text-white shadow-sm'
                : 'bg-gray-100 text-gray-400'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : showSuccess ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-around px-2 py-1 safe-area-inset-bottom">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors min-w-[64px] ${
                isActive
                  ? 'text-brand-teal'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-brand-teal' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-brand-teal' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="w-5 h-0.5 bg-brand-teal rounded-full mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
