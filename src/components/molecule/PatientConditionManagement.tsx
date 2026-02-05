'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit, Trash2, Calendar, Clock, AlertCircle, Stethoscope, TrendingUp, CheckCircle, Sparkles, LogOut, PlayCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Skeleton } from '../ui/skeleton'
import { toast } from 'sonner'
import ConditionSelector from './ConditionSelector'
import ConditionScreeningModal from './ConditionScreeningModal'
import SmartScreeningModal from './SmartScreeningModal'
import PhysioAssessmentChatbot from './PhysioAssessmentChatbot'
import ProtocolGeneratorModal from '../conditions/ProtocolGeneratorModal'
import DischargeConditionDialog from './DischargeConditionDialog'
import ApiManager from '../../services/api'
import { format } from 'date-fns'
import type {
    PatientConditionResponseDto,
    Neo4jConditionResponseDto,
    ConditionStatus,
    CreatePatientConditionDto,
    UpdatePatientConditionDto,
    VisitConditionResponseDto
} from '../../lib/types'

interface PatientConditionManagementProps {
    patientId: string
    patientName?: string
    onConditionsChange?: (conditions: PatientConditionResponseDto[]) => void
}

interface ConditionWithHistory extends PatientConditionResponseDto {
    treatmentHistory?: VisitConditionResponseDto[]
}

export const PatientConditionManagement: React.FC<PatientConditionManagementProps> = ({
    patientId,
    patientName,
    onConditionsChange
}) => {
    // State
    const [conditions, setConditions] = useState<ConditionWithHistory[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [selectedCondition, setSelectedCondition] = useState<ConditionWithHistory | null>(null)
    const [activeTab, setActiveTab] = useState('active')

    // Add condition state
    const [selectedNewConditions, setSelectedNewConditions] = useState<Neo4jConditionResponseDto[]>([])
    const [newConditionDescription, setNewConditionDescription] = useState('')
    const [addingCondition, setAddingCondition] = useState(false)
    const [showScreeningModal, setShowScreeningModal] = useState(false)
    const [showSmartScreeningModal, setShowSmartScreeningModal] = useState(false)
    const [showPhysioAssessment, setShowPhysioAssessment] = useState(false)

    // Edit condition state
    const [editingCondition, setEditingCondition] = useState(false)
    const [editStatus, setEditStatus] = useState<ConditionStatus>('ACTIVE')
    const [editChiefComplaint, setEditChiefComplaint] = useState('')

    // Protocol Generator Modal State
    const [showProtocolGenerator, setShowProtocolGenerator] = useState(false)
    const [selectedConditionForProtocol, setSelectedConditionForProtocol] = useState<{
        conditionId: string;
        conditionName: string;
    } | null>(null)
    const [editDischargeSummary, setEditDischargeSummary] = useState('')

    // Delete confirmation state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [conditionToDelete, setConditionToDelete] = useState<ConditionWithHistory | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Discharge state
    const [showDischargeDialog, setShowDischargeDialog] = useState(false)
    const [conditionToDischarge, setConditionToDischarge] = useState<ConditionWithHistory | null>(null)

    // Load patient conditions
    const loadConditions = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await ApiManager.getPatientConditions(patientId)
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load conditions')
            }

            const conditionsData = response.data || []

            // Load treatment history for each condition
            const conditionsWithHistory = await Promise.all(
                conditionsData.map(async (condition: PatientConditionResponseDto) => {
                    try {
                        const historyResponse = await ApiManager.getConditionHistory(condition.id)
                        return {
                            ...condition,
                            treatmentHistory: historyResponse.success ? historyResponse.data || [] : []
                        }
                    } catch (err) {
                        console.warn(`Failed to load history for condition ${condition.id}:`, err)
                        return {
                            ...condition,
                            treatmentHistory: []
                        }
                    }
                })
            )

            setConditions(conditionsWithHistory)
            onConditionsChange?.(conditionsWithHistory)
        } catch (err: any) {
            console.error('Error loading conditions:', err)
            setError(err.message || 'Failed to load conditions')
        } finally {
            setLoading(false)
        }
    }

    // Load conditions on mount
    useEffect(() => {
        loadConditions()
    }, [patientId])

    // Filter out incomplete drafts - only show conditions with actual diagnosis
    const completedConditions = conditions.filter(c =>
        !c.diagnosis_status ||
        c.diagnosis_status === 'COMPLETE' ||
        c.diagnosis_status === 'CLINICAL_DX_COMPLETE' ||
        c.diagnosis_status === 'SYMPTOM_DX_COMPLETE'
    )

    // Filter conditions by status
    const getFilteredConditions = (status: string) => {
        switch (status) {
            case 'active':
                return completedConditions.filter(c => c.status === 'ACTIVE')
            case 'improving':
                return completedConditions.filter(c => c.status === 'IMPROVING')
            case 'on_hold':
                return completedConditions.filter(c => c.status === 'ON_HOLD')
            case 'discharged':
                return completedConditions.filter(c => c.status === 'DISCHARGED' || c.status === 'RESOLVED')
            case 'all':
            default:
                return completedConditions
        }
    }

    // Add new condition (legacy method for basic condition creation)
    const handleAddCondition = async () => {
        if (selectedNewConditions.length === 0) return

        setAddingCondition(true)

        try {
            const addPromises = selectedNewConditions.map(async (condition) => {
                const createData: CreatePatientConditionDto = {
                    neo4j_condition_id: condition.condition_id,
                    condition_name: condition.condition_name,
                    body_region: condition.body_region,
                    chief_complaint: newConditionDescription || undefined
                }

                return ApiManager.createPatientCondition(patientId, createData)
            })

            const results = await Promise.all(addPromises)

            // Check if all requests succeeded
            const failed = results.filter(r => !r.success)
            if (failed.length > 0) {
                throw new Error(`Failed to add ${failed.length} condition(s)`)
            }

            // Reset form and reload
            setSelectedNewConditions([])
            setNewConditionDescription('')
            setShowAddDialog(false)
            await loadConditions()
        } catch (err: any) {
            console.error('Error adding conditions:', err)
            setError(err.message || 'Failed to add conditions')
        } finally {
            setAddingCondition(false)
        }
    }

    // Handle screening-based condition creation
    const handleScreeningConditionSubmit = async (conditionData: CreatePatientConditionDto) => {
        setAddingCondition(true)
        setError(null)

        try {
            const response = await ApiManager.createPatientCondition(patientId, conditionData)
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to create condition')
            }

            setShowScreeningModal(false)
            setSelectedNewConditions([])
            await loadConditions()
        } catch (err: any) {
            console.error('Error creating condition with screening:', err)
            setError(err.message || 'Failed to create condition')
        } finally {
            setAddingCondition(false)
        }
    }

    // Handle opening screening modal
    const handleOpenScreeningModal = () => {
        if (selectedNewConditions.length === 0) {
            setError('Please select a condition first')
            return
        }
        
        setShowAddDialog(false)
        setShowScreeningModal(true)
    }

    // Handle physio assessment completion
    const handlePhysioAssessmentComplete = async (summary: any) => {
        console.log('Physio assessment completed:', summary)
        
        // Here you can process the assessment results
        // For example, automatically create conditions based on the assessment
        if (summary.provisionalDiagnosis && summary.provisionalDiagnosis.length > 0) {
            // You could automatically add suggested conditions or store the assessment data
            console.log('Provisional diagnoses:', summary.provisionalDiagnosis)
        }
        
        // 🔒 CRITICAL FIX: DO NOT reload conditions automatically
        // Let the chatbot handle its own completion state without parent interference
        // Conditions will be reloaded only when the chatbot actually closes after diagnosis selection
        console.log('✅ Assessment completed - waiting for diagnosis selection before reloading conditions');
    }

    // Handle chatbot closing (with or without diagnosis selection)
    const handlePhysioAssessmentClose = async () => {
        console.log('🔄 Chatbot closed - reloading conditions now to reflect any new diagnoses');
        setShowPhysioAssessment(false);
        // Now it's safe to reload conditions since the chatbot is closed
        await loadConditions();
    }

    // Protocol Generator Modal Handlers
    const handleGenerateProtocol = (condition: ConditionWithHistory) => {
        setSelectedConditionForProtocol({
            conditionId: condition.id,
            conditionName: condition.condition_name
        });
        setShowProtocolGenerator(true);
    };

    const handleCloseProtocolGenerator = () => {
        setShowProtocolGenerator(false);
        setSelectedConditionForProtocol(null);
    };

    // Unified update condition function
    const handleUpdateCondition = async () => {
        if (!selectedCondition) return

        setEditingCondition(true)
        setError(null)

        try {
            // Build update data with only changed fields
            const updateData: UpdatePatientConditionDto = {}

            if (editStatus !== selectedCondition.status) {
                updateData.status = editStatus
            }

            if (editChiefComplaint !== (selectedCondition.chief_complaint || '')) {
                updateData.chief_complaint = editChiefComplaint
            }

            // If status is being changed to RESOLVED, require discharge summary
            if (updateData.status === 'RESOLVED' && !editDischargeSummary.trim()) {
                throw new Error('Discharge summary is required when marking condition as resolved')
            }

            if (updateData.status === 'RESOLVED' && editDischargeSummary.trim()) {
                updateData.discharge_summary = editDischargeSummary
            }

            // Check if there are any changes
            if (Object.keys(updateData).length === 0) {
                setShowEditDialog(false)
                return
            }

            const response = await ApiManager.updatePatientCondition(
                patientId,
                selectedCondition.id,
                updateData
            )

            if (!response.success) {
                throw new Error(response.message || 'Failed to update condition')
            }

            setShowEditDialog(false)
            await loadConditions()
        } catch (err: any) {
            console.error('Error updating condition:', err)
            setError(err.message || 'Failed to update condition')
        } finally {
            setEditingCondition(false)
        }
    }

    // Keep old methods for backwards compatibility (deprecated)
    const handleUpdateStatus = async () => {
        return handleUpdateCondition()
    }

    const handleUpdateDescription = async () => {
        return handleUpdateCondition()
    }

    // Delete condition
    // Open delete confirmation dialog
    const handleDeleteClick = (condition: ConditionWithHistory) => {
        setConditionToDelete(condition)
        setShowDeleteDialog(true)
    }

    // Actually delete the condition after confirmation
    const handleConfirmDelete = async () => {
        if (!conditionToDelete) return

        setIsDeleting(true)
        try {
            const response = await ApiManager.deletePatientCondition(patientId, conditionToDelete.id)

            if (!response.success) {
                throw new Error(response.message || 'Failed to delete condition')
            }

            toast.success('Condition removed', {
                description: `"${conditionToDelete.condition_name}" has been removed from this patient.`
            })
            setShowDeleteDialog(false)
            setConditionToDelete(null)
            await loadConditions()
        } catch (err: any) {
            console.error('Error deleting condition:', err)
            toast.error('Failed to delete condition', {
                description: err.message || 'An error occurred while deleting the condition.'
            })
        } finally {
            setIsDeleting(false)
        }
    }

    // Get status color
    const getStatusColor = (status: ConditionStatus) => {
        switch (status) {
            case 'ACTIVE': return 'bg-red-100 text-red-800 border-red-200'
            case 'IMPROVING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200'
            case 'CHRONIC': return 'bg-purple-100 text-purple-800 border-purple-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    // Get status icon
    const getStatusIcon = (status: ConditionStatus) => {
        switch (status) {
            case 'ACTIVE': return <AlertCircle className="w-4 h-4" />
            case 'IMPROVING': return <TrendingUp className="w-4 h-4" />
            case 'RESOLVED': return <CheckCircle className="w-4 h-4" />
            case 'CHRONIC': return <Clock className="w-4 h-4" />
            default: return <Stethoscope className="w-4 h-4" />
        }
    }

    // Open edit dialog
    const openEditDialog = (condition: ConditionWithHistory) => {
        setSelectedCondition(condition)
        setEditStatus(condition.status)
        setEditChiefComplaint(condition.chief_complaint || '')
        setEditDischargeSummary(condition.discharge_summary || '')
        setError(null)
        setShowEditDialog(true)
    }

    if (loading && conditions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Stethoscope className="w-5 h-5" />
                                Medical Conditions
                            </CardTitle>
                            <CardDescription>
                                Manage {patientName ? `${patientName}'s` : 'patient'} active and historical conditions
                            </CardDescription>
                        </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowPhysioAssessment(true)}
                            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                        >
                            <Stethoscope className="w-4 h-4 mr-2" />
                            Initial Screening
                        </Button>
                        <Button
                            onClick={() => setShowSmartScreeningModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Start Screening
                        </Button>
                        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Condition
                                </Button>
                            </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add New Condition</DialogTitle>
                                <DialogDescription>
                                    Select conditions from the knowledge base to add to this patient
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <ConditionSelector
                                    patientId={patientId}
                                    selectedConditions={selectedNewConditions}
                                    onConditionsChange={setSelectedNewConditions}
                                    multiple={true}
                                    showSearch={true}
                                    showBodyRegionFilter={true}
                                    placeholder="Search for conditions to add..."
                                />
                                
                                {selectedNewConditions.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Chief Complaint (Optional)
                                        </label>
                                        <Textarea
                                            value={newConditionDescription}
                                            onChange={(e) => setNewConditionDescription(e.target.value)}
                                            placeholder="Describe the patient's main concern..."
                                            rows={3}
                                        />
                                    </div>
                                )}

                                <div className="flex justify-between gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowAddDialog(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleAddCondition}
                                            disabled={selectedNewConditions.length === 0 || addingCondition}
                                        >
                                            {addingCondition ? 'Adding...' : 'Quick Add'}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={handleOpenScreeningModal}
                                            disabled={selectedNewConditions.length === 0 || addingCondition}
                                            className="bg-brand-teal hover:bg-brand-teal/90"
                                        >
                                            Add with Screening
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-red-600">{error}</p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={loadConditions}
                            className="mt-2"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="active">
                            Active ({getFilteredConditions('active').length})
                        </TabsTrigger>
                        <TabsTrigger value="improving">
                            Improving ({getFilteredConditions('improving').length})
                        </TabsTrigger>
                        <TabsTrigger value="on_hold">
                            On Hold ({getFilteredConditions('on_hold').length})
                        </TabsTrigger>
                        <TabsTrigger value="discharged">
                            Discharged ({getFilteredConditions('discharged').length})
                        </TabsTrigger>
                        <TabsTrigger value="all">
                            All ({completedConditions.length})
                        </TabsTrigger>
                    </TabsList>

                    {['active', 'improving', 'on_hold', 'discharged', 'all'].map(tab => (
                        <TabsContent key={tab} value={tab} className="mt-4">
                            {getFilteredConditions(tab).length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No {tab !== 'all' ? tab : ''} conditions found</p>
                                    <p className="text-sm mt-1">
                                        {tab === 'active' && "Click 'Add Condition' to add new conditions"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {getFilteredConditions(tab).map(condition => (
                                        <Card key={condition.id} className="relative">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="font-semibold text-lg">
                                                                {condition.condition_name}
                                                            </h3>
                                                            <Badge className={`${getStatusColor(condition.status)} flex items-center gap-1`}>
                                                                {getStatusIcon(condition.status)}
                                                                {condition.status}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {condition.condition_type}
                                                            </Badge>
                                                            {condition.severity_level && (
                                                                <Badge 
                                                                    className={`${getSeverityColor(condition.severity_level)} flex items-center gap-1`}
                                                                >
                                                                    {condition.severity_level}
                                                                </Badge>
                                                            )}
                                                            {condition.discharged_at && (
                                                                <Badge variant="secondary" className="text-green-600 bg-green-50">
                                                                    Discharged
                                                                </Badge>
                                                            )}
                                                            {condition.body_region && (
                                                                <Badge variant="outline">
                                                                    {condition.body_region}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {condition.description && (
                                                            <p className="text-gray-600 mb-2">
                                                                {condition.description}
                                                            </p>
                                                        )}

                                                        {/* Discharge information */}
                                                        {condition.discharged_at && (
                                                            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-2">
                                                                <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    <strong>Discharged on {format(new Date(condition.discharged_at), 'MMM d, yyyy')}</strong>
                                                                    {condition.dischargedBy && (
                                                                        <span>by {condition.dischargedBy.full_name}</span>
                                                                    )}
                                                                </div>
                                                                {condition.discharge_summary && (
                                                                    <p className="text-sm text-green-600 ml-6">
                                                                        {condition.discharge_summary}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Protocol information */}
                                                        {condition.current_protocol_id && (
                                                            <div className="text-sm text-blue-600 mb-2">
                                                                <strong>Current Protocol:</strong> {condition.current_protocol_id}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            {condition.onset_date && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    Onset: {format(new Date(condition.onset_date), 'MMM d, yyyy')}
                                                                </div>
                                                            )}
                                                            {condition.last_assessment_date && (
                                                                <div className="flex items-center gap-1">
                                                                    <Stethoscope className="w-4 h-4" />
                                                                    Last assessed: {format(new Date(condition.last_assessment_date), 'MMM d, yyyy')}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                Added: {format(new Date(condition.created_at), 'MMM d, yyyy')}
                                                            </div>
                                                            {condition.visit_conditions_count && condition.visit_conditions_count > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <Stethoscope className="w-4 h-4" />
                                                                    {condition.visit_conditions_count} treatment session(s)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditDialog(condition)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleGenerateProtocol(condition)}
                                                            className="text-healui-primary hover:text-healui-primary/80 hover:bg-healui-primary/10"
                                                            title="Generate AI Protocol"
                                                        >
                                                            <Sparkles className="w-4 h-4" />
                                                        </Button>
                                                        {condition.status !== 'DISCHARGED' ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setConditionToDischarge(condition)
                                                                    setShowDischargeDialog(true)
                                                                }}
                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                                title="Discharge"
                                                            >
                                                                <LogOut className="w-4 h-4" />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    try {
                                                                        const response = await ApiManager.reactivateCondition(patientId, condition.id)
                                                                        if (response.success) {
                                                                            toast.success('Condition reactivated')
                                                                            loadConditions()
                                                                        }
                                                                    } catch (err) {
                                                                        toast.error('Failed to reactivate')
                                                                    }
                                                                }}
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                title="Reactivate"
                                                            >
                                                                <PlayCircle className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(condition)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>

            {/* Edit Condition Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Condition</DialogTitle>
                        <DialogDescription>
                            Update the status or description for {selectedCondition?.condition_name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedCondition && (
                        <div className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <Select value={editStatus} onValueChange={(value: ConditionStatus) => setEditStatus(value)}>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chief Complaint
                                </label>
                                <Textarea
                                    value={editChiefComplaint}
                                    onChange={(e) => setEditChiefComplaint(e.target.value)}
                                    placeholder="Patient's main concern..."
                                    rows={3}
                                />
                            </div>

                            {editStatus === 'RESOLVED' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discharge Summary <span className="text-red-500">*</span>
                                    </label>
                                    <Textarea
                                        value={editDischargeSummary}
                                        onChange={(e) => setEditDischargeSummary(e.target.value)}
                                        placeholder="Provide a summary of the treatment outcome and discharge notes..."
                                        rows={4}
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Required when marking condition as resolved
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowEditDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleUpdateCondition}
                                    disabled={editingCondition}
                                >
                                    {editingCondition ? 'Updating...' : 'Update'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Condition Screening Modal */}
            <ConditionScreeningModal
                open={showScreeningModal}
                onClose={() => {
                    setShowScreeningModal(false)
                    setSelectedNewConditions([])
                }}
                onSubmit={handleScreeningConditionSubmit}
                selectedConditions={selectedNewConditions}
                loading={addingCondition}
            />

            {/* Smart Screening Modal */}
            <SmartScreeningModal
                open={showSmartScreeningModal}
                onClose={() => setShowSmartScreeningModal(false)}
                onSubmit={handleScreeningConditionSubmit}
                loading={addingCondition}
            />

        </Card>

        {/* Protocol Generator Modal */}
        {selectedConditionForProtocol && (
            <ProtocolGeneratorModal
                isOpen={showProtocolGenerator}
                onClose={handleCloseProtocolGenerator}
                patientId={patientId}
                conditionId={selectedConditionForProtocol.conditionId}
                conditionName={selectedConditionForProtocol.conditionName}
                patientName={patientName}
            />
        )}
        
        {showPhysioAssessment && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
                <div className="absolute inset-0 bg-medical-grid opacity-10"></div>
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
                
                <PhysioAssessmentChatbot
                    patientId={patientId}
                    patientName={patientName}
                    onComplete={handlePhysioAssessmentComplete}
                    onClose={handlePhysioAssessmentClose}
                    persistentKey={`assessment-${patientId}`}
                />
            </div>,
            document.body
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Condition</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove <strong>"{conditionToDelete?.condition_name}"</strong> from this patient?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isDeleting ? 'Removing...' : 'Remove Condition'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Discharge Condition Dialog */}
        <DischargeConditionDialog
            isOpen={showDischargeDialog}
            onClose={() => {
                setShowDischargeDialog(false)
                setConditionToDischarge(null)
            }}
            condition={conditionToDischarge}
            patientId={patientId}
            onDischargeComplete={loadConditions}
        />
        </>
    )
}

export default PatientConditionManagement