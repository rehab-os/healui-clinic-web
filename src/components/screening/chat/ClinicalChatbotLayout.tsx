'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Brain, X, RotateCcw, FileText, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface ClinicalChatbotLayoutProps {
  // Header props
  patientName?: string;
  isComplete: boolean;
  onReset: () => void;
  onClose?: () => void;

  // Summary panel
  showSummary: boolean;
  onToggleSummary: () => void;
  summaryContent?: ReactNode;
  showSummaryByDefault?: boolean; // Auto-show on desktop

  // Main content
  children: ReactNode;

  // Progress (optional - shown in bottom bar)
  progressComponent?: ReactNode;

  // Logo (optional)
  logoUrl?: string;
}

export const ClinicalChatbotLayout: React.FC<ClinicalChatbotLayoutProps> = ({
  patientName,
  isComplete,
  onReset,
  onClose,
  showSummary,
  onToggleSummary,
  summaryContent,
  showSummaryByDefault = false,
  children,
  progressComponent,
  logoUrl,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-20 bg-brand-teal border-b border-teal-600/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            {/* Left: Logo + AI Identity */}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shadow-md">
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    fill
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/90 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-brand-teal" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Clinical Assessment AI
                  </h2>
                  <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full border border-white/30">
                    AI
                  </span>
                </div>
                <p className="text-xs text-teal-100">
                  {isComplete ? '✓ Complete' : patientName || 'In progress'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {!isComplete && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleSummary}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
                      transition-all duration-200
                      ${showSummary
                        ? 'bg-white text-brand-teal shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                    `}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Summary</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onReset}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
                      bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </motion.button>
                </>
              )}

              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-65px)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-4 pb-24">
              {children}
            </div>
          </div>

          {/* Progress Bar at Bottom */}
          {progressComponent && (
            <div className="flex-shrink-0 border-t border-gray-100">
              {progressComponent}
            </div>
          )}
        </div>

        {/* Summary Panel (sliding from right) */}
        {summaryContent && (
          <motion.div
            initial={{ x: showSummary ? 0 : '100%' }}
            animate={{ x: showSummary ? 0 : '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-96 border-l border-gray-200 bg-gray-50 overflow-hidden hidden lg:block"
          >
            {summaryContent}
          </motion.div>
        )}
      </div>
    </div>
  );
};
