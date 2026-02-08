'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import ApiManager from '@/services/api/api.service'
import {
  ConditionStatus
} from '@/lib/types'
import type {
  PatientConditionResponseDto,
  UpdatePatientConditionDto
} from '@/lib/types'

interface ConditionEditModalProps {
  isOpen: boolean
  onClose: () => void
  condition: PatientConditionResponseDto | null
  onConditionUpdated?: (updatedCondition: PatientConditionResponseDto) => void
}

export const ConditionEditModal: React.FC<ConditionEditModalProps> = ({
  isOpen,
  onClose,
  condition,
  onConditionUpdated
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [status, setStatus] = useState<ConditionStatus>(ConditionStatus.ACTIVE)
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [dischargeSummary, setDischargeSummary] = useState('')

  // Initialize form when condition changes
  useEffect(() => {
    if (condition) {
      setStatus(condition.status)
      setChiefComplaint(condition.chief_complaint || '')
      setDischargeSummary(condition.discharge_summary || '')
      setError(null)
    }
  }, [condition])

  const handleSave = async () => {
    if (!condition) return

    setLoading(true)
    setError(null)

    try {
      // Build update data
      const updateData: UpdatePatientConditionDto = {}

      if (status !== condition.status) {
        updateData.status = status
      }

      if (chiefComplaint !== (condition.chief_complaint || '')) {
        updateData.chief_complaint = chiefComplaint
      }

      // Handle discharge
      if (status === 'RESOLVED' && !condition.discharged_at) {
        if (!dischargeSummary.trim()) {
          throw new Error('Discharge summary is required when marking condition as resolved')
        }
        updateData.discharge_summary = dischargeSummary
      }

      // Check if there are changes
      if (Object.keys(updateData).length === 0) {
        onClose()
        return
      }

      // Make API call
      const response = await ApiManager.updatePatientCondition(
        condition.patient_id || condition.patient_user_id!,
        condition.id,
        updateData
      )

      if (!response.success) {
        throw new Error(response.message || 'Failed to update condition')
      }

      // Notify parent component
      if (onConditionUpdated) {
        onConditionUpdated(response.data)
      }

      onClose()
    } catch (err: any) {
      console.error('Error updating condition:', err)
      setError(err.message || 'Failed to update condition')
    } finally {
      setLoading(false)
    }
  }

  if (!condition) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Update Condition
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Condition Name (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              {condition.condition_name}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select value={status} onValueChange={(value: ConditionStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="IMPROVING">Improving</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chief Complaint
            </label>
            <Textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Patient's main concern..."
              rows={3}
            />
          </div>

          {/* Discharge Summary (if resolving) */}
          {status === 'RESOLVED' && !condition.discharged_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discharge Summary <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                placeholder="Provide discharge summary and outcome..."
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Required when marking condition as resolved
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Updating...' : 'Update Condition'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConditionEditModal