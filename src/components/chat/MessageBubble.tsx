/**
 * MessageBubble Component - Modern AI chat bubbles
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from '@/types/chat.types';
import { Sparkles, User } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Avatar - Modern gradient style */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
        ) : (
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-4 w-4 text-white" />
            {/* Subtle glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 to-teal-500/30 blur-sm" />
          </div>
        )}
      </div>

      {/* Message Content - Clean bubbles */}
      <div className="flex max-w-[70%] flex-col">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
          }`}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Timestamp - subtle */}
        {message.timestamp && (
          <p className={`mt-1.5 px-1 text-xs text-gray-400 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
