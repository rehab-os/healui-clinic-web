'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Activity, AlertCircle } from 'lucide-react';

interface SlidingSummaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  summary: {
    primaryArea?: string;
    painLevel?: number;
    symptoms?: string[];
    redFlags?: string[];
    currentSection?: string;
  };
}

export const SlidingSummaryPanel: React.FC<SlidingSummaryPanelProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full lg:w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-brand-teal to-teal-600">
              <h3 className="text-lg font-bold text-white">Assessment Summary</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Primary Area */}
              {summary.primaryArea && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    <MapPin className="w-4 h-4" />
                    Primary Area
                  </div>
                  <div className="px-4 py-3 bg-teal-50 border-2 border-teal-200 rounded-xl text-teal-900 font-semibold">
                    {summary.primaryArea}
                  </div>
                </div>
              )}

              {/* Pain Level */}
              {summary.painLevel !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    <Activity className="w-4 h-4" />
                    Pain Level
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(summary.painLevel / 10) * 100}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          summary.painLevel <= 3
                            ? 'bg-gradient-to-r from-teal-400 to-teal-500'
                            : summary.painLevel <= 6
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                      />
                    </div>
                    <div className="px-3 py-1.5 bg-gray-100 rounded-lg font-bold text-gray-700 min-w-[3rem] text-center">
                      {summary.painLevel}/10
                    </div>
                  </div>
                </div>
              )}

              {/* Symptoms */}
              {summary.symptoms && summary.symptoms.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Symptoms
                  </div>
                  <div className="space-y-2">
                    {summary.symptoms.map((symptom, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-2 flex-shrink-0" />
                        <span className="text-sm">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {summary.redFlags && summary.redFlags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600 uppercase tracking-wide">
                    <AlertCircle className="w-4 h-4" />
                    Red Flags
                  </div>
                  <div className="space-y-2">
                    {summary.redFlags.map((flag, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-800"
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Section */}
              {summary.currentSection && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Current Section
                  </div>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium text-sm">
                    {summary.currentSection}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="w-full px-5 py-3.5 rounded-xl font-semibold text-base
                  bg-white border-2 border-gray-200 text-gray-700
                  hover:border-brand-teal hover:text-brand-teal hover:shadow-md
                  transition-all duration-300"
              >
                Close Summary
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
