'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getCookieValue } from '@/lib/utils/helpers';
import { store } from '@/store/store';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '') + '/';

// ── Silence detection constants ──
const SILENCE_THRESHOLD = 0.01; // RMS below this = silence
const CHUNK_SILENCE_DURATION_MS = 2000; // 2s silence → stop current chunk
const AUTO_STOP_SILENCE_DURATION_MS = 5000; // 5s continuous silence → stop entirely
const VOLUME_CHECK_INTERVAL_MS = 100; // check volume every 100ms

// ── Session-type config ──

const SESSION_CONFIG = {
  INTAKE: {
    maxDurationMs: 2 * 60 * 1000, // 2 minutes
    endpoint: 'voice/intake-transcribe',
  },
  FULL_INTAKE: {
    maxDurationMs: 3 * 60 * 1000, // 3 minutes
    endpoint: 'voice/full-intake-transcribe',
  },
  ASSESSMENT: {
    maxDurationMs: 5 * 60 * 1000, // 5 minutes
    endpoint: 'voice/intake-transcribe', // fallback for now
  },
} as const;

// ── Interfaces ──

interface UseVoiceCaptureOptions {
  sessionType: 'INTAKE' | 'FULL_INTAKE' | 'ASSESSMENT';
  clinicId: string;
  patientId?: string;
  onFieldsExtracted?: (fields: Record<string, any>) => void;
  onTranscriptUpdate?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceCaptureReturn {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  volumeLevel: number; // 0-1 normalized RMS for visualizer
  startListening: () => Promise<void>;
  stopListening: () => void;
}

// ── Auth headers (same pattern as api-client.ts) ──

function getAuthHeaders(): Record<string, string> {
  const token = getCookieValue('access_token');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const state = store.getState();
    const userData = state.user?.userData;
    const currentClinic = state.user?.currentClinic;
    if (userData?.organization?.id) {
      headers['x-organization-id'] = userData.organization.id;
    }
    if (currentClinic?.id) {
      headers['x-clinic-id'] = currentClinic.id;
    }
  } catch {
    // ignore
  }

  return headers;
}

// ── Utility: compute RMS from AnalyserNode frequency data ──

function computeRMS(analyser: AnalyserNode, dataArray: Uint8Array<ArrayBuffer>): number {
  analyser.getByteTimeDomainData(dataArray);
  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128; // convert 0-255 to -1..1
    sumSquares += normalized * normalized;
  }
  return Math.sqrt(sumSquares / dataArray.length);
}

// ── Hook ──

export function useVoiceCapture({
  sessionType,
  clinicId,
  patientId,
  onFieldsExtracted,
  onTranscriptUpdate,
  onError,
}: UseVoiceCaptureOptions): UseVoiceCaptureReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Mutable refs for recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActiveRef = useRef(false);
  const isRecordingChunkRef = useRef(false);
  const silenceStartRef = useRef<number | null>(null);
  const totalSilenceStartRef = useRef<number | null>(null);
  const cumulativeTranscriptRef = useRef('');
  const pendingRequestsRef = useRef(0);

  // Keep callback refs up to date
  const onFieldsExtractedRef = useRef(onFieldsExtracted);
  onFieldsExtractedRef.current = onFieldsExtracted;
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  onTranscriptUpdateRef.current = onTranscriptUpdate;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // ── Send a recorded chunk to the backend ──

  const sendChunk = useCallback(async (blob: Blob) => {
    if (blob.size === 0) {
      console.log('[Voice] Skipping empty chunk');
      return;
    }

    console.log('[Voice] Sending chunk, size:', blob.size, 'bytes');
    pendingRequestsRef.current++;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'chunk.webm');
      formData.append('clinic_id', clinicId);

      const headers = getAuthHeaders();
      const { endpoint } = SESSION_CONFIG[sessionType];
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[Voice] Backend error:', response.status, text);
        return;
      }

      const result = await response.json();
      console.log('[Voice] Backend response:', result);

      // Merge transcript
      const chunkText = result?.data?.transcript || result?.transcript || '';
      if (chunkText) {
        const prev = cumulativeTranscriptRef.current;
        cumulativeTranscriptRef.current = prev ? `${prev} ${chunkText}` : chunkText;
        setTranscript(cumulativeTranscriptRef.current);
        onTranscriptUpdateRef.current?.(cumulativeTranscriptRef.current);
        console.log('[Voice] Cumulative transcript:', cumulativeTranscriptRef.current);
      }

      // Merge extracted fields into form data via callback
      const fields = result?.data?.fields || result?.fields;
      if (fields && typeof fields === 'object' && Object.keys(fields).length > 0) {
        console.log('[Voice] Extracted fields:', fields);
        onFieldsExtractedRef.current?.(fields);
      }
    } catch (err: any) {
      console.error('[Voice] Send chunk error:', err);
    } finally {
      pendingRequestsRef.current--;
      if (pendingRequestsRef.current <= 0) {
        pendingRequestsRef.current = 0;
        setIsProcessing(false);
      }
    }
  }, [clinicId, sessionType]);

  // ── Start a new MediaRecorder for a chunk ──

  const startNewChunk = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !isActiveRef.current) return;

    // Check if stream tracks are still active
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0 || tracks[0].readyState !== 'live') {
      console.log('[Voice] Stream tracks not live, cannot start new chunk');
      return;
    }

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('[Voice] Chunk recording stopped, parts:', chunks.length);
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          sendChunk(blob);
        }
        isRecordingChunkRef.current = false;
      };

      recorder.onerror = (event: any) => {
        console.error('[Voice] MediaRecorder error:', event.error);
        isRecordingChunkRef.current = false;
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      isRecordingChunkRef.current = true;
      silenceStartRef.current = null;
      console.log('[Voice] New chunk recording started');
    } catch (err) {
      console.error('[Voice] Failed to start new chunk:', err);
      isRecordingChunkRef.current = false;
    }
  }, [sendChunk]);

  // ── Stop the current chunk (triggers dataavailable + onstop) ──

  const stopCurrentChunk = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      console.log('[Voice] Stopping current chunk due to silence');
      recorder.stop();
      mediaRecorderRef.current = null;
    }
    isRecordingChunkRef.current = false;
  }, []);

  // ── Full cleanup ──

  const cleanup = useCallback(() => {
    console.log('[Voice] Cleaning up all resources');
    isActiveRef.current = false;

    // Stop volume monitoring
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    // Clear max duration timeout
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Stop MediaRecorder
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // already stopped
      }
    }
    mediaRecorderRef.current = null;
    isRecordingChunkRef.current = false;

    // Close audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // already closed
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // ── startListening ──

  const startListening = useCallback(async () => {
    // Reset state
    setError(null);
    setTranscript('');
    cumulativeTranscriptRef.current = '';
    pendingRequestsRef.current = 0;
    silenceStartRef.current = null;
    totalSilenceStartRef.current = null;

    try {
      // Request microphone access
      console.log('[Voice] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;
      console.log('[Voice] Microphone access granted');

      // Set up Web Audio API for volume monitoring
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Mark as active
      isActiveRef.current = true;
      setIsListening(true);

      // Start the first chunk immediately
      startNewChunk();

      // Set up volume monitoring interval
      volumeIntervalRef.current = setInterval(() => {
        if (!isActiveRef.current) return;

        const rms = computeRMS(analyser, dataArray);
        const now = Date.now();

        // Expose volume for visualizer (clamp to 0-1)
        setVolumeLevel(Math.min(rms * 5, 1));

        if (rms < SILENCE_THRESHOLD) {
          // ── Silence detected ──

          // Track per-chunk silence
          if (silenceStartRef.current === null) {
            silenceStartRef.current = now;
          }

          // Track total continuous silence (for auto-stop)
          if (totalSilenceStartRef.current === null) {
            totalSilenceStartRef.current = now;
          }

          const chunkSilenceDuration = now - silenceStartRef.current;
          const totalSilenceDuration = now - totalSilenceStartRef.current;

          // Auto-stop entirely after 5s continuous silence
          if (totalSilenceDuration >= AUTO_STOP_SILENCE_DURATION_MS) {
            console.log('[Voice] 5s continuous silence — auto-stopping');
            // Stop current chunk first, then full cleanup
            stopCurrentChunk();
            cleanup();
            setIsListening(false);
            return;
          }

          // Stop current chunk after 2s silence (if currently recording)
          if (isRecordingChunkRef.current && chunkSilenceDuration >= CHUNK_SILENCE_DURATION_MS) {
            stopCurrentChunk();
          }
        } else {
          // ── Speech detected ──

          // Reset total silence tracker (speech breaks the continuous silence)
          totalSilenceStartRef.current = null;

          // If not currently recording a chunk, start a new one
          if (!isRecordingChunkRef.current && isActiveRef.current) {
            console.log('[Voice] Speech resumed — starting new chunk');
            startNewChunk();
          }

          // Reset per-chunk silence timer
          silenceStartRef.current = null;
        }
      }, VOLUME_CHECK_INTERVAL_MS);

      // Hard cap based on session type
      const { maxDurationMs } = SESSION_CONFIG[sessionType];
      maxDurationTimeoutRef.current = setTimeout(() => {
        console.log(`[Voice] ${maxDurationMs / 1000}s hard cap reached — stopping`);
        stopCurrentChunk();
        cleanup();
        setIsListening(false);
      }, maxDurationMs);

      console.log('[Voice] Listening started — silence threshold:', SILENCE_THRESHOLD);
    } catch (err: any) {
      const msg = err.message || 'Failed to start voice capture';
      console.error('[Voice] Start error:', err);
      cleanup();
      setError(msg);
      setIsListening(false);
      onErrorRef.current?.(msg);
    }
  }, [sessionType, startNewChunk, stopCurrentChunk, cleanup]);

  // ── stopListening ──

  const stopListening = useCallback(() => {
    console.log('[Voice] Manual stop requested');
    // Stop current chunk (will trigger send)
    stopCurrentChunk();
    cleanup();
    setIsListening(false);
  }, [stopCurrentChunk, cleanup]);

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    isListening,
    isProcessing,
    transcript,
    error,
    volumeLevel,
    startListening,
    stopListening,
  };
}

export default useVoiceCapture;
