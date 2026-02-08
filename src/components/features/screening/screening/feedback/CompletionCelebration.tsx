'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const CompletionCelebration: React.FC = () => {
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random(),
    color: ['bg-teal-500', 'bg-teal-400', 'bg-teal-300', 'bg-yellow-400', 'bg-green-400'][
      Math.floor(Math.random() * 5)
    ],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -20, x: `${piece.x}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            rotate: 360,
            opacity: 0,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn',
          }}
          className={`absolute w-3 h-3 ${piece.color} rounded-sm`}
        />
      ))}
    </div>
  );
};
