'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GenerateFromInsightsButtonProps {
  unusedInsightsCount: number
  patientConditionId: string
  onGenerate: (insightIds: string[]) => Promise<void>
  onSuccess?: () => void
  disabled?: boolean
}

/**
 * GenerateFromInsightsButton - Large, prominent CTA for protocol generation
 * Shows count of unused insights, triggers generation API
 * Loading state with spinner, success toast with "View Protocol" action
 */
export default function GenerateFromInsightsButton({
  unusedInsightsCount,
  patientConditionId,
  onGenerate,
  onSuccess,
  disabled = false
}: GenerateFromInsightsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (unusedInsightsCount === 0) {
      toast.error('No unused insights available')
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading('Analyzing clinical insights...')

    try {
      // In real implementation, you would pass the actual insight IDs
      // For now, we'll use an empty array as a placeholder
      await onGenerate([])

      toast.success('Protocol generated successfully', {
        id: toastId,
        action: {
          label: 'View Protocol',
          onClick: () => {
            onSuccess?.()
          }
        }
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate protocol', {
        id: toastId,
        description: 'Please try again or check your insights'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (unusedInsightsCount === 0) {
    return null
  }

  return (
    <div className="p-5 bg-gradient-to-br from-[#1e5f79] to-[#164557] rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 text-white">
          <h3 className="text-sm font-semibold">Ready to Generate Protocol</h3>
          <p className="text-xs text-white/80">
            {unusedInsightsCount} clinical insight{unusedInsightsCount !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#1e5f79] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Protocol...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate Treatment Protocol
          </>
        )}
      </button>

      <p className="mt-3 text-xs text-white/70 text-center">
        AI will analyze your clinical observations and create an evidence-based treatment plan
      </p>
    </div>
  )
}
