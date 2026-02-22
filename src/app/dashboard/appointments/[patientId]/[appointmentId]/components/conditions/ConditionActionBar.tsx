'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

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
    <div className="px-4 py-3 bg-white rounded-lg flex items-center gap-2">
      {/* Generate Protocol — no protocol yet + insights exist */}
      {showGenerateCTA && onGenerateFromInsights && (
        <button
          onClick={onGenerateFromInsights}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-teal text-white rounded-xl hover:bg-brand-teal/90 transition-colors shadow-sm disabled:opacity-50 text-sm font-medium"
        >
          <Sparkles className="h-4 w-4" />
          Generate Protocol ({unusedInsightsCount} insight{unusedInsightsCount !== 1 ? 's' : ''})
        </button>
      )}

      {/* Update Protocol — protocol exists + new insights */}
      {showUpdateCTA && onGenerateFromInsights && (
        <button
          onClick={onGenerateFromInsights}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <Sparkles className="h-4 w-4" />
          Update Protocol ({unusedInsightsCount} new insight{unusedInsightsCount !== 1 ? 's' : ''})
        </button>
      )}
    </div>
  )
}
