'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Play, Pause, Trash2, Upload, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTranscriptionComplete?: (transcription: string) => void;
  isTranscribing?: boolean;
  disabled?: boolean;
}

export default function AudioRecorder({ 
  onRecordingComplete, 
  onTranscriptionComplete,
  isTranscribing = false,
  disabled = false 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

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
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setVolumeLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Try to use audio/wav if supported, otherwise fall back to webm
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Convert to WAV if not already in a supported format
        let finalBlob = audioBlob;
        if (mimeType.includes('webm')) {
          // For now, we'll send as is and handle conversion server-side
          // Or we can rename the file extension to match the actual format
          finalBlob = new Blob([audioBlob], { type: 'audio/webm' });
        }
        
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        onRecordingComplete(finalBlob);
        
        // Cleanup
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      
      // Setup audio analyser for visualization
      setupAudioAnalyser(stream);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseResumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const playPauseAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!audioBlob ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic className="h-5 w-5" />
                <span>Start Recording</span>
              </button>
            ) : (
              <>
                <button
                  onClick={pauseResumeRecording}
                  className="p-3 bg-healui-accent text-white rounded-lg hover:bg-healui-accent/80 transition-all duration-200"
                >
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </button>
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-6 py-3 bg-text-gray text-white rounded-lg hover:bg-text-dark transition-all duration-200"
                >
                  <Square className="h-5 w-5" />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
          
          {isRecording && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isPaused ? 'bg-healui-accent' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-sm font-medium text-text-gray">
                  {isPaused ? 'Paused' : 'Recording'}
                </span>
              </div>
              
              {/* Audio Wave Visualization */}
              <div className="flex items-center justify-center space-x-1 h-16">
                {[...Array(20)].map((_, i) => {
                  const height = isPaused ? 10 : Math.max(10, volumeLevel * 60 * (1 + Math.sin(i * 0.5) * 0.3));
                  return (
                    <div
                      key={i}
                      className="w-1 bg-healui-primary rounded-full transition-all duration-100"
                      style={{
                        height: `${height}px`,
                        opacity: isPaused ? 0.3 : 0.8 + (volumeLevel * 0.2),
                      }}
                    />
                  );
                })}
              </div>
              
              <span className="text-lg font-mono text-text-dark">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-light rounded-lg">
            <div className="flex items-center space-x-4">
              <button
                onClick={playPauseAudio}
                className="p-2 bg-healui-primary text-white rounded-lg hover:bg-healui-physio transition-all duration-200"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <div>
                <p className="text-sm font-medium text-text-gray">Audio Recording</p>
                <p className="text-xs text-text-light">{formatTime(recordingTime)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={deleteRecording}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
          
          <div className="flex items-center justify-center">
            <button
              onClick={() => deleteRecording()}
              className="text-sm text-text-gray hover:text-text-dark transition-all duration-200"
            >
              Record Again
            </button>
          </div>
        </div>
      )}
      
      {isTranscribing && (
        <div className="flex items-center justify-center space-x-2 text-healui-primary">
          <div className="animate-spin h-4 w-4 border-2 border-healui-primary border-t-transparent rounded-full" />
          <span className="text-sm">Transcribing audio...</span>
        </div>
      )}
    </div>
  );
}