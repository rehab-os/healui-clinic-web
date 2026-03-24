'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square } from 'lucide-react';

interface RecordingModeProps {
  volumeLevel: number;
  isProcessing: boolean;
  transcript: string;
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  fieldsCaptured: number;
  totalFields: number;
  elapsedMs: number;
  onStop: () => void;
}

const ALL_FIELDS: { id: string; label: string }[] = [
  { id: 'pain_location',               label: 'Location' },
  { id: 'vas_score',                   label: 'VAS' },
  { id: 'onset_nature',                label: 'Onset' },
  { id: 'symptom_onset',               label: 'Since' },
  { id: 'symptom_progression',         label: 'Progression' },
  { id: 'pain_nature',                 label: 'Pain type' },
  { id: 'pain_radiation',              label: 'Radiates' },
  { id: 'radiation_pattern',           label: 'Radiation pattern' },
  { id: 'behavior_24hr',               label: 'Behavior' },
  { id: 'morning_stiffness_duration',  label: 'Morning stiffness' },
  { id: 'night_pain_details',          label: 'Night pain' },
  { id: 'pain_timing',                 label: 'Timing' },
  { id: 'pain_movement',               label: 'On movement' },
  { id: 'aggravating_factors',         label: 'Aggravating' },
  { id: 'relieving_factors',           label: 'Relieving' },
  { id: 'sensation_screening',         label: 'Sensation changes' },
  { id: 'sensation_type',              label: 'Sensation type' },
  { id: 'weakness_screening',          label: 'Weakness' },
  { id: 'weakness_location',           label: 'Weakness location' },
  { id: 'mobility_screening',          label: 'Mobility issues' },
  { id: 'functional_impact',           label: 'Function affected' },
  { id: 'swelling_assessment',         label: 'Swelling' },
  { id: 'previous_episodes',           label: 'Previous episodes' },
  { id: 'previous_episode_comparison', label: 'vs. before' },
  { id: 'red_flag_screening',          label: 'Red flags' },
];

const FIELD_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Core',         ids: ['pain_location', 'vas_score', 'onset_nature', 'symptom_onset', 'symptom_progression'] },
  { label: 'Pain',         ids: ['pain_nature', 'pain_radiation', 'radiation_pattern', 'behavior_24hr', 'morning_stiffness_duration', 'night_pain_details', 'pain_timing', 'pain_movement'] },
  { label: 'Factors',      ids: ['aggravating_factors', 'relieving_factors'] },
  { label: 'Neurological', ids: ['sensation_screening', 'sensation_type', 'weakness_screening', 'weakness_location'] },
  { label: 'Functional',   ids: ['mobility_screening', 'functional_impact', 'swelling_assessment'] },
  { label: 'History',      ids: ['previous_episodes', 'previous_episode_comparison', 'red_flag_screening'] },
];

const ALL_FIELDS_MAP = Object.fromEntries(ALL_FIELDS.map(f => [f.id, f.label]));

const GUIDANCE_FIELDS = [
  { id: 'pain_location',       hint: 'Where is the pain?' },
  { id: 'vas_score',           hint: 'Pain score 0–10' },
  { id: 'onset_nature',        hint: 'How did it start?' },
  { id: 'aggravating_factors', hint: 'What makes it worse?' },
  { id: 'relieving_factors',   hint: 'What helps?' },
  { id: 'pain_radiation',      hint: 'Does pain radiate?' },
  { id: 'behavior_24hr',       hint: 'Worse morning or night?' },
  { id: 'functional_impact',   hint: 'Daily activities affected?' },
  { id: 'sensation_screening', hint: 'Any numbness or tingling?' },
  { id: 'weakness_screening',  hint: 'Any weakness?' },
  { id: 'symptom_progression', hint: 'Getting better or worse?' },
  { id: 'previous_episodes',   hint: 'Happened before?' },
];

function formatValue(value: any): string {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  if (value == null) return '—';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return 'none';
    return value
      .filter((v: any) => v !== 'none')
      .map((v: any) => {
        if (typeof v === 'object' && v?.mainRegion) {
          const side = v.laterality && v.laterality !== 'center' ? ` (${v.laterality})` : '';
          return v.mainRegion.replace(/-/g, ' ') + side;
        }
        return String(v).replace(/_/g, ' ');
      })
      .join(' · ') || 'none';
  }
  if (typeof value === 'object' && (value as any)?.mainRegion) {
    const side = (value as any).laterality && (value as any).laterality !== 'center'
      ? ` (${(value as any).laterality})` : '';
    return (value as any).mainRegion.replace(/-/g, ' ') + side;
  }
  return String(value).replace(/_/g, ' ');
}

function Waveform({ volumeLevel }: { volumeLevel: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const amplitude = Math.max(2, volumeLevel * 10);
      const opacity   = 0.2 + volumeLevel * 0.5;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(13, 148, 136, ${opacity})`;
      ctx.lineWidth   = 1.5;
      for (let x = 0; x < W; x++) {
        const t = (x / W) * Math.PI * 6;
        const y = H / 2
          + Math.sin(t + phaseRef.current) * amplitude
          + Math.sin(t * 2.3 + phaseRef.current * 0.7) * amplitude * 0.3;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      phaseRef.current += volumeLevel > 0.02 ? 0.06 : 0.01;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [volumeLevel]);

  return <canvas ref={canvasRef} width={240} height={20} className="opacity-80" />;
}

export default function RecordingMode({
  volumeLevel,
  extractedFields,
  elapsedMs,
  onStop,
}: RecordingModeProps) {
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const isNearEnd       = 15 * 60 * 1000 - elapsedMs < 2 * 60 * 1000;
  const isSpeaking      = volumeLevel > 0.04;
  const capturedIds     = new Set(Object.keys(extractedFields));
  const capturedCount   = capturedIds.size;
  const uncapturedGuidance = GUIDANCE_FIELDS.filter(g => !capturedIds.has(g.id));

  const progressPct  = Math.min((capturedCount / ALL_FIELDS.length) * 100, 100);
  const circumference = 2 * Math.PI * 34;
  const strokeDash    = (progressPct / 100) * circumference;

  return (
    // Simple single-column flex layout — no overflow-hidden, no fixed positioning
    // Parent (AddConditionWorkflow) already handles full-screen placement
    <div className="h-full bg-white flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-[6px] h-[6px] rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[13px] text-gray-500 uppercase tracking-[0.12em] font-medium">
            {isSpeaking ? 'Listening' : 'Recording'}
          </span>
        </div>
        <span className={`text-[13px] font-mono tabular-nums ${isNearEnd ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
          {formatTime(elapsedMs)}
        </span>
      </div>

      {/* ── Captured fields — scrollable, takes remaining space ── */}
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {capturedCount === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
            <p className="text-[13px] text-gray-300 italic">
              Speak to start capturing clinical data...
            </p>
            <div className="mt-5 space-y-2">
              {uncapturedGuidance.slice(0, 6).map((g, i) => (
                <div key={g.id} className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-teal-400' : 'bg-gray-200'}`} />
                  <span className={`text-[13px] leading-relaxed ${i === 0 ? 'text-gray-600 font-medium' : 'text-gray-300'}`}>
                    {g.hint}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {FIELD_GROUPS.map(group => {
                const groupFields = group.ids
                  .map(id => ({ id, label: ALL_FIELDS_MAP[id] }))
                  .filter(f => capturedIds.has(f.id));
                if (groupFields.length === 0) return null;
                return (
                  <motion.div
                    key={group.label}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-[11px] text-gray-400 uppercase tracking-[0.12em] mb-1.5 font-medium">
                      {group.label}
                    </p>
                    <div className="space-y-1.5">
                      {groupFields.map(field => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="flex items-baseline gap-3"
                        >
                          <span className="text-[13px] text-gray-400 w-[120px] flex-shrink-0 leading-relaxed">
                            {field.label}
                          </span>
                          <span className="text-sm text-gray-800 font-medium leading-relaxed capitalize">
                            {formatValue(extractedFields[field.id])}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {uncapturedGuidance.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.12em] mb-2 font-medium">
                  Still needed · {uncapturedGuidance.length}
                </p>
                <div className="space-y-1.5">
                  {uncapturedGuidance.map((g, i) => (
                    <div key={g.id} className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        i === 0 ? 'bg-teal-400 animate-pulse' : i < 3 ? 'bg-gray-300' : 'bg-gray-200'
                      }`} />
                      <span className={`text-[13px] leading-relaxed ${
                        i === 0 ? 'text-gray-700 font-medium' : i < 3 ? 'text-gray-400' : 'text-gray-300'
                      }`}>
                        {g.hint}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Stop button — always at bottom, never clipped ── */}
      <div className="flex-shrink-0 flex flex-col items-center pb-10 pt-4 gap-3">
        <Waveform volumeLevel={volumeLevel} />

        <div className="relative flex items-center justify-center">
          {/* Progress ring — pointer-events:none so it never blocks the button */}
          <svg
            width="88" height="88"
            className="absolute"
            style={{ transform: 'rotate(-90deg)', pointerEvents: 'none' }}
          >
            <circle cx="44" cy="44" r="38" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <circle
              cx="44" cy="44" r="38"
              fill="none"
              stroke="#0d9488"
              strokeWidth="3"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          </svg>

          {/* The stop button — no whileTap, no transform, clean click target */}
          <button
            type="button"
            onClick={onStop}
            className="w-[72px] h-[72px] rounded-full bg-red-500 active:bg-red-600 flex items-center justify-center shadow-md"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Square className="w-5 h-5 text-white fill-white" />
          </button>
        </div>

        <span className="text-[11px] text-gray-300 tracking-wider uppercase">
          tap to stop
        </span>
      </div>
    </div>
  );
}
