'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface FloatingSummaryPanelProps {
  collectedData: Record<string, any>;
  selectedRegions: Array<{ mainRegion: string; laterality?: string }>;
  answeredCount: number;
  totalQuestions?: number;
  redFlags?: string[];
  isAIMode?: boolean;
  className?: string;
  isSourceTrackingPhase?: boolean;
  identifiedSources?: Array<{ sourceRegion: string; implication: string }>;
}

// Clean labels for display
const fieldLabels: Record<string, string> = {
  chief_complaint: 'Chief Complaint',
  pain_location: 'Location',
  body_map: 'Body Region',
  vas_score: 'Pain Score',
  pain_nature: 'Pain Type',
  symptom_onset: 'Started',
  onset_nature: 'How it Started',
  symptom_progression: 'Progression',
  aggravating_factors: 'Makes Worse',
  relieving_factors: 'Makes Better',
  functional_impact: 'Affects',
  work_impact: 'Work Impact',
  previous_episodes: 'Previous Episodes',
  previous_treatment: 'Past Treatment',
  medications: 'Medications',
  comorbidities: 'Other Conditions',
  red_flags: 'Red Flags',
  night_pain: 'Night Pain',
  morning_stiffness: 'Morning Stiffness',
  pain_screening: 'Has Pain',
  weakness_screening: 'Has Weakness',
  sensation_screening: 'Sensation Changes',
  mobility_screening: 'Mobility Issues',
};

// Format any value for display
const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === '') return '';

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    return value
      .map(v => {
        if (typeof v === 'string') return v.replace(/_/g, ' ');
        if (typeof v === 'object' && v.slug) return v.slug.replace(/_/g, ' ');
        if (typeof v === 'object' && v.mainRegion) return v.mainRegion.replace(/_/g, ' ');
        return String(v);
      })
      .join(', ');
  }

  // Objects
  if (typeof value === 'object') {
    if (value.slug) return value.slug.replace(/_/g, ' ');
    if (value.mainRegion) return value.mainRegion.replace(/_/g, ' ');
    if (value.detailed && Array.isArray(value.detailed)) {
      return value.detailed.map((d: any) => d.mainRegion?.replace(/_/g, ' ')).join(', ');
    }
    return '';
  }

  // Numbers (pain scores)
  if (typeof value === 'number') {
    if (key.includes('score') || key === 'vas_score') return `${value}/10`;
    return value.toString();
  }

  // Dates
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = new Date(value);
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days <= 7) return `${days} days ago`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks ago`;
    if (days <= 365) return `${Math.ceil(days / 30)} months ago`;
    return `${Math.floor(days / 365)}+ years ago`;
  }

  // Yes/No
  if (value === 'yes') return 'Yes';
  if (value === 'no') return 'No';

  // Regular strings
  if (typeof value === 'string') {
    return value.replace(/_/g, ' ');
  }

  return String(value);
};

const FloatingSummaryPanel: React.FC<FloatingSummaryPanelProps> = ({
  collectedData,
  selectedRegions,
  answeredCount,
  totalQuestions = 15,
  redFlags = [],
  className = '',
}) => {
  // Get ALL items (no limit)
  const allItems = Object.entries(collectedData)
    .map(([key, value]) => ({
      key,
      label: fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: formatValue(key, value),
    }))
    .filter(item => item.value); // Only show items with values

  const progress = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Simple Header */}
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Summary</span>
          <motion.span
            key={answeredCount}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs text-slate-400"
          >
            {answeredCount} of {totalQuestions}
          </motion.span>
        </div>
        {/* Animated Progress bar */}
        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Red Flags - Animated */}
      <AnimatePresence>
        {redFlags.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 bg-red-50 border-b border-red-100">
              <div className="flex items-start gap-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                </motion.div>
                <div className="text-xs text-red-700">
                  <span className="font-medium">Red Flags: </span>
                  {redFlags.map(f => f.replace(/_/g, ' ')).join(', ')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Answers - Scrollable with animations */}
      <div className="flex-1 overflow-y-auto">
        {allItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 text-center text-slate-400 text-xs"
          >
            Your answers will appear here
          </motion.div>
        ) : (
          <div className="divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {allItems.map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.25,
                    delay: index === allItems.length - 1 ? 0 : 0, // Only animate latest item
                  }}
                  layout
                  className="px-3 py-2"
                >
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-700 capitalize">
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Animated Footer */}
      <AnimatePresence>
        {answeredCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-3 py-2 border-t border-slate-100 bg-slate-50/50"
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
              </motion.div>
              <motion.span
                key={progress >= 80 ? 'done' : progress >= 50 ? 'half' : 'start'}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {progress >= 80 ? 'Almost done' : progress >= 50 ? 'Halfway there' : 'Keep going'}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingSummaryPanel;
