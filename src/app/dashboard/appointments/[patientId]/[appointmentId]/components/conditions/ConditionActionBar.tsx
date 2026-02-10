'use client'

import React from 'react'
import { Sparkles, RefreshCw, History, StickyNote, FileText } from 'lucide-react'

interface ConditionActionBarProps {
  hasProtocol: boolean
  hasUnusedInsights?: boolean
  unusedInsightsCount?: number
  onGenerateFromInsights?: () => void
  onUpdateProtocol?: () => void
  onViewHistory?: () => void
  onAddNote?: () => void
  onViewProtocolDetails?: () => void
  loading?: boolean
}

/**
 * ConditionActionBar - High-visibility CTA buttons for condition actions
 * Primary: Generate Protocol from Insights (Brand Teal, prominent)
 * Secondary: Update Protocol, View History, Add Note
 */
export default function ConditionActionBar({
  hasProtocol,
  hasUnusedInsights = false,
  unusedInsightsCount = 0,
  onGenerateFromInsights,
  onUpdateProtocol,
  onViewHistory,
  onAddNote,
  onViewProtocolDetails,
  loading = false
}: ConditionActionBarProps) {
  return (
    <div className="p-5 bg-[#eff8ff] border-t border-[#000000]/10">
      {/* Primary Action - Generate from Insights */}
      {hasUnusedInsights && unusedInsightsCount > 0 && (
        <div className="mb-3">
          <button
            onClick={onGenerateFromInsights}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#1e5f79] to-[#164557] text-white rounded-lg hover:from-[#164557] hover:to-[#0f3340] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Sparkles className="h-5 w-5" />
            <span>Generate Protocol from {unusedInsightsCount} Insight{unusedInsightsCount !== 1 ? 's' : ''}</span>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
            )}
          </button>
          <p className="text-xs text-gray-600 mt-2 text-center">
            AI will analyze recent clinical observations to create an optimized treatment plan
          </p>
        </div>
      )}

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Update Protocol */}
        {hasProtocol && onUpdateProtocol && (
          <button
            onClick={onUpdateProtocol}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white text-gray-700 rounded-lg hover:bg-[#c8eaeb] hover:text-[#1e5f79] transition-colors border border-[#000000]/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Update</span>
          </button>
        )}

        {/* View Protocol Details */}
        {hasProtocol && onViewProtocolDetails && (
          <button
            onClick={onViewProtocolDetails}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white text-gray-700 rounded-lg hover:bg-[#c8eaeb] hover:text-[#1e5f79] transition-colors border border-[#000000]/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </button>
        )}

        {/* View History */}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white text-gray-700 rounded-lg hover:bg-[#c8eaeb] hover:text-[#1e5f79] transition-colors border border-[#000000]/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        )}

        {/* Add Note */}
        {onAddNote && (
          <button
            onClick={onAddNote}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white text-gray-700 rounded-lg hover:bg-[#c8eaeb] hover:text-[#1e5f79] transition-colors border border-[#000000]/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">Note</span>
          </button>
        )}
      </div>

      {/* No Protocol Message */}
      {!hasProtocol && !hasUnusedInsights && (
        <div className="text-center py-3">
          <p className="text-sm text-gray-600">
            Add clinical insights to generate an AI-powered treatment protocol
          </p>
        </div>
      )}
    </div>
  )
}
