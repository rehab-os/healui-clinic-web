'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIBubbleLoader } from '@/components/ui/AIBubbleLoader';

// ─────────────────────────────────────────────
// FULLSCREEN OVERLAY
// ─────────────────────────────────────────────
function FullScreenOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClose}
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
          <div style={{ transform: 'scale(2.8)' }}>{children}</div>
        </div>

        {/* Hello there */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h2 className="text-4xl font-light tracking-wide text-white">
            Hello there
          </h2>
          <motion.p
            className="mt-3 text-sm text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            How can I help you today?
          </motion.p>
          <motion.div
            className="mx-auto mt-5 flex justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
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

        {/* Dismiss */}
        <motion.p
          className="text-xs text-white/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          click anywhere to dismiss
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// 1. ORIGINAL — AIBubbleLoader
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 2. PLASMA SWARM — Dense satellites, energetic
// ─────────────────────────────────────────────
function PlasmaSwarmLoader() {
  const satellites = [
    { size: 10, radius: 35, duration: 3.2, delay: 0, color: 'from-purple-400/40 to-violet-500/40' },
    { size: 7, radius: 40, duration: 2.8, delay: 0.3, color: 'from-cyan-300/35 to-teal-400/35' },
    { size: 9, radius: 30, duration: 3.6, delay: 0.7, color: 'from-blue-400/35 to-indigo-500/35' },
    { size: 6, radius: 45, duration: 4.0, delay: 1.0, color: 'from-teal-300/30 to-cyan-500/30' },
    { size: 8, radius: 25, duration: 2.5, delay: 0.5, color: 'from-indigo-300/35 to-purple-400/35' },
    { size: 5, radius: 48, duration: 4.5, delay: 1.3, color: 'from-cyan-400/25 to-blue-400/25' },
  ];

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <motion.div
        className="absolute h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400/50 to-teal-500/50 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 8px 32px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {satellites.map((s, i) => {
        const angle = (i / satellites.length) * Math.PI * 2;
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${s.color} backdrop-blur-lg`}
            style={{
              width: s.size * 4,
              height: s.size * 4,
              boxShadow: '0 4px 16px rgba(6,182,212,0.1)',
            }}
            animate={{
              x: [
                Math.cos(angle) * s.radius,
                Math.cos(angle + Math.PI * 0.66) * s.radius,
                Math.cos(angle + Math.PI * 1.33) * s.radius,
                Math.cos(angle + Math.PI * 2) * s.radius,
              ],
              y: [
                Math.sin(angle) * s.radius,
                Math.sin(angle + Math.PI * 0.66) * s.radius,
                Math.sin(angle + Math.PI * 1.33) * s.radius,
                Math.sin(angle + Math.PI * 2) * s.radius,
              ],
              scale: [1, 0.7, 1.1, 1],
              opacity: [0.4, 0.8, 0.5, 0.4],
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: s.delay,
            }}
          />
        );
      })}
      <motion.div
        className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400/10 to-purple-400/10 blur-2xl"
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. FIREFLY DANCE — Many tiny orbs swarming
// ─────────────────────────────────────────────
function FireflyDanceLoader() {
  const fireflies = Array.from({ length: 12 }).map((_, i) => ({
    size: 4 + Math.random() * 8,
    angle: (i / 12) * Math.PI * 2,
    radius: 15 + Math.random() * 35,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  }));

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-500/30 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 0 40px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {fireflies.map((f, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full backdrop-blur-sm"
          style={{
            width: f.size,
            height: f.size,
            background: `radial-gradient(circle, rgba(6,182,212,${0.5 + Math.random() * 0.4}), rgba(139,92,246,${0.2 + Math.random() * 0.2}))`,
            boxShadow: `0 0 ${f.size * 2}px rgba(6,182,212,0.2)`,
          }}
          animate={{
            x: [
              Math.cos(f.angle) * f.radius,
              Math.cos(f.angle + 1.5) * (f.radius * 0.6),
              Math.cos(f.angle + 3) * f.radius,
              Math.cos(f.angle + 4.5) * (f.radius * 0.8),
              Math.cos(f.angle + 6.28) * f.radius,
            ],
            y: [
              Math.sin(f.angle) * f.radius,
              Math.sin(f.angle + 1.5) * (f.radius * 0.6),
              Math.sin(f.angle + 3) * f.radius,
              Math.sin(f.angle + 4.5) * (f.radius * 0.8),
              Math.sin(f.angle + 6.28) * f.radius,
            ],
            opacity: [0.3, 0.9, 0.4, 0.8, 0.3],
            scale: [1, 0.6, 1.2, 0.8, 1],
          }}
          transition={{
            duration: f.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: f.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 4. LIQUID GLASS — Big overlapping blurred orbs
// ─────────────────────────────────────────────
function LiquidGlassLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div
        className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-400/30 backdrop-blur-2xl"
        style={{
          boxShadow:
            '0 8px 40px rgba(6,182,212,0.15), inset 0 2px 0 rgba(255,255,255,0.3)',
        }}
        animate={{
          x: [-10, 15, -10],
          y: [-5, 10, -5],
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.85, 0.6],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-purple-400/25 to-indigo-400/25 backdrop-blur-2xl"
        style={{
          boxShadow:
            '0 8px 40px rgba(139,92,246,0.12), inset 0 2px 0 rgba(255,255,255,0.25)',
        }}
        animate={{
          x: [12, -15, 12],
          y: [8, -12, 8],
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-blue-300/25 to-cyan-400/25 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 6px 30px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
        animate={{
          x: [5, -20, 5],
          y: [-15, 5, -15],
          scale: [1.1, 0.9, 1.1],
          opacity: [0.45, 0.75, 0.45],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      <motion.div
        className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-cyan-300/8 to-purple-300/8 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 5. QUANTUM FIELD — Orbs phase in/out randomly
// ─────────────────────────────────────────────
function QuantumFieldLoader() {
  const particles = Array.from({ length: 8 }).map((_, i) => ({
    size: 6 + Math.random() * 14,
    positions: Array.from({ length: 4 }).map(() => ({
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 80,
    })),
    duration: 3 + Math.random() * 2,
    delay: i * 0.3,
    color:
      i % 3 === 0
        ? 'from-cyan-400/40 to-teal-500/40'
        : i % 3 === 1
          ? 'from-purple-400/35 to-indigo-500/35'
          : 'from-blue-300/35 to-cyan-400/35',
  }));

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${p.color} backdrop-blur-lg`}
          style={{
            width: p.size,
            height: p.size,
            boxShadow:
              '0 4px 16px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          animate={{
            x: p.positions.map((pos) => pos.x),
            y: p.positions.map((pos) => pos.y),
            opacity: [0, 0.8, 0.3, 0.7, 0],
            scale: [0.5, 1, 0.8, 1.1, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-500/35 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 8px 32px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 6. SPINE FLOW — Vertebrae-like stacked orbs
// ─────────────────────────────────────────────
function SpineFlowLoader() {
  const vertebrae = 7;

  return (
    <div className="relative flex h-36 w-20 items-center justify-center">
      {/* Spinal cord glow line */}
      <motion.div
        className="absolute h-full w-1 rounded-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {Array.from({ length: vertebrae }).map((_, i) => {
        const centerIdx = (vertebrae - 1) / 2;
        const distFromCenter = Math.abs(i - centerIdx) / centerIdx;
        const size = 14 + (1 - distFromCenter) * 10;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-500/35 backdrop-blur-lg"
            style={{
              width: size,
              height: size,
              top: `${(i / (vertebrae - 1)) * 80 + 10}%`,
              boxShadow: `0 4px 16px rgba(6,182,212,${0.1 + (1 - distFromCenter) * 0.1}), inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
            animate={{
              x: [0, Math.sin(i * 0.8) * 8, 0, Math.sin(i * 0.8) * -6, 0],
              scale: [1, 1.15, 1, 1.1, 1],
              opacity: [0.4 + (1 - distFromCenter) * 0.2, 0.7 + (1 - distFromCenter) * 0.2, 0.4 + (1 - distFromCenter) * 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        );
      })}

      {/* Traveling pulse up the spine */}
      <motion.div
        className="absolute h-3 w-3 rounded-full bg-cyan-400/60 backdrop-blur-sm"
        style={{ boxShadow: '0 0 12px rgba(6,182,212,0.4)' }}
        animate={{
          top: ['90%', '10%', '90%'],
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 0.9, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 7. HEALING PULSE — Heartbeat-rhythm orb
// ─────────────────────────────────────────────
function HealingPulseLoader() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {/* Pulse rings — heartbeat timing: quick double-beat then pause */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-teal-400/30"
          style={{ width: 30, height: 30 }}
          animate={{
            width: [30, 100, 100, 30],
            height: [30, 100, 100, 30],
            opacity: [0.5, 0.2, 0, 0],
            borderWidth: [1.5, 0.5, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.2,
            times: [0, 0.3, 0.6, 1],
          }}
        />
      ))}

      {/* Core heartbeat orb — double-pump */}
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-teal-400/50 to-cyan-500/50 backdrop-blur-xl"
        style={{
          boxShadow: '0 0 30px rgba(20,184,166,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
        animate={{
          scale: [1, 1.35, 1.1, 1.3, 1, 1, 1],
          opacity: [0.6, 1, 0.7, 0.95, 0.6, 0.6, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.12, 0.22, 0.32, 0.45, 0.7, 1],
        }}
      />

      {/* Small satellite that orbits in sync */}
      <motion.div
        className="absolute h-4 w-4 rounded-full bg-gradient-to-br from-cyan-300/30 to-teal-400/30 backdrop-blur-md"
        style={{ boxShadow: '0 2px 8px rgba(6,182,212,0.1)' }}
        animate={{
          x: [0, 20, 0, -20, 0],
          y: [20, 0, -20, 0, 20],
          scale: [1, 1.3, 1, 1.3, 1],
          opacity: [0.3, 0.7, 0.3, 0.7, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Glow */}
      <motion.div
        className="absolute h-28 w-28 rounded-full bg-teal-400/5 blur-2xl"
        animate={{
          scale: [1, 1.5, 1.1, 1.4, 1, 1, 1],
          opacity: [0.2, 0.5, 0.3, 0.45, 0.2, 0.2, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.12, 0.22, 0.32, 0.45, 0.7, 1],
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 8. JOINT MOTION — ROM arc with orbiting orb
// ─────────────────────────────────────────────
function JointMotionLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Joint pivot */}
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl"
        style={{
          boxShadow: '0 8px 32px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ROM arc path (visual guide) */}
      <svg className="absolute h-full w-full" viewBox="0 0 128 128">
        <motion.path
          d="M 30 90 A 45 45 0 0 1 98 90"
          fill="none"
          stroke="rgba(6,182,212,0.15)"
          strokeWidth={2}
          strokeDasharray="4 4"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>

      {/* Bone arm 1 — sweeps through ROM */}
      <motion.div
        className="absolute"
        style={{ top: '50%', left: '50%', transformOrigin: '0 0' }}
        animate={{ rotate: [-50, 50, -50] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center">
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-cyan-400/40 to-transparent" />
          <motion.div
            className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-400/40 to-indigo-400/40 backdrop-blur-lg"
            style={{ boxShadow: '0 4px 12px rgba(139,92,246,0.15)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* Bone arm 2 — sweeps opposite */}
      <motion.div
        className="absolute"
        style={{ top: '50%', left: '50%', transformOrigin: '0 0' }}
        animate={{ rotate: [130, 180, 130] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      >
        <div className="flex items-center">
          <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-teal-400/40 to-transparent" />
          <motion.div
            className="h-4 w-4 rounded-full bg-gradient-to-br from-teal-300/40 to-cyan-400/40 backdrop-blur-lg"
            style={{ boxShadow: '0 4px 12px rgba(20,184,166,0.15)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* Energy particles at the joint */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-cyan-400/50"
          style={{ boxShadow: '0 0 8px rgba(6,182,212,0.3)' }}
          animate={{
            x: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10],
            y: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.6,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// 9. RECOVERY WAVE — Orbs growing to represent healing
// ─────────────────────────────────────────────
function RecoveryWaveLoader() {
  const stages = 5;

  return (
    <div className="relative flex h-24 w-36 items-center justify-center">
      {Array.from({ length: stages }).map((_, i) => {
        const progress = i / (stages - 1);
        const baseSize = 8 + progress * 16;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full backdrop-blur-lg"
            style={{
              width: baseSize,
              height: baseSize,
              left: `${15 + progress * 70}%`,
              background: `linear-gradient(135deg, rgba(6,182,212,${0.2 + progress * 0.3}), rgba(20,184,166,${0.2 + progress * 0.3}))`,
              boxShadow: `0 4px ${8 + progress * 12}px rgba(6,182,212,${0.05 + progress * 0.12}), inset 0 1px 0 rgba(255,255,255,${0.15 + progress * 0.15})`,
            }}
            animate={{
              scale: [1, 1.2 + progress * 0.15, 1],
              opacity: [0.3 + progress * 0.2, 0.6 + progress * 0.3, 0.3 + progress * 0.2],
              y: [0, -5 - progress * 5, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.25,
            }}
          />
        );
      })}

      {/* Connecting flow line */}
      <motion.div
        className="absolute h-0.5 w-3/4 rounded-full bg-gradient-to-r from-cyan-400/10 via-cyan-400/25 to-teal-500/40"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Traveling energy dot */}
      <motion.div
        className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400/70 backdrop-blur-sm"
        style={{ boxShadow: '0 0 10px rgba(6,182,212,0.4)' }}
        animate={{
          left: ['12%', '85%', '12%'],
          scale: [0.8, 1.3, 0.8],
          opacity: [0.4, 0.9, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 10. MUSCLE FIBER — Parallel fibers contracting
// ─────────────────────────────────────────────
function MuscleFiberLoader() {
  const fibers = 5;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {Array.from({ length: fibers }).map((_, i) => {
        const yOffset = (i - (fibers - 1) / 2) * 12;
        const isCenter = i === Math.floor(fibers / 2);

        return (
          <React.Fragment key={i}>
            {/* Fiber strand */}
            <motion.div
              className="absolute rounded-full backdrop-blur-md"
              style={{
                width: 60,
                height: isCenter ? 6 : 4,
                top: `calc(50% + ${yOffset}px)`,
                background: `linear-gradient(90deg, transparent, rgba(6,182,212,${isCenter ? 0.4 : 0.25}), rgba(20,184,166,${isCenter ? 0.5 : 0.3}), rgba(6,182,212,${isCenter ? 0.4 : 0.25}), transparent)`,
                boxShadow: isCenter ? '0 0 12px rgba(6,182,212,0.15)' : 'none',
              }}
              animate={{
                scaleX: [1, 0.7, 1, 0.75, 1],
                scaleY: [1, 1.4, 1, 1.3, 1],
                opacity: [0.4, 0.8, 0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.abs(i - (fibers - 1) / 2) * 0.12,
              }}
            />

            {/* End bulbs (sarcomere feel) */}
            {[-1, 1].map((side) => (
              <motion.div
                key={`${i}-${side}`}
                className="absolute rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-400/30 backdrop-blur-sm"
                style={{
                  width: isCenter ? 8 : 6,
                  height: isCenter ? 8 : 6,
                  top: `calc(50% + ${yOffset}px - ${isCenter ? 4 : 3}px + ${isCenter ? 3 : 2}px)`,
                  left: `calc(50% + ${side * 30}px - ${isCenter ? 4 : 3}px)`,
                  boxShadow: '0 2px 8px rgba(6,182,212,0.1)',
                }}
                animate={{
                  x: [0, side * -8, 0, side * -6, 0],
                  scale: [1, 1.3, 1, 1.2, 1],
                  opacity: [0.3, 0.7, 0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: Math.abs(i - (fibers - 1) / 2) * 0.12,
                }}
              />
            ))}
          </React.Fragment>
        );
      })}

      {/* Central glow */}
      <motion.div
        className="absolute h-20 w-20 rounded-full bg-cyan-400/5 blur-2xl"
        animate={{
          scaleX: [1, 0.7, 1],
          scaleY: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 11. DEEP LISTEN — Particles flowing inward
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

// ─────────────────────────────────────────────
// 12. SONAR RECEIVE — Rings contracting inward
// ─────────────────────────────────────────────
function SonarReceiveLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Contracting rings — outside to inside */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full backdrop-blur-[2px]"
          style={{
            border: '1.5px solid rgba(6,182,212,0.25)',
            boxShadow: '0 0 8px rgba(6,182,212,0.05)',
          }}
          animate={{
            width: [120, 20],
            height: [120, 20],
            opacity: [0, 0.6, 0.8, 0],
            borderWidth: [0.5, 2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeIn',
            delay: i * 0.75,
            times: [0, 0.3, 0.7, 1],
          }}
        />
      ))}

      {/* Core — pulses when rings arrive */}
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 0 30px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
        animate={{
          scale: [1, 1.2, 1, 1.15, 1],
          opacity: [0.5, 0.85, 0.55, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.25, 0.5, 0.75, 1],
        }}
      />

      {/* Small glass orb orbiting — "antenna" */}
      <motion.div
        className="absolute h-4 w-4 rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-400/30 backdrop-blur-lg"
        style={{ boxShadow: '0 2px 10px rgba(139,92,246,0.12)' }}
        animate={{
          x: [0, 18, 0, -18, 0],
          y: [-18, 0, 18, 0, -18],
          opacity: [0.4, 0.7, 0.4, 0.7, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 13. ATTENTIVE EYE — Focused listening presence
// ─────────────────────────────────────────────
function AttentiveEyeLoader() {
  return (
    <div className="relative flex h-28 w-36 items-center justify-center">
      {/* Outer eye shape — oval */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-cyan-400/15 to-teal-400/15 backdrop-blur-xl"
        style={{
          width: 120,
          height: 60,
          boxShadow:
            '0 8px 40px rgba(6,182,212,0.1), inset 0 2px 0 rgba(255,255,255,0.15)',
        }}
        animate={{
          scaleY: [1, 1.08, 1, 0.95, 1],
          scaleX: [1, 0.97, 1, 1.02, 1],
          opacity: [0.4, 0.6, 0.4, 0.55, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Mid ring */}
      <motion.div
        className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400/25 to-teal-500/25 backdrop-blur-lg"
        style={{
          boxShadow: '0 4px 20px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Iris — focused pupil */}
      <motion.div
        className="absolute h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400/50 to-teal-600/50 backdrop-blur-xl"
        style={{
          boxShadow: '0 0 20px rgba(6,182,212,0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
        animate={{
          scale: [1, 1.15, 1, 1.1, 1],
          x: [0, 3, 0, -2, 0],
          y: [0, -1, 0, 1, 0],
          opacity: [0.6, 0.9, 0.65, 0.85, 0.6],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pupil highlight */}
      <motion.div
        className="absolute h-2 w-2 rounded-full bg-white/40"
        style={{ marginTop: -4, marginLeft: -3 }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle listening particles drifting toward eye */}
      {[0, 1, 2, 3].map((i) => {
        const startX = (i % 2 === 0 ? -1 : 1) * (55 + i * 5);
        const startY = (i < 2 ? -1 : 1) * (10 + i * 3);
        return (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-cyan-400/30 backdrop-blur-sm"
            animate={{
              x: [startX, startX * 0.3, 0],
              y: [startY, startY * 0.3, 0],
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeIn',
              delay: i * 0.7,
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// 14. BREATH SYNC — Slow deliberate human breath
// ─────────────────────────────────────────────
function BreathSyncLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Outer breath halo */}
      <motion.div
        className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400/8 to-teal-400/8 backdrop-blur-sm"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        animate={{
          scale: [0.85, 1.15, 0.85],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.45, 1],
        }}
      />

      {/* Main breathing orb */}
      <motion.div
        className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-500/30 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 8px 40px rgba(6,182,212,0.15), inset 0 2px 0 rgba(255,255,255,0.3)',
        }}
        animate={{
          scale: [0.9, 1.2, 0.9],
          opacity: [0.45, 0.8, 0.45],
          boxShadow: [
            '0 8px 40px rgba(6,182,212,0.1), inset 0 2px 0 rgba(255,255,255,0.25)',
            '0 8px 60px rgba(6,182,212,0.3), inset 0 2px 0 rgba(255,255,255,0.4)',
            '0 8px 40px rgba(6,182,212,0.1), inset 0 2px 0 rgba(255,255,255,0.25)',
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.45, 1],
        }}
      />

      {/* Inner glow — brightens on inhale */}
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-white/15 to-cyan-300/20 backdrop-blur-md"
        animate={{
          scale: [0.8, 1.3, 0.8],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.45, 1],
        }}
      />

      {/* Companion orbs that breathe in sync */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const radius = 42;
        return (
          <motion.div
            key={i}
            className="absolute h-4 w-4 rounded-full bg-gradient-to-br from-purple-400/25 to-indigo-400/25 backdrop-blur-lg"
            style={{
              boxShadow: '0 2px 10px rgba(139,92,246,0.1)',
              left: `calc(50% + ${Math.cos(angle) * radius}px - 8px)`,
              top: `calc(50% + ${Math.sin(angle) * radius}px - 8px)`,
            }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.25, 0.6, 0.25],
              x: [0, Math.cos(angle) * 5, 0],
              y: [0, Math.sin(angle) * 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.45, 1],
              delay: i * 0.2,
            }}
          />
        );
      })}

      {/* Ambient glow */}
      <motion.div
        className="absolute h-36 w-36 rounded-full bg-cyan-400/5 blur-3xl"
        animate={{
          scale: [0.9, 1.2, 0.9],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.45, 1],
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 15. ECHO ABSORB — Orbs spawning at edge, drifting to center
// ─────────────────────────────────────────────
function EchoAbsorbLoader() {
  const streams = Array.from({ length: 10 }).map((_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 52;
    const size = 4 + Math.random() * 8;
    return {
      angle,
      radius,
      size,
      duration: 2.2 + Math.random() * 1.5,
      delay: i * 0.35,
      color:
        i % 3 === 0
          ? 'from-cyan-400/45 to-teal-500/45'
          : i % 3 === 1
            ? 'from-purple-400/35 to-indigo-400/35'
            : 'from-blue-300/35 to-cyan-400/35',
    };
  });

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Core — glows brighter as it receives */}
      <motion.div
        className="absolute h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl"
        style={{
          boxShadow:
            '0 8px 40px rgba(6,182,212,0.2), inset 0 2px 0 rgba(255,255,255,0.35)',
        }}
        animate={{
          scale: [1, 1.18, 1.05, 1.2, 1],
          opacity: [0.5, 0.85, 0.6, 0.9, 0.5],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Glass reflection */}
      <motion.div
        className="absolute h-7 w-7 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.35), transparent 60%)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inward-flowing orbs */}
      {streams.map((s, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${s.color} backdrop-blur-md`}
          style={{
            width: s.size,
            height: s.size,
            boxShadow: `0 0 ${s.size}px rgba(6,182,212,0.12), inset 0 0.5px 0 rgba(255,255,255,0.2)`,
          }}
          animate={{
            x: [
              Math.cos(s.angle) * s.radius,
              Math.cos(s.angle + 0.2) * (s.radius * 0.4),
              0,
            ],
            y: [
              Math.sin(s.angle) * s.radius,
              Math.sin(s.angle + 0.2) * (s.radius * 0.4),
              0,
            ],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1, 0.2],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            ease: 'easeIn',
            delay: s.delay,
          }}
        />
      ))}

      {/* Glow */}
      <motion.div
        className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/5 to-purple-400/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 16. SIRI EDGE GLOW — iOS 18 style border glow
// ─────────────────────────────────────────────
function SiriEdgeGlowLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Container with animated edge glow */}
      <div className="relative h-28 w-28 overflow-hidden rounded-3xl bg-gray-950/80 backdrop-blur-xl">
        {/* Rotating gradient border glow */}
        <motion.div
          className="absolute -inset-[2px] rounded-3xl"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(6,182,212,0.6), rgba(139,92,246,0.5), rgba(236,72,153,0.4), rgba(6,182,212,0.3), rgba(59,130,246,0.5), rgba(6,182,212,0.6))',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner mask */}
        <div className="absolute inset-[2px] rounded-[22px] bg-gray-950/90" />

        {/* Pulsing inner glow overlay */}
        <motion.div
          className="absolute inset-[2px] rounded-[22px]"
          style={{
            boxShadow:
              'inset 0 0 30px rgba(6,182,212,0.15), inset 0 0 60px rgba(139,92,246,0.08)',
          }}
          animate={{
            boxShadow: [
              'inset 0 0 30px rgba(6,182,212,0.1), inset 0 0 60px rgba(139,92,246,0.05)',
              'inset 0 0 50px rgba(6,182,212,0.25), inset 0 0 80px rgba(139,92,246,0.12)',
              'inset 0 0 30px rgba(6,182,212,0.1), inset 0 0 60px rgba(139,92,246,0.05)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Small center indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="h-2 w-2 rounded-full bg-cyan-400/60"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 17. CHATGPT ORB — Single breathing sphere with surface noise
// ─────────────────────────────────────────────
function ChatGPTOrbLoader() {
  // Simulate surface noise with multiple overlapping layers
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Deep background glow */}
      <motion.div
        className="absolute h-32 w-32 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)' }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main sphere — large, single, breathing */}
      <motion.div
        className="absolute h-24 w-24 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 40% 35%, rgba(6,182,212,0.7), rgba(20,184,166,0.5) 50%, rgba(6,95,130,0.6))',
          boxShadow:
            '0 0 60px rgba(6,182,212,0.25), 0 0 120px rgba(6,182,212,0.1), inset 0 -8px 20px rgba(0,0,0,0.2)',
        }}
        animate={{
          scale: [1, 1.06, 1],
          boxShadow: [
            '0 0 60px rgba(6,182,212,0.2), 0 0 120px rgba(6,182,212,0.08), inset 0 -8px 20px rgba(0,0,0,0.2)',
            '0 0 80px rgba(6,182,212,0.35), 0 0 150px rgba(6,182,212,0.15), inset 0 -8px 20px rgba(0,0,0,0.15)',
            '0 0 60px rgba(6,182,212,0.2), 0 0 120px rgba(6,182,212,0.08), inset 0 -8px 20px rgba(0,0,0,0.2)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Surface noise layer 1 — slow drift */}
      <motion.div
        className="absolute h-24 w-24 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at 60% 30%, rgba(255,255,255,0.12) 0%, transparent 50%)',
        }}
        animate={{
          rotate: [0, 360],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Surface noise layer 2 — counter-rotation */}
      <motion.div
        className="absolute h-22 w-22 rounded-full"
        style={{
          width: 88,
          height: 88,
          background:
            'radial-gradient(ellipse at 30% 70%, rgba(20,184,166,0.15) 0%, transparent 45%)',
        }}
        animate={{
          rotate: [360, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
          opacity: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Fresnel rim light — edges glow brighter */}
      <motion.div
        className="absolute h-24 w-24 rounded-full"
        style={{
          background:
            'radial-gradient(circle, transparent 55%, rgba(6,182,212,0.25) 75%, rgba(6,182,212,0.5) 90%, transparent 100%)',
        }}
        animate={{
          opacity: [0.5, 0.9, 0.5],
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Top highlight — specular */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 40,
          height: 20,
          top: '25%',
          background:
            'radial-gradient(ellipse, rgba(255,255,255,0.3), transparent 70%)',
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 18. GOOGLE DOTS — Four colored morphing dots
// ─────────────────────────────────────────────
function GoogleDotsLoader() {
  const colors = [
    { bg: 'bg-red-400', shadow: 'rgba(248,113,113,0.4)' },
    { bg: 'bg-yellow-400', shadow: 'rgba(250,204,21,0.4)' },
    { bg: 'bg-green-400', shadow: 'rgba(74,222,128,0.4)' },
    { bg: 'bg-blue-400', shadow: 'rgba(96,165,250,0.4)' },
  ];

  return (
    <div className="relative flex h-20 w-36 items-center justify-center">
      <div className="flex items-center gap-3">
        {colors.map((c, i) => (
          <motion.div
            key={i}
            className={`h-4 w-4 rounded-full ${c.bg}`}
            style={{ boxShadow: `0 0 12px ${c.shadow}` }}
            animate={{
              y: [0, -12, 0, 4, 0],
              scale: [1, 1.2, 1, 0.9, 1],
              opacity: [0.7, 1, 0.7, 0.85, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 19. PERPLEXITY SCATTER — Particle cloud gather/scatter
// ─────────────────────────────────────────────
function PerplexityScatterLoader() {
  const dotCount = 24;
  const dots = Array.from({ length: dotCount }).map((_, i) => {
    const angle = (i / dotCount) * Math.PI * 2;
    const tightRadius = 8 + Math.random() * 12;
    const wideRadius = 30 + Math.random() * 25;
    return {
      angle,
      tightRadius,
      wideRadius,
      size: 2.5 + Math.random() * 3.5,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 1.5,
    };
  });

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {dots.map((d, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-cyan-400/70"
          style={{
            width: d.size,
            height: d.size,
            boxShadow: `0 0 ${d.size * 2}px rgba(6,182,212,0.2)`,
          }}
          animate={{
            x: [
              Math.cos(d.angle) * d.tightRadius,
              Math.cos(d.angle + 0.3) * d.wideRadius,
              Math.cos(d.angle + 0.8) * d.tightRadius,
              Math.cos(d.angle + 1.2) * d.wideRadius,
              Math.cos(d.angle + Math.PI * 2) * d.tightRadius,
            ],
            y: [
              Math.sin(d.angle) * d.tightRadius,
              Math.sin(d.angle + 0.3) * d.wideRadius,
              Math.sin(d.angle + 0.8) * d.tightRadius,
              Math.sin(d.angle + 1.2) * d.wideRadius,
              Math.sin(d.angle + Math.PI * 2) * d.tightRadius,
            ],
            opacity: [0.5, 0.9, 0.6, 0.8, 0.5],
            scale: [1, 0.7, 1.2, 0.8, 1],
          }}
          transition={{
            duration: d.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: d.delay,
          }}
        />
      ))}

      {/* Faint center glow */}
      <motion.div
        className="absolute h-6 w-6 rounded-full bg-cyan-400/15 backdrop-blur-sm"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 20. FRESNEL ORB — Rim-lit sphere with inner glow
// ─────────────────────────────────────────────
function FresnelOrbLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Outer ambient */}
      <motion.div
        className="absolute h-32 w-32 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main sphere body */}
      <motion.div
        className="absolute h-20 w-20 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 45% 40%, rgba(15,23,42,0.9) 30%, rgba(6,182,212,0.15) 70%, rgba(6,182,212,0.4) 90%)',
          boxShadow: '0 0 40px rgba(6,182,212,0.15)',
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Fresnel rim — bright glowing edge */}
      <motion.div
        className="absolute h-20 w-20 rounded-full"
        style={{
          background:
            'radial-gradient(circle, transparent 50%, rgba(6,182,212,0.15) 65%, rgba(6,182,212,0.5) 80%, rgba(6,182,212,0.7) 90%, transparent 100%)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.03, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Rim color shift — rotating highlight */}
      <motion.div
        className="absolute h-20 w-20 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,0.3) 15%, transparent 30%, rgba(6,182,212,0.3) 60%, transparent 75%, rgba(20,184,166,0.2) 90%, transparent 100%)',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Specular highlight */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 30,
          height: 14,
          top: '30%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.25), transparent 70%)',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inner subtle pulse */}
      <motion.div
        className="absolute h-8 w-8 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// 21. ALEXA RING — Directional cyan ring spotlight
// ─────────────────────────────────────────────
function AlexaRingLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {/* Base ring */}
      <div
        className="absolute h-28 w-28 rounded-full"
        style={{
          border: '3px solid rgba(6,182,212,0.15)',
          boxShadow: '0 0 15px rgba(6,182,212,0.05), inset 0 0 15px rgba(6,182,212,0.05)',
        }}
      />

      {/* Rotating directional spotlight */}
      <motion.div
        className="absolute h-28 w-28 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(6,182,212,0.7) 0%, rgba(6,182,212,0.4) 8%, transparent 20%, transparent 80%, rgba(6,182,212,0.2) 90%, rgba(6,182,212,0.7) 100%)',
          filter: 'blur(2px)',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Outer glow ring */}
      <motion.div
        className="absolute h-28 w-28 rounded-full"
        style={{
          border: '2px solid transparent',
          boxShadow: '0 0 20px rgba(6,182,212,0.15)',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(6,182,212,0.1)',
            '0 0 35px rgba(6,182,212,0.25)',
            '0 0 20px rgba(6,182,212,0.1)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center breathing dot */}
      <motion.div
        className="absolute h-3 w-3 rounded-full bg-gradient-to-br from-cyan-400/50 to-teal-500/50"
        style={{ boxShadow: '0 0 12px rgba(6,182,212,0.3)' }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// LOADER REGISTRY
// ─────────────────────────────────────────────
interface LoaderEntry {
  id: string;
  name: string;
  description: string;
  component: React.ReactNode;
  tag: string;
}

const loaders: LoaderEntry[] = [
  {
    id: 'bubble-og',
    name: 'AI Bubble',
    description: 'The current glassmorphic orbiting bubble loader',
    component: <AIBubbleLoader />,
    tag: 'Current',
  },
  {
    id: 'plasma-swarm',
    name: 'Plasma Swarm',
    description: '6 satellites orbiting a vibrant core — dense and energetic',
    component: <PlasmaSwarmLoader />,
    tag: 'Energetic',
  },
  {
    id: 'firefly-dance',
    name: 'Firefly Dance',
    description: '12 tiny orbs swarming erratically around a center',
    component: <FireflyDanceLoader />,
    tag: 'Organic',
  },
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    description: 'Large overlapping glassmorphic orbs merging together',
    component: <LiquidGlassLoader />,
    tag: 'Glass',
  },
  {
    id: 'quantum-field',
    name: 'Quantum Field',
    description: 'Particles phasing in/out at random positions',
    component: <QuantumFieldLoader />,
    tag: 'Chaotic',
  },
  {
    id: 'spine-flow',
    name: 'Spine Flow',
    description: 'Vertebrae-like stacked orbs with energy traveling up the spine',
    component: <SpineFlowLoader />,
    tag: 'Physio',
  },
  {
    id: 'healing-pulse',
    name: 'Healing Pulse',
    description: 'Heartbeat-rhythm double-pump with radiating pulse rings',
    component: <HealingPulseLoader />,
    tag: 'Physio',
  },
  {
    id: 'joint-motion',
    name: 'Joint Motion',
    description: 'ROM arc with sweeping arms and energy particles at the pivot',
    component: <JointMotionLoader />,
    tag: 'Physio',
  },
  {
    id: 'recovery-wave',
    name: 'Recovery Wave',
    description: 'Orbs growing left to right — visualizing the healing journey',
    component: <RecoveryWaveLoader />,
    tag: 'Physio',
  },
  {
    id: 'muscle-fiber',
    name: 'Muscle Fiber',
    description: 'Parallel fibers contracting and relaxing — sarcomere feel',
    component: <MuscleFiberLoader />,
    tag: 'Physio',
  },
  {
    id: 'deep-listen',
    name: 'Deep Listen',
    description: '14 particles flowing inward to a breathing core — absorbing your voice',
    component: <DeepListenLoader />,
    tag: 'Listening',
  },
  {
    id: 'sonar-receive',
    name: 'Sonar Receive',
    description: 'Rings contracting inward like receiving sound — focused intake',
    component: <SonarReceiveLoader />,
    tag: 'Listening',
  },
  {
    id: 'attentive-eye',
    name: 'Attentive Eye',
    description: 'Focused oval presence with a tracking iris — I see you, I hear you',
    component: <AttentiveEyeLoader />,
    tag: 'Listening',
  },
  {
    id: 'breath-sync',
    name: 'Breath Sync',
    description: 'Slow deliberate 6s breath cycle with companion orbs — calm, present',
    component: <BreathSyncLoader />,
    tag: 'Listening',
  },
  {
    id: 'echo-absorb',
    name: 'Echo Absorb',
    description: 'Glassmorphic orbs spawning at edges, drifting to a glowing core',
    component: <EchoAbsorbLoader />,
    tag: 'Listening',
  },
  {
    id: 'siri-edge-glow',
    name: 'Siri Edge Glow',
    description: 'iOS 18 style — iridescent border glow rotating around a dark container',
    component: <SiriEdgeGlowLoader />,
    tag: 'Inspired',
  },
  {
    id: 'chatgpt-orb',
    name: 'ChatGPT Orb',
    description: 'Single large sphere with Fresnel rim, surface noise layers, 4s breathing',
    component: <ChatGPTOrbLoader />,
    tag: 'Inspired',
  },
  {
    id: 'google-dots',
    name: 'Google Dots',
    description: 'Four colored dots bouncing in sequence — playful, recognizable',
    component: <GoogleDotsLoader />,
    tag: 'Inspired',
  },
  {
    id: 'perplexity-scatter',
    name: 'Perplexity Scatter',
    description: '24 particles gathering tight then scattering wide — tactile cloud',
    component: <PerplexityScatterLoader />,
    tag: 'Inspired',
  },
  {
    id: 'fresnel-orb',
    name: 'Fresnel Orb',
    description: 'Dark sphere with bright rim-lit edges and rotating color highlights',
    component: <FresnelOrbLoader />,
    tag: 'Inspired',
  },
  {
    id: 'alexa-ring',
    name: 'Alexa Ring',
    description: 'Directional cyan spotlight sweeping around a glowing ring',
    component: <AlexaRingLoader />,
    tag: 'Inspired',
  },
];

// ─────────────────────────────────────────────
// DEMO PAGE
// ─────────────────────────────────────────────
export default function DemoLoadersPage() {
  const [activeLoader, setActiveLoader] = useState<string | null>(null);
  const activeEntry = loaders.find((l) => l.id === activeLoader);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              AI Loader Gallery
            </h1>
            <p className="mt-2 text-gray-500">
              Glassmorphic, alive loader variants — click any to see fullscreen.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loaders.map((loader, idx) => (
              <motion.button
                key={loader.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition-all hover:shadow-xl"
                onClick={() => setActiveLoader(loader.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Preview */}
                <div className="flex h-52 items-center justify-center bg-gray-50/50">
                  {loader.component}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {loader.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        loader.tag === 'Listening'
                          ? 'bg-purple-50 text-purple-600'
                          : loader.tag === 'Inspired'
                            ? 'bg-amber-50 text-amber-600'
                            : loader.tag === 'Physio'
                              ? 'bg-teal-50 text-teal-600'
                              : loader.tag === 'Current'
                                ? 'bg-cyan-50 text-cyan-600'
                                : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {loader.tag}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-500">
                    {loader.description}
                  </p>
                </div>

                {/* Hover hint */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/0 opacity-0 transition-all group-hover:bg-gray-900/5 group-hover:opacity-100">
                  <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-medium text-gray-700 shadow-lg backdrop-blur-sm">
                    Click to expand
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {activeEntry && (
          <FullScreenOverlay onClose={() => setActiveLoader(null)}>
            {activeEntry.component}
          </FullScreenOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
