'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ReviewModeProps {
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  gapAnswers: Record<string, any>;
  regionAnswers?: Record<string, any>;
  onFinalize: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  symptom_onset: 'Onset Date',
  onset_nature: 'Onset',
  symptom_progression: 'Progression',
  previous_episodes: 'Previous Episodes',
  previous_episode_comparison: 'vs. Previous',
  red_flag_screening: 'Red Flags',
  pain_screening: 'Has Pain',
  vas_score: 'VAS Score',
  pain_nature: 'Pain Type',
  pain_location: 'Location',
  pain_radiation: 'Radiates',
  radiation_pattern: 'Radiation Pattern',
  pain_timing: 'Pain Timing',
  pain_movement: 'On Movement',
  behavior_24hr: '24hr Behavior',
  morning_stiffness_duration: 'Morning Stiffness',
  night_pain_details: 'Night Pain',
  aggravating_factors: 'Aggravating',
  relieving_factors: 'Relieving',
  weakness_screening: 'Weakness',
  weakness_location: 'Weakness Location',
  sensation_screening: 'Sensation Changes',
  sensation_type: 'Sensation Type',
  mobility_screening: 'Mobility Issues',
  functional_impact: 'Function Affected',
  swelling_assessment: 'Swelling',
};

// Derive a plain-language chief complaint from extracted fields
function deriveChiefComplaint(fields: Record<string, any>): string | null {
  if (fields.chief_complaint) return fields.chief_complaint;

  const parts: string[] = [];

  const loc = fields.pain_location;
  if (loc) {
    const locations = Array.isArray(loc) ? loc : [loc];
    const locStr = locations.map((l: any) => {
      if (typeof l === 'object' && l?.mainRegion) {
        const side = l.laterality && l.laterality !== 'center' ? `${l.laterality} ` : '';
        return `${side}${l.mainRegion.replace(/-/g, ' ')}`;
      }
      return String(l).replace(/_/g, ' ');
    }).filter(Boolean).join(' and ');
    if (locStr) parts.push(locStr);
  }

  const onsetMap: Record<string, string> = {
    sudden: 'sudden onset', gradual: 'gradual onset',
    after_injury: 'post-injury', unknown: '',
  };
  const onset = fields.onset_nature ? onsetMap[fields.onset_nature] || '' : '';

  const natureStr = fields.pain_nature
    ? (Array.isArray(fields.pain_nature) ? fields.pain_nature.join('/') : fields.pain_nature)
    : '';

  let sentence = '';
  if (parts.length > 0) {
    sentence = `Patient presents with ${onset ? onset + ' ' : ''}${parts[0]} pain`;
    if (natureStr) sentence += ` (${natureStr.replace(/_/g, ' ')})`;
  } else if (fields.pain_screening === true) {
    sentence = `Patient presents with pain${onset ? ', ' + onset : ''}`;
  }

  if (fields.vas_score != null) {
    sentence += `. VAS ${fields.vas_score}/10`;
  }

  if (fields.pain_radiation === true && fields.radiation_pattern) {
    const rMap: Record<string, string> = {
      down_arm: 'radiating down arm', down_leg: 'radiating down leg',
      across_back: 'radiating across back', around_chest: 'radiating around chest',
      up_to_head: 'radiating to head', other_pattern: 'with radiation',
    };
    sentence += `, ${rMap[fields.radiation_pattern] || 'with radiation'}`;
  }

  if (fields.symptom_progression === 'getting_worse') sentence += '. Currently worsening';

  return sentence ? sentence + '.' : null;
}

function formatDisplayValue(value: any): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.filter(v => v !== 'none').map((v: any) => {
      if (typeof v === 'object' && v?.mainRegion) {
        const side = v.laterality && v.laterality !== 'center' ? ` (${v.laterality})` : '';
        return v.mainRegion.replace(/-/g, ' ') + side;
      }
      return String(v).replace(/_/g, ' ');
    }).join(' · ') || 'None';
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.replace(/_/g, ' ');
  return JSON.stringify(value);
}

export default function ReviewMode({
  extractedFields,
  fieldConfidence,
  gapAnswers,
  regionAnswers = {},
  onFinalize,
  onBack,
  isLoading = false,
}: ReviewModeProps) {
  const allFields = { ...extractedFields, ...gapAnswers };
  const chiefComplaint = deriveChiefComplaint(allFields);

  // Separate chief_complaint from other fields
  const displayFields = Object.entries(allFields).filter(([k]) => k !== 'chief_complaint');

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Chief complaint — hero section */}
      {chiefComplaint && (
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-2">
            Chief Complaint
          </p>
          <p className="text-[14px] text-gray-800 leading-relaxed font-light">
            {chiefComplaint}
          </p>
          <div className="flex items-center gap-3 mt-3">
            {allFields.vas_score != null && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                allFields.vas_score >= 7
                  ? 'border-red-300 text-red-500'
                  : allFields.vas_score >= 4
                  ? 'border-amber-300 text-amber-600'
                  : 'border-gray-200 text-gray-500'
              }`}>
                VAS {allFields.vas_score}/10
              </span>
            )}
            {allFields.onset_nature && (
              <span className="text-[11px] text-gray-400 capitalize">
                {String(allFields.onset_nature).replace(/_/g, ' ')}
              </span>
            )}
            {allFields.symptom_progression && (
              <span className={`text-[11px] ${
                allFields.symptom_progression === 'getting_worse' ? 'text-red-500' :
                allFields.symptom_progression === 'getting_better' ? 'text-teal-600' :
                'text-gray-400'
              }`}>
                {String(allFields.symptom_progression).replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Field list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.12em] mb-3">
          {displayFields.length} fields captured
        </p>

        {displayFields.map(([key, value], idx) => {
          const confidence = fieldConfidence[key];
          const isLowConfidence = confidence !== undefined && confidence < 0.7;
          const isFromGap = gapAnswers[key] !== undefined;
          const isFromRegion = regionAnswers[key] !== undefined;
          const label = FIELD_LABELS[key] || key.replace(/_/g, ' ');

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
              className="flex items-start justify-between py-2 border-b border-gray-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[11px] ${isLowConfidence ? 'text-amber-500' : 'text-gray-400'} w-[120px] flex-shrink-0 capitalize`}>
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  {isFromGap && (
                    <span className="text-[9px] text-gray-400 border border-gray-200 px-1 rounded">gap</span>
                  )}
                  {isFromRegion && (
                    <span className="text-[9px] text-gray-400 border border-gray-200 px-1 rounded">region</span>
                  )}
                </div>
              </div>
              <span className={`text-[12px] text-right max-w-[55%] capitalize ${
                isLowConfidence ? 'text-amber-600' : 'text-gray-700'
              }`}>
                {formatDisplayValue(value)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={onFinalize}
          disabled={isLoading}
          className={`w-full py-3.5 rounded-xl text-[13px] font-medium transition-all flex items-center justify-center gap-2 border ${
            !isLoading
              ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
              : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Processing...' : 'Continue to Clinical Tests'}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onBack}
          className="w-full py-2.5 text-[12px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
