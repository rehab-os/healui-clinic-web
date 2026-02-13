/**
 * useChat Hook
 * Manages chat state and handles message sending
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChatMessage,
  ChatStep,
  ExtractedData,
  ChatState,
  ValidationError,
} from '@/lib/types/chat.types';
import { sendChatMessage, completeIntake } from '@/services/chat/chatApi';

interface UseChatOptions {
  clinicId: string;
  clinicCode?: string;
  clinicName?: string;
  onComplete?: (patientId: string) => void;
  autoStart?: boolean;
}

export function useChat({ clinicId, clinicCode, clinicName, onComplete, autoStart = false }: UseChatOptions) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    currentStep: ChatStep.BASIC_INFO, // Start with basic info
    extractedData: {},
    isLoading: false,
    error: null,
    sessionId: null,
    isOpen: false,
    isComplete: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  // Start conversation with welcome message
  const startConversation = useCallback(async () => {
    if (state.messages.length > 0) return; // Already started

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await sendChatMessage({
        message: 'Hello',
        conversationHistory: [],
        currentStep: ChatStep.BASIC_INFO,
        clinicId,
        clinicName,
      });

      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [welcomeMessage],
        sessionId: response.sessionId || null,
        currentStep: response.nextStep || ChatStep.WELCOME,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to start conversation. Please try again.',
        isLoading: false,
      }));
    }
  }, [state.messages.length, clinicId, clinicName]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && state.messages.length === 0) {
      startConversation();
    }
  }, [autoStart, state.messages.length, startConversation]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const response = await sendChatMessage({
          message: content.trim(),
          conversationHistory: [...state.messages, userMessage],
          currentStep: state.currentStep,
          clinicId,
          clinicName,
          sessionId: state.sessionId || undefined,
        });

        const botMessage: ChatMessage = {
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, botMessage],
          extractedData: {
            ...prev.extractedData,
            ...response.extractedData,
          },
          currentStep: response.nextStep || prev.currentStep,
          sessionId: response.sessionId || prev.sessionId,
          isLoading: false,
        }));

        // Check if we've completed all steps
        if (response.nextStep === null || response.nextStep > 6) {
          setState((prev) => ({ ...prev, isComplete: true }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: 'Failed to send message. Please try again.',
          isLoading: false,
        }));

        // Add error message from bot
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try sending your message again.',
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
        }));
      }
    },
    [state.messages, state.currentStep, state.sessionId, clinicId, clinicName]
  );

  // Complete the intake process
  const completeIntakeProcess = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await completeIntake({
        patientData: state.extractedData,
        clinicId,
        clinicCode,
        sessionId: state.sessionId || undefined,
      });

      if (response.success) {
        onComplete?.(response.patientId);

        setState((prev) => ({
          ...prev,
          isComplete: true,
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to complete intake. Please try again.',
        isLoading: false,
      }));
    }
  }, [state.extractedData, state.sessionId, clinicId, clinicCode, onComplete]);

  // Open chat widget
  const openChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  // Close chat widget
  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Reset chat
  const resetChat = useCallback(() => {
    setState({
      messages: [],
      currentStep: ChatStep.WELCOME,
      extractedData: {},
      isLoading: false,
      error: null,
      sessionId: null,
      isOpen: false,
      isComplete: false,
    });
  }, []);

  return {
    ...state,
    messagesEndRef,
    sendMessage,
    startConversation,
    completeIntakeProcess,
    openChat,
    closeChat,
    resetChat,
  };
}
