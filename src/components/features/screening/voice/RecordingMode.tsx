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

// ALL trackable fields — ordered by clinical importance
// Only captured ones are shown (no dim placeholders)
const ALL_FIELDS: { id: string; label: string }[] = [
  { id: 'pain_location', label: 'Location' },
  { id: 'vas_score', label: 'VAS' },
  { id: 'onset_nature', label: 'Onset' },
  { id: 'symptom_onset', label: 'Since' },
  { id: 'symptom_progression', label: 'Progression' },
  { id: 'pain_nature', label: 'Pain type' },
  { id: 'pain_radiation', label: 'Radiates' },
  { id: 'radiation_pattern', label: 'Radiation pattern' },
  { id: 'behavior_24hr', label: 'Behavior' },
  { id: 'morning_stiffness_duration', label: 'Morning stiffness' },
  { id: 'night_pain_details', label: 'Night pain' },
  { id: 'pain_timing', label: 'Timing' },
  { id: 'pain_movement', label: 'On movement' },
  { id: 'aggravating_factors', label: 'Aggravating' },
  { id: 'relieving_factors', label: 'Relieving' },
  { id: 'sensation_screening', label: 'Sensation changes' },
  { id: 'sensation_type', label: 'Sensation type' },
  { id: 'weakness_screening', label: 'Weakness' },
  { id: 'weakness_location', label: 'Weakness location' },
  { id: 'mobility_screening', label: 'Mobility issues' },
  { id: 'functional_impact', label: 'Function affected' },
  { id: 'swelling_assessment', label: 'Swelling' },
  { id: 'previous_episodes', label: 'Previous episodes' },
  { id: 'previous_episode_comparison', label: 'vs. before' },
  { id: 'red_flag_screening', label: 'Red flags' },
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
  if (typeof value === 'object' && value?.mainRegion) {
    const side = value.laterality && value.laterality !== 'center' ? ` (${value.laterality})` : '';
    return value.mainRegion.replace(/-/g, ' ') + side;
  }
  return String(value).replace(/_/g, ' ');
}

// Canvas-based sine waveform — smooth, organic, reacts to volume
function Waveform({ volumeLevel }: { volumeLevel: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const amplitude = Math.max(4, volumeLevel * 28);
      const opacity = 0.15 + volumeLevel * 0.45;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(13, 148, 136, ${opacity})`;
      ctx.lineWidth = 1.5;

      for (let x = 0; x < W; x++) {
        const t = (x / W) * Math.PI * 6;
        // Layered sine waves for organic feel
        const y =
          H / 2 +
          Math.sin(t + phaseRef.current) * amplitude +
          Math.sin(t * 2.3 + phaseRef.current * 0.7) * amplitude * 0.3 +
          Math.sin(t * 0.5 + phaseRef.current * 1.3) * amplitude * 0.15;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      phaseRef.current += volumeLevel > 0.02 ? 0.06 : 0.01;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [volumeLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      className="opacity-90"
    />
  );
}

export default function RecordingMode({
  volumeLevel,
  transcript,
  extractedFields,
  elapsedMs,
  onStop,
}: RecordingModeProps) {
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const isNearEnd = 15 * 60 * 1000 - elapsedMs < 2 * 60 * 1000;
  const isSpeaking = volumeLevel > 0.04;

  // Captured vs uncaptured fields
  const capturedFields = ALL_FIELDS.filter(f => extractedFields[f.id] !== undefined);
  const capturedCount = capturedFields.length;

  // Key fields to prompt the physio about — most clinically important uncaptured ones
  const GUIDANCE_FIELDS = [
    { id: 'pain_location', hint: 'Where is the pain?' },
    { id: 'vas_score', hint: 'Pain score 0-10' },
    { id: 'onset_nature', hint: 'How did it start?' },
    { id: 'aggravating_factors', hint: 'What makes it worse?' },
    { id: 'relieving_factors', hint: 'What helps?' },
    { id: 'pain_radiation', hint: 'Does pain radiate?' },
    { id: 'behavior_24hr', hint: 'Worse morning/night?' },
    { id: 'functional_impact', hint: 'Daily activities affected?' },
    { id: 'sensation_screening', hint: 'Any numbness/tingling?' },
    { id: 'weakness_screening', hint: 'Any weakness?' },
    { id: 'symptom_progression', hint: 'Getting better or worse?' },
    { id: 'previous_episodes', hint: 'Happened before?' },
  ];
  const uncapturedGuidance = GUIDANCE_FIELDS.filter(g => extractedFields[g.id] === undefined);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col select-none">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-[5px] h-[5px] rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">
            {isSpeaking ? 'Listening' : 'Recording'}
          </span>
        </div>
        <span className={`text-xs font-mono tabular-nums ${isNearEnd ? 'text-red-500' : 'text-gray-400'}`}>
          {formatTime(elapsedMs)}
        </span>
      </div>

      {/* ── Captured fields ── */}
      <div className="flex-1 overflow-y-auto px-6 py-3 min-h-0">
        {capturedCount === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[12px] text-gray-300 italic mt-2"
          >
            Speak to start capturing clinical data...
          </motion.p>
        ) : (
          <div className="space-y-[6px]">
            <AnimatePresence>
              {capturedFields.map((field) => {
                const raw = extractedFields[field.id];
                const val = formatValue(raw);

                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex items-baseline gap-3"
                  >
                    <span className="text-[11px] text-gray-400 w-[110px] flex-shrink-0 leading-relaxed">
                      {field.label}
                    </span>
                    <span className="text-[12px] text-gray-800 font-medium leading-relaxed capitalize">
                      {val}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Guide mode — always visible, shows next uncaptured fields to cover */}
        {uncapturedGuidance.length > 0 && (
          <div className={`${capturedCount > 0 ? 'mt-4 pt-3 border-t border-gray-100' : 'mt-2'}`}>
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.15em] mb-2 font-medium">
              {capturedCount === 0 ? 'Ask about' : 'Still needed'}
            </p>
            <div className="space-y-1">
              {uncapturedGuidance.slice(0, capturedCount === 0 ? 5 : 4).map((g, i) => (
                <div key={g.id} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-teal-400' : 'bg-gray-200'}`} />
                  <span className={`text-[11px] leading-relaxed ${i === 0 ? 'text-gray-600 font-medium' : 'text-gray-300'}`}>
                    {g.hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="mx-6 h-px bg-gray-100 flex-shrink-0" />

      {/* ── Waveform + Stop ── */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center gap-5 py-6">
        <Waveform volumeLevel={volumeLevel} />

        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={onStop}
            className="w-12 h-12 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center transition-all duration-200"
            whileTap={{ scale: 0.92 }}
          >
            <Square className="w-[14px] h-[14px] text-gray-500 fill-gray-500" />
          </motion.button>
          <span className="text-[9px] text-gray-300 tracking-wider uppercase">
            tap to stop
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-6 h-px bg-gray-100 flex-shrink-0" />

      {/* ── Live transcript ── */}
      <div className="flex-shrink-0 px-6 pt-3 pb-5 max-h-[22vh] overflow-y-auto">
        {transcript ? (
          <p className="text-[12px] text-gray-500 leading-[1.8]">
            {transcript}
          </p>
        ) : (
          <p className="text-[11px] text-gray-300 italic">
            Transcript appears here as you speak...
          </p>
        )}
      </div>

      {/* ── Field count — bottom right, very subtle ── */}
      {capturedCount > 0 && (
        <div className="absolute bottom-4 right-5">
          <span className="text-[9px] text-gray-300 tabular-nums">
            {capturedCount} captured
          </span>
        </div>
      )}
    </div>
  );
}
