'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Square } from 'lucide-react'
import type { TrackingInputProps } from '../tracking.types'

export default function TimerInput({ value, onChange, definition, disabled }: TrackingInputProps) {
  const current = (value?.value as number | undefined) ?? ''
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setRunning(false)
    // Write final elapsed to value
    const seconds = Math.round(elapsed / 1000)
    if (seconds > 0) onChange({ value: seconds })
  }, [elapsed, onChange])

  const start = useCallback(() => {
    setElapsed(0)
    startTimeRef.current = Date.now()
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current)
    }, 100)
  }, [])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const displaySeconds = running ? (elapsed / 1000).toFixed(1) : ''

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={running ? displaySeconds : current}
        onChange={e => {
          if (!running) {
            const v = e.target.value
            onChange({ value: v === '' ? undefined : Number(v) })
          }
        }}
        min={definition.min ?? 0}
        disabled={disabled || running}
        placeholder="sec"
        className="w-16 h-7 px-2 text-xs text-right border border-gray-200 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={running ? stop : start}
        disabled={disabled}
        className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${
          running
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        } disabled:opacity-50`}
      >
        {running ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
    </div>
  )
}
