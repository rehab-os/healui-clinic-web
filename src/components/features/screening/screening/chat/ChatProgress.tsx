'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChatProgressProps {
  current: number;
  total: number;
  sections?: {
    name: string;
    questionsAnswered: number;
    totalQuestions: number;
  }[];
}

export const ChatProgress: React.FC<ChatProgressProps> = ({
  current,
  total,
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="px-6 py-3">
      {/* Thin progress bar */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="h-full bg-brand-teal rounded-full"
        />
      </div>

      {/* Minimal text */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-gray-400 font-medium tabular-nums">
          {current}/{total}
        </span>
        <span className="text-xs text-gray-400 font-medium tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};
