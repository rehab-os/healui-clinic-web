'use client'

import React, { useState, useRef } from 'react'
import { Plus, Check, Loader2, Eye } from 'lucide-react'

interface InlineFindingInputProps {
  onSubmit: (text: string) => Promise<void>
  placeholder?: string
  label?: string
}

export default function InlineFindingInput({
  onSubmit,
  placeholder = 'Pain 4/10, ROM improved, tenderness reduced...',
  label,
}: InlineFindingInputProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canSubmit = text.trim().length >= 3 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(text.trim())
      setText('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1200)
      inputRef.current?.focus()
    } catch {
      // error handling done by parent (toast)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Eye className="h-3 w-3 text-teal-600" />
          <label className="text-xs font-medium text-teal-700">{label}</label>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={submitting}
          className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal placeholder:text-gray-400 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            showSuccess
              ? 'bg-emerald-500 text-white'
              : canSubmit
                ? 'bg-brand-teal text-white hover:bg-brand-teal/90 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : showSuccess ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
