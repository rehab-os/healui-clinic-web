'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Target, Save, FileText } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import ApiManager from '../../services/api'
import type { VisitConditionResponseDto, TreatmentFocus } from '../../lib/types'

interface VisitConditionEditModalProps {
  isOpen: boolean
  onClose: () => void
  visitCondition: VisitConditionResponseDto | null
  onVisitConditionUpdated?: (updated: VisitConditionResponseDto) => void
}

export const VisitConditionEditModal: React.FC<VisitConditionEditModalProps> = ({
  isOpen,
  onClose,
  visitCondition,
  onVisitConditionUpdated
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [treatmentFocus, setTreatmentFocus] = useState<TreatmentFocus>('PRIMARY')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [nextVisitPlan, setNextVisitPlan] = useState('')
  const [sessionGoals, setSessionGoals] = useState('')

  // Initialize form when visitCondition changes
  useEffect(() => {
    if (visitCondition) {
      setTreatmentFocus(visitCondition.treatment_focus)
      setChiefComplaint(visitCondition.chief_complaint || '')
      setNextVisitPlan(visitCondition.next_visit_plan || '')
      setSessionGoals(
        Array.isArray(visitCondition.session_goals) 
          ? visitCondition.session_goals.join('\n')
          : visitCondition.session_goals || ''
      )
      setError(null)
    }
  }, [visitCondition])

  const handleSave = async () => {
    if (!visitCondition) return

    setLoading(true)
    setError(null)

    try {
      // Build update data
      const updateData: any = {}
      
      if (treatmentFocus !== visitCondition.treatment_focus) {
        updateData.treatment_focus = treatmentFocus
      }
      
      if (chiefComplaint !== (visitCondition.chief_complaint || '')) {
        updateData.chief_complaint = chiefComplaint
      }
      
      if (nextVisitPlan !== (visitCondition.next_visit_plan || '')) {
        updateData.next_visit_plan = nextVisitPlan
      }

      if (sessionGoals !== (Array.isArray(visitCondition.session_goals) 
          ? visitCondition.session_goals.join('\n')
          : visitCondition.session_goals || '')) {
        updateData.session_goals = sessionGoals.split('\n').filter(goal => goal.trim())
      }

      // Check if there are changes
      if (Object.keys(updateData).length === 0) {
        onClose()
        return
      }

      // Make API call
      const response = await ApiManager.updateVisitCondition(visitCondition.id, updateData)

      if (!response.success) {
        throw new Error(response.message || 'Failed to update visit condition')
      }

      // Notify parent component
      if (onVisitConditionUpdated) {
        onVisitConditionUpdated(response.data)
      }

      onClose()
    } catch (err: any) {
      console.error('Error updating visit condition:', err)
      setError(err.message || 'Failed to update visit condition')
    } finally {
      setLoading(false)
    }
  }

  if (!visitCondition) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Update Visit Treatment
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
              {visitCondition.condition_name}
            </div>
          </div>

          {/* Treatment Focus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treatment Focus
            </label>
            <Select value={treatmentFocus} onValueChange={(value: TreatmentFocus) => setTreatmentFocus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIMARY">Primary Focus</SelectItem>
                <SelectItem value="SECONDARY">Secondary Focus</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
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
              placeholder="Patient's main complaint for this visit..."
              rows={2}
            />
          </div>

          {/* Session Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Goals
            </label>
            <Textarea
              value={sessionGoals}
              onChange={(e) => setSessionGoals(e.target.value)}
              placeholder="Goals for this treatment session (one per line)..."
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter each goal on a new line
            </p>
          </div>

          {/* Next Visit Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan for Next Visit
            </label>
            <Textarea
              value={nextVisitPlan}
              onChange={(e) => setNextVisitPlan(e.target.value)}
              placeholder="Treatment plan and focus for next visit..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Updating...' : 'Update Visit Plan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VisitConditionEditModal