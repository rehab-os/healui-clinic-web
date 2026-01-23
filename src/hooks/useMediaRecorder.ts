'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

interface UseMediaRecorderOptions {
  onRecordingComplete?: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
  maxDuration?: number; // in milliseconds, default 60000 (60 seconds)
}

interface UseMediaRecorderReturn {
  state: RecordingState;
  error: string | null;
  recordingTime: number;
  volumeLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  audioBlob: Blob | null;
  isSupported: boolean;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderReturn {
  const { onRecordingComplete, onError, maxDuration = 60000 } = options;

  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isSupported = typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    typeof MediaRecorder !== 'undefined';

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    setVolumeLevel(0);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      if (!analyserRef.current || state !== 'recording') return;

      analyserRef.current.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = (dataArray[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedVolume = Math.min(rms * 4, 1);
      setVolumeLevel(normalizedVolume);

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  }, [state]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const err = new Error('MediaRecorder is not supported in this browser');
      setError(err.message);
      onError?.(err);
      return;
    }

    try {
      setError(null);
      setAudioBlob(null);
      setRecordingTime(0);
      setState('recording');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      streamRef.current = stream;

      // Determine best MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        cleanup();
        if (state !== 'error') {
          setState('done');
          onRecordingComplete?.(blob);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        const err = new Error(event.error?.message || 'Recording failed');
        setError(err.message);
        setState('error');
        onError?.(err);
        cleanup();
      };

      mediaRecorder.start(100); // Collect data every 100ms

      // Setup volume visualization
      setupAudioAnalyser(stream);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto-stop after max duration
      maxDurationTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, maxDuration);

    } catch (err: any) {
      const errorMessage = err.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow access to use voice input.'
        : err.name === 'NotFoundError'
        ? 'No microphone found. Please connect a microphone.'
        : `Failed to start recording: ${err.message}`;

      setError(errorMessage);
      setState('error');
      onError?.(new Error(errorMessage));
      cleanup();
    }
  }, [isSupported, maxDuration, onRecordingComplete, onError, setupAudioAnalyser, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      setState('processing');
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setAudioBlob(null);
    setRecordingTime(0);
    setState('idle');
  }, [cleanup]);

  return {
    state,
    error,
    recordingTime,
    volumeLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    isSupported
  };
}

export default useMediaRecorder;
