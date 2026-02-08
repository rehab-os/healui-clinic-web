'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ScreeningProgressBarProps {
  progress: number;
  className?: string;
}

export const ScreeningProgressBar: React.FC<ScreeningProgressBarProps> = ({
  progress,
  className = '',
}) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-1.5 overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full bg-gradient-to-r from-brand-teal to-teal-600 rounded-full"
      />
    </div>
  );
};
