'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Scan, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

// Static findings data — no backend call needed
import mriData from '@/data/findings/mri.json';
import xrayData from '@/data/findings/xray.json';
import ctData from '@/data/findings/ct.json';
import ultrasoundData from '@/data/findings/ultrasound.json';

interface ImagingRecommendation {
  modality: string;
  label: string;
  patient_label: string;
  indication_label: string;
  referral_text: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  isRecommended: boolean; // true if AI matched this to the differential
}

interface ImagingModeProps {
  extractedFields: Record<string, any>;
  analysisAnswers: Record<string, any>;
  diagnosisConfidence: number;
  topDifferential: { condition_name: string; confidence: number }[];
  onRequestImaging: (requests: ImagingRecommendation[]) => void;
  onSkip: () => void;
}

const URGENCY_STYLES: Record<string, string> = {
  emergency: 'bg-red-50 border-red-300 text-red-700',
  urgent:    'bg-amber-50 border-amber-300 text-amber-700',
  routine:   'bg-white border-gray-200 text-gray-700',
};

const MODALITY_COLORS: Record<string, string> = {
  'MRI':        'bg-teal-600',
  'X-Ray':      'bg-blue-600',
  'CT':         'bg-orange-600',
  'Ultrasound': 'bg-violet-600',
};

const REGION_ALIAS: Record<string, string> = {
  lumbar: 'lumbar_spine', lower_back: 'lumbar_spine', cervical: 'cervical_spine',
  neck: 'cervical_spine', thoracic: 'thoracic_spine',
  shoulder: 'shoulder', elbow: 'elbow', wrist: 'wrist', hand: 'hand',
  hip: 'hip', knee: 'knee', ankle: 'ankle', foot: 'foot',
};

const ALL_MODALITIES = [
  { key: 'xray', data: xrayData.xray_imaging },
  { key: 'mri', data: mriData.mri_imaging },
  { key: 'ultrasound', data: ultrasoundData.ultrasound_imaging },
  { key: 'ct', data: ctData.ct_imaging },
];

export default function ImagingMode({
  extractedFields,
  analysisAnswers,
  diagnosisConfidence,
  topDifferential,
  onRequestImaging,
  onSkip,
}: ImagingModeProps) {
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());
  const [expandedIdx, setExpandedIdx]   = useState<number | null>(null);
  const [showAll, setShowAll]           = useState(false);

  const CONFIDENCE_THRESHOLD = 0.75;
  const isConfident = diagnosisConfidence >= CONFIDENCE_THRESHOLD;

  // Detect region
  const region: string = analysisAnswers.analysis_region
    ?? extractedFields.analysis_region
    ?? detectRegionString(extractedFields.pain_location);

  const normalizedRegion = REGION_ALIAS[region] ?? region;
  const conditionNames = topDifferential.map(d => d.condition_name.toLowerCase());

  // Build recommendations from local JSON — always computed, not gated by confidence
  const { recommended, available } = useMemo(() => {
    const recommended: ImagingRecommendation[] = [];
    const available: ImagingRecommendation[] = [];
    const seen = new Set<string>();

    for (const { data } of ALL_MODALITIES) {
      const regionEntries = (data || []).filter((e: any) =>
        e.region === normalizedRegion || e.region === region
      );

      for (const entry of regionEntries) {
        for (const ind of entry.indications) {
          const key = `${entry.modality}::${entry.label}::${ind.id}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const findsLower = ind.finds.map((f: string) => f.toLowerCase());
          const matches = conditionNames.some(cond =>
            findsLower.some((find: string) => find.includes(cond) || cond.includes(find.split(' ')[0]))
          );

          const rec: ImagingRecommendation = {
            modality: entry.modality,
            label: entry.label,
            patient_label: entry.patient_label,
            indication_label: ind.label,
            referral_text: ind.referral_text,
            urgency: ind.urgency as 'routine' | 'urgent' | 'emergency',
            isRecommended: matches,
          };

          if (matches || ind.urgency === 'emergency') {
            recommended.push(rec);
          } else {
            available.push(rec);
          }
        }
      }
    }

    // Deduplicate by modality+label (keep first match per modality+label)
    const dedup = (arr: ImagingRecommendation[]) => {
      const map = new Map<string, ImagingRecommendation>();
      for (const r of arr) {
        const k = `${r.modality}::${r.label}`;
        if (!map.has(k)) map.set(k, r);
      }
      return Array.from(map.values());
    };

    return { recommended: dedup(recommended).slice(0, 5), available: dedup(available) };
  }, [normalizedRegion, region, conditionNames]);

  const allRecs = showAll ? [...recommended, ...available] : recommended;

  const toggleSelect = (idx: number) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const handleRequest = () => {
    const selected = allRecs.filter((_, i) => selectedIds.has(i));
    onRequestImaging(selected);
  };

  // No region detected — can't show anything
  if (!region) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <Scan className="w-8 h-8 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No body region detected for imaging lookup.</p>
        </div>
        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onSkip} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
        <p className="text-[12px] text-gray-400 uppercase tracking-[0.12em] mb-0.5 font-medium">Imaging</p>
        <h3 className="text-base font-semibold text-gray-800">
          {isConfident && recommended.length === 0 ? 'No imaging required' : 'Imaging Recommendations'}
        </h3>
        {isConfident && (
          <p className="text-[13px] text-gray-400 mt-0.5">
            Confidence is high — imaging is optional but available if needed.
          </p>
        )}
        {!isConfident && recommended.length > 0 && (
          <p className="text-[13px] text-gray-400 mt-0.5">
            Confidence {Math.round(diagnosisConfidence * 100)}% — imaging recommended to confirm
          </p>
        )}
      </div>

      {/* Confidence indicator */}
      <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${diagnosisConfidence >= 0.75 ? 'bg-teal-500' : diagnosisConfidence >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(diagnosisConfidence * 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[13px] font-mono font-medium text-gray-600 flex-shrink-0">
          {Math.round(diagnosisConfidence * 100)}% confident
        </span>
      </div>

      {/* Recommendations */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {recommended.length > 0 && (
          <p className="text-[12px] text-gray-400 font-medium uppercase tracking-[0.12em]">
            {isConfident ? 'Available imaging (optional)' : 'Recommended imaging'}
          </p>
        )}

        {allRecs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
              <Scan className="w-8 h-8 text-teal-500" />
            </div>
            <p className="text-base font-medium text-gray-800 mb-2">No imaging available</p>
            <p className="text-[13px] text-gray-400">No imaging studies found for this region.</p>
          </div>
        )}

        <AnimatePresence>
          {allRecs.map((rec, idx) => {
            const isSelected = selectedIds.has(idx);
            const isExpanded = expandedIdx === idx;
            const urgencyStyle = URGENCY_STYLES[rec.urgency] ?? URGENCY_STYLES.routine;
            const modalityColor = MODALITY_COLORS[rec.modality] ?? 'bg-gray-500';
            const isBeyondRecommended = idx >= recommended.length;

            return (
              <motion.div
                key={`${rec.modality}-${rec.label}-${idx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isSelected ? 'border-teal-400 shadow-sm' : urgencyStyle
                } ${isBeyondRecommended ? 'opacity-80' : ''}`}
              >
                <button
                  onClick={() => toggleSelect(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                    isSelected ? 'bg-teal-50' : 'bg-white hover:bg-gray-50'
                  } transition-colors`}
                >
                  <span className={`flex-shrink-0 text-[11px] font-bold text-white px-2 py-1 rounded-md ${modalityColor}`}>
                    {rec.modality}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-800 truncate">{rec.label}</p>
                    <p className="text-[12px] text-gray-400 truncate">{rec.indication_label}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {rec.urgency !== 'routine' && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        rec.urgency === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {rec.urgency}
                      </span>
                    )}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
                <div className="px-4 pb-1">
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Referral text
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[12px] text-gray-500 leading-relaxed pb-3 pt-1 border-t border-gray-100 mt-1">
                          {rec.referral_text}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Show more toggle */}
        {available.length > 0 && (
          <button
            onClick={() => { setShowAll(!showAll); setSelectedIds(new Set()); }}
            className="w-full text-center text-[12px] text-gray-400 hover:text-gray-600 py-2"
          >
            {showAll ? 'Show less' : `Show ${available.length} more available imaging options`}
          </button>
        )}

        {/* Emergency note */}
        {allRecs.some(r => r.urgency === 'emergency') && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700">
              Emergency imaging indicated. Request immediately and refer to appropriate care.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 bg-white space-y-2 flex-shrink-0">
        {selectedIds.size > 0 ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
              <p className="text-[13px] text-amber-800 font-medium">
                Ordering imaging will close this session
              </p>
              <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed">
                The assessment will be saved as pending. The diagnosis cannot be confirmed until imaging results are received.
              </p>
            </div>
            <button
              onClick={handleRequest}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Scan className="w-4 h-4" />
              Order {selectedIds.size} scan{selectedIds.size > 1 ? 's' : ''} &amp; save pending
            </button>
          </>
        ) : (
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            {isConfident ? 'Confirm diagnosis' : 'Skip imaging — confirm diagnosis'} <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {selectedIds.size === 0 && allRecs.length > 0 && (
          <p className="text-center text-[12px] text-gray-400">
            Or select a scan above if you need imaging
          </p>
        )}
      </div>
    </div>
  );
}

function detectRegionString(painLocation: any): string {
  if (!painLocation) return '';
  const loc = Array.isArray(painLocation) ? painLocation : [painLocation];
  const first = loc[0];
  if (typeof first === 'object' && first?.mainRegion) return first.mainRegion;
  return String(first ?? '').toLowerCase();
}
