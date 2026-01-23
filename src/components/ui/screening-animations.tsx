'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// ==================== ANIMATION VARIANTS ====================

// Question card enter/exit
export const questionVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
    }
  },
  exit: {
    opacity: 0,
    x: -30,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: 'easeIn'
    }
  }
};

// Options stagger container
export const optionsContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1
    }
  }
};

// Individual option item
export const optionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};

// Summary item slide in
export const summaryItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
    height: 0
  },
  animate: {
    opacity: 1,
    x: 0,
    height: 'auto',
    transition: {
      duration: 0.25,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15
    }
  }
};

// Results card stagger
export const resultsContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
};

export const resultCardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// Red flag alert
export const alertVariants: Variants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

// Progress bar
export const progressVariants: Variants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  })
};

// ==================== ANIMATED COMPONENTS ====================

interface AnimatedQuestionProps {
  questionId: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedQuestion: React.FC<AnimatedQuestionProps> = ({
  questionId,
  children,
  className = ''
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionId}
        variants={questionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface AnimatedOptionsProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedOptions: React.FC<AnimatedOptionsProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      variants={optionsContainerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedOptionProps {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const AnimatedOption: React.FC<AnimatedOptionProps> = ({
  children,
  isSelected = false,
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <motion.button
      variants={optionVariants}
      whileHover={!disabled ? { scale: 1.01, y: -1 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={className}
      layout
    >
      <motion.div
        animate={isSelected ? {
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
        } : {}}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </motion.button>
  );
};

interface AnimatedProgressProps {
  progress: number;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  className = ''
}) => {
  return (
    <div className={`h-1.5 bg-slate-200 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-teal-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, progress)}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
};

interface AnimatedSummaryItemProps {
  children: React.ReactNode;
  itemKey: string;
  className?: string;
}

export const AnimatedSummaryItem: React.FC<AnimatedSummaryItemProps> = ({
  children,
  itemKey,
  className = ''
}) => {
  return (
    <motion.div
      key={itemKey}
      variants={summaryItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedResultsProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedResults: React.FC<AnimatedResultsProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      variants={resultsContainerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedResultCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const AnimatedResultCard: React.FC<AnimatedResultCardProps> = ({
  children,
  className = '',
  onClick,
  disabled = false
}) => {
  return (
    <motion.button
      variants={resultCardVariants}
      whileHover={!disabled ? { scale: 1.01, y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
};

interface AnimatedAlertProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}

export const AnimatedAlert: React.FC<AnimatedAlertProps> = ({
  children,
  show,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={alertVariants}
          initial="initial"
          animate="animate"
          exit="initial"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Processing indicator with pulsing dots
export const ProcessingIndicator: React.FC<{ text?: string }> = ({
  text = 'Processing...'
}) => {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-teal-500"
            animate={{
              y: [0, -6, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      <span className="text-sm text-slate-600">{text}</span>
    </motion.div>
  );
};

// Checkmark animation for selected options
export const AnimatedCheckmark: React.FC<{ show: boolean }> = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-5 h-5 text-teal-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
};

// Page transition wrapper
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

// Slide up panel (for mobile bottom sheets)
export const SlideUpPanel: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}> = ({ children, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Number counter animation
export const AnimatedNumber: React.FC<{
  value: number;
  className?: string;
}> = ({ value, className = '' }) => {
  return (
    <motion.span
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 10, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {value}
    </motion.span>
  );
};
