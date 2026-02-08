'use client';

import React, { useState } from 'react';
import { ArrowRight, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ==================== Types ====================

interface SelectedRegion {
  mainRegion: string;
  laterality?: 'left' | 'right' | 'both' | 'center';
  subRegions: string[];
}

interface BodyMapSelectorProps {
  selectedRegions: SelectedRegion[];
  onSelectionChange: (regions: SelectedRegion[]) => void;
  onComplete: () => void;
  maxSelections?: number;
}

// ==================== Body Region Configuration ====================

interface BodyRegion {
  id: string;
  label: string;
  hasPair: boolean;
  // SVG path for the clickable region (simplified for both anterior views)
  pathData: {
    left?: string;
    right?: string;
    center?: string;
  };
  // Position for label
  labelPosition: { x: number; y: number };
}

// Simplified SVG paths for body regions (viewBox: 0 0 200 400)
const BODY_REGIONS: BodyRegion[] = [
  {
    id: 'head',
    label: 'Head',
    hasPair: false,
    pathData: {
      center: 'M85,10 Q100,0 115,10 Q130,25 130,45 Q130,60 115,70 Q100,75 85,70 Q70,60 70,45 Q70,25 85,10 Z'
    },
    labelPosition: { x: 100, y: 40 }
  },
  {
    id: 'neck',
    label: 'Neck',
    hasPair: false,
    pathData: {
      center: 'M88,70 L112,70 L115,95 L85,95 Z'
    },
    labelPosition: { x: 100, y: 82 }
  },
  {
    id: 'shoulder',
    label: 'Shoulder',
    hasPair: true,
    pathData: {
      left: 'M55,95 Q40,100 35,115 L50,120 Q55,105 70,100 Z',
      right: 'M145,95 Q160,100 165,115 L150,120 Q145,105 130,100 Z'
    },
    labelPosition: { x: 45, y: 108 }
  },
  {
    id: 'chest',
    label: 'Chest',
    hasPair: false,
    pathData: {
      center: 'M70,95 L130,95 L135,140 L65,140 Z'
    },
    labelPosition: { x: 100, y: 118 }
  },
  {
    id: 'upper-arm',
    label: 'Upper Arm',
    hasPair: true,
    pathData: {
      left: 'M35,120 L55,115 L58,170 L32,170 Z',
      right: 'M145,115 L165,120 L168,170 L142,170 Z'
    },
    labelPosition: { x: 42, y: 145 }
  },
  {
    id: 'elbow',
    label: 'Elbow',
    hasPair: true,
    pathData: {
      left: 'M30,168 L60,168 L62,190 L28,190 Z',
      right: 'M140,168 L170,168 L172,190 L138,190 Z'
    },
    labelPosition: { x: 45, y: 179 }
  },
  {
    id: 'forearm',
    label: 'Forearm',
    hasPair: true,
    pathData: {
      left: 'M26,188 L64,188 L68,240 L22,240 Z',
      right: 'M136,188 L174,188 L178,240 L132,240 Z'
    },
    labelPosition: { x: 45, y: 215 }
  },
  {
    id: 'wrist',
    label: 'Wrist',
    hasPair: true,
    pathData: {
      left: 'M20,238 L70,238 L72,255 L18,255 Z',
      right: 'M130,238 L180,238 L182,255 L128,255 Z'
    },
    labelPosition: { x: 45, y: 247 }
  },
  {
    id: 'hand',
    label: 'Hand',
    hasPair: true,
    pathData: {
      left: 'M15,253 L75,253 L80,295 L10,295 Z',
      right: 'M125,253 L185,253 L190,295 L120,295 Z'
    },
    labelPosition: { x: 45, y: 275 }
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    hasPair: false,
    pathData: {
      center: 'M65,140 L135,140 L140,195 L60,195 Z'
    },
    labelPosition: { x: 100, y: 168 }
  },
  {
    id: 'lower-back',
    label: 'Lower Back',
    hasPair: false,
    pathData: {
      center: 'M65,175 L135,175 L138,210 L62,210 Z'
    },
    labelPosition: { x: 100, y: 192 }
  },
  {
    id: 'hip',
    label: 'Hip',
    hasPair: true,
    pathData: {
      left: 'M60,195 L100,195 L100,230 L55,230 Z',
      right: 'M100,195 L140,195 L145,230 L100,230 Z'
    },
    labelPosition: { x: 75, y: 212 }
  },
  {
    id: 'thigh',
    label: 'Thigh',
    hasPair: true,
    pathData: {
      left: 'M55,228 L100,228 L95,310 L50,310 Z',
      right: 'M100,228 L145,228 L150,310 L105,310 Z'
    },
    labelPosition: { x: 75, y: 270 }
  },
  {
    id: 'knee',
    label: 'Knee',
    hasPair: true,
    pathData: {
      left: 'M48,308 L97,308 L95,340 L50,340 Z',
      right: 'M103,308 L152,308 L150,340 L105,340 Z'
    },
    labelPosition: { x: 72, y: 324 }
  },
  {
    id: 'lower-leg',
    label: 'Lower Leg',
    hasPair: true,
    pathData: {
      left: 'M50,338 L95,338 L90,400 L55,400 Z',
      right: 'M105,338 L150,338 L145,400 L110,400 Z'
    },
    labelPosition: { x: 72, y: 370 }
  },
  {
    id: 'ankle',
    label: 'Ankle',
    hasPair: true,
    pathData: {
      left: 'M53,398 L92,398 L90,418 L55,418 Z',
      right: 'M108,398 L147,398 L145,418 L110,418 Z'
    },
    labelPosition: { x: 72, y: 408 }
  },
  {
    id: 'foot',
    label: 'Foot',
    hasPair: true,
    pathData: {
      left: 'M50,416 L95,416 L100,445 L40,445 Z',
      right: 'M105,416 L150,416 L160,445 L100,445 Z'
    },
    labelPosition: { x: 70, y: 432 }
  }
];

// ==================== Component ====================

const BodyMapSelector: React.FC<BodyMapSelectorProps> = ({
  selectedRegions,
  onSelectionChange,
  onComplete,
  maxSelections = 10,
}) => {
  const [view, setView] = useState<'visual' | 'list'>('visual');
  const [pendingRegion, setPendingRegion] = useState<BodyRegion | null>(null);

  const isSelected = (regionId: string, side?: 'left' | 'right' | 'center' | 'both') => {
    return selectedRegions.some(r =>
      r.mainRegion === regionId &&
      (side === undefined || r.laterality === side)
    );
  };

  const toggleRegion = (regionId: string, laterality: 'left' | 'right' | 'both' | 'center') => {
    const existingIndex = selectedRegions.findIndex(
      r => r.mainRegion === regionId && r.laterality === laterality
    );

    let newRegions = [...selectedRegions];

    if (existingIndex >= 0) {
      newRegions.splice(existingIndex, 1);
    } else {
      if (newRegions.length >= maxSelections) return;
      newRegions.push({
        mainRegion: regionId,
        laterality,
        subRegions: [],
      });
    }

    onSelectionChange(newRegions);
    setPendingRegion(null);
  };

  const handleRegionClick = (region: BodyRegion, clickedSide?: 'left' | 'right') => {
    if (!region.hasPair) {
      toggleRegion(region.id, 'center');
    } else if (clickedSide) {
      // Direct click on left or right side of SVG
      toggleRegion(region.id, clickedSide);
    } else {
      // Show laterality picker
      setPendingRegion(pendingRegion?.id === region.id ? null : region);
    }
  };

  const handleRemove = (index: number) => {
    const newRegions = [...selectedRegions];
    newRegions.splice(index, 1);
    onSelectionChange(newRegions);
  };

  const formatLabel = (region: SelectedRegion) => {
    const r = BODY_REGIONS.find(br => br.id === region.mainRegion);
    if (!r) return region.mainRegion.replace(/-/g, ' ');

    if (r.hasPair && region.laterality !== 'both' && region.laterality !== 'center') {
      return `${region.laterality === 'left' ? 'L' : 'R'} ${r.label}`;
    }
    if (region.laterality === 'both') {
      return `Both ${r.label}s`;
    }
    return r.label;
  };

  const getRegionColor = (regionId: string, side?: 'left' | 'right' | 'center') => {
    const selected = isSelected(regionId, side);
    const bothSelected = isSelected(regionId, 'both');
    if (selected || bothSelected) {
      return 'fill-teal-500 stroke-teal-600';
    }
    return 'fill-slate-100 stroke-slate-300 hover:fill-teal-100 hover:stroke-teal-300';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Where is the problem?</h3>
        <p className="text-sm text-slate-500 mt-1">Tap the affected areas on the body</p>

        {/* View Toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setView('visual')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              view === 'visual'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Body Map
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              view === 'list'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === 'visual' ? (
          // SVG Body Map View
          <div className="flex justify-center">
            <svg
              viewBox="0 0 200 450"
              className="w-full max-w-[280px] h-auto"
              style={{ touchAction: 'manipulation' }}
            >
              {/* Body outline background */}
              <path
                d="M100,5
                   Q130,5 130,45 Q130,65 115,75
                   L115,95 Q160,100 165,120 L170,250 L175,290
                   Q155,290 145,230 L140,195 L145,230 L152,340 L150,420 L160,445
                   L100,445 L40,445 L50,420 L48,340 L55,230 L60,195 L55,230
                   Q45,290 25,290 L30,250 L35,120 Q40,100 85,95
                   L85,75 Q70,65 70,45 Q70,5 100,5 Z"
                className="fill-slate-50 stroke-slate-200"
                strokeWidth="1"
              />

              {/* Clickable Regions */}
              {BODY_REGIONS.map((region) => (
                <g key={region.id}>
                  {/* Center regions (non-paired) */}
                  {region.pathData.center && (
                    <path
                      d={region.pathData.center}
                      className={`cursor-pointer transition-all duration-150 ${getRegionColor(region.id, 'center')}`}
                      strokeWidth="2"
                      onClick={() => handleRegionClick(region)}
                      role="button"
                      aria-label={`Select ${region.label}`}
                    />
                  )}

                  {/* Left side */}
                  {region.pathData.left && (
                    <path
                      d={region.pathData.left}
                      className={`cursor-pointer transition-all duration-150 ${getRegionColor(region.id, 'left')}`}
                      strokeWidth="2"
                      onClick={() => handleRegionClick(region, 'left')}
                      role="button"
                      aria-label={`Select left ${region.label}`}
                    />
                  )}

                  {/* Right side */}
                  {region.pathData.right && (
                    <path
                      d={region.pathData.right}
                      className={`cursor-pointer transition-all duration-150 ${getRegionColor(region.id, 'right')}`}
                      strokeWidth="2"
                      onClick={() => handleRegionClick(region, 'right')}
                      role="button"
                      aria-label={`Select right ${region.label}`}
                    />
                  )}
                </g>
              ))}

              {/* Center line reference */}
              <line
                x1="100" y1="70" x2="100" y2="420"
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            </svg>
          </div>
        ) : (
          // List View
          <div className="grid grid-cols-2 gap-2">
            {BODY_REGIONS.map((region) => {
              const selected = isSelected(region.id);
              const isPending = pendingRegion?.id === region.id;

              return (
                <div key={region.id}>
                  <button
                    onClick={() => handleRegionClick(region)}
                    className={`w-full min-h-[56px] p-3 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{region.label}</span>
                      {selected && <Check className="w-5 h-5 text-teal-500" />}
                    </div>
                    {region.hasPair && !selected && (
                      <span className="text-xs text-slate-400 mt-0.5 block">Left / Right</span>
                    )}
                  </button>

                  {/* Laterality Picker */}
                  {isPending && region.hasPair && (
                    <div className="flex gap-2 mt-2">
                      {(['left', 'both', 'right'] as const).map((lat) => {
                        const isLatSelected = isSelected(region.id, lat);
                        return (
                          <button
                            key={lat}
                            onClick={() => toggleRegion(region.id, lat)}
                            className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all min-h-[48px] ${
                              isLatSelected
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {lat === 'left' ? 'Left' : lat === 'right' ? 'Right' : 'Both'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Laterality Popup for Visual Mode */}
        {view === 'visual' && pendingRegion && pendingRegion.hasPair && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Which side for {pendingRegion.label}?
            </p>
            <div className="flex gap-2">
              {(['left', 'both', 'right'] as const).map((lat) => {
                const isLatSelected = isSelected(pendingRegion.id, lat);
                return (
                  <button
                    key={lat}
                    onClick={() => toggleRegion(pendingRegion.id, lat)}
                    className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all min-h-[48px] ${
                      isLatSelected
                        ? 'bg-teal-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {lat === 'left' ? 'Left' : lat === 'right' ? 'Right' : 'Both'}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPendingRegion(null)}
              className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">
        {/* Selected Regions */}
        {selectedRegions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2 font-medium">Selected areas:</p>
            <div className="flex flex-wrap gap-2">
              {selectedRegions.map((region, index) => (
                <span
                  key={`${region.mainRegion}-${region.laterality}-${index}`}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                >
                  {formatLabel(region)}
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-1 hover:bg-teal-200 rounded-full min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Clear & Continue Buttons */}
        <div className="flex gap-3">
          {selectedRegions.length > 0 && (
            <button
              onClick={() => onSelectionChange([])}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <Button
            onClick={onComplete}
            disabled={selectedRegions.length === 0}
            className={`flex-1 min-h-[48px] text-sm font-medium rounded-xl ${
              selectedRegions.length > 0
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {selectedRegions.length === 0 ? (
              'Select at least one area'
            ) : (
              <span className="flex items-center gap-2">
                Continue with {selectedRegions.length} area{selectedRegions.length > 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BodyMapSelector;
