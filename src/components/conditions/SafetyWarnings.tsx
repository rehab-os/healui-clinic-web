'use client'

import React, { useState } from 'react'
import { AlertTriangle, Shield, Info, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface SafetyWarningsProps {
  redFlags?: any
  contraindications?: any
  yellowFlags?: string[]
  planType: 'home' | 'clinical'
}

const SafetyWarnings: React.FC<SafetyWarningsProps> = ({
  redFlags,
  contraindications,
  yellowFlags,
  planType
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  // Debug logging for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SafetyWarnings - Raw data:', { redFlags, contraindications, yellowFlags })
    }
  }, [redFlags, contraindications, yellowFlags])

  // Parse red flags - handle complex objects
  const redFlagsList = React.useMemo(() => {
    if (!redFlags) return []
    
    if (Array.isArray(redFlags)) {
      return redFlags.map(flag => 
        typeof flag === 'string' ? flag : 
        typeof flag === 'object' ? (flag.name || flag.flag || flag.description || JSON.stringify(flag)) : 
        String(flag)
      )
    }
    
    if (typeof redFlags === 'object') {
      return Object.values(redFlags)
        .filter(Boolean)
        .map(flag => 
          typeof flag === 'string' ? flag : 
          typeof flag === 'object' ? (flag.name || flag.flag || flag.description || flag.action || JSON.stringify(flag)) : 
          String(flag)
        )
    }
    
    return [String(redFlags)]
  }, [redFlags])

  // Parse contraindications - handle complex objects
  const contraindicationsList = React.useMemo(() => {
    if (!contraindications) return []
    
    if (Array.isArray(contraindications)) {
      return contraindications.map(item => 
        typeof item === 'string' ? item : 
        typeof item === 'object' ? (item.name || item.intervention || item.description || JSON.stringify(item)) : 
        String(item)
      )
    }
    
    if (typeof contraindications === 'object') {
      return Object.values(contraindications)
        .filter(Boolean)
        .map(item => 
          typeof item === 'string' ? item : 
          typeof item === 'object' ? (item.name || item.intervention || item.description || JSON.stringify(item)) : 
          String(item)
        )
    }
    
    return [String(contraindications)]
  }, [contraindications])

  // Parse yellow flags - handle complex objects
  const yellowFlagsList = React.useMemo(() => {
    if (!yellowFlags) return []
    
    if (Array.isArray(yellowFlags)) {
      return yellowFlags.map(flag => 
        typeof flag === 'string' ? flag : 
        typeof flag === 'object' ? (flag.name || flag.description || flag.factor || JSON.stringify(flag)) : 
        String(flag)
      )
    }
    
    if (typeof yellowFlags === 'object') {
      return Object.values(yellowFlags)
        .filter(Boolean)
        .map(flag => 
          typeof flag === 'string' ? flag : 
          typeof flag === 'object' ? (flag.name || flag.description || flag.factor || JSON.stringify(flag)) : 
          String(flag)
        )
    }
    
    return [String(yellowFlags)]
  }, [yellowFlags])

  // Check if we have any safety data to display
  const hasAnyWarnings = redFlagsList.length > 0 || contraindicationsList.length > 0 || yellowFlagsList.length > 0

  if (!hasAnyWarnings) {
    return (
      <Card className="border-green-200 bg-green-50">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Safety Assessment</h4>
            <Badge className="bg-green-100 text-green-800 text-xs">CLEAR</Badge>
          </div>
          <p className="text-green-700 text-sm mt-2">
            No red flags or contraindications identified for this condition.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Red Flags - Highest Priority */}
      {redFlagsList.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-800">Red Flags</h4>
                <Badge className="bg-red-100 text-red-800 text-xs">URGENT</Badge>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            
            <p className="text-red-700 text-sm mt-2 font-medium">
              Immediate medical evaluation required before treatment
            </p>
            
            {isExpanded && (
              <div className="mt-3 space-y-3">
                {redFlags && Array.isArray(redFlags) ? 
                  redFlags.map((flagObj, index) => (
                    <div key={index} className="border border-red-200 bg-red-100 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                        <div className="flex-1">
                          <div className="font-medium text-red-900">
                            {typeof flagObj === 'object' ? (flagObj.name || flagObj.flag || 'Red Flag') : String(flagObj)}
                          </div>
                          {typeof flagObj === 'object' && flagObj.action && (
                            <div className="text-sm text-red-700 mt-1">
                              <strong>Action:</strong> {flagObj.action}
                            </div>
                          )}
                          {typeof flagObj === 'object' && flagObj.rationale && (
                            <div className="text-sm text-red-700 mt-1">
                              <strong>Rationale:</strong> {flagObj.rationale}
                            </div>
                          )}
                          {typeof flagObj === 'object' && flagObj.urgency && (
                            <div className="text-xs text-red-600 mt-1">
                              <span className="bg-red-200 px-2 py-1 rounded">Urgency: {flagObj.urgency}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) :
                  redFlagsList.map((flag, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                      <span className="text-red-800">{flag}</span>
                    </div>
                  ))
                }
                
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">
                    {planType === 'home' ? '🏠 Patient Action:' : '🏥 Clinical Action:'}
                  </p>
                  <p className="text-red-700 text-xs mt-1">
                    {planType === 'home' 
                      ? 'Stop exercises immediately and contact your healthcare provider or emergency services if symptoms worsen.'
                      : 'Refer for immediate medical evaluation. Do not proceed with physiotherapy until medical clearance obtained.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Contraindications - High Priority */}
      {contraindicationsList.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-orange-800">Contraindications</h4>
                <Badge className="bg-orange-100 text-orange-800 text-xs">CAUTION</Badge>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-orange-600 hover:text-orange-800 transition-colors"
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <p className="text-orange-700 text-sm mt-2">
              Certain treatments or exercises should be avoided
            </p>
            
            {showDetails && (
              <div className="mt-3 space-y-3">
                {contraindications && Array.isArray(contraindications) ? 
                  contraindications.map((contraindicationObj, index) => (
                    <div key={index} className="border border-orange-200 bg-orange-100 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                        <div className="flex-1">
                          <div className="font-medium text-orange-900">
                            {typeof contraindicationObj === 'object' ? 
                              (contraindicationObj.name || contraindicationObj.intervention || contraindicationObj.description || 'Contraindication') : 
                              String(contraindicationObj)
                            }
                          </div>
                          {typeof contraindicationObj === 'object' && contraindicationObj.reason && (
                            <div className="text-sm text-orange-700 mt-1">
                              <strong>Reason:</strong> {contraindicationObj.reason}
                            </div>
                          )}
                          {typeof contraindicationObj === 'object' && contraindicationObj.alternatives && (
                            <div className="text-sm text-orange-700 mt-1">
                              <strong>Alternatives:</strong> {Array.isArray(contraindicationObj.alternatives) ? 
                                contraindicationObj.alternatives.join(', ') : 
                                contraindicationObj.alternatives
                              }
                            </div>
                          )}
                          {typeof contraindicationObj === 'object' && contraindicationObj.severity && (
                            <div className="text-xs text-orange-600 mt-1">
                              <span className="bg-orange-200 px-2 py-1 rounded">Severity: {contraindicationObj.severity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )) :
                  contraindicationsList.map((contraindication, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                      <span className="text-orange-800">{contraindication}</span>
                    </div>
                  ))
                }
                
                <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                  <p className="text-orange-800 text-sm font-medium">
                    📋 Treatment Modifications:
                  </p>
                  <p className="text-orange-700 text-xs mt-1">
                    The protocol has been adjusted to avoid contraindicated treatments. Alternative approaches have been selected.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Yellow Flags - Patient Education */}
      {yellowFlagsList.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Yellow Flags</h4>
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">EDUCATION</Badge>
            </div>
            
            <p className="text-yellow-700 text-sm mt-2">
              Psychosocial factors to be aware of during recovery
            </p>
            
            <div className="mt-3 space-y-3">
              {yellowFlags && Array.isArray(yellowFlags) ? 
                yellowFlags.map((flagObj, index) => (
                  <div key={index} className="border border-yellow-200 bg-yellow-100 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-yellow-900">
                          {typeof flagObj === 'object' ? 
                            (flagObj.name || flagObj.factor || flagObj.description || 'Yellow Flag') : 
                            String(flagObj)
                          }
                        </div>
                        {typeof flagObj === 'object' && flagObj.description && flagObj.description !== (flagObj.name || flagObj.factor) && (
                          <div className="text-sm text-yellow-700 mt-1">
                            {flagObj.description}
                          </div>
                        )}
                        {typeof flagObj === 'object' && flagObj.impact && (
                          <div className="text-sm text-yellow-700 mt-1">
                            <strong>Impact:</strong> {flagObj.impact}
                          </div>
                        )}
                        {typeof flagObj === 'object' && flagObj.management && (
                          <div className="text-sm text-yellow-700 mt-1">
                            <strong>Management:</strong> {flagObj.management}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) :
                yellowFlagsList.map((flag, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 shrink-0"></div>
                    <span className="text-yellow-800">{flag}</span>
                  </div>
                ))
              }
              
              <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  {planType === 'home' ? '🧠 Patient Support:' : '💭 Clinical Considerations:'}
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  {planType === 'home' 
                    ? 'Discuss any concerns with your therapist. Mental health support may be beneficial for optimal recovery.'
                    : 'Address psychosocial factors in treatment planning. Consider referral to psychology/counseling if needed.'
                  }
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SafetyWarnings