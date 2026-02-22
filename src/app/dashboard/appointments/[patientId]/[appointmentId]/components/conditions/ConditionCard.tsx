'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MapPin, MoreVertical, LogOut, Check } from 'lucide-react'

interface ConditionCardProps {
  condition: {
    id: string
    condition_name: string
    body_region?: string
    chief_complaint?: string
    treatment_focus?: string
    selected_phase?: string
    selected_goals?: string[]
    condition?: {
      status?: string
      diagnosis_date?: string
    }
  }
  visitChiefComplaint?: string
  onDischarge?: () => void
  onReactivate?: () => void
  children?: React.ReactNode
}

export default function ConditionCard({
  condition,
  visitChiefComplaint,
  onDischarge,
  onReactivate,
  children
}: ConditionCardProps) {
  const [showOverflow, setShowOverflow] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    if (showOverflow) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOverflow])

  const status = condition.condition?.status?.toUpperCase()
  const isPrimary = condition.treatment_focus === 'PRIMARY'
  const isDischarged = status === 'DISCHARGED'

  const statusDot = (() => {
    switch (status) {
      case 'ACTIVE': return 'bg-teal-500'
      case 'DISCHARGED': return 'bg-gray-400'
      case 'CHRONIC': return 'bg-amber-500'
      default: return 'bg-gray-400'
    }
  })()

  // Only show condition-specific chief complaint if different from visit-level
  const showChiefComplaint = condition.chief_complaint && condition.chief_complaint !== visitChiefComplaint

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Condition Header — compact */}
      <div className="px-5 py-3.5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Name + inline metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">
              {condition.condition_name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 flex-wrap">
              {condition.body_region && (
                <>
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-xs">{condition.body_region}</span>
                </>
              )}
              {condition.body_region && status && <span className="text-gray-300">&middot;</span>}
              {status && (
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                  <span className="capitalize">{status.toLowerCase()}</span>
                </span>
              )}
              {condition.selected_phase && (
                <>
                  <span className="text-gray-300">&middot;</span>
                  <span className="text-xs px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded font-medium">
                    {condition.selected_phase}
                  </span>
                </>
              )}
              {condition.selected_goals && condition.selected_goals.length > 0 && (
                <>
                  <span className="text-gray-300">&middot;</span>
                  <span className="text-xs text-gray-500" title={condition.selected_goals.join(', ')}>
                    {condition.selected_goals.length} goal{condition.selected_goals.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
            {showChiefComplaint && (
              <p className="text-xs text-amber-700 mt-1 italic">
                &ldquo;{condition.chief_complaint}&rdquo;
              </p>
            )}
          </div>

          {/* Right: Overflow menu only */}
          {(onDischarge || onReactivate) && (
            <div className="relative" ref={overflowRef}>
              <button
                onClick={() => setShowOverflow(!showOverflow)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showOverflow && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOverflow(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                    {!isDischarged && onDischarge ? (
                      <button
                        onClick={() => { setShowOverflow(false); onDischarge() }}
                        className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Discharge Condition
                      </button>
                    ) : onReactivate ? (
                      <button
                        onClick={() => { setShowOverflow(false); onReactivate() }}
                        className="w-full text-left px-4 py-2.5 text-sm text-brand-teal hover:bg-teal-50 flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Reactivate Condition
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children: Protocol Viewers */}
      {children && (
        <div className="border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}
