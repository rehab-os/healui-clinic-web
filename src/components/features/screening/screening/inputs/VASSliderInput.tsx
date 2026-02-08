'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface VASSliderInputProps {
  value: number;
  onChange: (value: number) => void;
  onSubmit?: () => void;
  min?: number;
  max?: number;
  showSubmitButton?: boolean;
}

export const VASSliderInput: React.FC<VASSliderInputProps> = ({
  value,
  onChange,
  onSubmit,
  min = 0,
  max = 10,
  showSubmitButton = true,
}) => {
  const getSeverityStyle = (val: number) => {
    if (val === 0) return 'bg-green-100 text-green-700';
    if (val <= 3) return 'bg-green-100 text-green-700';
    if (val <= 6) return 'bg-yellow-100 text-yellow-700';
    if (val <= 8) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const getSeverityLabel = (val: number) => {
    if (val === 0) return 'No pain';
    if (val <= 3) return 'Mild pain';
    if (val <= 6) return 'Moderate pain';
    if (val <= 8) return 'Severe pain';
    return 'Worst pain';
  };

  const getAmbientBg = (val: number) => {
    if (val === 0) return 'from-green-50/50 to-white';
    if (val <= 3) return 'from-green-50/50 to-white';
    if (val <= 6) return 'from-yellow-50/50 to-white';
    if (val <= 8) return 'from-orange-50/50 to-white';
    return 'from-red-50/50 to-white';
  };

  return (
    <div className="space-y-6">
      <div
        className={`bg-gradient-to-br ${getAmbientBg(value)} rounded-2xl p-8 sm:p-10 shadow-lg border-2 border-gray-100 transition-all duration-500`}
      >
        <motion.div
          className="text-center mb-10"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          key={value}
        >
          <motion.div
            className="text-8xl font-black bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent tabular-nums"
            animate={{ scale: [1.1, 1] }}
            transition={{ duration: 0.2 }}
            key={`value-${value}`}
          >
            {value}
          </motion.div>
          <motion.div
            className={`text-base font-bold mt-4 inline-block px-6 py-2 rounded-full shadow-md ${getSeverityStyle(value)}`}
            animate={{ scale: [1.1, 1] }}
            transition={{ duration: 0.2 }}
            key={`badge-${value}`}
          >
            {getSeverityLabel(value)}
          </motion.div>
        </motion.div>

        {/* Slider with gradient track */}
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            aria-label="Pain scale from 0 to 10"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={getSeverityLabel(value)}
            style={{
              background: `linear-gradient(to right,
                rgb(34, 197, 94) 0%,
                rgb(234, 179, 8) 50%,
                rgb(239, 68, 68) 100%)`,
            }}
            className="w-full h-4 rounded-full appearance-none cursor-grab active:cursor-grabbing shadow-inner
              focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-12
              [&::-webkit-slider-thumb]:h-12
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-grab
              [&::-webkit-slider-thumb]:shadow-2xl
              [&::-webkit-slider-thumb]:shadow-gray-900/30
              [&::-webkit-slider-thumb]:border-4
              [&::-webkit-slider-thumb]:border-brand-teal
              [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:duration-150
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:active:scale-125
              [&::-webkit-slider-thumb]:active:cursor-grabbing
              [&::-webkit-slider-thumb]:focus-visible:ring-4
              [&::-webkit-slider-thumb]:focus-visible:ring-teal-200"
          />
        </div>

        <div className="flex justify-between text-base font-semibold text-gray-600 mt-6 px-1">
          <div className="flex flex-col items-start">
            <span className="text-2xl">😊</span>
            <span className="text-xs">None</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">😐</span>
            <span className="text-xs">Moderate</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl">😣</span>
            <span className="text-xs">Worst</span>
          </div>
        </div>
      </div>

      {showSubmitButton && onSubmit && (
        <Button
          onClick={onSubmit}
          className="w-full bg-brand-teal hover:bg-brand-teal/90 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] text-white rounded-xl min-h-[64px] font-semibold text-lg transition-all duration-200"
        >
          Continue <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
