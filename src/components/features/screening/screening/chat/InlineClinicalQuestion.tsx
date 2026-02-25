'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface InlineClinicalQuestionProps {
  question: string;
  type: 'yes-no' | 'vas-slider' | 'multiple-choice' | 'text';
  options?: (string | { value: string; label: string })[];
  value?: any;
  onChange: (value: any) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  allowMultiple?: boolean;
}

export const InlineClinicalQuestion: React.FC<InlineClinicalQuestionProps> = ({
  question,
  type,
  options = [],
  value,
  onChange,
  onSubmit,
  disabled = false,
  allowMultiple = false,
}) => {
  const handleYesNoClick = (answer: 'yes' | 'no') => {
    onChange(answer);
    if (onSubmit) setTimeout(() => onSubmit(), 200);
  };

  const handleMultipleChoiceClick = (option: string | { value: string; label: string }) => {
    const optionValue = typeof option === 'string' ? option : option.value;
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v: string) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      if (onSubmit) setTimeout(() => onSubmit(), 200);
    }
  };

  const getOptionValue = (option: string | { value: string; label: string }) =>
    typeof option === 'string' ? option : option.value;
  const getOptionLabel = (option: string | { value: string; label: string }) =>
    typeof option === 'string' ? option : option.label;

  // Adaptive grid: short labels get grid, long labels stay vertical
  const getOptionsLayout = () => {
    const maxLen = Math.max(...options.map(o => getOptionLabel(o).length));
    const count = options.length;
    if (maxLen <= 30 && count <= 6) {
      return count <= 4 ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 sm:grid-cols-3 gap-2.5';
    }
    return 'grid grid-cols-2 gap-2.5'; // default 2-col for everything
  };

  return (
    <div className="space-y-4">
      {/* Question */}
      <p className="text-[15px] leading-snug text-gray-900 font-semibold tracking-tight">
        {question}
      </p>

      {/* Yes/No */}
      {type === 'yes-no' && (
        <div className="grid grid-cols-2 gap-2.5">
          {([
            { val: 'yes' as const, label: 'Yes' },
            { val: 'no' as const, label: 'No' },
          ]).map(({ val, label }) => (
            <motion.button
              key={val}
              type="button"
              whileTap={{ scale: disabled ? 1 : 0.97 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) handleYesNoClick(val); }}
              disabled={disabled}
              className={`
                rounded-xl py-3.5 px-4 text-sm font-semibold text-center
                transition-all duration-150 border
                ${value === val
                  ? 'bg-brand-teal text-white border-brand-teal shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="flex items-center justify-center gap-1.5">
                {value === val && <Check className="w-4 h-4" />}
                {label}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* VAS Slider */}
      {type === 'vas-slider' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="10"
              value={value || 0}
              onChange={(e) => onChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 rounded-full appearance-none cursor-pointer
                bg-gradient-to-r from-teal-100 via-amber-100 to-red-100
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-7
                [&::-webkit-slider-thumb]:h-7
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-brand-teal
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-3
                [&::-webkit-slider-thumb]:border-white
                [&::-moz-range-thumb]:w-7
                [&::-moz-range-thumb]:h-7
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-brand-teal
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-3
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:border-0
              "
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">No pain (0)</span>
            <motion.div
              key={value}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className="px-3.5 py-1.5 rounded-full bg-brand-teal text-white font-bold text-base shadow-sm"
            >
              {value || 0}
            </motion.div>
            <span className="text-gray-400">Worst (10)</span>
          </div>

          {onSubmit && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onSubmit) onSubmit(); }}
              disabled={disabled}
              className="w-full rounded-xl py-3.5 text-sm font-semibold
                bg-brand-teal text-white hover:bg-teal-700
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
        </div>
      )}

      {/* Multiple Choice */}
      {type === 'multiple-choice' && (() => {
        const layoutClass = getOptionsLayout();
        return (
          <div className="space-y-3">
            <div className={layoutClass}>
              {options.map((option, index) => {
                const optionValue = getOptionValue(option);
                const optionLabel = getOptionLabel(option);
                const isSelected = allowMultiple
                  ? Array.isArray(value) && value.includes(optionValue)
                  : value === optionValue;

                return (
                  <motion.button
                    type="button"
                    key={index}
                    whileTap={{ scale: disabled ? 1 : 0.97 }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) handleMultipleChoiceClick(option); }}
                    disabled={disabled}
                    className={`
                      flex items-center gap-2 rounded-xl p-3.5 text-sm font-medium text-left
                      transition-all duration-150 border
                      ${isSelected
                        ? 'bg-brand-teal text-white border-brand-teal shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="leading-tight">{optionLabel}</span>
                  </motion.button>
                );
              })}
            </div>

            {allowMultiple && onSubmit && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onSubmit) onSubmit(); }}
                disabled={disabled || !value || (Array.isArray(value) && value.length === 0)}
                className="w-full rounded-xl py-3.5 text-sm font-semibold
                  bg-brand-teal text-white hover:bg-teal-700
                  transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </div>
        );
      })()}

      {/* Text Input */}
      {type === 'text' && (
        <div className="space-y-3">
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer..."
            rows={3}
            className="w-full rounded-xl p-4 text-sm border border-gray-200
              focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-teal-500/15
              transition-colors duration-150 resize-none
              placeholder:text-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {onSubmit && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onSubmit) onSubmit(); }}
              disabled={disabled || !value || (typeof value === 'string' && !value.trim())}
              className="w-full rounded-xl py-3.5 text-sm font-semibold
                bg-brand-teal text-white hover:bg-teal-700
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
};
