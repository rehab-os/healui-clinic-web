'use client'

import React from 'react'
import { Clock, Activity, Building2, Home, Users, Zap, Settings, CheckCircle } from 'lucide-react'
import { Card } from '../ui/card'
import { ProtocolPreferences } from '../../types/protocol-generator.types'

interface ProtocolPreferencesStepProps {
  preferences: ProtocolPreferences
  onPreferencesChange: (preferences: ProtocolPreferences) => void
  planTypes: ('home' | 'clinical')[]
}

const ProtocolPreferencesStep: React.FC<ProtocolPreferencesStepProps> = ({
  preferences,
  onPreferencesChange,
  planTypes
}) => {
  const updatePreferences = (updates: Partial<ProtocolPreferences>) => {
    onPreferencesChange({ ...preferences, ...updates })
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Protocol Preferences</h3>
        <p className="text-gray-600">Quick configuration to personalize the treatment protocol.</p>
      </div>
      
      {/* Treatment Duration - Button Grid */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-healui-primary" />
          Treatment Duration
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 4, label: '4 weeks', subtitle: 'Acute/Short-term', description: 'Quick intervention' },
            { value: 6, label: '6 weeks', subtitle: 'Standard', description: 'Most common duration' },
            { value: 8, label: '8 weeks', subtitle: 'Extended', description: 'Complex conditions' },
            { value: 12, label: '12 weeks', subtitle: 'Comprehensive', description: 'Long-term rehabilitation' }
          ].map(duration => (
            <button
              key={duration.value}
              onClick={() => updatePreferences({ duration: duration.value })}
              className={`group p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                preferences.duration === duration.value
                  ? 'border-healui-primary bg-healui-primary/10 shadow-md scale-105'
                  : 'border-gray-200 hover:border-healui-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-gray-900">{duration.label}</div>
                {preferences.duration === duration.value && (
                  <CheckCircle className="w-4 h-4 text-healui-primary" />
                )}
              </div>
              <div className="text-sm text-gray-600">{duration.subtitle}</div>
              <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {duration.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Session Frequency - Button Grid */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-healui-primary" />
          Session Frequency
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 2, label: '2x/week', subtitle: 'Conservative', description: 'Gentle progression' },
            { value: 3, label: '3x/week', subtitle: 'Standard', description: 'Optimal for most patients' },
            { value: 4, label: '4x/week', subtitle: 'Intensive', description: 'Active rehabilitation' },
            { value: 5, label: '5x/week', subtitle: 'Aggressive', description: 'High-demand recovery' }
          ].map(freq => (
            <button
              key={freq.value}
              onClick={() => updatePreferences({ frequency: freq.value })}
              className={`group p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                preferences.frequency === freq.value
                  ? 'border-healui-primary bg-healui-primary/10 shadow-md scale-105'
                  : 'border-gray-200 hover:border-healui-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-gray-900">{freq.label}</div>
                {preferences.frequency === freq.value && (
                  <CheckCircle className="w-4 h-4 text-healui-primary" />
                )}
              </div>
              <div className="text-sm text-gray-600">{freq.subtitle}</div>
              <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {freq.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Treatment Setting - Only show if multiple plan types selected */}
      {planTypes.length > 1 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-healui-primary" />
            Treatment Setting
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'home', label: 'Home-Based', icon: Home, subtitle: 'Self-directed exercises', description: 'Minimal equipment, patient independence' },
              { value: 'clinic', label: 'Clinic-Based', icon: Building2, subtitle: 'Supervised treatment', description: 'Full equipment, professional oversight' },
              { value: 'hybrid', label: 'Hybrid', icon: Users, subtitle: 'Best of both', description: 'Clinic supervision + home exercises' }
            ].map(setting => (
              <button
                key={setting.value}
                onClick={() => updatePreferences({ setting: setting.value as any })}
                className={`group p-6 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
                  preferences.setting === setting.value
                    ? 'border-healui-primary bg-healui-primary/10 shadow-md scale-105'
                    : 'border-gray-200 hover:border-healui-primary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <setting.icon className={`w-8 h-8 ${
                    preferences.setting === setting.value ? 'text-healui-primary' : 'text-gray-400'
                  }`} />
                  {preferences.setting === setting.value && (
                    <CheckCircle className="w-5 h-5 text-healui-primary" />
                  )}
                </div>
                <div className="font-semibold text-gray-900">{setting.label}</div>
                <div className="text-sm text-gray-600 mt-1">{setting.subtitle}</div>
                <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {setting.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progression Style - Button Grid */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-healui-primary" />
          Progression Approach
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              value: 'conservative', 
              label: 'Conservative', 
              subtitle: 'Safety first',
              description: 'Slower progression prioritizing comfort and safety'
            },
            { 
              value: 'standard', 
              label: 'Standard', 
              subtitle: 'Evidence-based',
              description: 'Normal progression following clinical guidelines'
            },
            { 
              value: 'accelerated', 
              label: 'Accelerated', 
              subtitle: 'Fast-track',
              description: 'Faster progression for motivated, low-risk patients'
            }
          ].map(style => (
            <button
              key={style.value}
              onClick={() => updatePreferences({ progressionStyle: style.value as any })}
              className={`group p-6 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
                preferences.progressionStyle === style.value
                  ? 'border-healui-primary bg-healui-primary/10 shadow-md scale-105'
                  : 'border-gray-200 hover:border-healui-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  preferences.progressionStyle === style.value 
                    ? 'bg-healui-primary text-white' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Settings className="w-4 h-4" />
                </div>
                {preferences.progressionStyle === style.value && (
                  <CheckCircle className="w-5 h-5 text-healui-primary" />
                )}
              </div>
              <div className="font-semibold text-gray-900">{style.label}</div>
              <div className="text-sm text-gray-600 mt-1">{style.subtitle}</div>
              <div className="text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {style.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Available Equipment - Only show for home plans */}
      {(planTypes.includes('home') || preferences.setting === 'home' || preferences.setting === 'hybrid') && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-healui-primary" />
            Available Equipment <span className="text-sm font-normal text-gray-600 ml-2">(Optional for home plans)</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'resistance_bands', label: 'Resistance Bands', emoji: '🔗' },
              { value: 'dumbbells', label: 'Dumbbells', emoji: '🏋️' },
              { value: 'exercise_ball', label: 'Exercise Ball', emoji: '⚽' },
              { value: 'balance_pad', label: 'Balance Pad', emoji: '📦' },
              { value: 'foam_roller', label: 'Foam Roller', emoji: '📏' },
              { value: 'yoga_mat', label: 'Yoga Mat', emoji: '🧘' }
            ].map(equipment => {
              const isSelected = preferences.availableEquipment?.includes(equipment.value) || false
              return (
                <button
                  key={equipment.value}
                  onClick={() => {
                    const current = preferences.availableEquipment || []
                    const updated = isSelected 
                      ? current.filter(e => e !== equipment.value)
                      : [...current, equipment.value]
                    updatePreferences({ availableEquipment: updated })
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-center hover:shadow-md ${
                    isSelected
                      ? 'border-healui-primary bg-healui-primary/10 shadow-md scale-105'
                      : 'border-gray-200 hover:border-healui-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{equipment.emoji}</div>
                  <div className="text-sm font-medium text-gray-900">{equipment.label}</div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-healui-primary mx-auto mt-1" />
                  )}
                </button>
              )
            })}
          </div>
          <div className="text-xs text-gray-500 italic">
            💡 Select equipment you have available at home. If none selected, bodyweight exercises will be prioritized.
          </div>
        </div>
      )}

      {/* Summary Card */}
      <Card className="bg-healui-primary/5 border-healui-primary/20">
        <div className="p-4">
          <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
            <CheckCircle className="w-5 h-5 text-healui-primary mr-2" />
            Configuration Summary
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Duration</div>
              <div className="font-medium">{preferences.duration} weeks</div>
            </div>
            <div>
              <div className="text-gray-600">Frequency</div>
              <div className="font-medium">{preferences.frequency}x/week</div>
            </div>
            <div>
              <div className="text-gray-600">Progression</div>
              <div className="font-medium capitalize">{preferences.progressionStyle}</div>
            </div>
            {preferences.availableEquipment && preferences.availableEquipment.length > 0 && (
              <div>
                <div className="text-gray-600">Equipment</div>
                <div className="font-medium">{preferences.availableEquipment.length} items</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ProtocolPreferencesStep