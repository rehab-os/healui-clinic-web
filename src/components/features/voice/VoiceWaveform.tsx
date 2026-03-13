'use client';

import React, { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  volumeLevel: number; // 0-1
  isActive: boolean;
  barCount?: number;
  className?: string;
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  volumeLevel,
  isActive,
  barCount = 28,
  className = '',
}) => {
  const barsRef = useRef<number[]>(Array(barCount).fill(0));
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      barsRef.current = Array(barCount).fill(0);
      return;
    }

    // Push new volume sample and shift left for flowing effect
    const update = () => {
      const bars = barsRef.current;
      // Shift bars left
      for (let i = 0; i < bars.length - 1; i++) {
        bars[i] = bars[i + 1];
      }
      // Add new bar with slight randomness for organic feel
      const noise = 0.7 + Math.random() * 0.6;
      bars[bars.length - 1] = volumeLevel * noise;

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isActive, volumeLevel, barCount]);

  return (
    <div className={`flex items-center justify-center gap-[2px] h-8 ${className}`}>
      {barsRef.current.map((level, i) => {
        // Minimum height so bars are always visible
        const height = isActive
          ? Math.max(3, level * 28)
          : 3;

        // Center bars are more prominent
        const centerWeight = 1 - Math.abs(i - barCount / 2) / (barCount / 2) * 0.3;
        const adjustedHeight = height * centerWeight;

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-75"
            style={{
              width: '2.5px',
              height: `${Math.max(3, adjustedHeight)}px`,
              backgroundColor: isActive
                ? level > 0.3
                  ? '#0d9488' // teal-600 for speech
                  : '#5eead4' // teal-300 for quiet
                : '#d1d5db', // gray-300 for inactive
              opacity: isActive ? 0.6 + level * 0.4 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
};

export default VoiceWaveform;
