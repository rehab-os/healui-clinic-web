'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
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
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md" />
      <motion.div
        className="relative z-10 flex flex-col items-center gap-16"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="pointer-events-none absolute -top-32 h-[500px] w-[500px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="flex h-64 w-64 items-center justify-center">
          <div style={{ transform: 'scale(2.8)' }}>{children}</div>
        </div>
        <motion.p
          className="text-xs text-white/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          click anywhere to dismiss
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// EXISTING LOADER COMPONENTS (kept as-is)
// ═══════════════════════════════════════════════

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
        style={{ boxShadow: '0 8px 32px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.4)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {satellites.map((s, i) => {
        const angle = (i / satellites.length) * Math.PI * 2;
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${s.color} backdrop-blur-lg`}
            style={{ width: s.size * 4, height: s.size * 4, boxShadow: '0 4px 16px rgba(6,182,212,0.1)' }}
            animate={{
              x: [Math.cos(angle) * s.radius, Math.cos(angle + Math.PI * 0.66) * s.radius, Math.cos(angle + Math.PI * 1.33) * s.radius, Math.cos(angle + Math.PI * 2) * s.radius],
              y: [Math.sin(angle) * s.radius, Math.sin(angle + Math.PI * 0.66) * s.radius, Math.sin(angle + Math.PI * 1.33) * s.radius, Math.sin(angle + Math.PI * 2) * s.radius],
              scale: [1, 0.7, 1.1, 1],
              opacity: [0.4, 0.8, 0.5, 0.4],
            }}
            transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
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
        style={{ boxShadow: '0 0 40px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.3)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {fireflies.map((f, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full backdrop-blur-sm"
          style={{ width: f.size, height: f.size, background: `radial-gradient(circle, rgba(6,182,212,${0.5 + Math.random() * 0.4}), rgba(139,92,246,${0.2 + Math.random() * 0.2}))`, boxShadow: `0 0 ${f.size * 2}px rgba(6,182,212,0.2)` }}
          animate={{
            x: [Math.cos(f.angle) * f.radius, Math.cos(f.angle + 1.5) * (f.radius * 0.6), Math.cos(f.angle + 3) * f.radius, Math.cos(f.angle + 4.5) * (f.radius * 0.8), Math.cos(f.angle + 6.28) * f.radius],
            y: [Math.sin(f.angle) * f.radius, Math.sin(f.angle + 1.5) * (f.radius * 0.6), Math.sin(f.angle + 3) * f.radius, Math.sin(f.angle + 4.5) * (f.radius * 0.8), Math.sin(f.angle + 6.28) * f.radius],
            opacity: [0.3, 0.9, 0.4, 0.8, 0.3],
            scale: [1, 0.6, 1.2, 0.8, 1],
          }}
          transition={{ duration: f.duration, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
        />
      ))}
    </div>
  );
}

function LiquidGlassLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-400/30 backdrop-blur-2xl" style={{ boxShadow: '0 8px 40px rgba(6,182,212,0.15), inset 0 2px 0 rgba(255,255,255,0.3)' }} animate={{ x: [-10, 15, -10], y: [-5, 10, -5], scale: [1, 1.1, 1], opacity: [0.6, 0.85, 0.6] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-purple-400/25 to-indigo-400/25 backdrop-blur-2xl" style={{ boxShadow: '0 8px 40px rgba(139,92,246,0.12), inset 0 2px 0 rgba(255,255,255,0.25)' }} animate={{ x: [12, -15, 12], y: [8, -12, 8], scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      <motion.div className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-blue-300/25 to-cyan-400/25 backdrop-blur-xl" style={{ boxShadow: '0 6px 30px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.3)' }} animate={{ x: [5, -20, 5], y: [-15, 5, -15], scale: [1.1, 0.9, 1.1], opacity: [0.45, 0.75, 0.45] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      <motion.div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-cyan-300/8 to-purple-300/8 blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

function QuantumFieldLoader() {
  const particles = Array.from({ length: 8 }).map((_, i) => ({
    size: 6 + Math.random() * 14,
    positions: Array.from({ length: 4 }).map(() => ({ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 })),
    duration: 3 + Math.random() * 2,
    delay: i * 0.3,
    color: i % 3 === 0 ? 'from-cyan-400/40 to-teal-500/40' : i % 3 === 1 ? 'from-purple-400/35 to-indigo-500/35' : 'from-blue-300/35 to-cyan-400/35',
  }));
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {particles.map((p, i) => (
        <motion.div key={i} className={`absolute rounded-full bg-gradient-to-br ${p.color} backdrop-blur-lg`} style={{ width: p.size, height: p.size, boxShadow: '0 4px 16px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.2)' }}
          animate={{ x: p.positions.map((pos) => pos.x), y: p.positions.map((pos) => pos.y), opacity: [0, 0.8, 0.3, 0.7, 0], scale: [0.5, 1, 0.8, 1.1, 0.5] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
      <motion.div className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-500/35 backdrop-blur-xl" style={{ boxShadow: '0 8px 32px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.3)' }} animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

function SpineFlowLoader() {
  const vertebrae = 7;
  return (
    <div className="relative flex h-36 w-20 items-center justify-center">
      <motion.div className="absolute h-full w-1 rounded-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
      {Array.from({ length: vertebrae }).map((_, i) => {
        const centerIdx = (vertebrae - 1) / 2;
        const distFromCenter = Math.abs(i - centerIdx) / centerIdx;
        const size = 14 + (1 - distFromCenter) * 10;
        return (
          <motion.div key={i} className="absolute rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-500/35 backdrop-blur-lg"
            style={{ width: size, height: size, top: `${(i / (vertebrae - 1)) * 80 + 10}%`, boxShadow: `0 4px 16px rgba(6,182,212,${0.1 + (1 - distFromCenter) * 0.1}), inset 0 1px 0 rgba(255,255,255,0.25)` }}
            animate={{ x: [0, Math.sin(i * 0.8) * 8, 0, Math.sin(i * 0.8) * -6, 0], scale: [1, 1.15, 1, 1.1, 1], opacity: [0.4 + (1 - distFromCenter) * 0.2, 0.7 + (1 - distFromCenter) * 0.2, 0.4 + (1 - distFromCenter) * 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
          />
        );
      })}
      <motion.div className="absolute h-3 w-3 rounded-full bg-cyan-400/60 backdrop-blur-sm" style={{ boxShadow: '0 0 12px rgba(6,182,212,0.4)' }}
        animate={{ top: ['90%', '10%', '90%'], scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function HealingPulseLoader() {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute rounded-full border border-teal-400/30" style={{ width: 30, height: 30 }}
          animate={{ width: [30, 100, 100, 30], height: [30, 100, 100, 30], opacity: [0.5, 0.2, 0, 0], borderWidth: [1.5, 0.5, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: i * 0.2, times: [0, 0.3, 0.6, 1] }}
        />
      ))}
      <motion.div className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-teal-400/50 to-cyan-500/50 backdrop-blur-xl" style={{ boxShadow: '0 0 30px rgba(20,184,166,0.25), inset 0 1px 0 rgba(255,255,255,0.35)' }}
        animate={{ scale: [1, 1.35, 1.1, 1.3, 1, 1, 1], opacity: [0.6, 1, 0.7, 0.95, 0.6, 0.6, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.12, 0.22, 0.32, 0.45, 0.7, 1] }}
      />
      <motion.div className="absolute h-4 w-4 rounded-full bg-gradient-to-br from-cyan-300/30 to-teal-400/30 backdrop-blur-md" style={{ boxShadow: '0 2px 8px rgba(6,182,212,0.1)' }}
        animate={{ x: [0, 20, 0, -20, 0], y: [20, 0, -20, 0, 20], scale: [1, 1.3, 1, 1.3, 1], opacity: [0.3, 0.7, 0.3, 0.7, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-28 w-28 rounded-full bg-teal-400/5 blur-2xl"
        animate={{ scale: [1, 1.5, 1.1, 1.4, 1, 1, 1], opacity: [0.2, 0.5, 0.3, 0.45, 0.2, 0.2, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.12, 0.22, 0.32, 0.45, 0.7, 1] }}
      />
    </div>
  );
}

function JointMotionLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl" style={{ boxShadow: '0 8px 32px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.35)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.85, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg className="absolute h-full w-full" viewBox="0 0 128 128">
        <motion.path d="M 30 90 A 45 45 0 0 1 98 90" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth={2} strokeDasharray="4 4"
          animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
      <motion.div className="absolute" style={{ top: '50%', left: '50%', transformOrigin: '0 0' }} animate={{ rotate: [-50, 50, -50] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="flex items-center">
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-cyan-400/40 to-transparent" />
          <motion.div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-400/40 to-indigo-400/40 backdrop-blur-lg" style={{ boxShadow: '0 4px 12px rgba(139,92,246,0.15)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
      <motion.div className="absolute" style={{ top: '50%', left: '50%', transformOrigin: '0 0' }} animate={{ rotate: [130, 180, 130] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}>
        <div className="flex items-center">
          <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-teal-400/40 to-transparent" />
          <motion.div className="h-4 w-4 rounded-full bg-gradient-to-br from-teal-300/40 to-cyan-400/40 backdrop-blur-lg" style={{ boxShadow: '0 4px 12px rgba(20,184,166,0.15)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute h-2 w-2 rounded-full bg-cyan-400/50" style={{ boxShadow: '0 0 8px rgba(6,182,212,0.3)' }}
          animate={{ x: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10], y: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10], opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        />
      ))}
    </div>
  );
}

function RecoveryWaveLoader() {
  const stages = 5;
  return (
    <div className="relative flex h-24 w-36 items-center justify-center">
      {Array.from({ length: stages }).map((_, i) => {
        const progress = i / (stages - 1);
        const baseSize = 8 + progress * 16;
        return (
          <motion.div key={i} className="absolute rounded-full backdrop-blur-lg"
            style={{ width: baseSize, height: baseSize, left: `${15 + progress * 70}%`, background: `linear-gradient(135deg, rgba(6,182,212,${0.2 + progress * 0.3}), rgba(20,184,166,${0.2 + progress * 0.3}))`, boxShadow: `0 4px ${8 + progress * 12}px rgba(6,182,212,${0.05 + progress * 0.12}), inset 0 1px 0 rgba(255,255,255,${0.15 + progress * 0.15})` }}
            animate={{ scale: [1, 1.2 + progress * 0.15, 1], opacity: [0.3 + progress * 0.2, 0.6 + progress * 0.3, 0.3 + progress * 0.2], y: [0, -5 - progress * 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
          />
        );
      })}
      <motion.div className="absolute h-0.5 w-3/4 rounded-full bg-gradient-to-r from-cyan-400/10 via-cyan-400/25 to-teal-500/40" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400/70 backdrop-blur-sm" style={{ boxShadow: '0 0 10px rgba(6,182,212,0.4)' }}
        animate={{ left: ['12%', '85%', '12%'], scale: [0.8, 1.3, 0.8], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function MuscleFiberLoader() {
  const fibers = 5;
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {Array.from({ length: fibers }).map((_, i) => {
        const yOffset = (i - (fibers - 1) / 2) * 12;
        const isCenter = i === Math.floor(fibers / 2);
        return (
          <React.Fragment key={i}>
            <motion.div className="absolute rounded-full backdrop-blur-md"
              style={{ width: 60, height: isCenter ? 6 : 4, top: `calc(50% + ${yOffset}px)`, background: `linear-gradient(90deg, transparent, rgba(6,182,212,${isCenter ? 0.4 : 0.25}), rgba(20,184,166,${isCenter ? 0.5 : 0.3}), rgba(6,182,212,${isCenter ? 0.4 : 0.25}), transparent)`, boxShadow: isCenter ? '0 0 12px rgba(6,182,212,0.15)' : 'none' }}
              animate={{ scaleX: [1, 0.7, 1, 0.75, 1], scaleY: [1, 1.4, 1, 1.3, 1], opacity: [0.4, 0.8, 0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: Math.abs(i - (fibers - 1) / 2) * 0.12 }}
            />
            {[-1, 1].map((side) => (
              <motion.div key={`${i}-${side}`} className="absolute rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-400/30 backdrop-blur-sm"
                style={{ width: isCenter ? 8 : 6, height: isCenter ? 8 : 6, top: `calc(50% + ${yOffset}px - ${isCenter ? 4 : 3}px + ${isCenter ? 3 : 2}px)`, left: `calc(50% + ${side * 30}px - ${isCenter ? 4 : 3}px)`, boxShadow: '0 2px 8px rgba(6,182,212,0.1)' }}
                animate={{ x: [0, side * -8, 0, side * -6, 0], scale: [1, 1.3, 1, 1.2, 1], opacity: [0.3, 0.7, 0.3, 0.6, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: Math.abs(i - (fibers - 1) / 2) * 0.12 }}
              />
            ))}
          </React.Fragment>
        );
      })}
      <motion.div className="absolute h-20 w-20 rounded-full bg-cyan-400/5 blur-2xl" animate={{ scaleX: [1, 0.7, 1], scaleY: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

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
      <motion.div className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400/35 to-teal-500/35 backdrop-blur-xl" style={{ boxShadow: '0 8px 40px rgba(6,182,212,0.2), inset 0 2px 0 rgba(255,255,255,0.3)' }}
        animate={{ scale: [1, 1.12, 1.05, 1.15, 1], opacity: [0.5, 0.75, 0.6, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-white/20 to-cyan-300/20 backdrop-blur-sm" animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      {particles.map((p, i) => (
        <motion.div key={i} className="absolute rounded-full backdrop-blur-sm"
          style={{ width: p.size, height: p.size, background: `radial-gradient(circle, rgba(6,182,212,${0.4 + Math.random() * 0.3}), rgba(139,92,246,${0.15 + Math.random() * 0.15}))`, boxShadow: `0 0 ${p.size * 2}px rgba(6,182,212,0.15)` }}
          animate={{ x: [Math.cos(p.angle) * p.startRadius, Math.cos(p.angle + 0.3) * (p.startRadius * 0.5), Math.cos(p.angle + 0.5) * 5], y: [Math.sin(p.angle) * p.startRadius, Math.sin(p.angle + 0.3) * (p.startRadius * 0.5), Math.sin(p.angle + 0.5) * 5], opacity: [0, 0.8, 0], scale: [0.6, 1, 0.3] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeIn', delay: p.delay }}
        />
      ))}
      <motion.div className="absolute h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl" animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

function SonarReceiveLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i} className="absolute rounded-full backdrop-blur-[2px]" style={{ border: '1.5px solid rgba(6,182,212,0.25)', boxShadow: '0 0 8px rgba(6,182,212,0.05)' }}
          animate={{ width: [120, 20], height: [120, 20], opacity: [0, 0.6, 0.8, 0], borderWidth: [0.5, 2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeIn', delay: i * 0.75, times: [0, 0.3, 0.7, 1] }}
        />
      ))}
      <motion.div className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl" style={{ boxShadow: '0 0 30px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.35)' }}
        animate={{ scale: [1, 1.2, 1, 1.15, 1], opacity: [0.5, 0.85, 0.55, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }}
      />
      <motion.div className="absolute h-4 w-4 rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-400/30 backdrop-blur-lg" style={{ boxShadow: '0 2px 10px rgba(139,92,246,0.12)' }}
        animate={{ x: [0, 18, 0, -18, 0], y: [-18, 0, 18, 0, -18], opacity: [0.4, 0.7, 0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function AttentiveEyeLoader() {
  return (
    <div className="relative flex h-28 w-36 items-center justify-center">
      <motion.div className="absolute rounded-full bg-gradient-to-br from-cyan-400/15 to-teal-400/15 backdrop-blur-xl" style={{ width: 120, height: 60, boxShadow: '0 8px 40px rgba(6,182,212,0.1), inset 0 2px 0 rgba(255,255,255,0.15)' }}
        animate={{ scaleY: [1, 1.08, 1, 0.95, 1], scaleX: [1, 0.97, 1, 1.02, 1], opacity: [0.4, 0.6, 0.4, 0.55, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400/25 to-teal-500/25 backdrop-blur-lg" style={{ boxShadow: '0 4px 20px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.25)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400/50 to-teal-600/50 backdrop-blur-xl" style={{ boxShadow: '0 0 20px rgba(6,182,212,0.25), inset 0 1px 0 rgba(255,255,255,0.4)' }}
        animate={{ scale: [1, 1.15, 1, 1.1, 1], x: [0, 3, 0, -2, 0], y: [0, -1, 0, 1, 0], opacity: [0.6, 0.9, 0.65, 0.85, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-2 w-2 rounded-full bg-white/40" style={{ marginTop: -4, marginLeft: -3 }} animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      {[0, 1, 2, 3].map((i) => {
        const startX = (i % 2 === 0 ? -1 : 1) * (55 + i * 5);
        const startY = (i < 2 ? -1 : 1) * (10 + i * 3);
        return (
          <motion.div key={i} className="absolute h-2 w-2 rounded-full bg-cyan-400/30 backdrop-blur-sm"
            animate={{ x: [startX, startX * 0.3, 0], y: [startY, startY * 0.3, 0], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeIn', delay: i * 0.7 }}
          />
        );
      })}
    </div>
  );
}

function BreathSyncLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400/8 to-teal-400/8 backdrop-blur-sm" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}
        animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] }}
      />
      <motion.div className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-500/30 backdrop-blur-xl" style={{ boxShadow: '0 8px 40px rgba(6,182,212,0.15), inset 0 2px 0 rgba(255,255,255,0.3)' }}
        animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] }}
      />
      <motion.div className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-white/15 to-cyan-300/20 backdrop-blur-md" animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] }} />
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const radius = 42;
        return (
          <motion.div key={i} className="absolute h-4 w-4 rounded-full bg-gradient-to-br from-purple-400/25 to-indigo-400/25 backdrop-blur-lg"
            style={{ boxShadow: '0 2px 10px rgba(139,92,246,0.1)', left: `calc(50% + ${Math.cos(angle) * radius}px - 8px)`, top: `calc(50% + ${Math.sin(angle) * radius}px - 8px)` }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.25, 0.6, 0.25], x: [0, Math.cos(angle) * 5, 0], y: [0, Math.sin(angle) * 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1], delay: i * 0.2 }}
          />
        );
      })}
      <motion.div className="absolute h-36 w-36 rounded-full bg-cyan-400/5 blur-3xl" animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 1] }} />
    </div>
  );
}

function EchoAbsorbLoader() {
  const streams = Array.from({ length: 10 }).map((_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 52;
    const size = 4 + Math.random() * 8;
    return { angle, radius, size, duration: 2.2 + Math.random() * 1.5, delay: i * 0.35, color: i % 3 === 0 ? 'from-cyan-400/45 to-teal-500/45' : i % 3 === 1 ? 'from-purple-400/35 to-indigo-400/35' : 'from-blue-300/35 to-cyan-400/35' };
  });
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div className="absolute h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl" style={{ boxShadow: '0 8px 40px rgba(6,182,212,0.2), inset 0 2px 0 rgba(255,255,255,0.35)' }}
        animate={{ scale: [1, 1.18, 1.05, 1.2, 1], opacity: [0.5, 0.85, 0.6, 0.9, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-7 w-7 rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.35), transparent 60%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {streams.map((s, i) => (
        <motion.div key={i} className={`absolute rounded-full bg-gradient-to-br ${s.color} backdrop-blur-md`}
          style={{ width: s.size, height: s.size, boxShadow: `0 0 ${s.size}px rgba(6,182,212,0.12), inset 0 0.5px 0 rgba(255,255,255,0.2)` }}
          animate={{ x: [Math.cos(s.angle) * s.radius, Math.cos(s.angle + 0.2) * (s.radius * 0.4), 0], y: [Math.sin(s.angle) * s.radius, Math.sin(s.angle + 0.2) * (s.radius * 0.4), 0], opacity: [0, 0.7, 0], scale: [0.5, 1, 0.2] }}
          transition={{ duration: s.duration, repeat: Infinity, ease: 'easeIn', delay: s.delay }}
        />
      ))}
      <motion.div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/5 to-purple-400/5 blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

function SiriEdgeGlowLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div className="relative h-28 w-28 overflow-hidden rounded-3xl bg-gray-950/80 backdrop-blur-xl">
        <motion.div className="absolute -inset-[2px] rounded-3xl" style={{ background: 'conic-gradient(from 0deg, rgba(6,182,212,0.6), rgba(139,92,246,0.5), rgba(236,72,153,0.4), rgba(6,182,212,0.3), rgba(59,130,246,0.5), rgba(6,182,212,0.6))' }}
          animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-[2px] rounded-[22px] bg-gray-950/90" />
        <motion.div className="absolute inset-[2px] rounded-[22px]" style={{ boxShadow: 'inset 0 0 30px rgba(6,182,212,0.15), inset 0 0 60px rgba(139,92,246,0.08)' }}
          animate={{ boxShadow: ['inset 0 0 30px rgba(6,182,212,0.1), inset 0 0 60px rgba(139,92,246,0.05)', 'inset 0 0 50px rgba(6,182,212,0.25), inset 0 0 80px rgba(139,92,246,0.12)', 'inset 0 0 30px rgba(6,182,212,0.1), inset 0 0 60px rgba(139,92,246,0.05)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div className="h-2 w-2 rounded-full bg-cyan-400/60" animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
      </div>
    </div>
  );
}

function ChatGPTOrbLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div className="absolute h-32 w-32 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-24 w-24 rounded-full"
        style={{ background: 'radial-gradient(circle at 40% 35%, rgba(6,182,212,0.7), rgba(20,184,166,0.5) 50%, rgba(6,95,130,0.6))', boxShadow: '0 0 60px rgba(6,182,212,0.25), 0 0 120px rgba(6,182,212,0.1), inset 0 -8px 20px rgba(0,0,0,0.2)' }}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-24 w-24 rounded-full" style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(255,255,255,0.12) 0%, transparent 50%)' }}
        animate={{ rotate: [0, 360], opacity: [0.5, 0.8, 0.5] }}
        transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
      />
      <motion.div className="absolute rounded-full" style={{ width: 88, height: 88, background: 'radial-gradient(ellipse at 30% 70%, rgba(20,184,166,0.15) 0%, transparent 45%)' }}
        animate={{ rotate: [360, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ rotate: { duration: 15, repeat: Infinity, ease: 'linear' }, opacity: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
      />
      <motion.div className="absolute h-24 w-24 rounded-full" style={{ background: 'radial-gradient(circle, transparent 55%, rgba(6,182,212,0.25) 75%, rgba(6,182,212,0.5) 90%, transparent 100%)' }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute rounded-full" style={{ width: 40, height: 20, top: '25%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.3), transparent 70%)' }}
        animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

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
          <motion.div key={i} className={`h-4 w-4 rounded-full ${c.bg}`} style={{ boxShadow: `0 0 12px ${c.shadow}` }}
            animate={{ y: [0, -12, 0, 4, 0], scale: [1, 1.2, 1, 0.9, 1], opacity: [0.7, 1, 0.7, 0.85, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function PerplexityScatterLoader() {
  const dotCount = 24;
  const dots = Array.from({ length: dotCount }).map((_, i) => {
    const angle = (i / dotCount) * Math.PI * 2;
    return { angle, tightRadius: 8 + Math.random() * 12, wideRadius: 30 + Math.random() * 25, size: 2.5 + Math.random() * 3.5, duration: 3 + Math.random() * 2, delay: Math.random() * 1.5 };
  });
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      {dots.map((d, i) => (
        <motion.div key={i} className="absolute rounded-full bg-cyan-400/70" style={{ width: d.size, height: d.size, boxShadow: `0 0 ${d.size * 2}px rgba(6,182,212,0.2)` }}
          animate={{
            x: [Math.cos(d.angle) * d.tightRadius, Math.cos(d.angle + 0.3) * d.wideRadius, Math.cos(d.angle + 0.8) * d.tightRadius, Math.cos(d.angle + 1.2) * d.wideRadius, Math.cos(d.angle + Math.PI * 2) * d.tightRadius],
            y: [Math.sin(d.angle) * d.tightRadius, Math.sin(d.angle + 0.3) * d.wideRadius, Math.sin(d.angle + 0.8) * d.tightRadius, Math.sin(d.angle + 1.2) * d.wideRadius, Math.sin(d.angle + Math.PI * 2) * d.tightRadius],
            opacity: [0.5, 0.9, 0.6, 0.8, 0.5], scale: [1, 0.7, 1.2, 0.8, 1],
          }}
          transition={{ duration: d.duration, repeat: Infinity, ease: 'easeInOut', delay: d.delay }}
        />
      ))}
      <motion.div className="absolute h-6 w-6 rounded-full bg-cyan-400/15 backdrop-blur-sm" animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}

function FresnelOrbLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <motion.div className="absolute h-32 w-32 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-20 w-20 rounded-full" style={{ background: 'radial-gradient(circle at 45% 40%, rgba(15,23,42,0.9) 30%, rgba(6,182,212,0.15) 70%, rgba(6,182,212,0.4) 90%)', boxShadow: '0 0 40px rgba(6,182,212,0.15)' }}
        animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-20 w-20 rounded-full" style={{ background: 'radial-gradient(circle, transparent 50%, rgba(6,182,212,0.15) 65%, rgba(6,182,212,0.5) 80%, rgba(6,182,212,0.7) 90%, transparent 100%)' }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-20 w-20 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,0.3) 15%, transparent 30%, rgba(6,182,212,0.3) 60%, transparent 75%, rgba(20,184,166,0.2) 90%, transparent 100%)' }}
        animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div className="absolute rounded-full" style={{ width: 30, height: 14, top: '30%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.25), transparent 70%)' }}
        animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-8 w-8 rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)' }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function AlexaRingLoader() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div className="absolute h-28 w-28 rounded-full" style={{ border: '3px solid rgba(6,182,212,0.15)', boxShadow: '0 0 15px rgba(6,182,212,0.05), inset 0 0 15px rgba(6,182,212,0.05)' }} />
      <motion.div className="absolute h-28 w-28 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(6,182,212,0.7) 0%, rgba(6,182,212,0.4) 8%, transparent 20%, transparent 80%, rgba(6,182,212,0.2) 90%, rgba(6,182,212,0.7) 100%)', filter: 'blur(2px)' }}
        animate={{ rotate: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div className="absolute h-28 w-28 rounded-full" style={{ border: '2px solid transparent', boxShadow: '0 0 20px rgba(6,182,212,0.15)' }}
        animate={{ boxShadow: ['0 0 20px rgba(6,182,212,0.1)', '0 0 35px rgba(6,182,212,0.25)', '0 0 20px rgba(6,182,212,0.1)'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="absolute h-3 w-3 rounded-full bg-gradient-to-br from-cyan-400/50 to-teal-500/50" style={{ boxShadow: '0 0 12px rgba(6,182,212,0.3)' }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// NEW INLINE / COMPACT LOADERS
// ═══════════════════════════════════════════════

function DotPulseLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dotSize = size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const gap = size === 'sm' ? 'gap-0.5' : size === 'md' ? 'gap-1' : 'gap-1.5';
  return (
    <div className={`flex items-center ${gap}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${dotSize} rounded-full bg-teal-500`}
          animate={{ scale: [1, 1.4, 1], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function SpinRingLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 16 : size === 'md' ? 20 : 28;
  const stroke = size === 'sm' ? 2 : size === 'md' ? 2.5 : 3;
  const r = (dim - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <motion.svg
      width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="rgba(20,184,166,0.15)" strokeWidth={stroke} />
      <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="url(#tealGrad)" strokeWidth={stroke}
        strokeDasharray={`${circ * 0.3} ${circ * 0.7}`} strokeLinecap="round"
      />
      <defs>
        <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

function MiniOrbLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 12 : size === 'md' ? 16 : 24;
  return (
    <motion.div
      className="rounded-full bg-gradient-to-br from-cyan-400/60 to-teal-500/60"
      style={{ width: dim, height: dim, boxShadow: `0 0 ${dim}px rgba(6,182,212,0.25)` }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function BarSlideLoader() {
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-teal-500/10">
      <motion.div
        className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-teal-500 to-transparent"
        animate={{ left: ['-33%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// NEW SKELETON LOADERS
// ═══════════════════════════════════════════════

function SkeletonShimmer({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-200/70 ${className ?? ''}`}>
      <motion.div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function SkeletonCardLoader() {
  return (
    <div className="w-72 rounded-xl border border-gray-200 bg-white p-5">
      <SkeletonShimmer className="mb-4 h-36 w-full" />
      <SkeletonShimmer className="mb-2 h-4 w-3/4" />
      <SkeletonShimmer className="mb-4 h-3 w-1/2" />
      <div className="flex items-center gap-3">
        <SkeletonShimmer className="h-8 w-8 !rounded-full" />
        <div className="flex-1">
          <SkeletonShimmer className="mb-1 h-3 w-2/3" />
          <SkeletonShimmer className="h-2 w-1/3" />
        </div>
      </div>
    </div>
  );
}

function SkeletonListLoader() {
  return (
    <div className="w-72 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3">
          <SkeletonShimmer className="h-10 w-10 !rounded-full" />
          <div className="flex-1">
            <SkeletonShimmer className="mb-1.5 h-3.5 w-4/5" />
            <SkeletonShimmer className="h-2.5 w-3/5" />
          </div>
          <SkeletonShimmer className="h-6 w-14 !rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════

const NAV_SECTIONS = [
  { id: 'hero', label: 'Brand Loader' },
  { id: 'ai-processing', label: 'AI Processing' },
  { id: 'inline', label: 'Inline & Compact' },
  { id: 'skeleton', label: 'Skeletons' },
  { id: 'voice', label: 'Voice & Listening' },
  { id: 'physio', label: 'Physio-Themed' },
  { id: 'inspired', label: 'Industry Inspired' },
];

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className="mb-10"
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        {badge && (
          <span className="rounded-full bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

interface LoaderShowcaseProps {
  name: string;
  description: string;
  children: React.ReactNode;
  recommended?: boolean;
  onExpand?: () => void;
}

function LoaderShowcase({ name, description, children, recommended, onExpand }: LoaderShowcaseProps) {
  return (
    <motion.div
      className="group relative"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Light background preview */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button
          onClick={onExpand}
          className="relative flex h-44 w-full items-center justify-center bg-gradient-to-br from-gray-50 to-white transition-colors hover:from-gray-100/50 hover:to-gray-50"
        >
          {children}
          {recommended && (
            <div className="absolute top-3 right-3">
              <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Recommended
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/0 opacity-0 transition-all group-hover:bg-gray-900/5 group-hover:opacity-100">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-600 shadow-md backdrop-blur-sm">
              Expand
            </span>
          </div>
        </button>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DualBgShowcase({ name, description, children, recommended, onExpand }: LoaderShowcaseProps) {
  return (
    <motion.div className="group relative" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button onClick={onExpand} className="relative flex w-full">
          {/* Light half */}
          <div className="flex h-44 w-1/2 items-center justify-center bg-gradient-to-br from-gray-50 to-white">
            {children}
          </div>
          {/* Dark half */}
          <div className="flex h-44 w-1/2 items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 border-l border-gray-200">
            {children}
          </div>
          {recommended && (
            <div className="absolute top-3 right-3 z-10">
              <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Recommended
              </span>
            </div>
          )}
        </button>
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════
export default function DemoLoadersPage() {
  const [activeLoader, setActiveLoader] = useState<React.ReactNode | null>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    NAV_SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50/80">
        {/* ─── Top bar ─── */}
        <div className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900 tracking-tight">HealUI Loaders</span>
            </div>

            {/* Section nav */}
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {NAV_SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    activeSection === id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 1 — HERO / BRAND LOADER
        ═══════════════════════════════════════════ */}
        <section
          id="hero"
          ref={(el) => { sectionRefs.current['hero'] = el; }}
          className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
        >
          {/* Ambient bg effects */}
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1], x: [-20, 20, -20] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], y: [-10, 10, -10] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-24">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Loader showcase */}
              <div className="flex-1 flex items-center justify-center">
                <div className="relative">
                  <div style={{ transform: 'scale(2.5)' }}>
                    <AIBubbleLoader />
                  </div>
                  {/* Glow ring */}
                  <motion.div
                    className="pointer-events-none absolute -inset-20 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)' }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-block rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-400 mb-4 tracking-wide uppercase">
                    Brand Signature
                  </span>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
                    AI Bubble Loader
                  </h1>
                  <p className="text-gray-400 text-base leading-relaxed max-w-md mb-8">
                    The primary loader for HealUI. Glassmorphic orbiting bubbles in our teal/cyan palette.
                    Use for app startup, full-page transitions, and AI greeting screens.
                  </p>

                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <button
                      onClick={() => setActiveLoader(<AIBubbleLoader />)}
                      className="rounded-full bg-white/10 border border-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/20"
                    >
                      Preview Full Screen
                    </button>
                    <div className="flex items-center gap-2 rounded-full bg-gray-800/50 border border-gray-700/50 px-4 py-2.5">
                      <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-xs text-gray-400">Default for all page loads</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6">
          {/* ═══════════════════════════════════════════
              SECTION 2 — AI PROCESSING
          ═══════════════════════════════════════════ */}
          <section
            id="ai-processing"
            ref={(el) => { sectionRefs.current['ai-processing'] = el; }}
            className="py-16 border-b border-gray-200/60"
          >
            <SectionHeader
              title="AI Processing"
              subtitle="When the AI is thinking, analyzing, or generating results. These feel intelligent and alive. Best on dark backgrounds or modals."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <DualBgShowcase name="AI Bubble" description="Brand signature — orbiting glassmorphic bubbles" recommended onExpand={() => setActiveLoader(<AIBubbleLoader />)}>
                <AIBubbleLoader />
              </DualBgShowcase>
              <DualBgShowcase name="Plasma Swarm" description="Dense 6-satellite orbit — energetic, high-activity" onExpand={() => setActiveLoader(<PlasmaSwarmLoader />)}>
                <PlasmaSwarmLoader />
              </DualBgShowcase>
              <DualBgShowcase name="Liquid Glass" description="Overlapping glass orbs merging — smooth, contemplative" onExpand={() => setActiveLoader(<LiquidGlassLoader />)}>
                <LiquidGlassLoader />
              </DualBgShowcase>
              <DualBgShowcase name="ChatGPT Orb" description="Single sphere with Fresnel rim — focused, powerful" onExpand={() => setActiveLoader(<ChatGPTOrbLoader />)}>
                <ChatGPTOrbLoader />
              </DualBgShowcase>
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 3 — INLINE & COMPACT
          ═══════════════════════════════════════════ */}
          <section
            id="inline"
            ref={(el) => { sectionRefs.current['inline'] = el; }}
            className="py-16 border-b border-gray-200/60"
          >
            <SectionHeader
              title="Inline & Compact"
              subtitle="Small loaders for buttons, cards, table cells, and inline content. These are the workhorses — used hundreds of times across the app."
              badge="Essential"
            />

            {/* Size comparison strip */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-5">Size Variants</p>
              <div className="grid grid-cols-3 gap-8">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <div key={size} className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mb-4">{size}</p>
                    <div className="flex flex-col items-center gap-5">
                      <div className="flex items-center gap-2">
                        <DotPulseLoader size={size} />
                        <span className="text-[10px] text-gray-400 ml-1">Dot Pulse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SpinRingLoader size={size} />
                        <span className="text-[10px] text-gray-400 ml-1">Spin Ring</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MiniOrbLoader size={size} />
                        <span className="text-[10px] text-gray-400 ml-1">Mini Orb</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-context demos */}
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">In Context</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Button states */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold text-gray-500 mb-4">Button Loading States</p>
                <div className="flex flex-col gap-3">
                  <button className="flex items-center justify-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-medium text-white">
                    <SpinRingLoader size="sm" />
                    <span>Processing...</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700">
                    <span>Analyzing</span>
                    <DotPulseLoader size="sm" />
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">
                    <MiniOrbLoader size="sm" />
                    <span>Generating Report</span>
                  </button>
                </div>
              </div>

              {/* Card loading */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold text-gray-500 mb-4">Card Loading State</p>
                <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-6 flex flex-col items-center justify-center h-36">
                  <AIBubbleLoader />
                  <p className="text-xs text-gray-400 mt-2">Loading patient data...</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-semibold text-gray-500 mb-4">Progress Bar</p>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-600">Analyzing results</span>
                      <span className="text-xs text-gray-400">Working...</span>
                    </div>
                    <BarSlideLoader />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-600">Uploading document</span>
                      <span className="text-xs text-gray-400">67%</span>
                    </div>
                    <div className="relative h-1 w-full rounded-full bg-teal-500/10">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                        animate={{ width: ['40%', '67%', '40%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-600">Syncing data</span>
                      <DotPulseLoader size="sm" />
                    </div>
                    <BarSlideLoader />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 4 — SKELETONS
          ═══════════════════════════════════════════ */}
          <section
            id="skeleton"
            ref={(el) => { sectionRefs.current['skeleton'] = el; }}
            className="py-16 border-b border-gray-200/60"
          >
            <SectionHeader
              title="Content Skeletons"
              subtitle="Shimmer placeholders for content areas. Use these while loading lists, cards, profiles, and data tables. They reduce perceived wait time by showing the shape of incoming content."
              badge="Essential"
            />
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Card skeleton */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold text-gray-500 mb-4">Card Placeholder</p>
                <div className="flex justify-center">
                  <SkeletonCardLoader />
                </div>
              </div>

              {/* List skeleton */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold text-gray-500 mb-4">List / Table Rows</p>
                <div className="flex justify-center">
                  <SkeletonListLoader />
                </div>
              </div>

              {/* Text block skeleton */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold text-gray-500 mb-4">Text Content Block</p>
                <div className="max-w-sm mx-auto space-y-3">
                  <SkeletonShimmer className="h-6 w-2/3" />
                  <SkeletonShimmer className="h-3 w-full" />
                  <SkeletonShimmer className="h-3 w-full" />
                  <SkeletonShimmer className="h-3 w-4/5" />
                  <div className="pt-2" />
                  <SkeletonShimmer className="h-3 w-full" />
                  <SkeletonShimmer className="h-3 w-3/4" />
                </div>
              </div>

              {/* Profile skeleton */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-xs font-semibold text-gray-500 mb-4">Patient Profile Header</p>
                <div className="max-w-sm mx-auto flex items-center gap-4">
                  <SkeletonShimmer className="h-16 w-16 !rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonShimmer className="h-5 w-3/5" />
                    <SkeletonShimmer className="h-3 w-2/5" />
                    <div className="flex gap-2 pt-1">
                      <SkeletonShimmer className="h-5 w-16 !rounded-full" />
                      <SkeletonShimmer className="h-5 w-12 !rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 5 — VOICE & LISTENING
          ═══════════════════════════════════════════ */}
          <section
            id="voice"
            ref={(el) => { sectionRefs.current['voice'] = el; }}
            className="py-16 border-b border-gray-200/60"
          >
            <SectionHeader
              title="Voice & Listening"
              subtitle="Loaders that convey 'I am paying attention.' Use during voice input, audio recording, and active listening states. These feel receptive and calm."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DualBgShowcase name="Deep Listen" description="Particles flowing inward — absorbing your input" recommended onExpand={() => setActiveLoader(<DeepListenLoader />)}>
                <DeepListenLoader />
              </DualBgShowcase>
              <DualBgShowcase name="Sonar Receive" description="Rings contracting — focused intake" onExpand={() => setActiveLoader(<SonarReceiveLoader />)}>
                <SonarReceiveLoader />
              </DualBgShowcase>
              <DualBgShowcase name="Echo Absorb" description="Orbs drifting to glowing core — collecting your voice" onExpand={() => setActiveLoader(<EchoAbsorbLoader />)}>
                <EchoAbsorbLoader />
              </DualBgShowcase>
              <DualBgShowcase name="Breath Sync" description="Slow 6s breath — calm, therapeutic presence" onExpand={() => setActiveLoader(<BreathSyncLoader />)}>
                <BreathSyncLoader />
              </DualBgShowcase>
              <DualBgShowcase name="Attentive Eye" description="Focused oval with tracking iris — I see you" onExpand={() => setActiveLoader(<AttentiveEyeLoader />)}>
                <AttentiveEyeLoader />
              </DualBgShowcase>
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 6 — PHYSIO-THEMED
          ═══════════════════════════════════════════ */}
          <section
            id="physio"
            ref={(el) => { sectionRefs.current['physio'] = el; }}
            className="py-16 border-b border-gray-200/60"
          >
            <SectionHeader
              title="Physio-Themed"
              subtitle="Domain-specific loaders tied to physiotherapy concepts. Great for marketing pages, onboarding flows, treatment screens, and anywhere the product's clinical identity should shine."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <LoaderShowcase name="Spine Flow" description="Vertebrae with traveling energy pulse" recommended onExpand={() => setActiveLoader(<SpineFlowLoader />)}>
                <SpineFlowLoader />
              </LoaderShowcase>
              <LoaderShowcase name="Healing Pulse" description="Heartbeat rhythm — double-pump with radiating rings" onExpand={() => setActiveLoader(<HealingPulseLoader />)}>
                <HealingPulseLoader />
              </LoaderShowcase>
              <LoaderShowcase name="Joint Motion" description="ROM arc with sweeping bone arms" onExpand={() => setActiveLoader(<JointMotionLoader />)}>
                <JointMotionLoader />
              </LoaderShowcase>
              <LoaderShowcase name="Recovery Wave" description="Progressive growth — the healing journey" onExpand={() => setActiveLoader(<RecoveryWaveLoader />)}>
                <RecoveryWaveLoader />
              </LoaderShowcase>
              <LoaderShowcase name="Muscle Fiber" description="Parallel fibers contracting — sarcomere feel" onExpand={() => setActiveLoader(<MuscleFiberLoader />)}>
                <MuscleFiberLoader />
              </LoaderShowcase>
            </div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 7 — INDUSTRY INSPIRED
          ═══════════════════════════════════════════ */}
          <section
            id="inspired"
            ref={(el) => { sectionRefs.current['inspired'] = el; }}
            className="py-16"
          >
            <SectionHeader
              title="Industry Inspired"
              subtitle="Reference loaders inspired by Siri, ChatGPT, Google, Perplexity, and Alexa. These are for inspiration and experimentation — not direct use in production."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: 'Siri Edge Glow', desc: 'iOS 18 — rotating iridescent border', comp: <SiriEdgeGlowLoader /> },
                { name: 'ChatGPT Orb', desc: 'Breathing sphere with surface noise', comp: <ChatGPTOrbLoader /> },
                { name: 'Google Dots', desc: 'Four colored bouncing dots', comp: <GoogleDotsLoader /> },
                { name: 'Perplexity Scatter', desc: 'Particle cloud gather/scatter', comp: <PerplexityScatterLoader /> },
                { name: 'Fresnel Orb', desc: 'Dark sphere with bright rim-lit edges', comp: <FresnelOrbLoader /> },
                { name: 'Alexa Ring', desc: 'Directional spotlight sweeping a ring', comp: <AlexaRingLoader /> },
                { name: 'Firefly Dance', desc: '12 tiny orbs swarming erratically', comp: <FireflyDanceLoader /> },
                { name: 'Quantum Field', desc: 'Particles phasing in/out randomly', comp: <QuantumFieldLoader /> },
              ].map((loader) => (
                <LoaderShowcase
                  key={loader.name}
                  name={loader.name}
                  description={loader.desc}
                  onExpand={() => setActiveLoader(loader.comp)}
                >
                  {loader.comp}
                </LoaderShowcase>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/60 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-8 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              HealUI Design System — Loader Library
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">{21 + 7} variants</span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-400">Framer Motion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {activeLoader && (
          <FullScreenOverlay onClose={() => setActiveLoader(null)}>
            {activeLoader}
          </FullScreenOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
