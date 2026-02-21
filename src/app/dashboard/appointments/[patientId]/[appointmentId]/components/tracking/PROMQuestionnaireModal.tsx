'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Clock, FileText, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { loadPROM, type PROMData, type PROMQuestion } from './prom-loader'

interface PROMQuestionnaireModalProps {
  open: boolean
  onClose: () => void
  onScore: (score: number) => void
  itemKey: string
  itemDisplayName: string
}

export default function PROMQuestionnaireModal({
  open,
  onClose,
  onScore,
  itemKey,
  itemDisplayName,
}: PROMQuestionnaireModalProps) {
  const [prom, setProm] = useState<PROMData | null>(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setAnswers({})
    setCollapsedSections({})
    loadPROM(itemKey).then(data => {
      setProm(data)
      setLoading(false)
    })
  }, [open, itemKey])

  const setAnswer = useCallback((questionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }))
  }, [])

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }, [])

  // Count answered
  const allQuestions = useMemo(() => {
    if (!prom) return []
    return prom.sections.flatMap(s => s.questions)
  }, [prom])

  const answeredCount = Object.keys(answers).length
  const totalQuestions = allQuestions.length

  // Calculate score
  const calculatedScore = useMemo(() => {
    if (!prom || answeredCount === 0) return null
    const method = prom.scoring.method

    if (method === 'single_item') {
      const val = Object.values(answers)[0]
      return val !== undefined ? val : null
    }

    const scores = Object.values(answers)
    const sum = scores.reduce((a, b) => a + b, 0)

    if (method === 'sum_to_percentage') {
      const maxScore = prom.scoring.total_score.max
      return Math.round((sum / maxScore) * 100)
    }

    if (method === 'sum_to_score') {
      // DASH-style: [(sum/n) - 1] * 25
      const n = scores.length
      if (n === 0) return null
      return Math.round(((sum / n) - 1) * 25)
    }

    if (method === 'subscale_average_to_percentage') {
      // SPADI-style: average of subscale percentages
      if (!prom.scoring.subscales) return Math.round(sum)
      const subscaleScores: number[] = []
      for (const subscale of prom.scoring.subscales) {
        const sectionQuestions = prom.sections
          .filter(s => s.subscale === subscale.id)
          .flatMap(s => s.questions)
        const sectionAnswers = sectionQuestions
          .map(q => answers[q.id])
          .filter((v): v is number => v !== undefined)
        if (sectionAnswers.length > 0) {
          const maxPossible = sectionQuestions.length * (sectionQuestions[0]?.max || 10)
          const subscaleSum = sectionAnswers.reduce((a, b) => a + b, 0)
          subscaleScores.push((subscaleSum / maxPossible) * 100)
        }
      }
      if (subscaleScores.length === 0) return null
      return Math.round(subscaleScores.reduce((a, b) => a + b, 0) / subscaleScores.length)
    }

    // Fallback: raw sum
    return Math.round(sum)
  }, [prom, answers, answeredCount])

  // Interpretation
  const interpretation = useMemo(() => {
    if (!prom || calculatedScore === null) return null
    const interp = prom.scoring.total_score.interpretation
    for (const [range, label] of Object.entries(interp)) {
      if (range.includes('-')) {
        const [lo, hi] = range.split('-').map(Number)
        if (calculatedScore >= lo && calculatedScore <= hi) return label
      } else {
        if (calculatedScore === Number(range)) return label
      }
    }
    return null
  }, [prom, calculatedScore])

  const handleSubmit = () => {
    if (calculatedScore !== null) {
      onScore(calculatedScore)
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {prom?.full_name || itemDisplayName}
            </h2>
            {prom && (
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {totalQuestions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{prom.estimated_time_minutes} min
                </span>
                <span className="text-teal-600 font-medium">
                  {answeredCount}/{totalQuestions} answered
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Instructions */}
        {prom?.instructions && (
          <div className="px-6 py-3 bg-teal-50/50 border-b border-teal-100 text-xs text-teal-800">
            {prom.instructions}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Loading questionnaire...</span>
            </div>
          )}

          {!loading && !prom && (
            <div className="text-center py-12 text-sm text-gray-400">
              Questionnaire not available for this item.
            </div>
          )}

          {!loading && prom && (
            <div className="space-y-4">
              {prom.sections.map(section => {
                const isCollapsed = collapsedSections[section.id]
                const sectionAnswered = section.questions.filter(q => answers[q.id] !== undefined).length

                return (
                  <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{section.title}</span>
                        <span className="text-[10px] text-gray-400">
                          {sectionAnswered}/{section.questions.length}
                        </span>
                      </div>
                      {isCollapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
                    </button>

                    {/* Section questions */}
                    {!isCollapsed && (
                      <div className="divide-y divide-gray-100">
                        {section.questions.map((q, idx) => (
                          <QuestionRow
                            key={q.id}
                            question={q}
                            index={idx}
                            answer={answers[q.id]}
                            onAnswer={(score) => setAnswer(q.id, score)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with score + submit */}
        {prom && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                {calculatedScore !== null ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-teal-700">{calculatedScore}</span>
                    <div>
                      <div className="text-xs text-gray-500">
                        / {prom.scoring.total_score.max}
                        {prom.scoring.total_score.higher_is_worse ? ' (lower is better)' : ' (higher is better)'}
                      </div>
                      {interpretation && (
                        <div className="text-xs font-medium text-gray-700">{interpretation}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Answer questions to see score</span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={calculatedScore === null}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="h-4 w-4" />
                Use Score
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Individual Question ─────────────────────────────────────

function QuestionRow({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: PROMQuestion
  index: number
  answer: number | undefined
  onAnswer: (score: number) => void
}) {
  if (question.ui_component === 'slider') {
    return <SliderQuestion question={question} index={index} answer={answer} onAnswer={onAnswer} />
  }
  return <SingleChoiceQuestion question={question} index={index} answer={answer} onAnswer={onAnswer} />
}

// ── Slider Question (e.g. SPADI 0-10) ──────────────────────

function SliderQuestion({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: PROMQuestion
  index: number
  answer: number | undefined
  onAnswer: (score: number) => void
}) {
  const min = question.min ?? 0
  const max = question.max ?? 10
  const step = question.step ?? 1
  const labels = question.labels || {}

  // Build button values
  const values: number[] = []
  for (let v = min; v <= max; v += step) {
    values.push(Math.round(v * 10) / 10)
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xs font-medium text-gray-400 w-5 pt-0.5">{index + 1}.</span>
        <span className="text-sm text-gray-700">{question.question}</span>
      </div>
      <div className="ml-7">
        {/* Label endpoints */}
        {(labels[String(min)] || labels[String(max)]) && (
          <div className="flex justify-between text-[10px] text-gray-400 mb-1 px-0.5">
            <span>{labels[String(min)] || ''}</span>
            <span>{labels[String(max)] || ''}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {values.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onAnswer(v)}
              className={`min-w-[30px] h-7 px-1.5 text-xs font-medium rounded transition-colors ${
                answer === v
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Single Choice Question (e.g. DASH, NDI) ────────────────

function SingleChoiceQuestion({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: PROMQuestion
  index: number
  answer: number | undefined
  onAnswer: (score: number) => void
}) {
  const options = question.options || []

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xs font-medium text-gray-400 w-5 pt-0.5">{index + 1}.</span>
        <span className="text-sm text-gray-700">{question.question}</span>
      </div>
      <div className="ml-7 space-y-1">
        {options.map(opt => {
          const isSelected = answer === opt.score
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onAnswer(opt.score)}
              className={`w-full text-left px-3 py-1.5 text-xs rounded-md border transition-colors ${
                isSelected
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
