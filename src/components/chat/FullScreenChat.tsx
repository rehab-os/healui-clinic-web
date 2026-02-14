/**
 * FullScreenChat Component
 * Full-page chat experience for dedicated registration page
 */

'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { StatusIndicator } from './StatusIndicator';
import { ArrowLeft, CheckCircle, Building2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AIBubbleLoader } from '@/components/ui/AIBubbleLoader';

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
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-200/20 to-teal-300/20 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-gradient-to-br from-purple-200/10 to-indigo-300/10 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Header - Clean & Minimal with Status */}
      <header className="relative border-b border-gray-200/50 bg-white/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => router.push(backUrl)}
                className="rounded-xl p-2 text-gray-500 transition-all hover:bg-gray-100/80 hover:text-gray-900"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            {/* Clinic Logo */}
            {clinic.logo_url ? (
              <div className="h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200/50">
                <img
                  src={clinic.logo_url}
                  alt={clinic.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 ring-1 ring-cyan-200/30">
                <Building2 className="h-5 w-5 text-cyan-600" />
              </div>
            )}

            {/* Clinic Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate">
                {clinic.name}
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {clinic.city && clinic.state
                  ? `${clinic.city}, ${clinic.state}`
                  : 'Patient Registration'}
              </p>
            </div>
          </div>

          {/* Status Indicator - Right side */}
          <div className="hidden sm:block">
            <StatusIndicator
              currentStep={chat.currentStep}
              isLoading={chat.isLoading}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
          {/* Welcome Message (before chat starts) */}
          {chat.messages.length === 0 && !chat.isLoading && (
            <div className="flex flex-1 items-center justify-center p-12">
              <motion.div
                className="max-w-lg text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* AI Bubble Loader */}
                <motion.div
                  className="mb-10 flex justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <AIBubbleLoader />
                </motion.div>

                {/* Welcome text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <h2 className="mb-4 text-3xl font-semibold tracking-tight text-gray-900">
                    Welcome to {clinic.name}
                  </h2>
                  <p className="mb-10 text-lg leading-relaxed text-gray-600">
                    Our AI assistant will guide you through a quick registration process.
                    Secure, simple, and personalized for you.
                  </p>
                </motion.div>

                {/* Feature cards */}
                <motion.div
                  className="grid gap-4 text-left sm:grid-cols-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <div className="rounded-2xl bg-white/60 p-5 backdrop-blur-sm ring-1 ring-gray-200/50 transition-all hover:bg-white/80 hover:shadow-lg hover:shadow-cyan-500/5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50">
                      <CheckCircle className="h-5 w-5 text-cyan-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">~5 Minutes</p>
                    <p className="mt-1 text-xs text-gray-500">Quick and easy</p>
                  </div>

                  <div className="rounded-2xl bg-white/60 p-5 backdrop-blur-sm ring-1 ring-gray-200/50 transition-all hover:bg-white/80 hover:shadow-lg hover:shadow-purple-500/5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">HIPAA Secure</p>
                    <p className="mt-1 text-xs text-gray-500">Protected data</p>
                  </div>

                  <div className="rounded-2xl bg-white/60 p-5 backdrop-blur-sm ring-1 ring-gray-200/50 transition-all hover:bg-white/80 hover:shadow-lg hover:shadow-teal-500/5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50">
                      <Sparkles className="h-5 w-5 text-teal-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">AI-Powered</p>
                    <p className="mt-1 text-xs text-gray-500">Smart & friendly</p>
                  </div>
                </motion.div>

                {/* Status indicator */}
                <motion.div
                  className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1 w-1 rounded-full bg-cyan-500"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span>Initializing conversation</span>
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* Chat Messages */}
          {chat.messages.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <MessageList
                messages={chat.messages}
                isLoading={chat.isLoading}
                error={chat.error}
                messagesEndRef={chat.messagesEndRef}
              />
            </div>
          )}

          {/* Input Area - Fixed to bottom, floating */}
          {!chat.isComplete && chat.messages.length > 0 && (
            <div className="relative mt-auto border-t border-gray-200/30 bg-white/60 backdrop-blur-2xl">
              <div className="px-6 py-5">
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
            <div className="relative mt-auto border-t border-gray-200/30 bg-white/60 p-8 backdrop-blur-2xl">
              <motion.div
                className="mx-auto max-w-md text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Success icon with glow */}
                <motion.div
                  className="relative mb-6 flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/30 blur-2xl" />
                  <div className="relative rounded-full bg-gradient-to-br from-green-50 to-emerald-50 p-4 ring-1 ring-green-200/50">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="mb-2 text-xl font-semibold tracking-tight text-gray-900">
                    All Done!
                  </h3>
                  <p className="mb-6 text-sm text-gray-600">
                    Thank you! We'll contact you shortly to confirm your appointment.
                  </p>
                </motion.div>

                <motion.button
                  onClick={() => chat.completeIntakeProcess()}
                  className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3.5 font-medium text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Complete</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </motion.button>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
