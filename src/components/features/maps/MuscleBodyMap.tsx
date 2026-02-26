'use client';

import React, { useState, useMemo } from 'react';
import Body, { type ExtendedBodyPart, type Slug } from 'react-muscle-highlighter';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Muscle slug → our region key mapping
// NOTE: Each slug maps to exactly ONE region to avoid cross-highlighting.
// trapezius → thoracic (not neck) because the SVG covers upper back area
// quadriceps/hamstring → thigh (not knee) because the SVG covers the thigh area
// knees → knee (the small kneecap slug)
const SLUG_TO_REGION: Record<Slug, string> = {
  deltoids: 'shoulder',
  biceps: 'arm',
  triceps: 'arm',
  forearm: 'forearm',
  hands: 'hand',
  chest: 'chest',
  abs: 'abdomen',
  obliques: 'abdomen',
  trapezius: 'thoracic',
  'upper-back': 'thoracic',
  'lower-back': 'lower-back',
  gluteal: 'hip',
  adductors: 'thigh',
  quadriceps: 'thigh',
  hamstring: 'thigh',
  knees: 'knee',
  tibialis: 'lower-leg',
  calves: 'lower-leg',
  ankles: 'ankle',
  feet: 'foot',
  head: 'head',
  hair: 'head',
  neck: 'neck',
};

// Region key → display label
const REGION_LABELS: Record<string, string> = {
  shoulder: 'Shoulder',
  arm: 'Upper Arm',
  forearm: 'Forearm',
  hand: 'Hand',
  chest: 'Chest',
  abdomen: 'Abdomen',
  neck: 'Neck',
  thoracic: 'Thoracic / Mid Back',
  'lower-back': 'Lower Back',
  hip: 'Hip',
  thigh: 'Thigh',
  knee: 'Knee',
  'lower-leg': 'Calf / Lower Leg',
  ankle: 'Ankle',
  foot: 'Foot',
  head: 'Head',
};

// Laterality-capable regions (bilateral)
const BILATERAL_REGIONS = new Set([
  'shoulder', 'arm', 'forearm', 'hand', 'hip', 'thigh', 'knee', 'lower-leg', 'ankle', 'foot',
]);

type Laterality = 'left' | 'right' | 'both' | 'center';

export interface SelectedRegion {
  mainRegion: string;
  label: string;
  laterality: Laterality;
  subRegions: string[];
}

interface MuscleBodyMapProps {
  selectedRegions: SelectedRegion[];
  onSelectionChange: (regions: SelectedRegion[]) => void;
  onComplete: () => void;
  maxSelections?: number;
}

const MuscleBodyMap: React.FC<MuscleBodyMapProps> = ({
  selectedRegions,
  onSelectionChange,
  onComplete,
  maxSelections = 5,
}) => {
  const [pendingRegion, setPendingRegion] = useState<string | null>(null);
  const [pendingLaterality, setPendingLaterality] = useState<Laterality | null>(null);

  // Get all slugs for a region
  const getSlugsForRegion = (region: string): Slug[] => {
    return (Object.entries(SLUG_TO_REGION) as [Slug, string][])
      .filter(([, r]) => r === region)
      .map(([slug]) => slug);
  };

  // Build highlight data for the body component
  const bodyData = useMemo((): ExtendedBodyPart[] => {
    const data: ExtendedBodyPart[] = [];
    const highlightedSlugs = new Set<Slug>();

    // Highlight selected regions
    for (const region of selectedRegions) {
      const slugs = getSlugsForRegion(region.mainRegion);
      for (const slug of slugs) {
        if (!highlightedSlugs.has(slug)) {
          highlightedSlugs.add(slug);
          data.push({ slug, color: '#0d9488' }); // brand-teal
        }
      }
    }

    // Highlight pending region
    if (pendingRegion) {
      const slugs = getSlugsForRegion(pendingRegion);
      for (const slug of slugs) {
        if (!highlightedSlugs.has(slug)) {
          highlightedSlugs.add(slug);
          data.push({ slug, color: '#5eead4' }); // teal-300 for pending
        }
      }
    }

    return data;
  }, [selectedRegions, pendingRegion]);

  const handleBodyPartPress = (part: ExtendedBodyPart, side?: 'left' | 'right') => {
    if (!part.slug) return;
    const region = SLUG_TO_REGION[part.slug];
    if (!region) return;

    // Check if already selected
    const existingIndex = selectedRegions.findIndex(r => r.mainRegion === region);
    if (existingIndex >= 0) {
      // Deselect
      const updated = selectedRegions.filter((_, i) => i !== existingIndex);
      onSelectionChange(updated);
      setPendingRegion(null);
      setPendingLaterality(null);
      return;
    }

    // Check max selections
    if (selectedRegions.length >= maxSelections) return;

    // For bilateral regions, show laterality picker
    if (BILATERAL_REGIONS.has(region)) {
      setPendingRegion(region);
      // Pre-select based on which side was clicked
      setPendingLaterality(side || null);
    } else {
      // Non-bilateral (spine, head) — add directly
      const newRegion: SelectedRegion = {
        mainRegion: region,
        label: REGION_LABELS[region] || region,
        laterality: 'center',
        subRegions: [region],
      };
      onSelectionChange([...selectedRegions, newRegion]);
    }
  };

  const confirmLaterality = (laterality: Laterality) => {
    if (!pendingRegion) return;

    const label = REGION_LABELS[pendingRegion] || pendingRegion;
    const lateralityLabel = laterality === 'both' ? 'Both' : laterality === 'left' ? 'Left' : 'Right';

    const newRegion: SelectedRegion = {
      mainRegion: pendingRegion,
      label: laterality === 'center' ? label : `${lateralityLabel} ${label}`,
      laterality,
      subRegions: [pendingRegion],
    };

    onSelectionChange([...selectedRegions, newRegion]);
    setPendingRegion(null);
    setPendingLaterality(null);
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Body diagrams — front & back */}
      <div className='flex-1 flex items-start justify-center gap-4 min-h-0'>
        <div className='flex flex-col items-center'>
          <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>Front</span>
          <div className='w-[160px]'>
            <Body
              data={bodyData}
              side='front'
              gender='male'
              onBodyPartPress={handleBodyPartPress}
              border='none'
              defaultFill='#e5e7eb'
              defaultStroke='#d1d5db'
              defaultStrokeWidth={0.5}
              scale={1.2}
            />
          </div>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>Back</span>
          <div className='w-[160px]'>
            <Body
              data={bodyData}
              side='back'
              gender='male'
              onBodyPartPress={handleBodyPartPress}
              border='none'
              defaultFill='#e5e7eb'
              defaultStroke='#d1d5db'
              defaultStrokeWidth={0.5}
              scale={1.2}
            />
          </div>
        </div>
      </div>

      {/* Laterality picker modal */}
      {pendingRegion && (
        <div className='mx-auto mt-2 p-3 bg-teal-50 rounded-xl border border-teal-200 max-w-xs'>
          <p className='text-xs font-semibold text-teal-800 mb-2 text-center'>
            Which side? — {REGION_LABELS[pendingRegion]}
          </p>
          <div className='flex gap-2'>
            {(['left', 'right', 'both'] as Laterality[]).map((lat) => (
              <button
                key={lat}
                onClick={() => confirmLaterality(lat)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  pendingLaterality === lat
                    ? 'bg-brand-teal text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
                }`}
              >
                {lat === 'left' ? 'Left' : lat === 'right' ? 'Right' : 'Both'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected regions chips */}
      {selectedRegions.length > 0 && (
        <div className='mt-2 flex flex-wrap gap-1.5 justify-center'>
          {selectedRegions.map((region, i) => (
            <span
              key={i}
              className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200'
            >
              <Check className='h-3 w-3' />
              {region.label}
            </span>
          ))}
        </div>
      )}

      {/* Confirm button */}
      {selectedRegions.length > 0 && !pendingRegion && (
        <Button
          onClick={onComplete}
          className='mt-3 w-full bg-brand-teal hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl'
        >
          Confirm {selectedRegions.length} {selectedRegions.length === 1 ? 'Region' : 'Regions'}
        </Button>
      )}

      {selectedRegions.length === 0 && !pendingRegion && (
        <p className='text-center text-xs text-gray-400 mt-2'>
          Tap a body part to select the affected region
        </p>
      )}
    </div>
  );
};

export default MuscleBodyMap;
