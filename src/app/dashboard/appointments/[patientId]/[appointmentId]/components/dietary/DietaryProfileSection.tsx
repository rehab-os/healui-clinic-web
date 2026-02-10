'use client'

import React, { useState } from 'react'
import { Apple, RefreshCw, Calendar, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import type { PatientDietaryProfileResponseDto } from '@/types/dietary-profile.types'
import { toast } from 'sonner'

interface DietaryProfileSectionProps {
  profile: PatientDietaryProfileResponseDto | null
  patientId?: string
  patientUserId?: string
  activeConditions?: Array<{ id: string; name: string }>
  onGenerate?: () => Promise<void>
  onRegenerate?: () => Promise<void>
  children?: React.ReactNode
  loading?: boolean
}

/**
 * DietaryProfileSection - Main dietary profile container
 * Section header with "Generate Profile" CTA
 * Display active conditions considered, last generated timestamp
 * Tabs: Recommended Foods, Foods to Avoid, Supplements, Contraindications
 * "Regenerate" button
 */
export default function DietaryProfileSection({
  profile,
  patientId,
  patientUserId,
  activeConditions = [],
  onGenerate,
  onRegenerate,
  children,
  loading = false
}: DietaryProfileSectionProps) {
  const [activeTab, setActiveTab] = useState<'recommended' | 'avoid' | 'supplements' | 'contraindications'>('recommended')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!onGenerate) return
    setIsGenerating(true)
    try {
      await onGenerate()
      toast.success('Dietary profile generated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate dietary profile')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    if (!onRegenerate) return
    setIsGenerating(true)
    try {
      await onRegenerate()
      toast.success('Dietary profile regenerated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate dietary profile')
    } finally {
      setIsGenerating(false)
    }
  }

  const tabs = [
    { id: 'recommended' as const, label: 'Recommended', count: profile?.recommended_foods?.length || 0 },
    { id: 'avoid' as const, label: 'Avoid', count: profile?.foods_to_avoid?.length || 0 },
    { id: 'supplements' as const, label: 'Supplements', count: profile?.supplements?.length || 0 },
    { id: 'contraindications' as const, label: 'Contraindications', count: profile?.contraindications?.length || 0 },
  ]

  // No profile state
  if (!profile) {
    return (
      <div className="p-5">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#eff8ff] rounded-full mb-3">
            <Apple className="h-8 w-8 text-[#1e5f79]" />
          </div>
          <h3 className="text-lg font-semibold text-[#000000] mb-2">No Dietary Profile</h3>
          <p className="text-gray-600 mb-5 max-w-sm mx-auto">
            Generate a personalized dietary profile based on the patient's active conditions
          </p>
          {onGenerate && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || activeConditions.length === 0}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#1e5f79] text-white rounded-lg hover:bg-[#164557] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Dietary Profile
                </>
              )}
            </button>
          )}
          {activeConditions.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">Add conditions to generate a dietary profile</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="px-5 pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Apple className="h-5 w-5 text-[#1e5f79]" />
              <h3 className="text-lg font-semibold text-[#000000]">Dietary Profile</h3>
              {profile.ai_generated && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  AI Generated
                </span>
              )}
            </div>
            {profile.last_generated_at && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Last generated {format(new Date(profile.last_generated_at), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
          {onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#1e5f79] text-[#1e5f79] rounded-lg hover:bg-[#eff8ff] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}
        </div>

        {/* Active Conditions */}
        {profile.active_conditions_considered && profile.active_conditions_considered.length > 0 && (
          <div className="bg-[#eff8ff] border border-[#1e5f79]/20 rounded-lg p-3 mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Based on Active Conditions:</p>
            <div className="flex flex-wrap gap-2">
              {profile.active_conditions_considered.map((condition) => (
                <span
                  key={condition.condition_id}
                  className="inline-flex items-center px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 border border-[#000000]/10"
                >
                  {condition.condition_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#1e5f79] text-white'
                    : 'bg-[#eff8ff] text-gray-700 hover:bg-[#c8eaeb]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-white/20' : 'bg-white'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-5 pb-5">
        {children}
      </div>

      {/* General Guidelines */}
      {(profile.general_guidelines || profile.hydration_guidelines || profile.dietary_notes) && (
        <div className="px-5 pb-5 space-y-3">
          {profile.general_guidelines && (
            <div className="bg-[#eff8ff] border border-[#1e5f79]/20 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-[#000000] mb-1">General Guidelines</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{profile.general_guidelines}</p>
            </div>
          )}
          {profile.hydration_guidelines && (
            <div className="bg-[#eff8ff] border border-[#1e5f79]/20 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-[#000000] mb-1">Hydration Guidelines</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{profile.hydration_guidelines}</p>
            </div>
          )}
          {profile.dietary_notes && (
            <div className="bg-[#eff8ff] border border-[#1e5f79]/20 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-[#000000] mb-1">Additional Notes</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{profile.dietary_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
