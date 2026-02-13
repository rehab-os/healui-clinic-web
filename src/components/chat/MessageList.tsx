/**
 * MessageList Component
 * Displays list of chat messages
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
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex h-full items-center justify-center text-center text-gray-500">
          <p className="text-sm">Starting conversation...</p>
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isLoading && <TypingIndicator />}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
