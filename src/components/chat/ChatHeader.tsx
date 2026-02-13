/**
 * ChatHeader Component
 * Header for chat panel
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
      <div>
        <h3 className="font-semibold">Patient Registration</h3>
        <p className="text-xs text-blue-100">We're here to help you get started</p>
      </div>
      <button
        onClick={onClose}
        className="rounded-full p-1 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close chat"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
