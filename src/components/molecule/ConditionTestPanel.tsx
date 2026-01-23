'use client'

import React, { useState, useEffect } from 'react'
import { Search, Database, Activity } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import localConditionService from '../../services/localConditionService'
import type { Neo4jConditionResponseDto } from '../../lib/types'

export const ConditionTestPanel: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Neo4jConditionResponseDto[]>([])
    const [stats, setStats] = useState<any>({})
    const [recommendations, setRecommendations] = useState<Neo4jConditionResponseDto[]>([])

    useEffect(() => {
        // Load initial stats
        const serviceStats = localConditionService.getStats()
        setStats(serviceStats)
        console.log('Local Condition Service Stats:', serviceStats)

        // Test recommendations for shoulder pain
        const shoulderRecommendations = localConditionService.getRecommendedConditions({
            bodyRegion: 'shoulder',
            painLevel: 7,
            symptomDuration: 'CHRONIC',
            functionalImpact: 'MODERATE'
        })
        setRecommendations(shoulderRecommendations)
    }, [])

    const handleSearch = (term: string) => {
        setSearchTerm(term)
        if (term.trim()) {
            const results = localConditionService.searchConditions(term, 10)
            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }

    const testQuickSearch = (term: string) => {
        setSearchTerm(term)
        handleSearch(term)
    }

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Database className="w-5 h-5" />
                        <span>Local Ontology Data Test Panel</span>
                    </CardTitle>
                    <CardDescription>
                        Testing local condition knowledge base integration
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{stats.totalConditions}</div>
                            <div className="text-sm text-blue-800">Total Conditions</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{stats.bodyRegions}</div>
                            <div className="text-sm text-green-800">Body Regions</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
                            <div className="text-sm text-purple-800">Categories</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">✅</div>
                            <div className="text-sm text-orange-800">Data Loaded</div>
                        </div>
                    </div>

                    {/* Search Test */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                            <Search className="w-5 h-5" />
                            <span>Search Test</span>
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search conditions (e.g., shoulder, back, knee)..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-600">Quick tests:</span>
                                {['shoulder', 'back pain', 'knee', 'frozen', 'adhesive'].map(term => (
                                    <Button
                                        key={term}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => testQuickSearch(term)}
                                        className="text-xs"
                                    >
                                        {term}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <h4 className="font-medium">Found {searchResults.length} condition(s):</h4>
                                {searchResults.map(condition => (
                                    <Card key={condition.condition_id} className="border-blue-200">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="font-medium">{condition.condition_name}</h5>
                                                    <p className="text-sm text-gray-600">{condition.description}</p>
                                                    <div className="flex space-x-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {condition.body_region}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {condition.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Badge className="bg-green-100 text-green-800 text-xs">
                                                    Local
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AI Recommendations Test */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                            <Activity className="w-5 h-5" />
                            <span>AI Recommendations Test (Shoulder Pain)</span>
                        </h3>
                        
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700">
                                <strong>Test Scenario:</strong> Patient with shoulder pain, level 7/10, chronic duration, moderate functional impact
                            </p>
                        </div>

                        {recommendations.length > 0 ? (
                            <div className="space-y-2">
                                {recommendations.map(condition => (
                                    <Card key={condition.condition_id} className="border-orange-200">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h5 className="font-medium">{condition.condition_name}</h5>
                                                    <p className="text-sm text-gray-600">{condition.description}</p>
                                                    <div className="flex space-x-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {condition.body_region}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {condition.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                                    AI Match
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No recommendations generated</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ConditionTestPanel