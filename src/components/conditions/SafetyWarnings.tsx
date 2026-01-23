'use client'

import React, { useState } from 'react'
import { AlertTriangle, Shield, Users, ChevronDown, ChevronUp, FileWarning } from 'lucide-react'
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
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    redFlags: false,
    contraindications: false,
    yellowFlags: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

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

  // Count warnings for summary
  const warningCounts = {
    redFlags: redFlagsList.length,
    contraindications: contraindicationsList.length,
    yellowFlags: yellowFlagsList.length,
    total: redFlagsList.length + contraindicationsList.length + yellowFlagsList.length
  }

  if (!hasAnyWarnings) {
    return null // No safety indicators needed
  }

  return (
    <div className="flex items-center gap-1 mb-2">
      {/* Critical Safety Icon */}
      {redFlagsList.length > 0 && (
        <div 
          className="group relative cursor-help"
          title="Critical safety alerts - click for details"
        >
          <button
            onClick={() => toggleSection('redFlags')}
            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
          </button>
          
          {expandedSections.redFlags && (
            <div className="absolute top-7 left-0 z-10 bg-white border border-red-200 rounded-lg shadow-lg p-3 min-w-72">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800 text-sm">Critical Safety Alerts</span>
                </div>
                <div className="text-xs text-red-700 mb-2">
                  {planType === 'home' 
                    ? 'Stop all exercises. Contact healthcare provider immediately.'
                    : 'Refer for urgent medical assessment. Do not proceed with treatment.'
                  }
                </div>
                <div className="space-y-1">
                  {redFlagsList.map((flag, index) => (
                    <div key={index} className="text-xs text-red-700">• {flag}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Precaution Icon */}
      {contraindicationsList.length > 0 && (
        <div 
          className="group relative cursor-help"
          title="Treatment precautions - click for details"
        >
          <button
            onClick={() => toggleSection('contraindications')}
            className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
          >
            <Shield className="w-3 h-3" />
          </button>
          
          {expandedSections.contraindications && (
            <div className="absolute top-7 left-0 z-10 bg-white border border-orange-200 rounded-lg shadow-lg p-3 min-w-72">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800 text-sm">Treatment Precautions</span>
                </div>
                <div className="text-xs text-orange-700 mb-2">
                  Protocol modified to exclude contraindicated interventions.
                </div>
                <div className="space-y-1">
                  {contraindicationsList.map((contraindication, index) => (
                    <div key={index} className="text-xs text-orange-700">• {contraindication}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Psychosocial Icon */}
      {yellowFlagsList.length > 0 && (
        <div 
          className="group relative cursor-help"
          title="Psychosocial considerations - click for details"
        >
          <button
            onClick={() => toggleSection('yellowFlags')}
            className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors"
          >
            <Users className="w-3 h-3" />
          </button>
          
          {expandedSections.yellowFlags && (
            <div className="absolute top-7 left-0 z-10 bg-white border border-yellow-200 rounded-lg shadow-lg p-3 min-w-72">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 text-sm">Psychosocial Considerations</span>
                </div>
                <div className="text-xs text-yellow-700 mb-2">
                  {planType === 'home' 
                    ? 'Discuss concerns with your therapist. Psychological support may help.'
                    : 'Address psychosocial barriers. Consider psychology referral if needed.'
                  }
                </div>
                <div className="space-y-1">
                  {yellowFlagsList.map((flag, index) => (
                    <div key={index} className="text-xs text-yellow-700">• {flag}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SafetyWarnings