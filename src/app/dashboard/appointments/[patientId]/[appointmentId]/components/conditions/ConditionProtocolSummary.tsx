'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Package, History, Sparkles, ChevronDown, ChevronRight, X, Zap, Hand, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

interface ProtocolModality {
  modalityName: string
  duration: string
  frequency: string
  parameters?: string
  applicationMethod?: string
  clinicalSupervisionRequired?: boolean
}

interface ProtocolManualTherapy {
  technique: string
  frequency: string
  sessionDuration: string
  clinicalOnly?: boolean
  expectedOutcome?: string
}

interface ProtocolPhase {
  phaseName: string
  durationWeeks: number
  goals?: string[]
}

interface ProtocolData {
  id?: string
  protocol_title?: string
  version?: number
  exercises?: any[]
  goals?: string[]
  treatment_phases?: ProtocolPhase[]
  modalities?: ProtocolModality[]
  manual_therapy?: ProtocolManualTherapy[]
  program_duration_weeks?: number
  created_at?: string
  updated_at?: string
}

interface ConditionProtocolSummaryProps {
  homeProtocol?: ProtocolData | null
  clinicalProtocol?: ProtocolData | null
  isHomePrevious?: boolean
  isClinicalPrevious?: boolean
  onGenerateNew?: () => void
  onViewHistory?: () => void
}

export default function ConditionProtocolSummary({
  homeProtocol,
  clinicalProtocol,
  isHomePrevious = false,
  isClinicalPrevious = false,
  onGenerateNew,
  onViewHistory,
}: ConditionProtocolSummaryProps) {
  const [expandedSection, setExpandedSection] = useState<'home' | 'clinical' | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileSheet, setMobileSheet] = useState<'home' | 'clinical' | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const getSummaryCounts = (protocol: ProtocolData | null | undefined) => {
    if (!protocol) return ''
    const parts: string[] = []
    const exCount = protocol.exercises?.length || 0
    parts.push(`${exCount} ex`)
    if (protocol.modalities && protocol.modalities.length > 0) {
      parts.push(`${protocol.modalities.length} mod`)
    }
    if (protocol.manual_therapy && protocol.manual_therapy.length > 0) {
      parts.push(`${protocol.manual_therapy.length} MT`)
    }
    return parts.join(' · ')
  }

  const groupExercisesByPhase = (protocol: ProtocolData) => {
    const phases = protocol.treatment_phases || []
    const exercises = protocol.exercises || []
    if (phases.length === 0) return [{ phase: null, exercises }]
    return phases.map((phase, phaseIdx) => {
      const phaseExercises = exercises.filter(ex => {
        const idx = ex.order_index ?? 0
        return Math.floor(idx / 100) === phaseIdx
      })
      return { phase, exercises: phaseExercises }
    })
  }

  const handleToggle = (section: 'home' | 'clinical') => {
    if (isMobile) {
      setMobileSheet(prev => prev === section ? null : section)
    } else {
      setExpandedSection(prev => prev === section ? null : section)
    }
  }

  const renderProtocolContent = (protocol: ProtocolData, isPrevious: boolean) => {
    const phaseGroups = groupExercisesByPhase(protocol)
    const modalities = protocol.modalities || []
    const manualTherapy = protocol.manual_therapy || []

    return (
      <div className={`px-4 lg:px-5 py-3 space-y-3 ${isPrevious ? 'bg-amber-50/30' : 'bg-gray-50/30'}`}>
        {isPrevious && protocol.created_at && (
          <div className="text-xs text-amber-600 font-medium">
            From {format(new Date(protocol.created_at), 'MMM dd, yyyy')}
          </div>
        )}

        {phaseGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {group.phase && (
              <div className="mb-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{group.phase.phaseName}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{group.phase.durationWeeks}w</span>
                </div>
                {group.phase.goals && group.phase.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {group.phase.goals.map((goal: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded">
                        <Target className="h-2.5 w-2.5" />
                        {goal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {group.exercises.length > 0 ? (
              <div className="space-y-1">
                {group.exercises.map((exercise: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                      isPrevious ? 'bg-amber-50/40 border border-amber-100' : 'bg-blue-50/50 border border-blue-100/50'
                    }`}
                  >
                    <span className="text-sm text-gray-800 truncate flex-1 mr-3">
                      {exercise.exercise_name || exercise.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                      <span className="font-mono">
                        {(exercise.custom_sets || exercise.sets) && `${exercise.custom_sets || exercise.sets}s`}
                        {(exercise.custom_sets || exercise.sets) && (exercise.custom_reps || exercise.reps) && ' × '}
                        {(exercise.custom_reps || exercise.reps) && `${exercise.custom_reps || exercise.reps}r`}
                      </span>
                      {exercise.frequency && (
                        <span className="text-gray-400">{exercise.frequency}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : group.phase ? (
              <p className="text-[10px] text-gray-300 pl-3">No exercises in this phase</p>
            ) : null}

            {gIdx < phaseGroups.length - 1 && (
              <div className="border-t border-gray-100 mt-2.5" />
            )}
          </div>
        ))}

        {(!protocol.exercises || protocol.exercises.length === 0) && phaseGroups.every(g => g.exercises.length === 0) && (
          <p className="text-xs text-gray-400 py-1">No exercises</p>
        )}

        {modalities.length > 0 && (
          <div>
            <div className="border-t border-gray-100 pt-2 mt-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Modalities</div>
              <div className="space-y-1">
                {modalities.map((mod, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                      isPrevious ? 'bg-amber-50/40 border border-amber-100' : 'bg-amber-50/50 border border-amber-100/50'
                    }`}
                  >
                    <span className="text-sm text-gray-800 truncate flex-1 mr-3 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      {mod.modalityName}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {mod.duration}{mod.frequency ? `, ${mod.frequency}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {manualTherapy.length > 0 && (
          <div>
            <div className="border-t border-gray-100 pt-2 mt-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Manual Therapy</div>
              <div className="space-y-1">
                {manualTherapy.map((mt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                      isPrevious ? 'bg-amber-50/40 border border-amber-100' : 'bg-green-50/50 border border-green-100/50'
                    }`}
                  >
                    <span className="text-sm text-gray-800 truncate flex-1 mr-3 flex items-center gap-1.5">
                      <Hand className="h-3 w-3 text-green-600 flex-shrink-0" />
                      {mt.technique}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {mt.frequency}{mt.sessionDuration ? `, ${mt.sessionDuration}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Summary text for mobile collapsed row
  const homeSummary = homeProtocol ? getSummaryCounts(homeProtocol) : null
  const clinicalSummary = clinicalProtocol ? getSummaryCounts(clinicalProtocol) : null

  // Active sheet protocol for bottom sheet
  const sheetProtocol = mobileSheet === 'home' ? homeProtocol : mobileSheet === 'clinical' ? clinicalProtocol : null
  const sheetIsPrevious = mobileSheet === 'home' ? isHomePrevious : isClinicalPrevious
  const sheetTitle = mobileSheet === 'home' ? 'Home Protocol' : 'Clinical Protocol'

  return (
    <div className="border-t border-gray-100">
      {/* ── Mobile: compact 2-row summary ── */}
      <div className="lg:hidden px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px]">
          <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* Home */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Home:</span>
              {homeProtocol ? (
                <button
                  onClick={() => handleToggle('home')}
                  className="text-teal-600 font-medium flex items-center gap-0.5"
                >
                  {homeSummary}
                  {isHomePrevious && (
                    <span className="inline-flex items-center gap-0.5 ml-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                      <History className="h-2.5 w-2.5" />prev
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </button>
              ) : (
                <button onClick={onGenerateNew} className="text-teal-600 font-medium flex items-center gap-0.5">
                  <Sparkles className="h-3 w-3" />Generate
                </button>
              )}
            </div>
            {/* Clinical */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Clinical:</span>
              {clinicalProtocol ? (
                <button
                  onClick={() => handleToggle('clinical')}
                  className="text-teal-600 font-medium flex items-center gap-0.5"
                >
                  {clinicalSummary}
                  {isClinicalPrevious && (
                    <span className="inline-flex items-center gap-0.5 ml-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                      <History className="h-2.5 w-2.5" />prev
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </button>
              ) : (
                <span className="text-gray-300 italic">None</span>
              )}
            </div>
          </div>
          {(isHomePrevious || isClinicalPrevious) && onGenerateNew && (
            <button onClick={onGenerateNew} className="text-teal-600 font-medium flex items-center gap-0.5 flex-shrink-0">
              <Sparkles className="h-3 w-3" />New
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile: bottom sheet for protocol detail ── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {mobileSheet && sheetProtocol && (
            <motion.div
              className="fixed inset-0 z-[9998] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSheet(null)} />
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col safe-area-inset-bottom"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              >
                {/* Sheet handle + header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                    <Package className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-semibold text-gray-900">{sheetTitle}</span>
                    {sheetIsPrevious && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Previous visit</span>
                    )}
                  </div>
                  <button onClick={() => setMobileSheet(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Sheet content */}
                <div className="overflow-y-auto flex-1">
                  {renderProtocolContent(sheetProtocol, sheetIsPrevious)}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Desktop: inline expand (unchanged) ── */}
      <div className="hidden lg:block">
        <div className="px-5 py-2.5 flex items-center gap-3 text-xs">
          <Package className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Home:</span>
            {homeProtocol ? (
              <button
                onClick={() => handleToggle('home')}
                className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
              >
                {getSummaryCounts(homeProtocol)}
                {isHomePrevious && (
                  <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                    <History className="h-2.5 w-2.5" />
                    prev
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${expandedSection === 'home' ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button onClick={onGenerateNew} className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Generate
              </button>
            )}
          </div>

          <span className="text-gray-200">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Clinical:</span>
            {clinicalProtocol ? (
              <button
                onClick={() => handleToggle('clinical')}
                className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5"
              >
                {getSummaryCounts(clinicalProtocol)}
                {isClinicalPrevious && (
                  <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                    <History className="h-2.5 w-2.5" />
                    prev
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${expandedSection === 'clinical' ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <span className="text-gray-300 italic">None</span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {(isHomePrevious || isClinicalPrevious) && onGenerateNew && (
              <button onClick={onGenerateNew} className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                New
              </button>
            )}
          </div>
        </div>

        {expandedSection === 'home' && homeProtocol && renderProtocolContent(homeProtocol, isHomePrevious)}
        {expandedSection === 'clinical' && clinicalProtocol && renderProtocolContent(clinicalProtocol, isClinicalPrevious)}
      </div>
    </div>
  )
}
