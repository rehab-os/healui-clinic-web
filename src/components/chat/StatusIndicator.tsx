/**
 * StatusIndicator - Shows current chat step in header
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChatStep, STEP_NAMES, TOTAL_STEPS } from '@/types/chat.types';
import { Sparkles } from 'lucide-react';

interface StatusIndicatorProps {
  currentStep: ChatStep;
  isLoading?: boolean;
}

export function StatusIndicator({ currentStep, isLoading = false }: StatusIndicatorProps) {
  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="flex items-center gap-2">
      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          className="flex h-2 w-2 rounded-full bg-cyan-500"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Status text */}
      <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-50 to-teal-50 px-3 py-1.5 ring-1 ring-cyan-200/30">
        <Sparkles className="h-3 w-3 text-cyan-600" />
        <span className="text-xs font-medium text-gray-700">
          {STEP_NAMES[currentStep]}
        </span>
      </div>

      {/* Compact progress */}
      <div className="flex items-center gap-1">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 w-1 rounded-full transition-all ${
              i < currentStep
                ? 'bg-cyan-500 w-1.5'
                : i === currentStep
                ? 'bg-cyan-400 w-2'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
