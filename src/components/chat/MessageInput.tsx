/**
 * MessageInput Component - Modern floating input
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  isLoading,
  disabled,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !disabled) {
      inputRef.current?.focus();
    }
  }, [isLoading, disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Modern floating input container */}
      <div className="relative mx-auto max-w-3xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-lg shadow-gray-900/5 ring-1 ring-gray-200/50 transition-all focus-within:ring-2 focus-within:ring-cyan-500/30">
          {/* AI indicator when loading */}
          {isLoading && (
            <motion.div
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Sparkles className="h-4 w-4 text-cyan-600 animate-pulse" />
            </motion.div>
          )}

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'AI is thinking...' : 'Type your message...'}
            disabled={disabled || isLoading}
            className="flex-1 bg-transparent px-2 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:text-gray-400"
          />

          {/* Send button */}
          <motion.button
            type="submit"
            disabled={disabled || isLoading || !message.trim()}
            className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:shadow-none"
            whileHover={!disabled && !isLoading && message.trim() ? { scale: 1.05 } : {}}
            whileTap={!disabled && !isLoading && message.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="relative z-10 h-4 w-4" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </motion.button>
        </div>

        {/* Subtle hint - only show when not loading */}
        {!isLoading && (
          <motion.p
            className="mt-2 text-center text-xs text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">Enter</kbd> to send
          </motion.p>
        )}
      </div>
    </form>
  );
}
