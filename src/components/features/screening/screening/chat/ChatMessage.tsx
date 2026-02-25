'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface ChatMessageProps {
  type: 'bot' | 'user' | 'system';
  content: React.ReactNode;
  showAvatar?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  showAvatar = true,
}) => {
  if (type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center my-3"
      >
        <div className="px-3.5 py-1.5 bg-gray-100/80 rounded-full text-xs text-gray-500 font-medium">
          {content}
        </div>
      </motion.div>
    );
  }

  const isBot = type === 'bot';

  if (isBot) {
    // Bot messages render content directly — no bubble wrapper for cleaner look
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="text-[15px] leading-relaxed text-gray-800">
          {content}
        </div>
      </motion.div>
    );
  }

  // User messages — compact right-aligned
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex justify-end gap-2"
    >
      <div className="max-w-[75%] rounded-2xl rounded-tr-md px-4 py-2.5 bg-brand-teal text-white shadow-sm">
        <div className="text-sm leading-relaxed font-medium">
          {content}
        </div>
      </div>
      {showAvatar && (
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-gray-500" />
        </div>
      )}
    </motion.div>
  );
};
