'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowRight, ArrowLeft, X, AlertTriangle, MapPin, Activity, Target, Brain, Search, Stethoscope, Loader2 } from 'lucide-react'
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
import localConditionService from '../../services/localConditionService'

interface SmartScreeningModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (conditionData: CreatePatientConditionDto) => void
    loading?: boolean
}

interface ScreeningState {
    // Question flow data
    chiefComplaint: string
    painLocation: string
    painLevel: number
    symptomDuration: SymptomDuration | ''
    functionalImpact: FunctionalLimitationLevel | ''
    redFlags: string[]
    
    // Derived condition selection
    recommendedConditions: Neo4jConditionResponseDto[]
    searchedConditions: Neo4jConditionResponseDto[]
    selectedCondition: Neo4jConditionResponseDto | null
    conditionSearchTerm: string
    searchingConditions: boolean
    
    // Final details
    primaryGoal: string
    urgencyLevel: UrgencyLevel | ''
    additionalNotes: string
}

const BODY_REGIONS = [
    'Head & Neck', 'Cervical Spine', 'Shoulder', 'Arm', 'Elbow', 'Wrist & Hand',
    'Thoracic Spine', 'Chest', 'Lumbar Spine', 'Hip', 'Thigh', 'Knee', 'Lower Leg', 'Ankle & Foot'
]

const RED_FLAG_OPTIONS = [
    { id: 'night_pain', label: 'Severe night pain that wakes you up', emoji: '🌙' },
    { id: 'weight_loss', label: 'Unexplained weight loss recently', emoji: '⚖️' },
    { id: 'fever', label: 'Fever with your symptoms', emoji: '🤒' },
    { id: 'numbness', label: 'Numbness or tingling', emoji: '🖐️' },
    { id: 'weakness', label: 'Significant weakness', emoji: '💪' },
    { id: 'bowel_bladder', label: 'Bowel or bladder problems', emoji: '🚽' },
    { id: 'trauma', label: 'Recent injury or trauma', emoji: '🤕' },
]

const SMART_QUESTIONS = {
    1: {
        title: "What's bothering you most?",
        subtitle: "Tell us about your main concern in your own words",
        icon: Brain,
        color: "blue"
    },
    2: {
        title: "Where exactly is the problem?",
        subtitle: "Point us to the area that's affected",
        icon: MapPin,
        color: "green"
    },
    3: {
        title: "How bad is the pain?",
        subtitle: "Help us understand your pain level",
        icon: Activity,
        color: "red"
    },
    4: {
        title: "Any warning signs?",
        subtitle: "Let's check for anything that needs urgent attention",
        icon: AlertTriangle,
        color: "yellow"
    },
    5: {
        title: "How long has this been going on?",
        subtitle: "Timeline helps us understand your condition better",
        icon: Activity,
        color: "purple"
    },
    6: {
        title: "How is this affecting your life?",
        subtitle: "Understanding the impact on your daily activities",
        icon: Target,
        color: "indigo"
    }
}

export const SmartScreeningModal: React.FC<SmartScreeningModalProps> = ({
    open,
    onClose,
    onSubmit,
    loading = false
}) => {
    const [currentStep, setCurrentStep] = useState(1)
    const [screening, setScreening] = useState<ScreeningState>({
        chiefComplaint: '',
        painLocation: '',
        painLevel: 0,
        symptomDuration: '',
        functionalImpact: '',
        redFlags: [],
        recommendedConditions: [],
        searchedConditions: [],
        selectedCondition: null,
        conditionSearchTerm: '',
        searchingConditions: false,
        primaryGoal: '',
        urgencyLevel: '',
        additionalNotes: ''
    })

    const updateScreening = (key: keyof ScreeningState, value: any) => {
        setScreening(prev => ({ ...prev, [key]: value }))
    }

    const toggleRedFlag = (flagId: string) => {
        setScreening(prev => ({
            ...prev,
            redFlags: prev.redFlags.includes(flagId)
                ? prev.redFlags.filter(f => f !== flagId)
                : [...prev.redFlags, flagId]
        }))
    }

    const handleNext = () => {
        if (currentStep === 6) {
            // After step 6, find recommended conditions
            findRecommendedConditions()
        }
        setCurrentStep(prev => Math.min(8, prev + 1))
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(1, prev - 1))
    }

    const findRecommendedConditions = async () => {
        // Use local ontology data to find recommended conditions based on screening
        const recommendedConditions = localConditionService.getRecommendedConditions({
            bodyRegion: screening.painLocation,
            painLevel: screening.painLevel,
            symptomDuration: screening.symptomDuration,
            functionalImpact: screening.functionalImpact
        })
        
        console.log('AI-recommended conditions based on screening:', recommendedConditions)
        updateScreening('recommendedConditions', recommendedConditions)
    }

    const searchConditions = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            updateScreening('searchedConditions', [])
            return
        }

        updateScreening('searchingConditions', true)
        
        try {
            console.log('Searching local conditions.json for term:', searchTerm)
            
            // Use only local ontology data from conditions.json
            const searchResults = localConditionService.searchConditions(searchTerm.trim(), 10)
            console.log('Found conditions from local conditions.json:', searchResults.length)
            
            updateScreening('searchedConditions', searchResults)
            
        } catch (error) {
            console.error('Error searching local conditions:', error)
            updateScreening('searchedConditions', [])
        } finally {
            updateScreening('searchingConditions', false)
        }
    }

    // Use useRef for debouncing
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

    const handleConditionSearch = (value: string) => {
        updateScreening('conditionSearchTerm', value)
        
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        
        // Set new timeout
        searchTimeoutRef.current = setTimeout(() => {
            searchConditions(value)
        }, 500)
    }

    const generateTechnicalReport = () => {
        const redFlagCount = screening.redFlags.length
        const painSeverity = screening.painLevel >= 7 ? 'High' : screening.painLevel >= 4 ? 'Moderate' : 'Low'
        const chronicity = screening.symptomDuration === 'CHRONIC' ? 'Chronic' : screening.symptomDuration === 'SUBACUTE' ? 'Subacute' : 'Acute'
        const functionalImpact = screening.functionalImpact
        
        return {
            assessment_type: 'INITIAL_SCREENING',
            timestamp: new Date().toISOString(),
            clinical_indicators: {
                red_flags: {
                    present: redFlagCount > 0,
                    count: redFlagCount,
                    flags: screening.redFlags
                },
                pain_assessment: {
                    vas_score: screening.painLevel,
                    severity: painSeverity,
                    present: screening.painLevel > 0
                },
                chronicity: {
                    classification: chronicity,
                    duration: screening.symptomDuration
                },
                functional_status: {
                    limitation_level: functionalImpact,
                    impairment_present: functionalImpact !== 'NONE'
                }
            },
            primary_presentation: {
                chief_complaint: screening.chiefComplaint,
                anatomical_region: screening.painLocation,
                condition_hypothesis: screening.selectedCondition?.condition_name || 'Pending selection'
            },
            priority_classification: {
                urgency: screening.urgencyLevel || 'Pending',
                requires_immediate_attention: redFlagCount > 0 || screening.painLevel >= 8,
                clinical_priority: redFlagCount > 0 ? 'HIGH' : screening.painLevel >= 6 ? 'MEDIUM' : 'STANDARD'
            },
            screening_completion: {
                status: 'IN_PROGRESS',
                step: '7_of_8',
                data_quality: 'COMPREHENSIVE'
            }
        }
    }

    const handleSubmit = () => {
        if (!screening.selectedCondition) return

        const conditionData: CreatePatientConditionDto = {
            neo4j_condition_id: screening.selectedCondition.condition_id,
            description: screening.additionalNotes,
            condition_type: 'ACUTE' as ConditionType,
            
            // Screening data from questions
            chief_complaint: screening.chiefComplaint,
            primary_body_region: screening.painLocation,
            pain_present: screening.painLevel > 0,
            vas_score: screening.painLevel,
            symptom_duration: screening.symptomDuration || undefined,
            functional_limitation_level: screening.functionalImpact || undefined,
            primary_goal: screening.primaryGoal,
            urgency_level: screening.urgencyLevel || undefined,
            
            // Red flags
            night_pain: screening.redFlags.includes('night_pain'),
            unexplained_weight_loss: screening.redFlags.includes('weight_loss'),
            fever_with_symptoms: screening.redFlags.includes('fever'),
            neurological_symptoms: screening.redFlags.includes('numbness') || screening.redFlags.includes('weakness'),
            bladder_bowel_changes: screening.redFlags.includes('bowel_bladder'),
            recent_trauma: screening.redFlags.includes('trauma'),
        }

        onSubmit(conditionData)
    }

    const handleClose = () => {
        // Clear timeout on close
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        
        setCurrentStep(1)
        setScreening({
            chiefComplaint: '',
            painLocation: '',
            painLevel: 0,
            symptomDuration: '',
            functionalImpact: '',
            redFlags: [],
            recommendedConditions: [],
            searchedConditions: [],
            selectedCondition: null,
            conditionSearchTerm: '',
            searchingConditions: false,
            primaryGoal: '',
            urgencyLevel: '',
            additionalNotes: ''
        })
        onClose()
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    const getStepProgress = () => Math.round((currentStep / 8) * 100)

    const currentQuestion = SMART_QUESTIONS[currentStep as keyof typeof SMART_QUESTIONS]
    const IconComponent = currentQuestion?.icon

    const canProceed = () => {
        switch (currentStep) {
            case 1: return screening.chiefComplaint.trim().length > 0
            case 2: return screening.painLocation.trim().length > 0
            case 3: return true // Pain level can be 0
            case 4: return true // Red flags are optional
            case 5: return screening.symptomDuration !== ''
            case 6: return screening.functionalImpact !== ''
            case 7: return screening.selectedCondition !== null
            case 8: return screening.primaryGoal.trim().length > 0
            default: return false
        }
    }

    const renderProgressBar = () => (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Step {currentStep} of 8</span>
                <span className="text-sm text-gray-500">{getStepProgress()}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getStepProgress()}%` }}
                />
            </div>
        </div>
    )

    const renderQuestionHeader = () => {
        if (!currentQuestion) return null

        return (
            <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${currentQuestion.color}-100 mb-4`}>
                    <IconComponent className={`w-8 h-8 text-${currentQuestion.color}-600`} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQuestion.title}</h2>
                <p className="text-gray-600">{currentQuestion.subtitle}</p>
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Smart Condition Assessment</DialogTitle>
                            <DialogDescription>
                                Let's understand your condition through guided questions
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
                </DialogHeader>

                <div className="py-6">
                    {renderProgressBar()}
                    {renderQuestionHeader()}

                    {/* Step 1: Chief Complaint */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="p-6">
                                    <Label htmlFor="chief-complaint" className="text-base font-medium">
                                        Describe what's bothering you most *
                                    </Label>
                                    <Textarea
                                        id="chief-complaint"
                                        placeholder="e.g., 'Sharp pain in my lower back when I bend over' or 'My shoulder hurts when I reach overhead'"
                                        value={screening.chiefComplaint}
                                        onChange={(e) => updateScreening('chiefComplaint', e.target.value)}
                                        rows={4}
                                        className="mt-2 border-blue-300 focus:border-blue-500"
                                    />
                                    <p className="text-sm text-blue-600 mt-2">
                                        💡 Be as specific as possible - this helps us understand your condition better
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 2: Location */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <Card className="border-green-200 bg-green-50">
                                <CardContent className="p-6">
                                    <Label className="text-base font-medium mb-4 block">
                                        Which area of your body is affected? *
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {BODY_REGIONS.map((region) => (
                                            <Button
                                                key={region}
                                                type="button"
                                                variant={screening.painLocation === region ? 'default' : 'outline'}
                                                className={`justify-start h-auto p-3 ${
                                                    screening.painLocation === region 
                                                        ? 'bg-green-600 text-white' 
                                                        : 'hover:bg-green-100'
                                                }`}
                                                onClick={() => updateScreening('painLocation', region)}
                                            >
                                                {region}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 3: Pain Level */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="p-6">
                                    <Label className="text-base font-medium mb-4 block">
                                        Rate your pain level (0 = No pain, 10 = Worst possible pain)
                                    </Label>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">No pain</span>
                                            <span className="text-lg font-bold text-red-600">{screening.painLevel}</span>
                                            <span className="text-sm text-gray-600">Worst pain</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            value={screening.painLevel}
                                            onChange={(e) => updateScreening('painLevel', parseInt(e.target.value))}
                                            className="w-full h-3 bg-gradient-to-r from-green-300 via-yellow-300 to-red-500 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="grid grid-cols-11 text-xs text-gray-500">
                                            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                                                <span key={n} className="text-center">{n}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {screening.painLevel === 0 && (
                                        <p className="text-sm text-green-600 mt-3">
                                            ✓ No pain reported - we'll still help assess your condition
                                        </p>
                                    )}
                                    {screening.painLevel >= 8 && (
                                        <p className="text-sm text-red-600 mt-3">
                                            ⚠️ Severe pain reported - this may need urgent attention
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 4: Red Flags */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <Card className="border-yellow-200 bg-yellow-50">
                                <CardContent className="p-6">
                                    <Label className="text-base font-medium mb-4 block">
                                        Do you have any of these warning signs? (Select all that apply)
                                    </Label>
                                    <div className="space-y-3">
                                        {RED_FLAG_OPTIONS.map((flag) => (
                                            <Card
                                                key={flag.id}
                                                className={`cursor-pointer transition-all ${
                                                    screening.redFlags.includes(flag.id)
                                                        ? 'border-yellow-500 bg-yellow-100'
                                                        : 'border-gray-200 hover:border-yellow-300'
                                                }`}
                                                onClick={() => toggleRedFlag(flag.id)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-2xl">{flag.emoji}</span>
                                                            <span className="font-medium">{flag.label}</span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                            screening.redFlags.includes(flag.id)
                                                                ? 'border-yellow-500 bg-yellow-500'
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {screening.redFlags.includes(flag.id) && (
                                                                <span className="text-white text-xs">✓</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {screening.redFlags.length > 0 && (
                                        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                                            <p className="text-sm text-red-800 font-medium">
                                                ⚠️ Warning signs detected - we'll prioritize your assessment
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 5: Duration */}
                    {currentStep === 5 && (
                        <div className="space-y-4">
                            <Card className="border-purple-200 bg-purple-50">
                                <CardContent className="p-6">
                                    <Label className="text-base font-medium mb-4 block">
                                        How long have you been experiencing this? *
                                    </Label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'ACUTE', label: 'Less than 6 weeks', desc: 'Recent onset' },
                                            { value: 'SUBACUTE', label: '6-12 weeks', desc: 'Ongoing for a while' },
                                            { value: 'CHRONIC', label: 'More than 3 months', desc: 'Long-term condition' }
                                        ].map((option) => (
                                            <Card
                                                key={option.value}
                                                className={`cursor-pointer transition-all ${
                                                    screening.symptomDuration === option.value
                                                        ? 'border-purple-500 bg-purple-100'
                                                        : 'border-gray-200 hover:border-purple-300'
                                                }`}
                                                onClick={() => updateScreening('symptomDuration', option.value)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">{option.label}</div>
                                                            <div className="text-sm text-gray-600">{option.desc}</div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 ${
                                                            screening.symptomDuration === option.value
                                                                ? 'border-purple-500 bg-purple-500'
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {screening.symptomDuration === option.value && (
                                                                <div className="w-full h-full rounded-full bg-white scale-50" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 6: Functional Impact */}
                    {currentStep === 6 && (
                        <div className="space-y-4">
                            <Card className="border-indigo-200 bg-indigo-50">
                                <CardContent className="p-6">
                                    <Label className="text-base font-medium mb-4 block">
                                        How much is this affecting your daily activities? *
                                    </Label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'NONE', label: 'No limitations', desc: 'I can do everything normally' },
                                            { value: 'MILD', label: 'Mild limitations', desc: 'Some difficulty with demanding activities' },
                                            { value: 'MODERATE', label: 'Moderate limitations', desc: 'Difficulty with daily activities' },
                                            { value: 'SEVERE', label: 'Severe limitations', desc: 'Major limitations in most activities' }
                                        ].map((option) => (
                                            <Card
                                                key={option.value}
                                                className={`cursor-pointer transition-all ${
                                                    screening.functionalImpact === option.value
                                                        ? 'border-indigo-500 bg-indigo-100'
                                                        : 'border-gray-200 hover:border-indigo-300'
                                                }`}
                                                onClick={() => updateScreening('functionalImpact', option.value)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">{option.label}</div>
                                                            <div className="text-sm text-gray-600">{option.desc}</div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 ${
                                                            screening.functionalImpact === option.value
                                                                ? 'border-indigo-500 bg-indigo-500'
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {screening.functionalImpact === option.value && (
                                                                <div className="w-full h-full rounded-full bg-white scale-50" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 7: Condition Recommendations & Search */}
                    {currentStep === 7 && (
                        <div className="space-y-6">
                            {/* Patient Summary */}
                            <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-blue-50">
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-2 mb-6">
                                        <Stethoscope className="w-6 h-6 text-teal-600" />
                                        <h3 className="text-xl font-bold text-gray-900">Your Assessment Summary</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Primary Concern */}
                                        <div className="bg-white rounded-lg p-4 border border-teal-100">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Brain className="w-4 h-4 text-blue-600" />
                                                <span className="font-medium text-gray-900">Primary Concern</span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">{screening.chiefComplaint}</p>
                                        </div>

                                        {/* Location & Pain */}
                                        <div className="bg-white rounded-lg p-4 border border-teal-100">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <MapPin className="w-4 h-4 text-green-600" />
                                                <span className="font-medium text-gray-900">Location & Severity</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-700">{screening.painLocation}</p>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-gray-500">Pain Level:</span>
                                                    <Badge variant={screening.painLevel >= 7 ? 'destructive' : screening.painLevel >= 4 ? 'secondary' : 'outline'}>
                                                        {screening.painLevel}/10
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duration & Impact */}
                                        <div className="bg-white rounded-lg p-4 border border-teal-100">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Activity className="w-4 h-4 text-purple-600" />
                                                <span className="font-medium text-gray-900">Timeline & Impact</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-700">
                                                    Duration: <span className="font-medium">{
                                                        screening.symptomDuration === 'ACUTE' ? 'Less than 6 weeks' :
                                                        screening.symptomDuration === 'SUBACUTE' ? '6-12 weeks' :
                                                        screening.symptomDuration === 'CHRONIC' ? 'More than 3 months' : 'Not specified'
                                                    }</span>
                                                </p>
                                                <p className="text-sm text-gray-700">
                                                    Impact: <span className="font-medium">{
                                                        screening.functionalImpact === 'NONE' ? 'No limitations' :
                                                        screening.functionalImpact === 'MILD' ? 'Mild limitations' :
                                                        screening.functionalImpact === 'MODERATE' ? 'Moderate limitations' :
                                                        screening.functionalImpact === 'SEVERE' ? 'Severe limitations' : 'Not specified'
                                                    }</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Safety Assessment */}
                                        <div className="bg-white rounded-lg p-4 border border-teal-100">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <AlertTriangle className={`w-4 h-4 ${screening.redFlags.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
                                                <span className="font-medium text-gray-900">Safety Check</span>
                                            </div>
                                            {screening.redFlags.length > 0 ? (
                                                <div className="space-y-1">
                                                    <Badge variant="destructive" className="text-xs">
                                                        {screening.redFlags.length} warning sign{screening.redFlags.length > 1 ? 's' : ''} detected
                                                    </Badge>
                                                    <p className="text-xs text-red-700">Requires priority assessment</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                                        No warning signs
                                                    </Badge>
                                                    <p className="text-xs text-green-700">Safe for standard assessment</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recommended Conditions */}
                                    <div className="bg-white rounded-lg p-4 border border-teal-100">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Target className="w-4 h-4 text-teal-600" />
                                            <span className="font-medium text-gray-900">AI-Recommended Conditions</span>
                                        </div>
                                        
                                        {screening.recommendedConditions.length > 0 ? (
                                            <div className="space-y-2">
                                                {screening.recommendedConditions.map((condition) => (
                                                    <Card
                                                        key={condition.condition_id}
                                                        className={`cursor-pointer transition-all ${
                                                            screening.selectedCondition?.condition_id === condition.condition_id
                                                                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                                                                : 'border-gray-200 hover:border-teal-300'
                                                        }`}
                                                        onClick={() => updateScreening('selectedCondition', condition)}
                                                    >
                                                        <CardContent className="p-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                        <h4 className="font-semibold text-gray-900 text-sm">{condition.condition_name}</h4>
                                                                        <Badge className="bg-green-100 text-green-800 text-xs">AI Match</Badge>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 mt-1">{condition.description}</p>
                                                                    <div className="flex space-x-1 mt-2">
                                                                        <Badge variant="outline" className="text-xs px-1 py-0">{condition.body_region}</Badge>
                                                                        <Badge variant="outline" className="text-xs px-1 py-0">{condition.category}</Badge>
                                                                    </div>
                                                                </div>
                                                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-3 ${
                                                                    screening.selectedCondition?.condition_id === condition.condition_id
                                                                        ? 'border-teal-500 bg-teal-500'
                                                                        : 'border-gray-300'
                                                                }`}>
                                                                    {screening.selectedCondition?.condition_id === condition.condition_id && (
                                                                        <div className="w-full h-full rounded-full bg-white scale-50" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Finding the best matches for your symptoms...</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Manual Search */}
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Search className="w-5 h-5 text-blue-600" />
                                        <Label className="text-base font-medium">
                                            Or Search for a Specific Condition
                                        </Label>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                type="text"
                                                placeholder="Type condition name (e.g., 'shoulder pain', 'knee injury')..."
                                                value={screening.conditionSearchTerm}
                                                onChange={(e) => handleConditionSearch(e.target.value)}
                                                className="pl-10 pr-10 border-blue-300 focus:border-blue-500"
                                            />
                                            {screening.searchingConditions && (
                                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                                            )}
                                        </div>
                                        
                                        {/* Quick search suggestions */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs text-gray-500">Quick search:</span>
                                            {['Adhesive', 'Frozen', 'Shoulder', 'Back', 'Knee', 'Neck', 'Tennis Elbow', 'Carpal'].map((suggestion) => (
                                                <Button
                                                    key={suggestion}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 text-xs px-2 py-0 hover:bg-blue-100"
                                                    onClick={() => {
                                                        updateScreening('conditionSearchTerm', suggestion)
                                                        searchConditions(suggestion)
                                                    }}
                                                >
                                                    {suggestion}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Search Results */}
                                    {screening.conditionSearchTerm && (
                                        <div className="mt-4">
                                            {screening.searchingConditions ? (
                                                <div className="text-center py-4">
                                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-600">Searching conditions...</p>
                                                </div>
                                            ) : screening.searchedConditions.length > 0 ? (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700 mb-3">
                                                        Found {screening.searchedConditions.length} matching condition(s):
                                                    </p>
                                                    {screening.searchedConditions.map((condition) => (
                                                        <Card
                                                            key={condition.condition_id}
                                                            className={`cursor-pointer transition-all ${
                                                                screening.selectedCondition?.condition_id === condition.condition_id
                                                                    ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-200'
                                                                    : 'border-gray-200 hover:border-blue-300'
                                                            }`}
                                                            onClick={() => updateScreening('selectedCondition', condition)}
                                                        >
                                                            <CardContent className="p-3">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center space-x-2 mb-1">
                                                                            <h5 className="font-medium text-gray-900 text-sm">{condition.condition_name}</h5>
                                                                            <Badge className="bg-green-100 text-green-800 text-xs">Local Data</Badge>
                                                                        </div>
                                                                        <p className="text-xs text-gray-600">{condition.description}</p>
                                                                        <div className="flex space-x-1 mt-1">
                                                                            <Badge variant="outline" className="text-xs px-1 py-0">{condition.body_region}</Badge>
                                                                            <Badge variant="outline" className="text-xs px-1 py-0">{condition.category}</Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-2 ${
                                                                        screening.selectedCondition?.condition_id === condition.condition_id
                                                                            ? 'border-blue-500 bg-blue-500'
                                                                            : 'border-gray-300'
                                                                    }`}>
                                                                        {screening.selectedCondition?.condition_id === condition.condition_id && (
                                                                            <div className="w-full h-full rounded-full bg-white scale-50" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-sm text-gray-500">No conditions found matching "{screening.conditionSearchTerm}"</p>
                                                    <p className="text-xs text-gray-400 mt-1">Try different keywords or check the recommended conditions above</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                        </div>
                    )}

                    {/* Step 8: Goals and Finalization */}
                    {currentStep === 8 && (
                        <div className="space-y-4">
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="p-6">
                                    <Label htmlFor="primary-goal" className="text-base font-medium block mb-4">
                                        What's your main goal for treatment? *
                                    </Label>
                                    <Textarea
                                        id="primary-goal"
                                        placeholder="e.g., 'Get back to running pain-free' or 'Be able to lift my kids without pain'"
                                        value={screening.primaryGoal}
                                        onChange={(e) => updateScreening('primaryGoal', e.target.value)}
                                        rows={3}
                                        className="border-blue-300 focus:border-blue-500"
                                    />
                                    
                                    <div className="mt-6">
                                        <Label className="text-base font-medium block mb-3">
                                            How urgent is this treatment?
                                        </Label>
                                        <Select 
                                            value={screening.urgencyLevel} 
                                            onValueChange={(value) => updateScreening('urgencyLevel', value)}
                                        >
                                            <SelectTrigger className="border-blue-300">
                                                <SelectValue placeholder="Select urgency level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ROUTINE">Routine - Can wait for normal scheduling</SelectItem>
                                                <SelectItem value="URGENT">Urgent - Need to be seen soon</SelectItem>
                                                <SelectItem value="EMERGENT">Emergent - Need immediate attention</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="mt-6">
                                        <Label htmlFor="additional-notes" className="text-base font-medium block mb-3">
                                            Anything else we should know? (Optional)
                                        </Label>
                                        <Textarea
                                            id="additional-notes"
                                            placeholder="Any additional information about your condition..."
                                            value={screening.additionalNotes}
                                            onChange={(e) => updateScreening('additionalNotes', e.target.value)}
                                            rows={3}
                                            className="border-blue-300 focus:border-blue-500"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Summary */}
                            <Card className="border-green-200 bg-green-50">
                                <CardHeader>
                                    <CardTitle className="text-lg text-green-800">Assessment Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p><strong>Condition:</strong> {screening.selectedCondition?.condition_name}</p>
                                    <p><strong>Location:</strong> {screening.painLocation}</p>
                                    <p><strong>Pain Level:</strong> {screening.painLevel}/10</p>
                                    <p><strong>Duration:</strong> {screening.symptomDuration}</p>
                                    <p><strong>Impact:</strong> {screening.functionalImpact}</p>
                                    {screening.redFlags.length > 0 && (
                                        <p><strong>Warning Signs:</strong> {screening.redFlags.length} detected</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Button>
                    
                    <div className="flex space-x-2">
                        {currentStep < 8 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
                            >
                                <span>Continue</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !canProceed()}
                                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                            >
                                {loading ? 'Creating Assessment...' : 'Complete Assessment'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SmartScreeningModal