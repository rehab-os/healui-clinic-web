'use client'

import React, { useState } from 'react'
import { AlertTriangle, Plus, Minus, User, Heart, Activity, Briefcase, Target, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import type {
    CreatePatientConditionDto,
    Neo4jConditionResponseDto,
    ConditionType,
    SymptomDuration,
    FunctionalLimitationLevel,
    MechanismOfInjury,
    UrgencyLevel
} from '../../lib/types'

interface ConditionScreeningModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (conditionData: CreatePatientConditionDto) => void
    selectedConditions: Neo4jConditionResponseDto[]
    loading?: boolean
}

interface ScreeningData {
    // Red flags
    night_pain?: boolean
    unexplained_weight_loss?: boolean
    history_cancer_tb?: boolean
    fever_with_symptoms?: boolean
    bladder_bowel_changes?: boolean
    neurological_symptoms?: boolean
    recent_trauma?: boolean
    red_flag_notes?: string

    // Primary problem
    chief_complaint?: string
    primary_body_region?: string
    pain_present?: boolean
    vas_score?: number
    symptom_duration?: SymptomDuration

    // Functional impact
    functional_limitation_level?: FunctionalLimitationLevel
    work_affected?: boolean
    sleep_affected?: boolean
    daily_activities_affected?: boolean

    // Mechanism/context
    mechanism_of_injury?: MechanismOfInjury
    related_to_work?: boolean
    related_to_sport?: boolean
    previous_episodes?: boolean

    // Patient expectations
    primary_goal?: string
    urgency_level?: UrgencyLevel

    // Condition details
    condition_type?: ConditionType
    onset_date?: string
    description?: string
}

const RED_FLAG_QUESTIONS = [
    { key: 'night_pain', label: 'Night pain that disrupts sleep', icon: '🌙' },
    { key: 'unexplained_weight_loss', label: 'Recent unexplained weight loss', icon: '⚖️' },
    { key: 'history_cancer_tb', label: 'History of cancer or tuberculosis', icon: '🩺' },
    { key: 'fever_with_symptoms', label: 'Fever with current symptoms', icon: '🌡️' },
    { key: 'bladder_bowel_changes', label: 'Changes in bladder or bowel function', icon: '🚽' },
    { key: 'neurological_symptoms', label: 'Weakness, numbness, or tingling', icon: '🧠' },
    { key: 'recent_trauma', label: 'Recent trauma or injury', icon: '🤕' },
] as const

const BODY_REGIONS = [
    'Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Shoulder', 'Elbow', 
    'Wrist/Hand', 'Hip', 'Knee', 'Ankle/Foot', 'Temporomandibular', 'Other'
]

export const ConditionScreeningModal: React.FC<ConditionScreeningModalProps> = ({
    open,
    onClose,
    onSubmit,
    selectedConditions,
    loading = false
}) => {
    const [currentStep, setCurrentStep] = useState(1)
    const [screeningData, setScreeningData] = useState<ScreeningData>({})
    const [redFlags, setRedFlags] = useState<string[]>([])

    const updateScreeningData = (key: keyof ScreeningData, value: any) => {
        setScreeningData(prev => ({ ...prev, [key]: value }))
    }

    const toggleRedFlag = (flag: string) => {
        const isActive = redFlags.includes(flag)
        if (isActive) {
            setRedFlags(prev => prev.filter(f => f !== flag))
            updateScreeningData(flag as keyof ScreeningData, false)
        } else {
            setRedFlags(prev => [...prev, flag])
            updateScreeningData(flag as keyof ScreeningData, true)
        }
    }

    const hasRedFlags = redFlags.length > 0

    const handleSubmit = () => {
        if (selectedConditions.length === 0) return

        const conditionData: CreatePatientConditionDto = {
            neo4j_condition_id: selectedConditions[0].condition_id,
            description: screeningData.description,
            condition_type: screeningData.condition_type,
            onset_date: screeningData.onset_date,
            
            // Screening data
            ...screeningData
        }

        onSubmit(conditionData)
    }

    const handleClose = () => {
        setCurrentStep(1)
        setScreeningData({})
        setRedFlags([])
        onClose()
    }

    const renderStepIndicator = () => (
        <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map((step) => (
                    <React.Fragment key={step}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step === currentStep 
                                ? 'bg-brand-teal text-white' 
                                : step < currentStep 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-500'
                        }`}>
                            {step < currentStep ? '✓' : step}
                        </div>
                        {step < 4 && (
                            <div className={`w-8 h-1 ${
                                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Safety Screening</h3>
                <p className="text-sm text-gray-600">
                    Let's quickly check for any warning signs that need immediate attention
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {RED_FLAG_QUESTIONS.map((question) => (
                    <Card 
                        key={question.key}
                        className={`cursor-pointer transition-all duration-200 ${
                            redFlags.includes(question.key)
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleRedFlag(question.key)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">{question.icon}</span>
                                    <span className="text-sm font-medium">{question.label}</span>
                                </div>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    redFlags.includes(question.key)
                                        ? 'border-red-500 bg-red-500'
                                        : 'border-gray-300'
                                }`}>
                                    {redFlags.includes(question.key) && (
                                        <span className="text-white text-xs">✓</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {hasRedFlags && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Red flags detected</p>
                                <p className="text-xs text-red-600 mt-1">
                                    Please inform senior physiotherapist immediately
                                </p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <Label htmlFor="red-flag-notes" className="text-sm text-red-800">
                                Additional notes (optional)
                            </Label>
                            <Textarea
                                id="red-flag-notes"
                                placeholder="Any additional details about the red flags..."
                                value={screeningData.red_flag_notes || ''}
                                onChange={(e) => updateScreeningData('red_flag_notes', e.target.value)}
                                className="mt-1 border-red-200 focus:border-red-500"
                                rows={2}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <User className="h-12 w-12 text-brand-teal mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem Identification</h3>
                <p className="text-sm text-gray-600">
                    Tell us about the main issue in your own words
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="chief-complaint">Chief Complaint *</Label>
                    <Textarea
                        id="chief-complaint"
                        placeholder="In your own words, what's bothering you most?"
                        value={screeningData.chief_complaint || ''}
                        onChange={(e) => updateScreeningData('chief_complaint', e.target.value)}
                        rows={3}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="body-region">Primary Body Region Affected</Label>
                    <Select 
                        value={screeningData.primary_body_region || ''} 
                        onValueChange={(value) => updateScreeningData('primary_body_region', value)}
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select the main area affected" />
                        </SelectTrigger>
                        <SelectContent>
                            {BODY_REGIONS.map((region) => (
                                <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Pain Present?</Label>
                        <div className="flex space-x-4 mt-2">
                            <Button
                                type="button"
                                variant={screeningData.pain_present === true ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('pain_present', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                type="button"
                                variant={screeningData.pain_present === false ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('pain_present', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    {screeningData.pain_present && (
                        <div>
                            <Label htmlFor="vas-score">Pain Level (0-10)</Label>
                            <Input
                                id="vas-score"
                                type="number"
                                min="0"
                                max="10"
                                value={screeningData.vas_score || ''}
                                onChange={(e) => updateScreeningData('vas_score', parseInt(e.target.value) || 0)}
                                className="mt-1"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <Label htmlFor="symptom-duration">How long have you had these symptoms?</Label>
                    <Select 
                        value={screeningData.symptom_duration || ''} 
                        onValueChange={(value) => updateScreeningData('symptom_duration', value as SymptomDuration)}
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACUTE">Acute (less than 6 weeks)</SelectItem>
                            <SelectItem value="SUBACUTE">Subacute (6-12 weeks)</SelectItem>
                            <SelectItem value="CHRONIC">Chronic (more than 3 months)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <Activity className="h-12 w-12 text-brand-teal mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Functional Impact</h3>
                <p className="text-sm text-gray-600">
                    How is this condition affecting your daily life?
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Overall functional limitation level</Label>
                    <Select 
                        value={screeningData.functional_limitation_level || ''} 
                        onValueChange={(value) => updateScreeningData('functional_limitation_level', value as FunctionalLimitationLevel)}
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select limitation level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NONE">None - No limitations</SelectItem>
                            <SelectItem value="MILD">Mild - Some difficulty with demanding activities</SelectItem>
                            <SelectItem value="MODERATE">Moderate - Difficulty with daily activities</SelectItem>
                            <SelectItem value="SEVERE">Severe - Major limitations in most activities</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {[
                        { key: 'work_affected', label: 'Work or school activities affected', icon: '💼' },
                        { key: 'sleep_affected', label: 'Sleep quality affected', icon: '😴' },
                        { key: 'daily_activities_affected', label: 'Daily activities (dressing, bathing, etc.) affected', icon: '🏠' }
                    ].map((item) => (
                        <Card 
                            key={item.key}
                            className={`cursor-pointer transition-all duration-200 ${
                                screeningData[item.key as keyof ScreeningData]
                                    ? 'border-brand-teal bg-brand-teal/5'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => updateScreeningData(item.key as keyof ScreeningData, !screeningData[item.key as keyof ScreeningData])}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg">{item.icon}</span>
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        screeningData[item.key as keyof ScreeningData]
                                            ? 'border-brand-teal bg-brand-teal'
                                            : 'border-gray-300'
                                    }`}>
                                        {screeningData[item.key as keyof ScreeningData] && (
                                            <span className="text-white text-xs">✓</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>How did this condition start?</Label>
                        <Select 
                            value={screeningData.mechanism_of_injury || ''} 
                            onValueChange={(value) => updateScreeningData('mechanism_of_injury', value as MechanismOfInjury)}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select mechanism" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRAUMA">Sudden injury/trauma</SelectItem>
                                <SelectItem value="GRADUAL_ONSET">Gradual onset</SelectItem>
                                <SelectItem value="POST_SURGICAL">After surgery</SelectItem>
                                <SelectItem value="UNKNOWN">Unknown/Unclear</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Have you had this condition before?</Label>
                        <div className="flex space-x-4 mt-2">
                            <Button
                                type="button"
                                variant={screeningData.previous_episodes === true ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('previous_episodes', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                type="button"
                                variant={screeningData.previous_episodes === false ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('previous_episodes', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Related to work activities?</Label>
                        <div className="flex space-x-4 mt-2">
                            <Button
                                type="button"
                                variant={screeningData.related_to_work === true ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('related_to_work', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                type="button"
                                variant={screeningData.related_to_work === false ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('related_to_work', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label>Related to sports/exercise?</Label>
                        <div className="flex space-x-4 mt-2">
                            <Button
                                type="button"
                                variant={screeningData.related_to_sport === true ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('related_to_sport', true)}
                            >
                                Yes
                            </Button>
                            <Button
                                type="button"
                                variant={screeningData.related_to_sport === false ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateScreeningData('related_to_sport', false)}
                            >
                                No
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <Target className="h-12 w-12 text-brand-teal mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Treatment Goals</h3>
                <p className="text-sm text-gray-600">
                    Let's set expectations and condition details
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="primary-goal">What's your main goal for treatment? *</Label>
                    <Textarea
                        id="primary-goal"
                        placeholder="e.g., Return to running, Pain-free daily activities, Get back to work..."
                        value={screeningData.primary_goal || ''}
                        onChange={(e) => updateScreeningData('primary_goal', e.target.value)}
                        rows={2}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label>How urgent is your treatment need?</Label>
                    <Select 
                        value={screeningData.urgency_level || ''} 
                        onValueChange={(value) => updateScreeningData('urgency_level', value as UrgencyLevel)}
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select urgency level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ROUTINE">Routine - Can wait for normal scheduling</SelectItem>
                            <SelectItem value="URGENT">Urgent - Need to be seen soon</SelectItem>
                            <SelectItem value="EMERGENT">Emergent - Need immediate attention</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Condition Type</Label>
                        <Select 
                            value={screeningData.condition_type || 'ACUTE'} 
                            onValueChange={(value) => updateScreeningData('condition_type', value as ConditionType)}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACUTE">Acute</SelectItem>
                                <SelectItem value="CHRONIC">Chronic</SelectItem>
                                <SelectItem value="RECURRING">Recurring</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="onset-date">When did this start? (optional)</Label>
                        <Input
                            id="onset-date"
                            type="date"
                            value={screeningData.onset_date || ''}
                            onChange={(e) => updateScreeningData('onset_date', e.target.value)}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="description">Additional notes (optional)</Label>
                    <Textarea
                        id="description"
                        placeholder="Any additional information about this condition..."
                        value={screeningData.description || ''}
                        onChange={(e) => updateScreeningData('description', e.target.value)}
                        rows={3}
                        className="mt-1"
                    />
                </div>

                {/* Summary */}
                <Card className="bg-brand-teal/5 border-brand-teal/20">
                    <CardHeader>
                        <CardTitle className="text-sm text-brand-teal">Screening Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {hasRedFlags && (
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <Badge variant="destructive">Red flags detected</Badge>
                            </div>
                        )}
                        {screeningData.chief_complaint && (
                            <p className="text-sm"><strong>Chief complaint:</strong> {screeningData.chief_complaint}</p>
                        )}
                        {screeningData.primary_body_region && (
                            <p className="text-sm"><strong>Body region:</strong> {screeningData.primary_body_region}</p>
                        )}
                        {screeningData.pain_present && screeningData.vas_score && (
                            <p className="text-sm"><strong>Pain level:</strong> {screeningData.vas_score}/10</p>
                        )}
                        {screeningData.primary_goal && (
                            <p className="text-sm"><strong>Primary goal:</strong> {screeningData.primary_goal}</p>
                        )}
                        {selectedConditions.length > 0 && (
                            <p className="text-sm"><strong>Condition:</strong> {selectedConditions[0].condition_name}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Condition Screening</DialogTitle>
                            <DialogDescription>
                                Complete the screening to add a new condition
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    {renderStepIndicator()}
                </DialogHeader>

                <div className="py-4">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </div>

                <div className="flex justify-between pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                    >
                        Previous
                    </Button>
                    
                    <div className="flex space-x-2">
                        {currentStep < 4 ? (
                            <Button
                                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                                disabled={
                                    (currentStep === 2 && !screeningData.chief_complaint) ||
                                    (currentStep === 4 && !screeningData.primary_goal)
                                }
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !screeningData.chief_complaint || !screeningData.primary_goal}
                                className="bg-brand-teal hover:bg-brand-teal/90"
                            >
                                {loading ? 'Adding Condition...' : 'Complete Screening'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ConditionScreeningModal