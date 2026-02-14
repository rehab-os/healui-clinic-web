/**
 * ProgressBar Component - Modern liquid progress
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChatStep, STEP_NAMES, TOTAL_STEPS } from '@/types/chat.types';

interface ProgressBarProps {
  currentStep: ChatStep;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="py-4">
      {/* Step indicator - minimal */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-gray-700">
          {STEP_NAMES[currentStep]}
        </span>
        <span className="text-xs text-gray-400">
          {currentStep}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Modern liquid progress bar */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 shadow-sm shadow-cyan-500/30"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Animated shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
