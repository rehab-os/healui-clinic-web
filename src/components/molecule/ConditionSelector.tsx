'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, Plus, X, ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import ApiManager from '../../services/api'
import localConditionService from '../../services/localConditionService'
import type {
    Neo4jConditionResponseDto,
    PatientConditionResponseDto,
    ConditionType,
    ConditionStatus
} from '../../lib/types'

interface ConditionSelectorProps {
    // Optional patient ID to exclude already assigned conditions
    patientId?: string
    // Selected conditions (for controlled component)
    selectedConditions?: Neo4jConditionResponseDto[]
    // Callback when conditions are selected
    onConditionsChange?: (conditions: Neo4jConditionResponseDto[]) => void
    // Allow multiple selection (default: true)
    multiple?: boolean
    // Body region filter
    bodyRegionFilter?: string
    // Show search functionality
    showSearch?: boolean
    // Show body region filter
    showBodyRegionFilter?: boolean
    // Placeholder text
    placeholder?: string
    // Disabled state
    disabled?: boolean
    // Custom styling
    className?: string
    // Exclude specific condition IDs (e.g., already in visit)
    excludeConditionIds?: string[]
}

interface ConditionWithDetails extends Neo4jConditionResponseDto {
    isAlreadyAssigned?: boolean
    assignedCondition?: PatientConditionResponseDto
    isExcluded?: boolean
}

const BODY_REGIONS = [
    { value: 'all', label: 'All Regions' },
    { value: 'head', label: 'Head & Neck' },
    { value: 'neck', label: 'Neck' },
    { value: 'shoulder', label: 'Shoulder' },
    { value: 'arm', label: 'Arm' },
    { value: 'elbow', label: 'Elbow' },
    { value: 'wrist', label: 'Wrist & Hand' },
    { value: 'back', label: 'Back' },
    { value: 'chest', label: 'Chest' },
    { value: 'abdomen', label: 'Abdomen' },
    { value: 'hip', label: 'Hip' },
    { value: 'thigh', label: 'Thigh' },
    { value: 'knee', label: 'Knee' },
    { value: 'leg', label: 'Lower Leg' },
    { value: 'ankle', label: 'Ankle' },
    { value: 'foot', label: 'Foot' },
]

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
    patientId,
    selectedConditions = [],
    onConditionsChange,
    multiple = true,
    bodyRegionFilter,
    showSearch = true,
    showBodyRegionFilter = true,
    placeholder = "Search and select conditions...",
    disabled = false,
    className = "",
    excludeConditionIds = []
}) => {
    // State
    const [availableConditions, setAvailableConditions] = useState<ConditionWithDetails[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedBodyRegion, setSelectedBodyRegion] = useState(bodyRegionFilter && bodyRegionFilter !== '' ? bodyRegionFilter : 'all')
    const [showDropdown, setShowDropdown] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load available conditions
    const loadConditions = async () => {
        setLoading(true)
        setError(null)

        try {
            let conditions: ConditionWithDetails[] = []
            
            console.log('Loading conditions from local conditions.json')
            
            // Use only local ontology data from conditions.json
            if (selectedBodyRegion && selectedBodyRegion !== 'all') {
                conditions = localConditionService.getConditionsByBodyRegion(selectedBodyRegion)
                console.log(`Loaded ${conditions.length} conditions for body region: ${selectedBodyRegion}`)
            } else {
                conditions = localConditionService.getAllConditions()
                console.log(`Loaded ${conditions.length} total conditions from local ontology`)
            }

            // If patient ID provided, mark already assigned conditions
            if (patientId) {
                try {
                    const patientConditionsResponse = await ApiManager.getPatientConditions(patientId)
                    if (patientConditionsResponse.success) {
                        const assignedConditions = patientConditionsResponse.data || []
                        
                        conditions = conditions.map(condition => {
                            const assigned = assignedConditions.find(
                                (pc: PatientConditionResponseDto) => 
                                    pc.neo4j_condition_id === condition.condition_id
                            )
                            const isExcluded = excludeConditionIds.includes(condition.condition_id)
                            return {
                                ...condition,
                                isAlreadyAssigned: !!assigned,
                                assignedCondition: assigned,
                                isExcluded: isExcluded
                            }
                        })
                    }
                } catch (err) {
                    console.warn('Failed to load patient conditions:', err)
                }
            } else if (excludeConditionIds.length > 0) {
                // Just mark excluded conditions even without patient ID
                conditions = conditions.map(condition => ({
                    ...condition,
                    isExcluded: excludeConditionIds.includes(condition.condition_id)
                }))
            }

            setAvailableConditions(conditions)
        } catch (err: any) {
            console.error('Error loading conditions:', err)
            setError(err.message || 'Failed to load conditions')
            setAvailableConditions([])
        } finally {
            setLoading(false)
        }
    }

    // Effects - only reload when body region, patient, or exclude list changes
    useEffect(() => {
        loadConditions()
    }, [selectedBodyRegion, patientId, excludeConditionIds.join(',')])

    // No need for search effect since we filter locally now

    // Filter conditions based on search (only filter locally, don't trigger API calls)
    const filteredConditions = useMemo(() => {
        if (!showSearch) return availableConditions
        if (!searchTerm.trim()) return availableConditions
        
        const searchLower = searchTerm.toLowerCase()
        return availableConditions.filter(condition => {
            return (
                condition.condition_name.toLowerCase().includes(searchLower) ||
                condition.description.toLowerCase().includes(searchLower) ||
                condition.body_region.toLowerCase().includes(searchLower) ||
                condition.category.toLowerCase().includes(searchLower)
            )
        })
    }, [availableConditions, searchTerm, showSearch])

    // Handle condition selection
    const handleConditionSelect = (condition: ConditionWithDetails) => {
        if (disabled || condition.isAlreadyAssigned || condition.isExcluded) return

        let newSelected: Neo4jConditionResponseDto[]

        if (multiple) {
            const isAlreadySelected = selectedConditions.some(
                selected => selected.condition_id === condition.condition_id
            )

            if (isAlreadySelected) {
                newSelected = selectedConditions.filter(
                    selected => selected.condition_id !== condition.condition_id
                )
            } else {
                newSelected = [...selectedConditions, condition]
            }
        } else {
            newSelected = [condition]
            setShowDropdown(false)
        }

        onConditionsChange?.(newSelected)
    }

    // Handle remove selected condition
    const handleRemoveCondition = (conditionId: string) => {
        if (disabled) return

        const newSelected = selectedConditions.filter(
            condition => condition.condition_id !== conditionId
        )
        onConditionsChange?.(newSelected)
    }

    // Get status color for condition
    const getStatusColor = (condition: ConditionWithDetails) => {
        if (condition.isExcluded) {
            return 'bg-orange-100 text-orange-800 border-orange-200'
        }
        if (condition.isAlreadyAssigned) {
            const status = condition.assignedCondition?.status
            switch (status) {
                case 'ACTIVE': return 'bg-red-100 text-red-800 border-red-200'
                case 'IMPROVING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
                case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200'
                default: return 'bg-gray-100 text-gray-800 border-gray-200'
            }
        }
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }

    return (
        <div className={`relative ${className}`}>
            {/* Body Region Filter */}
            {showBodyRegionFilter && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Body Region
                    </label>
                    <Select
                        value={selectedBodyRegion}
                        onValueChange={setSelectedBodyRegion}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select body region..." />
                        </SelectTrigger>
                        <SelectContent>
                            {BODY_REGIONS.map(region => (
                                <SelectItem key={region.value} value={region.value}>
                                    {region.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Selected Conditions Display */}
            {selectedConditions.length > 0 && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Conditions
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {selectedConditions.map(condition => (
                            <Badge
                                key={condition.condition_id}
                                variant="secondary"
                                className="flex items-center gap-1 px-3 py-1"
                            >
                                <span className="text-sm">{condition.condition_name}</span>
                                {!disabled && (
                                    <button
                                        onClick={() => handleRemoveCondition(condition.condition_id)}
                                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                                        type="button"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Input */}
            {showSearch && (
                <div className="relative mb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setShowDropdown(true)}
                            disabled={disabled}
                            className="pl-10 pr-10"
                        />
                        {loading && (
                            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                        )}
                        {!loading && (
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                type="button"
                                disabled={disabled}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add Condition Button (for non-search mode) */}
            {!showSearch && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={disabled}
                    className="w-full justify-between"
                >
                    <span>{placeholder}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </Button>
            )}

            {/* Dropdown with Conditions */}
            {showDropdown && (
                <Card className="absolute top-full left-0 right-0 z-[9999] mt-1 max-h-96 overflow-hidden shadow-lg">
                    <CardContent className="p-0">
                        {loading && (
                            <div className="p-4 space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <Skeleton className="w-4 h-4 rounded" />
                                        <Skeleton className="h-4 flex-1" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="p-4 text-center text-red-600">
                                <p className="text-sm">{error}</p>
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

                        {!loading && !error && filteredConditions.length === 0 && (
                            <div className="p-4 text-center text-gray-500">
                                <p className="text-sm">No conditions found</p>
                                {searchTerm && (
                                    <p className="text-xs mt-1">Try adjusting your search terms</p>
                                )}
                            </div>
                        )}

                        {!loading && !error && filteredConditions.length > 0 && (
                            <div className="max-h-80 overflow-y-auto">
                                {filteredConditions.map(condition => {
                                    const isSelected = selectedConditions.some(
                                        selected => selected.condition_id === condition.condition_id
                                    )

                                    return (
                                        <button
                                            key={condition.condition_id}
                                            type="button"
                                            onClick={() => handleConditionSelect(condition)}
                                            disabled={condition.isAlreadyAssigned || condition.isExcluded}
                                            className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors
                                                ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                                                ${(condition.isAlreadyAssigned || condition.isExcluded) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                                        {condition.condition_name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                        {condition.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs px-2 py-0"
                                                        >
                                                            {condition.body_region}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs px-2 py-0"
                                                        >
                                                            {condition.category}
                                                        </Badge>
                                                        {condition.isExcluded && (
                                                            <Badge
                                                                className={`text-xs px-2 py-0 ${getStatusColor(condition)}`}
                                                            >
                                                                Already in Visit
                                                            </Badge>
                                                        )}
                                                        {condition.isAlreadyAssigned && !condition.isExcluded && (
                                                            <Badge
                                                                className={`text-xs px-2 py-0 ${getStatusColor(condition)}`}
                                                            >
                                                                Already Assigned
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="ml-2 flex-shrink-0">
                                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    )
}

export default ConditionSelector