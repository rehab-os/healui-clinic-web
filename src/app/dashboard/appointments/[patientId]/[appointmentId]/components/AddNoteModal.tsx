'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import SmartNoteInput from '@/components/features/notes/SmartNoteInput'

interface AddNoteModalProps {
  open: boolean
  onClose: () => void
  visitId: string
  visitConditionId?: string // If provided, note will be condition-specific
  conditionName?: string
  onSuccess?: () => void
}

export default function AddNoteModal({
  open,
  onClose,
  visitId,
  visitConditionId,
  conditionName,
  onSuccess
}: AddNoteModalProps) {
  if (!open) return null

  const handleNoteCreated = () => {
    if (onSuccess) onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {visitConditionId ? 'Add Condition Note' : 'Add Visit Note'}
            </h2>
            {conditionName && (
              <p className="text-sm text-gray-600 mt-1">{conditionName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Smart Note Input */}
        <div className="p-6">
          <SmartNoteInput
            visitId={visitId}
            preSelectedVisitConditionId={visitConditionId}
            enableConditionMode={!visitConditionId} // If no condition provided, allow selection
            onNoteCreated={handleNoteCreated}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
