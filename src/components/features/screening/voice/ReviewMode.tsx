'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface ReviewModeProps {
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  gapAnswers: Record<string, any>;
  regionAnswers?: Record<string, any>;
  transcript?: string;
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
  transcript,
  onFinalize,
  onBack,
  isLoading = false,
}: ReviewModeProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const allFields = { ...extractedFields, ...gapAnswers };
  const chiefComplaint = deriveChiefComplaint(allFields);

  // Separate chief_complaint from other fields
  const displayFields = Object.entries(allFields).filter(([k]) => k !== 'chief_complaint');

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Chief complaint — hero section */}
      {chiefComplaint && (
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-2 font-medium">
            Chief Complaint
          </p>
          <p className="text-base text-gray-800 leading-relaxed font-light">
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
        <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-3 font-medium">
          {displayFields.length} fields captured
        </p>

        {/* Body Region + Laterality — prominent editable selector */}
        <RegionLateralityRow
          painLocation={allFields.pain_location}
          onUpdate={(updated) => {
            // Update the extractedFields directly so downstream steps see it
            extractedFields.pain_location = updated;
          }}
        />

        {displayFields.filter(([key]) => key !== 'pain_location').map(([key, value], idx) => {
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
                <span className={`text-[13px] ${isLowConfidence ? 'text-amber-500' : 'text-gray-400'} w-[130px] flex-shrink-0 capitalize`}>
                  {label}
                </span>
                <div className="flex items-center gap-1.5">
                  {isFromGap && (
                    <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">gap</span>
                  )}
                  {isFromRegion && (
                    <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">region</span>
                  )}
                </div>
              </div>
              <span className={`text-[13px] text-right max-w-[55%] capitalize font-medium ${
                isLowConfidence ? 'text-amber-600' : 'text-gray-800'
              }`}>
                {formatDisplayValue(value)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Transcript — collapsible at bottom of list */}
      {transcript && (
        <div className="px-5 py-3 border-t border-gray-50">
          <button
            onClick={() => setShowTranscript(v => !v)}
            className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-600 transition-colors w-full text-left"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
            {showTranscript ? 'Hide' : 'Show'} recording transcript
          </button>
          {showTranscript && (
            <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
              {transcript}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={onFinalize}
          disabled={isLoading}
          className={`w-full py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 border ${
            !isLoading
              ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
              : 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Processing...' : 'Continue to Examination'}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onBack}
          className="w-full py-2.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}

// ── Region + Laterality selector for Review step ──

const REVIEW_REGIONS = [
  { id: 'shoulder', label: 'Shoulder', paired: true },
  { id: 'elbow', label: 'Elbow', paired: true },
  { id: 'wrist', label: 'Wrist', paired: true },
  { id: 'hand', label: 'Hand', paired: true },
  { id: 'hip', label: 'Hip', paired: true },
  { id: 'knee', label: 'Knee', paired: true },
  { id: 'ankle', label: 'Ankle', paired: true },
  { id: 'foot', label: 'Foot', paired: true },
  { id: 'lower-back', label: 'Lumbar Spine', paired: false },
  { id: 'neck', label: 'Cervical Spine', paired: false },
  { id: 'thoracic', label: 'Thoracic Spine', paired: false },
  { id: 'head', label: 'Head', paired: false },
];

function RegionLateralityRow({
  painLocation,
  onUpdate,
}: {
  painLocation: any;
  onUpdate: (updated: any[]) => void;
}) {
  // Parse current value
  const current = Array.isArray(painLocation) ? painLocation : painLocation ? [painLocation] : [];
  const firstLoc = current[0];
  const currentRegion = typeof firstLoc === 'object' && firstLoc?.mainRegion
    ? firstLoc.mainRegion : typeof firstLoc === 'string' ? firstLoc : null;
  const currentLaterality = typeof firstLoc === 'object' && firstLoc?.laterality
    ? firstLoc.laterality : null;

  const matchedRegion = REVIEW_REGIONS.find(r =>
    r.id === currentRegion || r.id === currentRegion?.replace(/_/g, '-')
  );
  const isPaired = matchedRegion?.paired ?? false;
  const regionLabel = matchedRegion?.label || (currentRegion ? currentRegion.replace(/[-_]/g, ' ') : null);

  const [isEditing, setIsEditing] = React.useState(!currentRegion);

  const handleRegionChange = (regionId: string) => {
    const region = REVIEW_REGIONS.find(r => r.id === regionId);
    if (!region) return;
    if (!region.paired) {
      onUpdate([{ mainRegion: regionId, laterality: 'center', subRegions: [] }]);
      setIsEditing(false);
    } else {
      // Paired — need laterality, keep editing
      onUpdate([{ mainRegion: regionId, laterality: null, subRegions: [] }]);
    }
  };

  const handleLateralityChange = (lat: string) => {
    const regionId = current[0]?.mainRegion || currentRegion;
    if (!regionId) return;
    onUpdate([{ mainRegion: regionId, laterality: lat, subRegions: [] }]);
    setIsEditing(false);
  };

  const needsLaterality = current[0]?.mainRegion && !current[0]?.laterality &&
    REVIEW_REGIONS.find(r => r.id === current[0]?.mainRegion)?.paired;

  // Display mode — compact with edit button
  if (!isEditing && currentRegion && (currentLaterality || !isPaired)) {
    const latDisplay = currentLaterality === 'both' ? 'Both Sides'
      : currentLaterality === 'left' ? 'Left'
      : currentLaterality === 'right' ? 'Right'
      : currentLaterality === 'center' ? ''
      : '';

    return (
      <div className="flex items-center justify-between py-3 px-3 mb-3 bg-teal-50 border border-teal-200 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-teal-600 font-semibold uppercase tracking-wider">Region</span>
          <span className="text-[14px] text-teal-800 font-medium capitalize">{regionLabel}</span>
          {latDisplay && (
            <span className="text-[12px] text-teal-600 bg-white px-2 py-0.5 rounded border border-teal-200 font-medium">
              {latDisplay}
            </span>
          )}
        </div>
        <span
          onClick={() => setIsEditing(true)}
          className="text-[12px] text-teal-500 hover:text-teal-700 cursor-pointer font-medium"
        >
          Change
        </span>
      </div>
    );
  }

  // Edit mode — region dropdown + laterality
  return (
    <div className="py-3 px-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-amber-600 font-semibold uppercase tracking-wider">
          {currentRegion ? 'Change Region' : 'Select Body Region'}
        </span>
        {currentRegion && (
          <span
            onClick={() => setIsEditing(false)}
            className="text-[12px] text-amber-500 hover:text-amber-700 cursor-pointer font-medium"
          >
            Cancel
          </span>
        )}
      </div>

      {/* Region selector */}
      <div className="flex flex-wrap gap-1.5">
        {REVIEW_REGIONS.map(region => {
          const isActive = current[0]?.mainRegion === region.id;
          return (
            <span
              key={region.id}
              onClick={() => handleRegionChange(region.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {region.label}
            </span>
          );
        })}
      </div>

      {/* Laterality selector — shown for paired regions */}
      {needsLaterality && (
        <div className="flex gap-2">
          {[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'both', label: 'Both' },
          ].map(opt => (
            <span
              key={opt.value}
              onClick={() => handleLateralityChange(opt.value)}
              className="flex-1 py-2 text-center rounded-lg text-[13px] font-medium border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-all cursor-pointer select-none"
            >
              {opt.label}
            </span>
          ))}
        </div>
      )}

      {!currentRegion && (
        <p className="text-[11px] text-amber-500">
          Body region was not detected from voice. Please select manually.
        </p>
      )}
    </div>
  );
}
