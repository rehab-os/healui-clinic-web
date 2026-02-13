/**
 * ProgressBar Component
 * Shows current step progress
 */

'use client';

import React from 'react';
import { ChatStep, STEP_NAMES, TOTAL_STEPS } from '@/types/chat.types';

interface ProgressBarProps {
  currentStep: ChatStep;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">{STEP_NAMES[currentStep]}</span>
        <span>
          Step {currentStep} of {TOTAL_STEPS}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
