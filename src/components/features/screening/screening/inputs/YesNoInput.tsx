'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, CircleDot } from 'lucide-react';

interface YesNoInputProps {
  value: string;
  onChange: (value: 'yes' | 'no') => void;
  onSubmit?: () => void;
  autoSubmit?: boolean;
}

const optionsContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const optionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const YesNoInput: React.FC<YesNoInputProps> = ({
  value,
  onChange,
  onSubmit,
  autoSubmit = true,
}) => {
  const handleSelect = (selectedValue: 'yes' | 'no') => {
    onChange(selectedValue);
    if (autoSubmit && onSubmit) {
      setTimeout(() => onSubmit(), 100);
    }
  };

  return (
    <motion.div
      className="grid grid-cols-2 gap-4"
      role="radiogroup"
      variants={optionsContainerVariants}
      initial="initial"
      animate="animate"
    >
      {[
        { value: 'yes', label: 'Yes', icon: Check },
        { value: 'no', label: 'No', icon: CircleDot },
      ].map(({ value: optValue, label, icon: Icon }, index) => (
        <motion.button
          key={optValue}
          variants={optionVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          role="radio"
          aria-checked={value === optValue}
          tabIndex={value === optValue || (!value && index === 0) ? 0 : -1}
          onClick={() => handleSelect(optValue as 'yes' | 'no')}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault();
              handleSelect(optValue === 'yes' ? 'no' : 'yes');
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelect(optValue as 'yes' | 'no');
            }
          }}
          className={`flex items-center justify-center gap-3 min-h-[64px] rounded-xl border-2 transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
            value === optValue
              ? 'border-brand-teal bg-brand-teal text-white shadow-xl shadow-teal-500/30'
              : 'border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50/50 hover:shadow-lg text-gray-700'
          }`}
        >
          <Icon className={`h-6 w-6 ${value === optValue ? 'text-white' : 'text-gray-400'}`} />
          <span className="font-semibold text-lg">{label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};
