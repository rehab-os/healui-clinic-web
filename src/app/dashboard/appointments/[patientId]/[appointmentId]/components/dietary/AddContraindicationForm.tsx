'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ContraIndicationSeverity, ContraindicationType } from '@/types/dietary-profile.types'

const contraindicationSchema = z.object({
  item: z.string().min(2, 'Item name is required'),
  type: z.nativeEnum(ContraindicationType),
  reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
  severity: z.nativeEnum(ContraIndicationSeverity),
})

type ContraindicationFormData = z.infer<typeof contraindicationSchema>

interface AddContraindicationFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ContraindicationFormData) => Promise<void>
  patientId?: string
  patientUserId?: string
}

/**
 * AddContraindicationForm - Modal form for adding contraindications
 * Fields: item, type, reason, severity
 * Submit via API, toast on success
 */
export default function AddContraindicationForm({
  open,
  onClose,
  onSubmit,
  patientId,
  patientUserId
}: AddContraindicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContraindicationFormData>({
    resolver: zodResolver(contraindicationSchema),
    defaultValues: {
      type: ContraindicationType.FOOD,
      severity: ContraIndicationSeverity.MODERATE,
    }
  })

  const onSubmitForm = async (data: ContraindicationFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success('Contraindication added successfully')
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contraindication')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#000000]/10 bg-[#eff8ff]">
          <h2 className="text-lg font-semibold text-[#000000]">
            Add Contraindication
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-500 hover:text-[#1e5f79] hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-5 space-y-3">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-semibold text-[#000000] mb-1">
              Item Name *
            </label>
            <input
              type="text"
              {...register('item')}
              className="w-full px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
              placeholder="e.g., Peanuts, Ibuprofen, Running"
            />
            {errors.item && (
              <p className="mt-1 text-sm text-red-600">{errors.item.message}</p>
            )}
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#000000] mb-2">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ContraindicationType).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 px-3 py-2 border border-[#000000]/10 rounded-lg cursor-pointer hover:bg-[#eff8ff] transition-colors"
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('type')}
                    className="h-4 w-4 text-[#1e5f79] border-gray-300 focus:ring-[#1e5f79]"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {type.toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Severity Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#000000] mb-2">
              Severity *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ContraIndicationSeverity).map((severity) => (
                <label
                  key={severity}
                  className="flex items-center gap-2 px-3 py-2 border border-[#000000]/10 rounded-lg cursor-pointer hover:bg-[#eff8ff] transition-colors"
                >
                  <input
                    type="radio"
                    value={severity}
                    {...register('severity')}
                    className="h-4 w-4 text-[#1e5f79] border-gray-300 focus:ring-[#1e5f79]"
                  />
                  <span className={`text-sm font-medium ${
                    severity === 'CRITICAL' ? 'text-red-600' :
                    severity === 'SEVERE' ? 'text-orange-600' :
                    severity === 'MODERATE' ? 'text-yellow-600' :
                    'text-gray-700'
                  }`}>
                    {severity}
                  </span>
                </label>
              ))}
            </div>
            {errors.severity && (
              <p className="mt-1 text-sm text-red-600">{errors.severity.message}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-[#000000] mb-1">
              Reason *
            </label>
            <textarea
              {...register('reason')}
              rows={3}
              className="w-full px-3 py-2 border border-[#000000]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e5f79] text-sm"
              placeholder="Explain why this is contraindicated for this patient..."
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#000000]/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
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
                  Add Contraindication
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
