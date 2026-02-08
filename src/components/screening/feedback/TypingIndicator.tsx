'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-2"
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-teal-100 rounded-full border border-teal-200 shadow-md">
        <div className="flex gap-1">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-brand-teal rounded-full"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-brand-teal rounded-full"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-brand-teal rounded-full"
          />
        </div>
        <span className="text-sm font-medium text-teal-700">Analyzing...</span>
      </div>
    </motion.div>
  );
};
