'use client'

import React, { useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import type { ContraIndicationSeverity } from '@/types/dietary-profile.types'

interface Contraindication {
  id?: string
  item: string
  type: string
  reason: string
  severity: ContraIndicationSeverity
  source?: string
}

interface ContraindicationsListProps {
  conditionBased: Contraindication[]
  patientSpecific: Contraindication[]
  onAddContraindication?: () => void
  onRemoveContraindication?: (id: string) => void
}

/**
 * ContraindicationsList - Two sections: Condition-Based, Patient-Specific
 * List items with severity badges (MILD, MODERATE, SEVERE, CRITICAL)
 * Item type icons, reason display, "Add Contraindication" button
 */
export default function ContraindicationsList({
  conditionBased,
  patientSpecific,
  onAddContraindication,
  onRemoveContraindication
}: ContraindicationsListProps) {
  const getSeverityColor = (severity: ContraIndicationSeverity) => {
    switch (severity) {
      case 'MILD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'MODERATE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'SEVERE':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'CRITICAL':
        return 'bg-red-600 text-white border-red-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    const iconClass = 'h-4 w-4'
    switch (type.toLowerCase()) {
      case 'food':
        return '🍎'
      case 'supplement':
        return '💊'
      case 'exercise':
        return '🏃'
      case 'modality':
        return '⚡'
      case 'medication':
        return '💉'
      default:
        return '⚠️'
    }
  }

  const renderContraindication = (item: Contraindication, isPatientSpecific: boolean) => (
    <div
      key={item.id || item.item}
      className="bg-white border border-[#000000]/10 rounded-lg p-3 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-xl">{getTypeIcon(item.type)}</span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[#000000]">{item.item}</h4>
            <p className="text-xs text-gray-600 mt-0.5 capitalize">{item.type.toLowerCase()}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(item.severity)}`}>
          {item.severity}
        </span>
      </div>

      <div className="bg-[#eff8ff] rounded p-2 mb-2">
        <p className="text-xs text-gray-700 leading-relaxed">
          <span className="font-medium">Reason:</span> {item.reason}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Source: {item.source || (isPatientSpecific ? 'Patient-Specific' : 'Condition Default')}
        </span>
        {isPatientSpecific && onRemoveContraindication && item.id && (
          <button
            onClick={() => onRemoveContraindication(item.id!)}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )

  const hasContraindications = conditionBased.length > 0 || patientSpecific.length > 0

  if (!hasContraindications) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 mb-3">No contraindications recorded</p>
        {onAddContraindication && (
          <button
            onClick={onAddContraindication}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1e5f79] text-white rounded-lg hover:bg-[#164557] transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Contraindication
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Condition-Based Contraindications */}
      {conditionBased.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#000000]">
              Condition-Based ({conditionBased.length})
            </h4>
          </div>
          <div className="space-y-2">
            {conditionBased.map((item) => renderContraindication(item, false))}
          </div>
        </div>
      )}

      {/* Patient-Specific Contraindications */}
      {patientSpecific.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#000000]">
              Patient-Specific ({patientSpecific.length})
            </h4>
          </div>
          <div className="space-y-2">
            {patientSpecific.map((item) => renderContraindication(item, true))}
          </div>
        </div>
      )}

      {/* Add Button */}
      {onAddContraindication && (
        <div className="pt-3 border-t border-[#000000]/10">
          <button
            onClick={onAddContraindication}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white border border-[#1e5f79] text-[#1e5f79] rounded-lg hover:bg-[#eff8ff] transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Patient-Specific Contraindication
          </button>
        </div>
      )}
    </div>
  )
}
