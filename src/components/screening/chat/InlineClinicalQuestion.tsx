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
  allowMultiple?: boolean; // Allow selecting multiple options
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
    if (onSubmit) {
      setTimeout(() => onSubmit(), 300);
    }
  };

  const handleMultipleChoiceClick = (option: string | { value: string; label: string }) => {
    const optionValue = typeof option === 'string' ? option : option.value;

    if (allowMultiple) {
      // Multi-select: toggle option in array
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v: string) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
      // Don't auto-submit for multi-select
    } else {
      // Single-select: replace value
      onChange(optionValue);
      if (onSubmit) {
        setTimeout(() => onSubmit(), 300);
      }
    }
  };

  // Helper to get option value
  const getOptionValue = (option: string | { value: string; label: string }) => {
    return typeof option === 'string' ? option : option.value;
  };

  // Helper to get option label
  const getOptionLabel = (option: string | { value: string; label: string }) => {
    return typeof option === 'string' ? option : option.label;
  };

  return (
    <div className="space-y-4">
      {/* Question Text */}
      <p className="text-base leading-relaxed text-gray-800 font-medium">
        {question}
      </p>

      {/* Yes/No Buttons */}
      {type === 'yes-no' && (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) handleYesNoClick('yes');
            }}
            disabled={disabled}
            className={`
              relative overflow-hidden rounded-xl p-5 font-semibold text-base
              transition-all duration-300 border-2
              ${value === 'yes'
                ? 'bg-brand-teal text-white border-transparent shadow-lg shadow-teal-500/20'
                : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:shadow-md'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Yes
              {value === 'yes' && <Check className="w-5 h-5" />}
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) handleYesNoClick('no');
            }}
            disabled={disabled}
            className={`
              relative overflow-hidden rounded-xl p-5 font-semibold text-base
              transition-all duration-300 border-2
              ${value === 'no'
                ? 'bg-gray-700 text-white border-transparent shadow-lg shadow-gray-500/20'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              No
              {value === 'no' && <Check className="w-5 h-5" />}
            </span>
          </motion.button>
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
              className="w-full h-3 rounded-full appearance-none cursor-pointer
                bg-gradient-to-r from-teal-100 via-amber-100 to-red-100
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-8
                [&::-webkit-slider-thumb]:h-8
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-brand-teal
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-teal-500/30
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-4
                [&::-webkit-slider-thumb]:border-white
                [&::-moz-range-thumb]:w-8
                [&::-moz-range-thumb]:h-8
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-brand-teal
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:shadow-teal-500/30
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-4
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:border-0
              "
            />
          </div>

          {/* Value Display */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">No pain (0)</span>
            <motion.div
              key={value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-full bg-brand-teal text-white font-bold text-lg shadow-lg"
            >
              {value || 0}
            </motion.div>
            <span className="text-gray-500">Worst pain (10)</span>
          </div>

          {/* Submit Button for Slider */}
          {onSubmit && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSubmit) onSubmit();
              }}
              disabled={disabled}
              className="w-full rounded-xl p-5 font-semibold text-base
                bg-brand-teal text-white
                hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </motion.button>
          )}
        </div>
      )}

      {/* Multiple Choice */}
      {type === 'multiple-choice' && (
        <div className="space-y-3">
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
                whileHover={{ scale: disabled ? 1 : 1.01, x: disabled ? 0 : 4 }}
                whileTap={{ scale: disabled ? 1 : 0.99 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled) handleMultipleChoiceClick(option);
                }}
                disabled={disabled}
                className={`
                  w-full text-left rounded-xl p-5 font-medium text-base
                  transition-all duration-300 border-2
                  ${isSelected
                    ? 'bg-brand-teal text-white border-transparent shadow-lg shadow-teal-500/20'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:shadow-md'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="flex items-center justify-between">
                  {optionLabel}
                  {isSelected && <Check className="w-5 h-5 flex-shrink-0" />}
                </span>
              </motion.button>
            );
          })}

          {/* Continue button for multi-select */}
          {allowMultiple && onSubmit && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSubmit) onSubmit();
              }}
              disabled={disabled || !value || (Array.isArray(value) && value.length === 0)}
              className="w-full rounded-xl p-5 font-semibold text-base
                bg-brand-teal text-white
                hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </motion.button>
          )}
        </div>
      )}

      {/* Text Input */}
      {type === 'text' && (
        <div className="space-y-3">
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            rows={3}
            className="w-full rounded-xl p-5 text-base border-2 border-gray-200
              focus:border-brand-teal focus:outline-none focus:ring-4 focus:ring-teal-500/20
              transition-all duration-300 resize-none
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {onSubmit && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSubmit) onSubmit();
              }}
              disabled={disabled || !value || (typeof value === 'string' && !value.trim())}
              className="w-full rounded-xl p-5 font-semibold text-base
                bg-brand-teal text-white
                hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};
