/**
 * TypingIndicator Component
 * Shows when bot is typing
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300">
        <Bot className="h-5 w-5 text-gray-700" />
      </div>

      <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-200">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-gray-400"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
