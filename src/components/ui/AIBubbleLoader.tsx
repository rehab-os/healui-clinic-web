/**
 * AI Bubble Loader
 * Floating, breathing orbs with glassmorphism - modern AI aesthetic
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function AIBubbleLoader() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Main central orb */}
      <motion.div
        className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400/40 to-teal-500/40 backdrop-blur-xl"
        style={{
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbiting bubble 1 */}
      <motion.div
        className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-500/30 backdrop-blur-lg"
        style={{
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.15)',
        }}
        animate={{
          x: [0, 30, 0, -30, 0],
          y: [0, -30, 0, 30, 0],
          scale: [1, 0.8, 1, 0.8, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbiting bubble 2 */}
      <motion.div
        className="absolute h-6 w-6 rounded-full bg-gradient-to-br from-teal-300/30 to-cyan-500/30 backdrop-blur-lg"
        style={{
          boxShadow: '0 4px 16px rgba(20, 184, 166, 0.15)',
        }}
        animate={{
          x: [0, -25, 0, 25, 0],
          y: [0, 25, 0, -25, 0],
          scale: [1, 1.1, 1, 0.9, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Orbiting bubble 3 */}
      <motion.div
        className="absolute h-5 w-5 rounded-full bg-gradient-to-br from-blue-300/30 to-cyan-400/30 backdrop-blur-lg"
        style={{
          boxShadow: '0 4px 16px rgba(6, 182, 212, 0.15)',
        }}
        animate={{
          x: [0, 20, 0, -20, 0],
          y: [0, -20, 0, 20, 0],
          scale: [1, 0.9, 1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Subtle glow effect */}
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-gradient-to-br from-cyan-400/10 to-teal-500/10 blur-2xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

interface AILoadingScreenProps {
  message?: string;
  submessage?: string;
}

const LOADING_MESSAGES = [
  { text: 'Preparing your AI assistant', duration: 1000 },
  { text: 'Personalizing your experience', duration: 1000 },
  { text: 'Setting up secure connection', duration: 1000 },
  { text: 'Almost ready', duration: 1000 },
];

export function AILoadingScreen({
  message = 'Welcome',
  submessage,
}: AILoadingScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const currentMessage = LOADING_MESSAGES[currentMessageIndex];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-cyan-50/30">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-200/20 to-teal-300/20 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-gradient-to-br from-purple-200/15 to-indigo-300/15 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="relative text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Loader */}
        <div className="mb-10 flex justify-center">
          <AIBubbleLoader />
        </div>

        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-gray-900">
            {message}
          </h2>
        </motion.div>

        {/* Animated loading messages */}
        <div className="relative h-6">
          <motion.div
            key={currentMessageIndex}
            className="absolute inset-x-0 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {/* Animated checkmark for completed steps */}
            {currentMessageIndex > 0 && (
              <motion.div
                className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {/* Loading message */}
            <p className="text-sm font-medium text-gray-600">
              {currentMessage.text}
            </p>

            {/* Animated dots */}
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1 w-1 rounded-full bg-cyan-500"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Progress indicator */}
        <motion.div
          className="mt-8 flex justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {LOADING_MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= currentMessageIndex
                  ? 'w-8 bg-gradient-to-r from-cyan-500 to-teal-500'
                  : 'w-1 bg-gray-300'
              }`}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
