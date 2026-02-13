/**
 * FullScreenChat Component
 * Full-page chat experience for dedicated registration page
 */

'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ProgressBar } from './ProgressBar';
import { ArrowLeft, CheckCircle, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ClinicData {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  logo_url?: string;
}

interface FullScreenChatProps {
  clinic: ClinicData;
  onComplete?: (patientId: string) => void;
  showBackButton?: boolean;
  backUrl?: string;
}

// Legacy props for backward compatibility
interface LegacyFullScreenChatProps {
  clinicId: string;
  clinicName?: string;
  onComplete?: (patientId: string) => void;
  showBackButton?: boolean;
  backUrl?: string;
}

export function FullScreenChat(
  props: FullScreenChatProps | LegacyFullScreenChatProps
) {
  const router = useRouter();

  // Handle both new and legacy prop formats
  const clinic = 'clinic' in props
    ? props.clinic
    : {
        id: props.clinicId,
        name: props.clinicName || 'HealUI Clinic',
        code: props.clinicId,
      };

  const {
    onComplete,
    showBackButton = true,
    backUrl = '/',
  } = props;

  const chat = useChat({
    clinicId: clinic.id,
    clinicCode: clinic.code,
    clinicName: clinic.name,
    onComplete: (patientId) => {
      if (onComplete) {
        onComplete(patientId);
      } else {
        // Default: redirect to confirmation page
        router.push(`/registration-complete?patientId=${patientId}&clinicName=${encodeURIComponent(clinic.name)}`);
      }
    },
    autoStart: true,
  });

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => router.push(backUrl)}
                className="rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}

            {/* Clinic Logo */}
            {clinic.logo_url ? (
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={clinic.logo_url}
                  alt={`${clinic.name} logo`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {clinic.name}
              </h1>
              <p className="text-sm text-gray-500">
                {clinic.city && clinic.state
                  ? `${clinic.city}, ${clinic.state} • Patient Registration`
                  : 'Patient Registration'}
              </p>
            </div>
          </div>

          {/* Logo or additional info */}
          <div className="hidden sm:block">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2">
              <p className="text-sm font-medium text-white">
                AI-Powered Intake
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6">
          <ProgressBar currentStep={chat.currentStep} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-4xl flex-col">
          {/* Welcome Message (before chat starts) */}
          {chat.messages.length === 0 && !chat.isLoading && (
            <motion.div
              className="flex flex-1 items-center justify-center p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="max-w-md text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-blue-100 p-4">
                    <svg
                      className="h-12 w-12 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Welcome to {clinic.name}!
                </h2>
                <p className="mb-6 text-gray-600">
                  Our AI assistant will help you complete your registration in
                  just a few minutes. The conversation is secure and your
                  information is protected.
                </p>
                <div className="space-y-2 text-left">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <p className="text-sm text-gray-600">
                      Quick and easy - takes about 5 minutes
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <p className="text-sm text-gray-600">
                      Secure and HIPAA compliant
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                    <p className="text-sm text-gray-600">
                      Conversational and friendly
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-xs text-gray-500">
                  Starting conversation...
                </p>
              </div>
            </motion.div>
          )}

          {/* Chat Messages */}
          {chat.messages.length > 0 && (
            <div className="flex-1 overflow-hidden bg-white">
              <MessageList
                messages={chat.messages}
                isLoading={chat.isLoading}
                error={chat.error}
                messagesEndRef={chat.messagesEndRef}
              />
            </div>
          )}

          {/* Input Area */}
          {!chat.isComplete && (
            <div className="border-t border-gray-200 bg-white">
              <div className="p-6">
                <MessageInput
                  onSendMessage={chat.sendMessage}
                  isLoading={chat.isLoading}
                  disabled={chat.isLoading}
                />
              </div>
            </div>
          )}

          {/* Completion State */}
          {chat.isComplete && (
            <div className="border-t border-gray-200 bg-white p-6">
              <div className="mx-auto max-w-md text-center">
                <div className="mb-4 flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  Registration Complete!
                </h3>
                <p className="mb-6 text-gray-600">
                  Thank you for providing your information. Our team will
                  contact you shortly to confirm your appointment.
                </p>
                <button
                  onClick={() => chat.completeIntakeProcess()}
                  className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-300"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="mx-auto max-w-4xl px-6 text-center text-xs text-gray-500">
          <p>
            Powered by AI • Your data is encrypted and secure • HIPAA Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}
