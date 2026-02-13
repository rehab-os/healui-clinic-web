/**
 * ChatPanel Component
 * Main chat interface panel
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ChatMessage, ChatStep } from '@/types/chat.types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ProgressBar } from './ProgressBar';
import { ChatHeader } from './ChatHeader';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentStep: ChatStep;
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  onComplete: () => void;
}

export function ChatPanel({
  messages,
  currentStep,
  isLoading,
  error,
  isComplete,
  messagesEndRef,
  onSendMessage,
  onClose,
  onComplete,
}: ChatPanelProps) {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <ChatHeader onClose={onClose} />

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        error={error}
        messagesEndRef={messagesEndRef}
      />

      {/* Input */}
      {!isComplete && (
        <MessageInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          disabled={isLoading}
        />
      )}

      {/* Complete Button */}
      {isComplete && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onComplete}
            className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            ✓ Complete Registration
          </button>
        </div>
      )}
    </motion.div>
  );
}
