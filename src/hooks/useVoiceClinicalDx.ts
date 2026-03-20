'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getCookieValue } from '@/lib/utils/helpers';
import { store } from '@/store/store';
import { ClinicalDxVoiceService } from '@/services/api/clinical-dx-voice.service';

// ── Medical vocabulary prompt for OpenAI Realtime transcription ──
// Pre-loading clinical + Hindi terms improves accuracy on medical speech
// without any extra cost — just context priming.
const TRANSCRIPTION_PROMPT = `Physiotherapy clinical assessment. The clinician speaks English and may mix Hindi terms. Transcribe everything in English.

Hindi to English: dard/derd=pain, kamar=lower back, ghutna=knee, kandha=shoulder, gardan=neck, pith=back, pair/paer=leg or foot, haath=hand or arm, sir/sar=head, sunn=numb, kamzori=weakness, seena=chest, pet=abdomen, naso=nerves, chot=injury, takleef=discomfort.

Clinical terms: VAS score, visual analogue scale, lumbar spine, cervical, thoracic, sacral, sciatica, radiculopathy, disc herniation, rotator cuff, plantar fasciitis, impingement, paraesthesia, dermatome, myotome, aggravating factors, relieving factors, onset, progression, range of motion, physiotherapy, tenderness, effusion, crepitus, ROM.`;

// ── Constants ──
const VOLUME_CHECK_INTERVAL_MS = 100;
const MAX_SESSION_DURATION_MS = 15 * 60 * 1000; // 15 min hard cap
const TOTAL_FIELD_COUNT = 24;

// OpenAI Realtime WebSocket URL for transcription
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?intent=transcription';

// ── Types ──

interface UseVoiceClinicalDxOptions {
  clinicId: string;
  patientId: string;
  conditionId?: string;
  onError?: (error: string) => void;
}

export interface UseVoiceClinicalDxReturn {
  isRecording: boolean;
  isProcessing: boolean;
  volumeLevel: number;
  transcript: string;
  extractedFields: Record<string, any>;
  fieldConfidence: Record<string, number>;
  fieldsCaptured: number;
  totalFields: number;
  sessionId: string | null;
  elapsedMs: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

// ── Auth headers ──
function getAuthHeaders(): Record<string, string> {
  const token = getCookieValue('access_token');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  try {
    const state = store.getState();
    const userData = state.user?.userData;
    const currentClinic = state.user?.currentClinic;
    if (userData?.organization?.id) headers['x-organization-id'] = userData.organization.id;
    if (currentClinic?.id) headers['x-clinic-id'] = currentClinic.id;
  } catch {
    console.warn('[VoiceDx] Failed to read Redux store');
  }
  return headers;
}

// ── RMS for volume visualization ──
function computeRMS(analyser: AnalyserNode, dataArray: Uint8Array): number {
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const n = (dataArray[i] - 128) / 128;
    sum += n * n;
  }
  return Math.sqrt(sum / dataArray.length);
}

// ── Int16Array → Base64 ──
function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ── Hook ──

export function useVoiceClinicalDx({
  clinicId,
  patientId,
  conditionId,
  onError,
}: UseVoiceClinicalDxOptions): UseVoiceClinicalDxReturn {
  // ── State ──
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extractedFields, setExtractedFields] = useState<Record<string, any>>({});
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, number>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // ── Refs ──
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const volumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Refs that don't trigger re-renders but need latest values
  const sessionIdRef = useRef<string | null>(null);
  const cumulativeTranscriptRef = useRef('');
  const completedTurnsRef = useRef(''); // Accumulated text from all completed turns
  const currentTurnDeltaRef = useRef(''); // Delta text for the current in-progress turn
  const extractedFieldsRef = useRef<Record<string, any>>({});
  const isActiveRef = useRef(false);
  const mountedRef = useRef(true);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Keep refs in sync with state
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { cumulativeTranscriptRef.current = transcript; }, [transcript]);
  useEffect(() => { extractedFieldsRef.current = extractedFields; }, [extractedFields]);

  // ── Extract fields from backend after a speech turn completes ──
  const runExtraction = useCallback(async (fullTranscript: string) => {
    const sid = sessionIdRef.current;
    if (!sid || !fullTranscript.trim() || !mountedRef.current) return;

    try {
      const result = await ClinicalDxVoiceService.extractFields(
        sid,
        fullTranscript,
        extractedFieldsRef.current,
      );
      const data = result?.data || result;
      if (mountedRef.current && data?.extracted_fields) {
        setExtractedFields(data.extracted_fields);
        setFieldConfidence(data.field_confidence || {});
      }
    } catch (err) {
      console.warn('[VoiceDx] Field extraction failed:', err);
      // Non-fatal — recording continues, fields just won't update
    }
  }, []);

  // ── Connect to OpenAI Realtime WebSocket ──
  const connectWebSocket = useCallback((ephemeralKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Use subprotocol auth — standard browser WebSocket pattern for OpenAI Realtime
        const ws = new WebSocket(OPENAI_REALTIME_URL, [
          'realtime',
          `openai-insecure-api-key.${ephemeralKey}`,
          'openai-beta.realtime-v1',
        ]);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[VoiceDx] WebSocket connected to OpenAI Realtime');

          // Configure transcription session — medical vocabulary + tuned VAD
          ws.send(JSON.stringify({
            type: 'transcription_session.update',
            session: {
              input_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'gpt-4o-mini-transcribe',
                language: 'en',
                prompt: TRANSCRIPTION_PROMPT,
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.4,       // More sensitive than default 0.5
                prefix_padding_ms: 500, // Capture beginning of words cleanly
                silence_duration_ms: 1500, // Give physio 1.5s pause before turn commits
              },
            },
          }));

          resolve();
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const msg = JSON.parse(event.data);
            handleRealtimeEvent(msg);
          } catch {
            // Non-JSON message — ignore
          }
        };

        ws.onerror = (e) => {
          console.error('[VoiceDx] WebSocket error:', e);
          reject(new Error('WebSocket connection failed'));
        };

        ws.onclose = (e) => {
          console.log('[VoiceDx] WebSocket closed:', e.code, e.reason);
        };
      } catch (err) {
        reject(err);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle events from OpenAI Realtime API ──
  const handleRealtimeEvent = useCallback((msg: any) => {
    switch (msg.type) {
      case 'conversation.item.input_audio_transcription.delta': {
        // Partial transcript — append delta to current turn
        if (msg.delta) {
          currentTurnDeltaRef.current += msg.delta;
          // Display = all completed turns + current partial turn
          const display = completedTurnsRef.current + currentTurnDeltaRef.current;
          cumulativeTranscriptRef.current = display;
          setTranscript(display);
        }
        break;
      }

      case 'conversation.item.input_audio_transcription.completed': {
        // Turn completed — finalize this turn, reset delta, trigger extraction
        const turnTranscript = msg.transcript || currentTurnDeltaRef.current;
        if (turnTranscript) {
          // Add this turn to the permanent completed turns
          completedTurnsRef.current =
            completedTurnsRef.current + (completedTurnsRef.current ? ' ' : '') + turnTranscript.trim();
          currentTurnDeltaRef.current = ''; // reset for next turn

          // Update display with all completed turns
          const fullTranscript = completedTurnsRef.current;
          cumulativeTranscriptRef.current = fullTranscript;
          setTranscript(fullTranscript);

          // Run extraction with the full cumulative transcript
          runExtraction(fullTranscript);
        }
        break;
      }

      case 'input_audio_buffer.speech_started':
        console.log('[VoiceDx] Speech detected');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[VoiceDx] Speech paused');
        break;

      case 'error':
        console.error('[VoiceDx] OpenAI Realtime error:', msg.error);
        break;

      default:
        break;
    }
  }, [runExtraction]);

  // ── Set up AudioContext + AudioWorklet for PCM streaming ──
  const setupAudio = useCallback(async (stream: MediaStream): Promise<void> => {
    const audioContext = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = audioContext;

    // Load the PCM worklet
    await audioContext.audioWorklet.addModule('/pcm-processor.js');

    const source = audioContext.createMediaStreamSource(stream);

    // Analyser for volume visualization (waveform bars)
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    source.connect(analyser);

    // PCM worklet for streaming to OpenAI
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
    workletNodeRef.current = workletNode;
    source.connect(workletNode);

    // Receive PCM chunks and send over WebSocket
    workletNode.port.onmessage = (event) => {
      if (!isActiveRef.current) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (event.data?.type === 'pcm') {
        const base64Audio = int16ToBase64(event.data.data);
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        }));
      }
    };

    // Connect worklet (output goes nowhere — we only use the port messages)
    workletNode.connect(audioContext.createGain()); // sink to prevent noise
  }, []);

  // ── Full cleanup ──
  const cleanup = useCallback(() => {
    console.log('[VoiceDx] Cleaning up');
    isActiveRef.current = false;

    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Disconnect audio worklet
    if (workletNodeRef.current) {
      try { workletNodeRef.current.disconnect(); } catch { /* ok */ }
      workletNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* ok */ }
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // Close WebSocket
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.close(); } catch { /* ok */ }
    }
    wsRef.current = null;

    setVolumeLevel(0);
  }, []);

  // ── Start recording ──
  const startRecording = useCallback(async () => {
    setError(null);
    setIsProcessing(true);
    setTranscript('');
    setExtractedFields({});
    setFieldConfidence({});
    setElapsedMs(0);
    cumulativeTranscriptRef.current = '';
    completedTurnsRef.current = '';
    currentTurnDeltaRef.current = '';
    extractedFieldsRef.current = {};

    try {
      // 1. Create session
      console.log('[VoiceDx] Creating session...');
      const sessionResult = await ClinicalDxVoiceService.createSession(clinicId, patientId, conditionId);
      if (!sessionResult?.data?.session_id) throw new Error('Failed to create session');
      const sid = sessionResult.data.session_id;
      setSessionId(sid);
      sessionIdRef.current = sid;
      console.log('[VoiceDx] Session created:', sid);

      // 2. Get ephemeral token from backend
      console.log('[VoiceDx] Getting ephemeral token...');
      const tokenResult = await ClinicalDxVoiceService.getEphemeralToken(sid);
      const ephemeralKey = tokenResult?.data?.client_secret || tokenResult?.client_secret;
      if (!ephemeralKey) throw new Error('Failed to get OpenAI ephemeral token');
      console.log('[VoiceDx] Got ephemeral token');

      // 3. Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,  // Auto-adjust mic level — helps when physio moves around
          sampleRate: 48000,      // High quality, worklet downsamples to 24kHz for OpenAI
        },
      });
      streamRef.current = stream;

      // 4. Connect WebSocket to OpenAI Realtime
      await connectWebSocket(ephemeralKey);

      // 5. Set up AudioContext + AudioWorklet (PCM streaming starts automatically)
      await setupAudio(stream);

      // 6. Mark active
      isActiveRef.current = true;
      setIsRecording(true);
      setIsProcessing(false);

      // 7. Volume monitoring for waveform visualization
      const analyser = analyserRef.current!;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      volumeIntervalRef.current = setInterval(() => {
        if (!isActiveRef.current) return;
        setVolumeLevel(Math.min(computeRMS(analyser, dataArray) * 5, 1));
      }, VOLUME_CHECK_INTERVAL_MS);

      // 8. Elapsed time timer
      sessionStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - sessionStartRef.current);
      }, 1000);

      // 9. Hard cap — 15 min max
      maxDurationTimeoutRef.current = setTimeout(() => {
        console.log('[VoiceDx] 15min cap — auto-stopping');
        cleanup();
        setIsRecording(false);
      }, MAX_SESSION_DURATION_MS);

      console.log('[VoiceDx] Recording started via OpenAI Realtime API');
    } catch (err: any) {
      const msg = err?.message || 'Failed to start recording';
      console.error('[VoiceDx] Start error:', err);
      cleanup();
      setError(msg);
      setIsRecording(false);
      setIsProcessing(false);
      onErrorRef.current?.(msg);
    }
  }, [clinicId, patientId, conditionId, connectWebSocket, setupAudio, cleanup]);

  // ── Stop recording ──
  const stopRecording = useCallback(async () => {
    console.log('[VoiceDx] Stopping recording');
    setIsRecording(false);
    setIsProcessing(true);

    cleanup();

    // Final extraction with the full transcript we have
    const finalTranscript = cumulativeTranscriptRef.current;
    if (finalTranscript.trim()) {
      await runExtraction(finalTranscript);
    }

    if (mountedRef.current) {
      setIsProcessing(false);
    }

    console.log('[VoiceDx] Stop complete');
  }, [cleanup, runExtraction]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      isActiveRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const fieldsCaptured = Object.keys(extractedFields).length;

  return {
    isRecording,
    isProcessing,
    volumeLevel,
    transcript,
    extractedFields,
    fieldConfidence,
    fieldsCaptured,
    totalFields: TOTAL_FIELD_COUNT,
    sessionId,
    elapsedMs,
    error,
    startRecording,
    stopRecording,
  };
}
