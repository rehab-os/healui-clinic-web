'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface ChatProgressProps {
  current: number;
  total: number;
  sections?: {
    name: string;
    questionsAnswered: number;
    totalQuestions: number;
  }[];
}

export const ChatProgress: React.FC<ChatProgressProps> = ({
  current,
  total,
  sections = [],
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="px-6 py-4 space-y-3">
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-brand-teal to-teal-600 rounded-full"
            />
          </div>
        </div>

        {/* Progress Text */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-brand-teal" />
            <span className="font-medium">
              {current} of {total} questions answered
            </span>
          </div>
          <span className="text-gray-500 font-medium">{Math.round(percentage)}%</span>
        </div>

        {/* Section Breakdown (optional) */}
        {sections.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {sections.map((section, index) => {
              const sectionComplete = section.questionsAnswered === section.totalQuestions;
              return (
                <div
                  key={index}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-300
                    ${sectionComplete
                      ? 'bg-teal-100 text-teal-700 border border-teal-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }
                  `}
                >
                  {section.name}: {section.questionsAnswered}/{section.totalQuestions}
                  {sectionComplete && (
                    <CheckCircle2 className="w-3 h-3 inline-block ml-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
