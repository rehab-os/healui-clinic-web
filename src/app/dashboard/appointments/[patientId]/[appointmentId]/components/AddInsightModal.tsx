'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Loader2, Brain, TrendingUp, AlertTriangle, Trophy, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

const insightSchema = z.object({
  insight_text: z.string().min(10, 'Insight must be at least 10 characters'),
  insight_type: z.enum(['OBSERVATION', 'PROGRESS', 'SETBACK', 'MILESTONE', 'PATIENT_FEEDBACK']),
  pain_level: z.number().min(0).max(10).optional(),
  functional_status: z.string().optional(),
  patient_compliance: z.string().optional(),
  other_notes: z.string().optional(),
})

type InsightFormData = z.infer<typeof insightSchema>

interface AddInsightModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: InsightFormData) => Promise<void>
  conditionName: string
  visitId: string
}

const insightTypes = [
  { value: 'OBSERVATION', label: 'Observation', icon: Brain, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'PROGRESS', label: 'Progress', icon: TrendingUp, color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'SETBACK', label: 'Setback', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'MILESTONE', label: 'Milestone', icon: Trophy, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'PATIENT_FEEDBACK', label: 'Patient Feedback', icon: MessageSquare, color: 'bg-amber-50 text-amber-700 border-amber-200' },
]

export default function AddInsightModal({
  open,
  onClose,
  onSubmit,
  conditionName,
  visitId
}: AddInsightModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<InsightFormData>({
    resolver: zodResolver(insightSchema),
    defaultValues: {
      insight_type: 'OBSERVATION',
    }
  })

  const selectedType = watch('insight_type')
  const painLevel = watch('pain_level')

  const onSubmitForm = async (data: InsightFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success('Clinical insight added successfully')
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add insight')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Clinical Insight</h2>
            <p className="text-sm text-gray-600 mt-1">{conditionName}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-6">
          {/* Insight Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Insight Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {insightTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.value
                return (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? `${type.color} border-current shadow-sm`
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register('insight_type')}
                      className="sr-only"
                    />
                    <Icon className={`h-4 w-4 ${isSelected ? '' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-700'}`}>
                      {type.label}
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.insight_type && (
              <p className="mt-2 text-sm text-red-600">{errors.insight_type.message}</p>
            )}
          </div>

          {/* Insight Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Insight Description *
            </label>
            <textarea
              {...register('insight_text')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-sm"
              placeholder="Describe your observation, patient progress, setback, or feedback..."
            />
            {errors.insight_text && (
              <p className="mt-2 text-sm text-red-600">{errors.insight_text.message}</p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pain Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Pain Level (Optional)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                {...register('pain_level', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-teal"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>No Pain</span>
                <span className="font-medium text-gray-900">{painLevel || 0}/10</span>
                <span>Severe Pain</span>
              </div>
            </div>

            {/* Patient Compliance */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Patient Compliance (Optional)
              </label>
              <select
                {...register('patient_compliance')}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-sm"
              >
                <option value="">Select...</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
          </div>

          {/* Functional Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Functional Status (Optional)
            </label>
            <input
              type="text"
              {...register('functional_status')}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-sm"
              placeholder="e.g., Independent ambulation, Requires assistance..."
            />
          </div>

          {/* Other Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              {...register('other_notes')}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-sm"
              placeholder="Any other relevant information..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
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
      </div>
    </div>
  )
}
