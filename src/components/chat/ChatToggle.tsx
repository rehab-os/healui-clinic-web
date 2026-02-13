/**
 * ChatToggle Component
 * Floating button to open chat
 */

'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatToggleProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export function ChatToggle({ onClick, hasUnread }: ChatToggleProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      aria-label="Open chat"
    >
      <MessageCircle className="h-6 w-6" />

      {hasUnread && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          !
        </span>
      )}
    </motion.button>
  );
}
