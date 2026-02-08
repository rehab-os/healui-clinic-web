'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, User } from 'lucide-react';

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-4"
      >
        <div className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600 font-medium">
          {content}
        </div>
      </motion.div>
    );
  }

  const isBot = type === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      {/* Avatar (left side for bot) */}
      {isBot && showAvatar && (
        <div className="w-9 h-9 rounded-xl bg-brand-teal flex items-center justify-center flex-shrink-0 shadow-md">
          <Brain className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${
          isBot
            ? 'bg-white border-2 border-gray-100 rounded-tl-sm'
            : 'bg-brand-teal text-white rounded-tr-sm shadow-lg'
        }`}
      >
        <div className={`text-base leading-relaxed ${isBot ? 'text-gray-800' : 'text-white font-medium'}`}>
          {content}
        </div>
      </div>

      {/* Avatar (right side for user) */}
      {!isBot && showAvatar && (
        <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      )}
    </motion.div>
  );
};
