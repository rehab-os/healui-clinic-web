'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Circle } from 'lucide-react';

interface LiveFieldTrackerProps {
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  className?: string;
}

// Field groups matching ClinicalDx categories
const FIELD_GROUPS = [
  {
    label: 'Initial',
    fields: [
      { id: 'symptom_onset', label: 'Onset Date' },
      { id: 'onset_nature', label: 'Onset Nature' },
      { id: 'symptom_progression', label: 'Progression' },
      { id: 'previous_episodes', label: 'Previous Episodes' },
    ]
  },
  {
    label: 'Safety',
    fields: [
      { id: 'red_flag_screening', label: 'Red Flags' },
    ]
  },
  {
    label: 'Pain',
    fields: [
      { id: 'pain_screening', label: 'Has Pain' },
      { id: 'vas_score', label: 'VAS Score' },
      { id: 'pain_nature', label: 'Pain Type' },
      { id: 'pain_location', label: 'Location' },
      { id: 'pain_radiation', label: 'Radiation' },
      { id: 'behavior_24hr', label: '24hr Behavior' },
      { id: 'aggravating_factors', label: 'Aggravating' },
      { id: 'relieving_factors', label: 'Relieving' },
    ]
  },
  {
    label: 'Motor',
    fields: [
      { id: 'weakness_screening', label: 'Weakness' },
      { id: 'weakness_location', label: 'Weakness Location' },
    ]
  },
  {
    label: 'Sensory',
    fields: [
      { id: 'sensation_screening', label: 'Sensation' },
      { id: 'sensation_type', label: 'Sensation Type' },
    ]
  },
  {
    label: 'Mobility',
    fields: [
      { id: 'mobility_screening', label: 'Mobility' },
    ]
  },
  {
    label: 'Functional',
    fields: [
      { id: 'functional_impact', label: 'Functional Impact' },
    ]
  },
  {
    label: 'Objective',
    fields: [
      { id: 'swelling_assessment', label: 'Swelling' },
    ]
  }
];

const ALL_FIELDS = FIELD_GROUPS.flatMap(g => g.fields);

export default function LiveFieldTracker({
  extractedFields,
  fieldConfidence,
  className = '',
}: LiveFieldTrackerProps) {
  const capturedCount = Object.keys(extractedFields).length;
  const totalCount = ALL_FIELDS.length;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Fields Captured</h3>
          <span className="text-sm font-medium text-teal-600">
            {capturedCount}/{totalCount}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(capturedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Field groups */}
      <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
        {FIELD_GROUPS.map((group) => {
          const groupCaptured = group.fields.filter(f => extractedFields[f.id] !== undefined).length;
          if (group.fields.length === 0) return null;

          return (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {group.label}
                </span>
                {groupCaptured === group.fields.length && groupCaptured > 0 && (
                  <Check className="w-3 h-3 text-teal-500" />
                )}
              </div>
              <div className="space-y-1">
                <AnimatePresence>
                  {group.fields.map((field) => {
                    const value = extractedFields[field.id];
                    const confidence = fieldConfidence[field.id];
                    const isCaptured = value !== undefined;
                    const isLowConfidence = isCaptured && confidence !== undefined && confidence < 0.7;

                    return (
                      <motion.div
                        key={field.id}
                        layout
                        initial={isCaptured ? { opacity: 0, x: -10 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm ${
                          isCaptured
                            ? isLowConfidence
                              ? 'bg-amber-50 border border-amber-200'
                              : 'bg-teal-50 border border-teal-200'
                            : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        {isCaptured ? (
                          isLowConfidence ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                          )
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`flex-1 truncate ${isCaptured ? 'text-gray-900' : 'text-gray-400'}`}>
                          {field.label}
                        </span>
                        {isCaptured && (
                          <span className="text-xs text-gray-500 truncate max-w-[120px]">
                            {formatFieldValue(value)}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatFieldValue(value: any): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (Array.isArray(value)) {
    return value.map((v: any) => {
      if (typeof v === 'object' && v?.mainRegion) {
        const side = v.laterality && v.laterality !== 'center' ? ` (${v.laterality})` : '';
        return v.mainRegion.replace(/-/g, ' ') + side;
      }
      return String(v);
    }).join(', ');
  }
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value.length > 30 ? value.slice(0, 30) + '...' : value;
  if (typeof value === 'object' && value?.mainRegion) {
    const side = value.laterality && value.laterality !== 'center' ? ` (${value.laterality})` : '';
    return value.mainRegion.replace(/-/g, ' ') + side;
  }
  return JSON.stringify(value).slice(0, 30);
}
