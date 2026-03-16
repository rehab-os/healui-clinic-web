'use client'

import React from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

interface ConditionActionBarProps {
  hasProtocol: boolean
  hasUnusedInsights?: boolean
  unusedInsightsCount?: number
  onGenerateFromInsights?: () => void
  loading?: boolean
}

export default function ConditionActionBar({
  hasProtocol,
  hasUnusedInsights = false,
  unusedInsightsCount = 0,
  onGenerateFromInsights,
  loading = false
}: ConditionActionBarProps) {
  const showGenerateCTA = hasUnusedInsights && unusedInsightsCount > 0 && !hasProtocol
  const showUpdateCTA = hasProtocol && hasUnusedInsights && unusedInsightsCount > 0

  if (!showGenerateCTA && !showUpdateCTA) return null

  return (
    <button
      onClick={onGenerateFromInsights}
      disabled={loading}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all disabled:opacity-50 group ${
        showUpdateCTA
          ? 'bg-amber-50/60 border border-amber-200/60 hover:bg-amber-50'
          : 'bg-teal-50/60 border border-teal-200/60 hover:bg-teal-50'
      }`}
    >
      <div className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${
        showUpdateCTA
          ? 'bg-amber-100 text-amber-600'
          : 'bg-teal-100 text-brand-teal'
      }`}>
        <Sparkles className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${
          showUpdateCTA ? 'text-amber-800' : 'text-teal-800'
        }`}>
          {showUpdateCTA
            ? `${unusedInsightsCount} new observation${unusedInsightsCount !== 1 ? 's' : ''} since last protocol`
            : `${unusedInsightsCount} observation${unusedInsightsCount !== 1 ? 's' : ''} ready for protocol`
          }
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {showUpdateCTA
            ? 'AI can update your treatment plan with new findings'
            : 'AI can generate an evidence-based treatment plan'
          }
        </p>
      </div>

      <ArrowRight className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
        showUpdateCTA ? 'text-amber-400' : 'text-teal-400'
      }`} />
    </button>
  )
}
