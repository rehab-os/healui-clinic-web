'use client'

import React from 'react'
import { Target, Zap, Heart, Clock, CheckCircle } from 'lucide-react'
import { Card } from '../ui/card'
import { ProtocolPreferences } from '../../types/protocol-generator.types'

interface ProtocolConfigurationStepProps {
  preferences: ProtocolPreferences
  onPreferencesChange: (preferences: ProtocolPreferences) => void
  planType: 'home' | 'clinic'
}

const ProtocolConfigurationStep: React.FC<ProtocolConfigurationStepProps> = ({
  preferences,
  onPreferencesChange,
  planType
}) => {
  const updatePreferences = (updates: Partial<ProtocolPreferences>) => {
    onPreferencesChange({ ...preferences, ...updates })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Primary Treatment Focus */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-healui-primary" />
          <h4 className="text-sm font-semibold text-gray-900">Primary Treatment Focus</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { 
              value: 'pain_relief', 
              label: 'Pain Relief', 
              subtitle: 'Symptom management',
              gradient: 'from-red-500 to-pink-500'
            },
            { 
              value: 'function', 
              label: 'Function', 
              subtitle: 'Restore movement',
              gradient: 'from-blue-500 to-indigo-500'
            },
            { 
              value: 'performance', 
              label: 'Performance', 
              subtitle: 'Athletic enhancement',
              gradient: 'from-green-500 to-emerald-500'
            }
          ].map(focus => (
            <button
              key={focus.value}
              onClick={() => updatePreferences({ primaryFocus: focus.value as any })}
              className={`relative p-3 rounded-lg transition-all duration-200 text-left hover:shadow-sm ${
                preferences.primaryFocus === focus.value
                  ? 'bg-healui-primary/10 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-r ${focus.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Target className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm">{focus.label}</div>
                  <div className="text-xs text-gray-500">{focus.subtitle}</div>
                </div>
                {preferences.primaryFocus === focus.value && (
                  <CheckCircle className="w-4 h-4 text-healui-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Progression Approach */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-healui-primary" />
          <h4 className="text-sm font-semibold text-gray-900">Progression Approach</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { 
              value: 'conservative', 
              label: 'Conservative', 
              subtitle: 'Cautious progression',
              color: 'text-blue-600',
              bg: 'bg-blue-50 border-blue-200'
            },
            { 
              value: 'standard', 
              label: 'Standard', 
              subtitle: 'Evidence-based',
              color: 'text-green-600',
              bg: 'bg-green-50 border-green-200'
            },
            { 
              value: 'aggressive', 
              label: 'Aggressive', 
              subtitle: 'Accelerated recovery',
              color: 'text-orange-600',
              bg: 'bg-orange-50 border-orange-200'
            }
          ].map(approach => (
            <button
              key={approach.value}
              onClick={() => updatePreferences({ progressionApproach: approach.value as any })}
              className={`relative p-3 rounded-lg transition-all duration-200 text-left hover:shadow-sm ${
                preferences.progressionApproach === approach.value
                  ? 'bg-healui-primary/10 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md ${preferences.progressionApproach === approach.value ? approach.bg : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                  <Zap className={`w-3 h-3 ${preferences.progressionApproach === approach.value ? approach.color : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm">{approach.label}</div>
                  <div className="text-xs text-gray-500">{approach.subtitle}</div>
                </div>
                {preferences.progressionApproach === approach.value && (
                  <CheckCircle className="w-4 h-4 text-healui-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Patient Engagement */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-healui-primary" />
          <h4 className="text-sm font-semibold text-gray-900">Patient Engagement Level</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { 
              value: 'high_motivation', 
              label: 'High Motivation', 
              subtitle: 'Self-driven',
              gradient: 'from-orange-500 to-red-500'
            },
            { 
              value: 'moderate', 
              label: 'Moderate', 
              subtitle: 'Standard engagement',
              gradient: 'from-blue-500 to-purple-500'
            },
            { 
              value: 'needs_simple', 
              label: 'Needs Simple', 
              subtitle: 'Keep it basic',
              gradient: 'from-green-500 to-teal-500'
            }
          ].map(engagement => (
            <button
              key={engagement.value}
              onClick={() => updatePreferences({ patientEngagement: engagement.value as any })}
              className={`relative p-3 rounded-lg transition-all duration-200 text-left hover:shadow-sm ${
                preferences.patientEngagement === engagement.value
                  ? 'bg-healui-primary/10 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-r ${engagement.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Heart className="w-3 h-3 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm">{engagement.label}</div>
                  <div className="text-xs text-gray-500">{engagement.subtitle}</div>
                </div>
                {preferences.patientEngagement === engagement.value && (
                  <CheckCircle className="w-4 h-4 text-healui-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Program Duration */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-healui-primary" />
          <h4 className="text-sm font-semibold text-gray-900">Program Duration</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { 
              value: 4, 
              label: '4 weeks', 
              subtitle: 'Acute/Short-term',
              color: 'text-orange-600',
              bg: 'bg-orange-50 border-orange-200'
            },
            { 
              value: 6, 
              label: '6 weeks', 
              subtitle: 'Standard',
              color: 'text-blue-600',
              bg: 'bg-blue-50 border-blue-200'
            },
            { 
              value: 8, 
              label: '8 weeks', 
              subtitle: 'Extended',
              color: 'text-purple-600',
              bg: 'bg-purple-50 border-purple-200'
            },
            { 
              value: 12, 
              label: '12 weeks', 
              subtitle: 'Comprehensive',
              color: 'text-green-600',
              bg: 'bg-green-50 border-green-200'
            }
          ].map(duration => (
            <button
              key={duration.value}
              onClick={() => updatePreferences({ programDuration: duration.value as any })}
              className={`relative p-2 rounded-lg transition-all duration-200 text-left hover:shadow-sm ${
                preferences.programDuration === duration.value
                  ? 'bg-healui-primary/10 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md ${preferences.programDuration === duration.value ? duration.bg : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                  <Clock className={`w-2.5 h-2.5 ${preferences.programDuration === duration.value ? duration.color : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm">{duration.label}</div>
                  <div className="text-xs text-gray-500">{duration.subtitle}</div>
                </div>
                {preferences.programDuration === duration.value && (
                  <CheckCircle className="w-3.5 h-3.5 text-healui-primary flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Summary */}
      <Card className="bg-healui-primary/5 border-healui-primary/20">
        <div className="p-4">
          <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 text-healui-primary mr-2" />
            Configuration Summary
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Setting</div>
              <div className="font-medium capitalize">{planType}</div>
            </div>
            <div>
              <div className="text-gray-600">Focus</div>
              <div className="font-medium capitalize">{preferences.primaryFocus?.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-gray-600">Progression</div>
              <div className="font-medium capitalize">{preferences.progressionApproach}</div>
            </div>
            <div>
              <div className="text-gray-600">Duration</div>
              <div className="font-medium">{preferences.programDuration} weeks</div>
            </div>
          </div>
          
          {preferences.patientEngagement && (
            <div className="mt-3 pt-3 border-t border-healui-primary/20">
              <div className="text-gray-600 text-sm">Patient Engagement</div>
              <div className="font-medium text-sm capitalize">{preferences.patientEngagement?.replace('_', ' ')}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ProtocolConfigurationStep