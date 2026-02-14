/**
 * MessageList Component - Clean, minimal message area
 */

'use client';

import React from 'react';
import { ChatMessage } from '@/types/chat.types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  isLoading,
  error,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-8">
      {messages.length === 0 && !isLoading && (
        <div className="flex h-full items-center justify-center text-center text-gray-400">
          <p className="text-sm">Starting conversation...</p>
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isLoading && <TypingIndicator />}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200/50">
          {error}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
