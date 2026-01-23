'use client';

import React, { useState } from 'react';
import BodyMapSelector from '../../components/molecule/BodyMapSelector';
import { RotateCcw } from 'lucide-react';

interface SelectedRegion {
  mainRegion: string;
  laterality?: 'left' | 'right' | 'both' | 'center';
  subRegions: string[];
}

export default function BodyMapTestPage() {
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  const [completedSelection, setCompletedSelection] = useState<SelectedRegion[] | null>(null);
  const [key, setKey] = useState(0);

  const handleComplete = () => {
    setCompletedSelection(selectedRegions);
  };

  const handleReset = () => {
    setSelectedRegions([]);
    setCompletedSelection(null);
    setKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Body Map Selector Test</h1>
            <p className="text-sm text-slate-500">Interactive anatomical region selector</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/smart-screening"
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Go to Smart Screening
            </a>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Body Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Select Affected Areas</h2>
            <div className="h-[600px]">
              <BodyMapSelector
                key={key}
                selectedRegions={selectedRegions}
                onSelectionChange={setSelectedRegions}
                onComplete={handleComplete}
                maxSelections={5}
              />
            </div>
          </div>

          {/* Debug Panel */}
          <div className="space-y-4">
            {/* Current Selection State */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Current Selection</h2>
              {selectedRegions.length === 0 ? (
                <p className="text-slate-400 text-sm italic">No regions selected yet</p>
              ) : (
                <div className="space-y-3">
                  {selectedRegions.map((region, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-800 capitalize">
                          {region.mainRegion.replace(/_/g, ' ')}
                        </span>
                        {region.laterality && region.laterality !== 'center' && (
                          <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                            {region.laterality}
                          </span>
                        )}
                      </div>
                      {region.subRegions.length > 0 && (
                        <div className="ml-8 flex flex-wrap gap-1 mt-2">
                          {region.subRegions.map((sub) => (
                            <span
                              key={sub}
                              className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600"
                            >
                              {sub.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Selection */}
            {completedSelection && (
              <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6">
                <h2 className="text-lg font-semibold text-green-800 mb-4">Completed Selection</h2>
                <pre className="text-xs text-green-700 bg-green-100 p-4 rounded-lg overflow-auto max-h-[300px]">
                  {JSON.stringify(completedSelection, null, 2)}
                </pre>
              </div>
            )}

            {/* Raw Data */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Raw State (Debug)</h2>
              <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg overflow-auto max-h-[200px]">
                {JSON.stringify(selectedRegions, null, 2)}
              </pre>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-3">How to Test</h2>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Click on any body region in the diagram</li>
                <li>For limbs, select Left / Right / Both</li>
                <li>Select specific sub-regions (e.g., front, back, side)</li>
                <li>Notice the connected region suggestions</li>
                <li>Add multiple areas or click "Done"</li>
                <li>Toggle between Front and Back views</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
