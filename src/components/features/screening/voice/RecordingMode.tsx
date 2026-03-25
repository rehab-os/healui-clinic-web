'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIBubbleLoader } from '@/components/ui/AIBubbleLoader';

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

// ─── Field definitions ──────────────────────────────────────────────────────

const ALL_FIELDS: { id: string; label: string }[] = [
  { id: 'pain_location',               label: 'Location' },
  { id: 'vas_score',                   label: 'Pain severity' },
  { id: 'onset_nature',                label: 'Onset' },
  { id: 'symptom_onset',               label: 'Duration' },
  { id: 'symptom_progression',         label: 'Progression' },
  { id: 'pain_nature',                 label: 'Pain type' },
  { id: 'pain_radiation',              label: 'Radiation' },
  { id: 'radiation_pattern',           label: 'Radiation area' },
  { id: 'behavior_24hr',               label: '24hr pattern' },
  { id: 'morning_stiffness_duration',  label: 'Morning stiffness' },
  { id: 'night_pain_details',          label: 'Night pain' },
  { id: 'pain_timing',                 label: 'Timing' },
  { id: 'pain_movement',               label: 'Movement related' },
  { id: 'aggravating_factors',         label: 'Aggravating' },
  { id: 'relieving_factors',           label: 'Relieving' },
  { id: 'sensation_screening',         label: 'Sensation' },
  { id: 'sensation_type',              label: 'Sensation type' },
  { id: 'weakness_screening',          label: 'Weakness' },
  { id: 'weakness_location',           label: 'Weakness area' },
  { id: 'mobility_screening',          label: 'Mobility' },
  { id: 'functional_impact',           label: 'Function' },
  { id: 'swelling_assessment',         label: 'Swelling' },
  { id: 'previous_episodes',           label: 'Previous episodes' },
  { id: 'previous_episode_comparison', label: 'Compared to before' },
  { id: 'red_flag_screening',          label: 'Red flags' },
];

const ALL_FIELDS_MAP = Object.fromEntries(ALL_FIELDS.map(f => [f.id, f.label]));

// Clinical conversation prompts — phrased as things the physio might ask the patient
const CLINICAL_PROMPTS = [
  { id: 'pain_location',       prompt: 'Can you show me exactly where it hurts?' },
  { id: 'vas_score',           prompt: 'On a scale of 0 to 10, how bad is the pain?' },
  { id: 'onset_nature',        prompt: 'How did this start — suddenly or gradually?' },
  { id: 'aggravating_factors', prompt: 'What movements or positions make it worse?' },
  { id: 'relieving_factors',   prompt: 'Does anything help ease the pain?' },
  { id: 'pain_radiation',      prompt: 'Does the pain travel anywhere else?' },
  { id: 'behavior_24hr',       prompt: 'Is it worse in the morning or evening?' },
  { id: 'functional_impact',   prompt: 'What daily activities are you struggling with?' },
  { id: 'sensation_screening', prompt: 'Any numbness, tingling, or pins and needles?' },
  { id: 'weakness_screening',  prompt: 'Have you noticed any weakness?' },
  { id: 'symptom_progression', prompt: 'Is it getting better, worse, or staying the same?' },
  { id: 'previous_episodes',   prompt: 'Has this happened before?' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatValue(value: any): string {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  if (value == null) return '';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    return value
      .filter((v: any) => v !== 'none')
      .map((v: any) => {
        if (typeof v === 'object' && v?.mainRegion) {
          const side = v.laterality && v.laterality !== 'center' ? ` (${v.laterality})` : '';
          return v.mainRegion.replace(/-/g, ' ') + side;
        }
        return String(v).replace(/_/g, ' ');
      })
      .join(', ') || '';
  }
  if (typeof value === 'object' && (value as any)?.mainRegion) {
    const side = (value as any).laterality && (value as any).laterality !== 'center'
      ? ` (${(value as any).laterality})` : '';
    return (value as any).mainRegion.replace(/-/g, ' ') + side;
  }
  return String(value).replace(/_/g, ' ');
}

// ─── Voice-reactive AI Orb (matches AIBubbleLoader style) ───────────────────

function AIOrb({ volumeLevel, isSpeaking, size = 120 }: { volumeLevel: number; isSpeaking: boolean; size?: number }) {
  const scale = size / 120; // scale factor relative to default

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Ambient glow — expands with voice */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-cyan-400/10 to-teal-500/10 blur-2xl"
        style={{ width: size, height: size }}
        animate={{
          scale: isSpeaking ? [1, 1.3 + volumeLevel * 0.5, 1] : [1, 1.15, 1],
          opacity: isSpeaking ? [0.3, 0.6, 0.3] : [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: isSpeaking ? 1.2 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main central orb — voice reactive */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl"
        style={{
          width: 64 * scale,
          height: 64 * scale,
          boxShadow: `0 8px 32px rgba(6, 182, 212, ${isSpeaking ? 0.3 + volumeLevel * 0.3 : 0.15}), inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
        }}
        animate={{
          scale: isSpeaking ? [1, 1.1 + volumeLevel * 0.15, 1] : [1, 1.08, 1],
          opacity: isSpeaking ? [0.6, 0.9, 0.6] : [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: isSpeaking ? 0.8 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbiting bubble 1 — faster when speaking */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-500/30 backdrop-blur-lg"
        style={{
          width: 32 * scale,
          height: 32 * scale,
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.15)',
        }}
        animate={{
          x: isSpeaking
            ? [0, 30 * scale, 0, -30 * scale, 0]
            : [0, 24 * scale, 0, -24 * scale, 0],
          y: isSpeaking
            ? [0, -30 * scale, 0, 30 * scale, 0]
            : [0, -24 * scale, 0, 24 * scale, 0],
          scale: isSpeaking ? [1, 0.7, 1, 0.7, 1] : [1, 0.85, 1, 0.85, 1],
          opacity: isSpeaking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: isSpeaking ? 2 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbiting bubble 2 */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-teal-300/30 to-cyan-500/30 backdrop-blur-lg"
        style={{
          width: 24 * scale,
          height: 24 * scale,
          boxShadow: '0 4px 16px rgba(20, 184, 166, 0.15)',
        }}
        animate={{
          x: isSpeaking
            ? [0, -28 * scale, 0, 28 * scale, 0]
            : [0, -20 * scale, 0, 20 * scale, 0],
          y: isSpeaking
            ? [0, 28 * scale, 0, -28 * scale, 0]
            : [0, 20 * scale, 0, -20 * scale, 0],
          scale: isSpeaking ? [1, 1.2, 1, 0.8, 1] : [1, 1.05, 1, 0.95, 1],
          opacity: isSpeaking ? [0.5, 0.9, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: isSpeaking ? 1.8 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
      />

      {/* Orbiting bubble 3 — smallest */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-blue-300/30 to-cyan-400/30 backdrop-blur-lg"
        style={{
          width: 18 * scale,
          height: 18 * scale,
          boxShadow: '0 4px 16px rgba(6, 182, 212, 0.1)',
        }}
        animate={{
          x: isSpeaking
            ? [0, 22 * scale, 0, -22 * scale, 0]
            : [0, 16 * scale, 0, -16 * scale, 0],
          y: isSpeaking
            ? [0, -18 * scale, 0, 18 * scale, 0]
            : [0, -14 * scale, 0, 14 * scale, 0],
          scale: isSpeaking ? [1, 0.9, 1, 1.1, 1] : [1, 0.95, 1, 1.05, 1],
          opacity: isSpeaking ? [0.4, 0.7, 0.4] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: isSpeaking ? 1.5 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.7,
        }}
      />
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function RecordingMode({
  volumeLevel,
  extractedFields,
  elapsedMs,
  onStop,
}: RecordingModeProps) {
  const isSpeaking = volumeLevel > 0.04;
  const capturedIds = new Set(Object.keys(extractedFields));
  const capturedCount = capturedIds.size;
  const uncapturedPrompts = CLINICAL_PROMPTS.filter(p => !capturedIds.has(p.id));

  // Build captured insights as natural phrases
  const capturedInsights = ALL_FIELDS
    .filter(f => capturedIds.has(f.id))
    .map(f => {
      const val = formatValue(extractedFields[f.id]);
      if (!val) return null;
      return { label: f.label, value: val };
    })
    .filter(Boolean) as { label: string; value: string }[];

  // Auto-scroll ref for insights
  const insightsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    insightsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [capturedCount]);

  return (
    <div className="h-full bg-white flex flex-col">
      {/* ── Top: status ── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-2 h-2 rounded-full bg-teal-500"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[13px] text-gray-500 font-medium">
              {isSpeaking ? 'Listening...' : capturedCount > 0 ? 'Waiting...' : 'Ready to listen'}
            </span>
          </div>
          {capturedCount > 0 && (
            <span className="text-[12px] text-teal-600 font-medium">
              {capturedCount} captured
            </span>
          )}
        </div>
      </div>

      {/* ── Middle: captured insights + prompts ── */}
      <div className="flex-1 overflow-y-auto px-5">
        {capturedCount === 0 ? (
          /* Before any data captured — show the orb + first prompt */
          <div className="flex flex-col items-center justify-center h-full -mt-8">
            <AIOrb volumeLevel={volumeLevel} isSpeaking={isSpeaking} />
            <p className="text-[15px] text-gray-700 font-medium mt-6 text-center">
              Start your conversation
            </p>
            <p className="text-[13px] text-gray-400 mt-1.5 text-center max-w-[260px]">
              Speak naturally with the patient — the AI will capture clinical details automatically
            </p>
          </div>
        ) : (
          /* Data being captured — show insights + clinical prompts */
          <div className="space-y-1 py-2">
            {/* Captured data as flowing tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <AnimatePresence>
                {capturedInsights.map((insight, i) => (
                  <motion.div
                    key={insight.label}
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-50 border border-teal-200 rounded-lg"
                  >
                    <span className="text-[11px] text-teal-600 font-medium">{insight.label}</span>
                    <span className="text-[12px] text-teal-800 font-medium capitalize">{insight.value}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div ref={insightsEndRef} />

            {/* Clinical prompts — things to ask next */}
            {uncapturedPrompts.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-3">
                  You could ask
                </p>
                <div className="space-y-2">
                  {uncapturedPrompts.slice(0, 4).map((prompt, i) => (
                    <motion.div
                      key={prompt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2.5"
                    >
                      <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${
                        i === 0 ? 'bg-teal-400' : 'bg-gray-300'
                      }`} />
                      <span className={`text-[13px] leading-relaxed ${
                        i === 0 ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        &ldquo;{prompt.prompt}&rdquo;
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom: orb (small) + done button ── */}
      <div className="flex-shrink-0 flex flex-col items-center pb-8 pt-4 gap-3 border-t border-gray-50">
        {capturedCount > 0 && (
          <AIOrb volumeLevel={volumeLevel} isSpeaking={isSpeaking} size={80} />
        )}

        <button
          type="button"
          onClick={onStop}
          className="px-8 py-3 rounded-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-white text-[14px] font-medium transition-all shadow-sm"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
