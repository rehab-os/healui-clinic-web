/**
 * ChatWidget Component
 * Main chat widget with floating button and slide-in panel
 */

'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatToggle } from './ChatToggle';
import { ChatPanel } from './ChatPanel';

interface ChatWidgetProps {
  clinicId: string;
  onComplete?: (patientId: string) => void;
  className?: string;
}

export function ChatWidget({ clinicId, onComplete, className }: ChatWidgetProps) {
  const chat = useChat({
    clinicId,
    onComplete,
    autoStart: true,
  });

  return (
    <div className={className}>
      {/* Floating Toggle Button */}
      {!chat.isOpen && (
        <ChatToggle
          onClick={chat.openChat}
          hasUnread={false}
        />
      )}

      {/* Chat Panel */}
      {chat.isOpen && (
        <ChatPanel
          messages={chat.messages}
          currentStep={chat.currentStep}
          isLoading={chat.isLoading}
          error={chat.error}
          isComplete={chat.isComplete}
          messagesEndRef={chat.messagesEndRef}
          onSendMessage={chat.sendMessage}
          onClose={chat.closeChat}
          onComplete={chat.completeIntakeProcess}
        />
      )}
    </div>
  );
}
