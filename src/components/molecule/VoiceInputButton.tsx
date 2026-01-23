'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Mic, MicOff, Square, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useMediaRecorder, RecordingState } from '../../hooks/useMediaRecorder';
import { cn } from '../../lib/utils';

interface VoiceInputButtonProps {
  onTranscription: (transcription: string) => void;
  onProcessingStart?: () => void;
  onProcessingEnd?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTimer?: boolean;
  maxDuration?: number;
  transcribeAudio: (audioBlob: Blob) => Promise<string>;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20'
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

export function VoiceInputButton({
  onTranscription,
  onProcessingStart,
  onProcessingEnd,
  disabled = false,
  className,
  size = 'md',
  showTimer = true,
  maxDuration = 60000,
  transcribeAudio
}: VoiceInputButtonProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    onProcessingStart?.();

    try {
      const transcription = await transcribeAudio(audioBlob);
      if (transcription && transcription.trim()) {
        setShowSuccess(true);
        onTranscription(transcription);
        setTimeout(() => setShowSuccess(false), 1500);
      } else {
        setTranscriptionError('No speech detected. Please try again.');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
      setTranscriptionError(error.message || 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
      onProcessingEnd?.();
    }
  }, [transcribeAudio, onTranscription, onProcessingStart, onProcessingEnd]);

  const {
    state,
    error: recordingError,
    recordingTime,
    volumeLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported
  } = useMediaRecorder({
    onRecordingComplete: handleRecordingComplete,
    maxDuration
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = useCallback(() => {
    if (state === 'idle' || state === 'error' || state === 'done') {
      setTranscriptionError(null);
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  }, [state, startRecording, stopRecording]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    cancelRecording();
  }, [cancelRecording]);

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing' || isTranscribing;
  const hasError = state === 'error' || !!transcriptionError;
  const currentError = recordingError || transcriptionError;

  if (!isSupported) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className={cn(
          'flex items-center justify-center rounded-full bg-gray-100 text-gray-400',
          sizeClasses[size]
        )}>
          <MicOff className={iconSizes[size]} />
        </div>
        <span className="text-xs text-gray-500">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Main Button */}
      <div className="relative">
        {/* Volume visualization rings */}
        {isRecording && (
          <>
            <div
              className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-30"
              style={{
                transform: `scale(${1 + volumeLevel * 0.3})`,
                animationDuration: '1.5s'
              }}
            />
            <div
              className="absolute inset-0 rounded-full border border-red-300 opacity-20"
              style={{
                transform: `scale(${1.2 + volumeLevel * 0.5})`,
              }}
            />
          </>
        )}

        {/* Button */}
        <button
          onClick={handleClick}
          disabled={disabled || isProcessing}
          className={cn(
            'relative flex items-center justify-center rounded-full transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            sizeClasses[size],
            isRecording && 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 animate-pulse',
            isProcessing && 'bg-blue-500 text-white cursor-wait',
            showSuccess && 'bg-green-500 text-white',
            hasError && !isRecording && 'bg-red-100 text-red-600 hover:bg-red-200',
            !isRecording && !isProcessing && !hasError && !showSuccess && 'bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={isRecording ? {
            boxShadow: `0 0 ${20 + volumeLevel * 40}px rgba(239, 68, 68, ${0.3 + volumeLevel * 0.5})`
          } : undefined}
        >
          {isProcessing ? (
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
          ) : showSuccess ? (
            <Check className={iconSizes[size]} />
          ) : isRecording ? (
            <Square className={cn(iconSizes[size], 'fill-current')} style={{ width: '40%', height: '40%' }} />
          ) : hasError ? (
            <AlertCircle className={iconSizes[size]} />
          ) : (
            <Mic className={iconSizes[size]} />
          )}
        </button>

        {/* Cancel button during recording */}
        {isRecording && (
          <button
            onClick={handleCancel}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Timer */}
      {showTimer && isRecording && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono font-medium text-gray-700">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <span className="text-xs text-blue-600 font-medium animate-pulse">
          Processing...
        </span>
      )}

      {/* Success message */}
      {showSuccess && (
        <span className="text-xs text-green-600 font-medium">
          Got it!
        </span>
      )}

      {/* Error message */}
      {hasError && currentError && !isRecording && (
        <span className="text-xs text-red-600 text-center max-w-[150px]">
          {currentError}
        </span>
      )}

      {/* Idle state hint */}
      {state === 'idle' && !hasError && (
        <span className="text-xs text-gray-500">
          Tap to speak
        </span>
      )}
    </div>
  );
}

export default VoiceInputButton;
