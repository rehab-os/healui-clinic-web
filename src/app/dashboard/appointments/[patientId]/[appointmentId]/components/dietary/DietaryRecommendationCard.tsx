'use client'

import React from 'react'
import { Clock, TrendingUp, Info } from 'lucide-react'
import type { DietaryRecommendationDto, RecommendationCategory, RecommendationSource } from '@/types/dietary-profile.types'

interface DietaryRecommendationCardProps {
  recommendation: DietaryRecommendationDto
  type: 'recommended' | 'avoid' | 'supplement'
}

/**
 * DietaryRecommendationCard - Individual dietary recommendation display
 * Item name, category badge, quantity, frequency, timing
 * Reason explanation, source indicator (AI, Physio, Condition Default)
 */
export default function DietaryRecommendationCard({
  recommendation,
  type
}: DietaryRecommendationCardProps) {
  const getCategoryColor = (category?: RecommendationCategory) => {
    if (!category) return 'bg-gray-100 text-gray-800'
    switch (category) {
      case 'ANTI_INFLAMMATORY':
        return 'bg-green-100 text-green-800'
      case 'PROTEIN':
        return 'bg-blue-100 text-blue-800'
      case 'HYDRATION':
        return 'bg-cyan-100 text-cyan-800'
      case 'VITAMINS':
        return 'bg-purple-100 text-purple-800'
      case 'OTHER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceBadge = (source?: RecommendationSource | string) => {
    if (!source) return null
    switch (source) {
      case 'AI_GENERATED':
        return { label: 'AI', color: 'bg-purple-100 text-purple-700' }
      case 'PHYSIO_ADDED':
        return { label: 'Physio', color: 'bg-blue-100 text-blue-700' }
      case 'CONDITION_DEFAULT':
        return { label: 'Default', color: 'bg-gray-100 text-gray-700' }
      default:
        return null
    }
  }

  const formatCategory = (category?: RecommendationCategory) => {
    if (!category) return ''
    return category.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const sourceBadge = getSourceBadge(recommendation.source)
  const cardColor = type === 'avoid' ? 'bg-red-50 border-red-200' : 'bg-white border-[#000000]/10'

  return (
    <div className={`border rounded-lg p-3 hover:shadow-sm transition-shadow ${cardColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#000000] mb-1">
            {recommendation.item}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {recommendation.category && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(recommendation.category)}`}>
                {formatCategory(recommendation.category)}
              </span>
            )}
            {sourceBadge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sourceBadge.color}`}>
                {sourceBadge.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      {(recommendation.quantity || recommendation.frequency || recommendation.timing) && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {recommendation.quantity && (
            <div className="bg-[#eff8ff] rounded p-2">
              <p className="text-xs text-gray-600 mb-0.5">Quantity</p>
              <p className="text-xs font-medium text-[#000000]">{recommendation.quantity}</p>
            </div>
          )}
          {recommendation.frequency && (
            <div className="bg-[#eff8ff] rounded p-2">
              <p className="text-xs text-gray-600 mb-0.5">Frequency</p>
              <p className="text-xs font-medium text-[#000000]">{recommendation.frequency}</p>
            </div>
          )}
          {recommendation.timing && (
            <div className="bg-[#eff8ff] rounded p-2">
              <p className="text-xs text-gray-600 mb-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Timing
              </p>
              <p className="text-xs font-medium text-[#000000]">{recommendation.timing}</p>
            </div>
          )}
        </div>
      )}

      {/* Reason */}
      <div className="bg-[#eff8ff] rounded p-2 border border-[#1e5f79]/20">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-[#1e5f79] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-0.5">Why {type === 'avoid' ? 'Avoid' : 'Recommended'}?</p>
            <p className="text-xs text-gray-700 leading-relaxed">{recommendation.reason}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
