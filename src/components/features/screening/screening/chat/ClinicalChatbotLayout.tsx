'use client';

import React, { ReactNode } from 'react';
import { X, RotateCcw, Sparkles } from 'lucide-react';

interface ClinicalChatbotLayoutProps {
  patientName?: string;
  isComplete: boolean;
  onReset: () => void;
  onClose?: () => void;
  showSummary: boolean;
  onToggleSummary: () => void;
  summaryContent?: ReactNode;
  showSummaryByDefault?: boolean;
  children: ReactNode;
  progressComponent?: ReactNode;
  logoUrl?: string;
}

export const ClinicalChatbotLayout: React.FC<ClinicalChatbotLayoutProps> = ({
  patientName,
  isComplete,
  onReset,
  onClose,
  children,
  progressComponent,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50/80">
      {/* ===== MINIMAL TOP BAR ===== */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 tracking-tight leading-tight">
                  Clinical Assessment
                </h2>
                <p className="text-[11px] text-gray-400 leading-tight">
                  {isComplete ? 'Complete' : patientName || 'In progress'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isComplete && (
                <button
                  onClick={onReset}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT — vertically centered single question ===== */}
      <div className="flex flex-col h-[calc(100vh-49px)]">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto py-6">
            {children}
          </div>
        </div>

        {/* Progress bar — fixed bottom */}
        {progressComponent && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto">
              {progressComponent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
