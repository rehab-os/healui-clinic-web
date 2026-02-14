/**
 * TypingIndicator Component - AI is thinking...
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      {/* AI Avatar with glow */}
      <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20">
        <Sparkles className="h-4 w-4 text-white" />
        {/* Animated glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-500/30 blur-sm"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Typing dots - modern style */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-gray-200/50">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
