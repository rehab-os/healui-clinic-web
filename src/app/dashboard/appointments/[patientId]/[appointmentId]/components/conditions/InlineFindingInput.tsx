'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Check, Loader2, Eye, Mic, Square } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaRecorder } from '@/hooks/useMediaRecorder'
import ApiManager from '@/services/api/api.service'

interface InlineFindingInputProps {
  onSubmit: (text: string) => Promise<void>
  placeholder?: string
  label?: string
}

// ─────────────────────────────────────────────
// EXACT DeepListenLoader from demo-loaders/page.tsx (lines 753-831)
// ─────────────────────────────────────────────
function DeepListenLoader() {
  const particleCount = 14;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const startRadius = 50 + Math.random() * 15;
    const size = 3 + Math.random() * 6;
    const duration = 2.5 + Math.random() * 1.5;
    return { angle, startRadius, size, duration, delay: i * 0.2 };
  });

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Receiving core — breathes slowly */}
      <motion.div
        className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-500/35 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 8px 40px rgba(6,182,212,0.2), inset 0 2px 0 rgba(255,255,255,0.3)',
        }}
        animate={{
          scale: [1, 1.12, 1.05, 1.15, 1],
          opacity: [0.5, 0.75, 0.6, 0.8, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inner glow that brightens as "absorbing" */}
      <motion.div
        className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-white/20 to-cyan-300/20 backdrop-blur-sm"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Particles flowing inward — being absorbed */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full backdrop-blur-sm"
          style={{
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(6,182,212,${0.4 + Math.random() * 0.3}), rgba(139,92,246,${0.15 + Math.random() * 0.15}))`,
            boxShadow: `0 0 ${p.size * 2}px rgba(6,182,212,0.15)`,
          }}
          animate={{
            x: [
              Math.cos(p.angle) * p.startRadius,
              Math.cos(p.angle + 0.3) * (p.startRadius * 0.5),
              Math.cos(p.angle + 0.5) * 5,
            ],
            y: [
              Math.sin(p.angle) * p.startRadius,
              Math.sin(p.angle + 0.3) * (p.startRadius * 0.5),
              Math.sin(p.angle + 0.5) * 5,
            ],
            opacity: [0, 0.8, 0],
            scale: [0.6, 1, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeIn',
            delay: p.delay,
          }}
        />
      ))}

      {/* Outer ambient glow */}
      <motion.div
        className="absolute h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function InlineFindingInput({
  onSubmit,
  placeholder = 'Pain 4/10, ROM improved, tenderness reduced...',
  label,
}: InlineFindingInputProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const canSubmit = text.trim().length >= 3 && !submitting

  // Auto-resize textarea when text changes programmatically (e.g. after transcription)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [text])

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setTranscribeError(null)

    try {
      // Match SmartNoteInput's file creation logic exactly
      let filename = 'observation'
      let mimeType = audioBlob.type

      if (audioBlob.type.includes('webm')) {
        filename = 'observation.webm'
      } else if (audioBlob.type.includes('wav')) {
        filename = 'observation.wav'
      } else if (audioBlob.type.includes('mp3')) {
        filename = 'observation.mp3'
      } else if (audioBlob.type.includes('m4a')) {
        filename = 'observation.m4a'
      } else {
        filename = 'observation.webm'
        mimeType = 'audio/webm'
      }

      const audioFile = new File([audioBlob], filename, { type: mimeType })
      console.log('[Insight Voice] Sending audio:', { filename, mimeType, size: audioFile.size })

      const response = await ApiManager.transcribeAudio(audioFile)
      console.log('[Insight Voice] Response:', response)

      if (response.success && response.data?.transcription) {
        setText((prev) => {
          const trimmed = prev.trim()
          return trimmed ? `${trimmed}. ${response.data.transcription}` : response.data.transcription
        })
        setIsListening(false)
        setTimeout(() => inputRef.current?.focus(), 100)
      } else {
        setTranscribeError(response.message || 'No speech detected. Try again.')
      }
    } catch (err: any) {
      console.error('[Insight Voice] Error:', err)
      // Show the actual error message, not a generic one
      const msg = err?.message || String(err)
      setTranscribeError(msg)
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const {
    state: recState,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
  } = useMediaRecorder({
    onRecordingComplete: handleRecordingComplete,
    maxDuration: 120000,
  })

  const isRecording = recState === 'recording'

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

  const handleMicClick = () => {
    setTranscribeError(null)
    setIsListening(true)
    startRecording()
  }

  const handleStopRecording = () => {
    stopRecording()
  }

  const handleCancelRecording = () => {
    cancelRecording()
    setIsListening(false)
    setIsTranscribing(false)
    setTranscribeError(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <Eye className="h-3 w-3 text-teal-600" />
          <label className="text-xs font-medium text-teal-700">{label}</label>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            // Auto-resize
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={submitting}
          rows={1}
          className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal placeholder:text-gray-400 disabled:opacity-50 transition-colors resize-none overflow-hidden"
          style={{ maxHeight: '120px', overflowY: text.length > 200 ? 'auto' : 'hidden' }}
        />

        {/* Mic button */}
        {isSupported && (
          <button
            onClick={handleMicClick}
            disabled={submitting || isListening}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 text-white hover:from-cyan-600 hover:to-teal-700 shadow-sm shadow-teal-500/25 transition-all hover:shadow-md hover:shadow-teal-500/30 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Record observation"
          >
            <Mic className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Submit button */}
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

      {/* ─── Fullscreen overlay — portaled to body so it renders above sidebar/header ─── */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={handleCancelRecording}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" />

            {/* Content — use gap instead of margin so scale doesn't overlap */}
            <motion.div
              className="relative z-10 flex flex-col items-center gap-16"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ambient glow */}
              <motion.div
                className="pointer-events-none absolute -top-32 h-[500px] w-[500px] rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Loader container — fixed height so scale doesn't eat into text */}
              <div className="flex h-64 w-64 items-center justify-center">
                <div style={{ transform: 'scale(2.8)' }}>
                  <DeepListenLoader />
                </div>
              </div>

              {/* Status text */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {isTranscribing ? (
                  <>
                    <h2 className="text-4xl font-light tracking-wide text-white">
                      Transcribing
                    </h2>
                    <motion.p
                      className="mt-3 text-sm text-white/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Converting speech to text...
                    </motion.p>
                  </>
                ) : transcribeError ? (
                  <>
                    <h2 className="text-2xl font-light tracking-wide text-red-400">
                      {transcribeError}
                    </h2>
                    <motion.button
                      onClick={() => {
                        setTranscribeError(null)
                        startRecording()
                      }}
                      className="mt-5 px-6 py-2.5 text-sm rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Try again
                    </motion.button>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl font-light tracking-wide text-white">
                      Listening
                    </h2>
                    <motion.p
                      className="mt-3 text-sm text-white/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      Recording insight for this condition...
                    </motion.p>

                    {/* Timer + recording indicator */}
                    {isRecording && (
                      <motion.div
                        className="mx-auto mt-5 flex items-center justify-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                      >
                        <motion.div
                          className="h-2 w-2 rounded-full bg-red-500"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        <span className="text-sm font-mono text-white/50">
                          {formatTime(recordingTime)}
                        </span>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>

              {/* Stop recording button */}
              {isRecording && (
                <motion.button
                  onClick={handleStopRecording}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all hover:scale-105 active:scale-95"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
                  title="Stop recording"
                >
                  <Square className="h-6 w-6 fill-current" />
                </motion.button>
              )}

              {/* Three animated dots */}
              <motion.div
                className="flex justify-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  )
}
