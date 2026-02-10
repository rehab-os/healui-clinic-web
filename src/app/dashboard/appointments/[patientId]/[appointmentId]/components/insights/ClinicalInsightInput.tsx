'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ClinicalInsightType } from '@/types/clinical-insights.types'

const insightSchema = z.object({
  insight_text: z.string().min(10, 'Insight must be at least 10 characters'),
  insight_type: z.nativeEnum(ClinicalInsightType),
  pain_level: z.number().min(0).max(10).optional(),
  functional_status: z.string().optional(),
  patient_compliance: z.string().optional(),
  other_notes: z.string().optional(),
})

type InsightFormData = z.infer<typeof insightSchema>

interface ClinicalInsightInputProps {
  patientConditionId: string
  visitId?: string
  onSubmit: (data: InsightFormData) => Promise<void>
  onCancel?: () => void
}

/**
 * ClinicalInsightInput - Form for adding clinical insights
 * Textarea for freeform text, type selector, optional context metadata
 * Form validation with react-hook-form + zod, toast notifications
 */
export default function ClinicalInsightInput({
  patientConditionId,
  visitId,
  onSubmit,
  onCancel
}: ClinicalInsightInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<InsightFormData>({
    resolver: zodResolver(insightSchema),
    defaultValues: {
      insight_type: ClinicalInsightType.OBSERVATION,
      pain_level: undefined,
    }
  })

  const onSubmitForm = async (data: InsightFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success('Clinical insight added successfully')
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add insight')
    } finally {
      setIsSubmitting(false)
    }
  }

  const insightTypes = [
    { value: ClinicalInsightType.OBSERVATION, label: 'Observation', color: 'bg-blue-100 text-blue-800' },
    { value: ClinicalInsightType.PROGRESS, label: 'Progress', color: 'bg-green-100 text-green-800' },
    { value: ClinicalInsightType.SETBACK, label: 'Setback', color: 'bg-red-100 text-red-800' },
    { value: ClinicalInsightType.MILESTONE, label: 'Milestone', color: 'bg-purple-100 text-purple-800' },
    { value: ClinicalInsightType.PATIENT_FEEDBACK, label: 'Patient Feedback', color: 'bg-amber-100 text-amber-800' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="p-5 space-y-3">
      {/* Insight Type Selector */}
      <div>
        <label className="block text-sm font-semibold text-[#000000] mb-2">
          Insight Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {insightTypes.map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-2 px-3 py-2 border border-[#000000]/10 rounded-lg cursor-pointer hover:bg-[#eff8ff] transition-colors"
            >
              <input
                type="radio"
                value={type.value}
                {...register('insight_type')}
                className="h-4 w-4 text-[#1e5f79] border-gray-300 focus:ring-[#1e5f79]"
              />
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${type.color}`}>
                {type.label}
              </span>
            </label>
          ))}
        </div>
        {errors.insight_type && (
          <p className="mt-1 text-sm text-red-600">{errors.insight_type.message}</p>
        )}
      </div>

      {/* Insight Text */}
      <div>
        <label className="block text-sm font-semibold text-[#000000] mb-2">
          Clinical Observation *
        </label>
        <textarea
          {...register('insight_text')}
          rows={4}
          className="w-full px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
          placeholder="Describe the clinical observation, patient progress, or relevant finding..."
        />
        {errors.insight_text && (
          <p className="mt-1 text-sm text-red-600">{errors.insight_text.message}</p>
        )}
      </div>

      {/* Optional Context Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pain Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pain Level (0-10)
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            {...register('pain_level', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
            placeholder="0-10"
          />
          {errors.pain_level && (
            <p className="mt-1 text-sm text-red-600">{errors.pain_level.message}</p>
          )}
        </div>

        {/* Functional Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Functional Status
          </label>
          <input
            type="text"
            {...register('functional_status')}
            className="w-full px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
            placeholder="e.g., Independent, Assisted"
          />
        </div>
      </div>

      {/* Patient Compliance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Patient Compliance
        </label>
        <input
          type="text"
          {...register('patient_compliance')}
          className="w-full px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
          placeholder="e.g., Good adherence to home exercise program"
        />
      </div>

      {/* Other Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          {...register('other_notes')}
          rows={2}
          className="w-full px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
          placeholder="Any other relevant information..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#000000]/10">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#164557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Insight
            </>
          )}
        </button>
      </div>
    </form>
  )
}
