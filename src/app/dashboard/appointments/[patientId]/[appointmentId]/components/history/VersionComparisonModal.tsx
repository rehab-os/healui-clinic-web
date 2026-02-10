'use client'

import React from 'react'
import { X, Plus, Minus, ArrowRight } from 'lucide-react'
import type { CompareVersionsResponseDto } from '@/types/treatment-history.types'
import { format } from 'date-fns'

interface VersionComparisonModalProps {
  comparison: CompareVersionsResponseDto | null
  onClose: () => void
  open: boolean
}

/**
 * VersionComparisonModal - Side-by-side diff view
 * Current version (left) vs Previous version (right)
 * Highlight additions (green) and removals (red)
 * Display exercises, modalities, phases, goals differences
 */
export default function VersionComparisonModal({
  comparison,
  onClose,
  open
}: VersionComparisonModalProps) {
  if (!open || !comparison) return null

  const { current, previous, differences, change_summary } = comparison

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#000000]/10 bg-[#eff8ff]">
          <div>
            <h2 className="text-lg font-semibold text-[#000000]">
              Protocol Version Comparison
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Version {current.version} vs Version {previous.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-[#1e5f79] hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-5 space-y-5">
            {/* Change Summary */}
            {change_summary && (
              <div className="bg-[#eff8ff] border border-[#1e5f79]/20 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-[#000000] mb-1">Summary</h3>
                <p className="text-sm text-gray-700">{change_summary}</p>
              </div>
            )}

            {/* Version Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-green-800 mb-1">Current Version</h3>
                <p className="text-sm font-medium text-[#000000]">v{current.version}</p>
                <p className="text-xs text-gray-600">
                  {format(new Date(current.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-red-800 mb-1">Previous Version</h3>
                <p className="text-sm font-medium text-[#000000]">v{previous.version}</p>
                <p className="text-xs text-gray-600">
                  {format(new Date(previous.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {/* Phase Change */}
            {differences.phase_change && (
              <div className="bg-white border border-[#000000]/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-[#000000] mb-2">Phase Change</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200">
                    {differences.phase_change.from}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200">
                    {differences.phase_change.to}
                  </span>
                </div>
              </div>
            )}

            {/* Exercises Changes */}
            {(differences.exercises_added?.length || differences.exercises_removed?.length || differences.exercises_modified?.length) && (
              <div className="bg-white border border-[#000000]/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-[#000000] mb-2">Exercise Changes</h3>
                <div className="space-y-2">
                  {/* Added */}
                  {differences.exercises_added && differences.exercises_added.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Plus className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Added ({differences.exercises_added.length})</span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {differences.exercises_added.map((exercise: any, index: number) => (
                          <li key={index} className="text-sm text-gray-700 bg-green-50 px-2 py-1 rounded">
                            {exercise.name || exercise.exercise_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Removed */}
                  {differences.exercises_removed && differences.exercises_removed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Minus className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-600">Removed ({differences.exercises_removed.length})</span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {differences.exercises_removed.map((exercise: any, index: number) => (
                          <li key={index} className="text-sm text-gray-700 bg-red-50 px-2 py-1 rounded line-through">
                            {exercise.name || exercise.exercise_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Modified */}
                  {differences.exercises_modified && differences.exercises_modified.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Modified ({differences.exercises_modified.length})</span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {differences.exercises_modified.map((exercise: any, index: number) => (
                          <li key={index} className="text-sm text-gray-700 bg-blue-50 px-2 py-1 rounded">
                            {exercise.name || exercise.exercise_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modalities Changes */}
            {(differences.modalities_added?.length || differences.modalities_removed?.length || differences.modalities_modified?.length) && (
              <div className="bg-white border border-[#000000]/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-[#000000] mb-2">Modality Changes</h3>
                <div className="space-y-2">
                  {/* Added */}
                  {differences.modalities_added && differences.modalities_added.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Plus className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Added ({differences.modalities_added.length})</span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {differences.modalities_added.map((modality: any, index: number) => (
                          <li key={index} className="text-sm text-gray-700 bg-green-50 px-2 py-1 rounded">
                            {modality.name || modality.modality_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Removed */}
                  {differences.modalities_removed && differences.modalities_removed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Minus className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-600">Removed ({differences.modalities_removed.length})</span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {differences.modalities_removed.map((modality: any, index: number) => (
                          <li key={index} className="text-sm text-gray-700 bg-red-50 px-2 py-1 rounded line-through">
                            {modality.name || modality.modality_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Goals Changes */}
            {(differences.goals_added?.length || differences.goals_removed?.length) && (
              <div className="bg-white border border-[#000000]/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-[#000000] mb-2">Goal Changes</h3>
                <div className="space-y-2">
                  {differences.goals_added && differences.goals_added.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Plus className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Added</span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {differences.goals_added.map((goal: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 bg-green-50 px-2 py-1 rounded">
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {differences.goals_removed && differences.goals_removed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Minus className="h-4 w-4 text-red-600" />
                        <span className="text-xs font-medium text-red-600">Removed</span>
                      </div>
                      <ul className="ml-6 space-y-1">
                        {differences.goals_removed.map((goal: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 bg-red-50 px-2 py-1 rounded line-through">
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other Changes */}
            {differences.other_changes && (
              <div className="bg-white border border-[#000000]/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-[#000000] mb-2">Other Changes</h3>
                <p className="text-sm text-gray-700">{differences.other_changes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#000000]/10 bg-[#eff8ff]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-[#000000]/10 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
