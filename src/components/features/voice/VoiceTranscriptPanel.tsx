'use client';

import React from 'react';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';

interface TranscriptSegment {
  index: number;
  text: string;
  timestamp: number;
  duration_ms: number;
  language?: string;
}

interface VoiceTranscriptPanelProps {
  isListening: boolean;
  isProcessing: boolean;
  isExtracting: boolean;
  transcript: string;
  segments: TranscriptSegment[];
  error: string | null;
  onStop: () => void;
  onCancel: () => void;
}

const VoiceTranscriptPanel: React.FC<VoiceTranscriptPanelProps> = ({
  isListening,
  isProcessing,
  isExtracting,
  transcript,
  segments,
  error,
  onStop,
  onCancel,
}) => {
  return (
    <div className="border border-teal-200 bg-teal-50/50 rounded-lg p-3 space-y-2">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isListening ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-medium text-gray-700">Listening...</span>
            </>
          ) : isExtracting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
              <span className="text-xs font-medium text-teal-700">Extracting data...</span>
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Processing...</span>
            </>
          ) : null}
        </div>

        {isListening && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
            >
              <Square className="h-3 w-3" />
              Done
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              <MicOff className="h-3 w-3" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Transcript area */}
      {transcript ? (
        <div className="bg-white rounded-md border border-gray-200 p-2.5 max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
        </div>
      ) : isListening ? (
        <div className="bg-white/60 rounded-md border border-dashed border-gray-300 p-2.5">
          <p className="text-xs text-gray-400 text-center">Speak now — transcript will appear here</p>
        </div>
      ) : null}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default VoiceTranscriptPanel;
