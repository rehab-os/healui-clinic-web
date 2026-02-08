'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import ApiManager from '@/services/api/api.service'
import { DISCHARGE_REASONS, type DischargeReason, type PatientConditionResponseDto } from '@/lib/types'
import { LogOut, AlertTriangle, CheckCircle, UserX, FileX, DollarSign, MapPin, ArrowRightLeft, Skull, RefreshCw } from 'lucide-react'

interface DischargeConditionDialogProps {
    isOpen: boolean
    onClose: () => void
    condition: PatientConditionResponseDto | null
    patientId: string
    onDischargeComplete: () => void
}

const getReasonIcon = (reason: DischargeReason) => {
    switch (reason) {
        case 'GOALS_MET': return <CheckCircle className="w-4 h-4 text-green-500" />
        case 'MMI': return <RefreshCw className="w-4 h-4 text-blue-500" />
        case 'REFERRED': return <ArrowRightLeft className="w-4 h-4 text-purple-500" />
        case 'LAMA': return <UserX className="w-4 h-4 text-orange-500" />
        case 'SAMA': return <FileX className="w-4 h-4 text-orange-600" />
        case 'LTFU': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
        case 'NON_COMPLIANT': return <AlertTriangle className="w-4 h-4 text-red-400" />
        case 'FINANCIAL': return <DollarSign className="w-4 h-4 text-gray-500" />
        case 'RELOCATED': return <MapPin className="w-4 h-4 text-blue-400" />
        case 'TRANSFERRED': return <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
        case 'DECEASED': return <Skull className="w-4 h-4 text-gray-600" />
        default: return <LogOut className="w-4 h-4 text-gray-500" />
    }
}

export const DischargeConditionDialog: React.FC<DischargeConditionDialogProps> = ({
    isOpen,
    onClose,
    condition,
    patientId,
    onDischargeComplete,
}) => {
    const [dischargeReason, setDischargeReason] = useState<DischargeReason | ''>('')
    const [dischargeSummary, setDischargeSummary] = useState('')
    const [dischargeNotes, setDischargeNotes] = useState('')
    const [referredTo, setReferredTo] = useState('')
    const [isDischarging, setIsDischarging] = useState(false)

    const handleDischarge = async () => {
        if (!condition || !dischargeReason) return

        setIsDischarging(true)
        try {
            const response = await ApiManager.dischargeCondition(patientId, condition.id, {
                discharge_reason: dischargeReason,
                discharge_summary: dischargeSummary || undefined,
                discharge_notes: dischargeNotes || undefined,
                referred_to: dischargeReason === 'REFERRED' ? referredTo : undefined,
            })

            if (!response.success) {
                throw new Error(response.message || 'Failed to discharge condition')
            }

            const reasonLabel = DISCHARGE_REASONS.find(r => r.value === dischargeReason)?.label || dischargeReason
            toast.success('Condition Discharged', {
                description: `${condition.condition_name} - ${reasonLabel}`
            })

            // Reset form
            setDischargeReason('')
            setDischargeSummary('')
            setDischargeNotes('')
            setReferredTo('')

            onDischargeComplete()
            onClose()
        } catch (error: any) {
            console.error('Error discharging condition:', error)
            toast.error('Failed to discharge', {
                description: error.message || 'An error occurred'
            })
        } finally {
            setIsDischarging(false)
        }
    }

    const selectedReason = DISCHARGE_REASONS.find(r => r.value === dischargeReason)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LogOut className="w-5 h-5 text-orange-500" />
                        Discharge Condition
                    </DialogTitle>
                    <DialogDescription>
                        Discharge <strong>{condition?.condition_name}</strong> from active treatment.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Discharge Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="discharge-reason">Discharge Reason *</Label>
                        <Select
                            value={dischargeReason}
                            onValueChange={(value) => setDischargeReason(value as DischargeReason)}
                        >
                            <SelectTrigger id="discharge-reason">
                                <SelectValue placeholder="Select reason for discharge" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {DISCHARGE_REASONS.map((reason) => (
                                    <SelectItem key={reason.value} value={reason.value}>
                                        <div className="flex items-center gap-2">
                                            {getReasonIcon(reason.value)}
                                            <span>{reason.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedReason && (
                            <p className="text-xs text-gray-500">{selectedReason.description}</p>
                        )}
                    </div>

                    {/* Referred To (only if REFERRED) */}
                    {dischargeReason === 'REFERRED' && (
                        <div className="space-y-2">
                            <Label htmlFor="referred-to">Referred To</Label>
                            <Input
                                id="referred-to"
                                placeholder="Dr. Name - Specialty"
                                value={referredTo}
                                onChange={(e) => setReferredTo(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Discharge Summary */}
                    <div className="space-y-2">
                        <Label htmlFor="discharge-summary">Discharge Summary</Label>
                        <Textarea
                            id="discharge-summary"
                            placeholder="Brief summary of treatment outcomes..."
                            value={dischargeSummary}
                            onChange={(e) => setDischargeSummary(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="discharge-notes">Additional Notes</Label>
                        <Textarea
                            id="discharge-notes"
                            placeholder="Follow-up recommendations, HEP instructions, etc."
                            value={dischargeNotes}
                            onChange={(e) => setDischargeNotes(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isDischarging}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDischarge}
                        disabled={!dischargeReason || isDischarging}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isDischarging ? 'Discharging...' : 'Discharge Condition'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DischargeConditionDialog
