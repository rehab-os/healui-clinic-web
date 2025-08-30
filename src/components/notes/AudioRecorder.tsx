'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Play, Pause, Trash2, Upload, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';

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
  const [frequencyData, setFrequencyData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aiCircleRef = useRef<HTMLDivElement | null>(null);
  const gsapTimelineRef = useRef<gsap.core.Timeline | null>(null);

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
      if (gsapTimelineRef.current) {
        gsapTimelineRef.current.kill();
      }
    };
  }, [audioUrl]);

  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.85;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    
    source.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const frequencyArray = new Uint8Array(analyser.frequencyBinCount);
    
    // Initialize GSAP timeline for AI listening animations
    gsapTimelineRef.current = gsap.timeline({ repeat: -1 });
    
    // Animate AI circle with pulsing effect
    if (aiCircleRef.current) {
      gsapTimelineRef.current
        .to(aiCircleRef.current, {
          scale: 1.1,
          duration: 0.8,
          ease: "power2.inOut"
        })
        .to(aiCircleRef.current, {
          scale: 1,
          duration: 0.8,
          ease: "power2.inOut"
        });
    }
    
    const updateVolume = () => {
      if (!analyserRef.current || !isRecording) return;
      
      // Get time domain data for volume level
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      // Calculate RMS (Root Mean Square) for better volume detection
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = (dataArray[i] - 128) / 128; // Convert to -1 to 1 range
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedVolume = Math.min(rms * 5, 1); // Amplify sensitivity
      setVolumeLevel(normalizedVolume);
      
      // Get frequency data for spectrum visualization
      analyserRef.current.getByteFrequencyData(frequencyArray);
      const frequencies = Array.from(frequencyArray.slice(0, 32)).map(val => {
        // Enhance sensitivity for frequency visualization
        const normalized = val / 255;
        return Math.pow(normalized, 0.5) * 1.5; // Apply power curve and amplify
      });
      setFrequencyData(frequencies);
      
      // Dynamic GSAP animations based on volume level
      if (aiCircleRef.current && normalizedVolume > 0.02) {
        const intensity = Math.min(normalizedVolume * 2, 1);
        
        // Update circle glow and scale based on volume
        gsap.to(aiCircleRef.current, {
          boxShadow: `0 0 ${20 + intensity * 60}px rgba(16, 185, 129, ${0.3 + intensity * 0.7})`,
          scale: 1 + intensity * 0.2,
          duration: 0.1,
          ease: "power1.out"
        });
      }
      
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
        if (gsapTimelineRef.current) {
          gsapTimelineRef.current.kill();
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
      
      // Clean up GSAP animations
      if (gsapTimelineRef.current) {
        gsapTimelineRef.current.kill();
      }
      
      // Reset visual states
      setVolumeLevel(0);
      setFrequencyData([]);
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
            <div className="flex flex-col items-center space-y-6">
              {/* AI Listening Indicator */}
              <div className="relative flex flex-col items-center">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`h-4 w-4 rounded-full ${isPaused ? 'bg-healui-accent' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-sm font-medium text-text-gray">
                    {isPaused ? 'Paused' : 'AI is listening...'}
                  </span>
                  {!isPaused && volumeLevel > 0.05 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium animate-pulse">
                      📢 Detecting voice
                    </span>
                  )}
                </div>

                {/* Central AI Circle with Dynamic Glow */}
                <div className="relative mb-6">
                  <div
                    ref={aiCircleRef}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-healui-physio to-healui-primary flex items-center justify-center shadow-lg"
                    style={{
                      boxShadow: `0 0 ${20 + volumeLevel * 40}px rgba(16, 185, 129, ${0.4 + volumeLevel * 0.6})`
                    }}
                  >
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Ripple Effect Rings */}
                  {!isPaused && volumeLevel > 0.1 && (
                    <>
                      <div 
                        className="absolute inset-0 rounded-full border-2 border-healui-physio opacity-30 animate-ping"
                        style={{ 
                          animationDuration: '1.5s',
                          transform: `scale(${1 + volumeLevel * 0.5})` 
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-full border border-healui-primary opacity-20 animate-ping"
                        style={{ 
                          animationDuration: '2s',
                          animationDelay: '0.3s',
                          transform: `scale(${1.2 + volumeLevel * 0.8})` 
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Enhanced Frequency Spectrum Visualization */}
              <div className="w-full max-w-md">
                <div className="flex items-end justify-center space-x-1 h-24 bg-gray-50 rounded-xl p-4 relative overflow-hidden">
                  {/* Background gradient overlay */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-healui-physio/10 via-transparent to-healui-primary/10 rounded-xl"
                    style={{
                      opacity: volumeLevel * 0.8
                    }}
                  />
                  
                  {/* Frequency bars */}
                  {Array(32).fill(0).map((_, i) => {
                    // Use frequency data if available, otherwise use volume-based simulation
                    const frequency = frequencyData[i] || 0;
                    const simulatedFreq = volumeLevel * (0.3 + Math.sin(i * 0.3 + Date.now() * 0.005) * 0.2);
                    const normalizedFreq = isPaused ? 0 : Math.max(frequency, simulatedFreq * 0.8);
                    
                    // Ensure minimum visibility and better scaling
                    const height = Math.max(6, normalizedFreq * 80 + volumeLevel * 20);
                    const hue = 160 + (i / 32) * 25; // Green to blue gradient
                    const saturation = 70 + normalizedFreq * 20;
                    const lightness = 50 + normalizedFreq * 25;
                    
                    return (
                      <div
                        key={i}
                        className="rounded-full transition-all duration-100 relative z-10"
                        style={{
                          height: `${height}px`,
                          width: '4px',
                          background: `linear-gradient(to top, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${hue}, ${saturation + 10}%, ${lightness + 15}%))`,
                          opacity: isPaused ? 0.3 : Math.max(0.4, 0.6 + normalizedFreq * 0.4),
                          transform: `scaleY(${isPaused ? 0.3 : Math.max(0.5, 1 + normalizedFreq * 0.3)})`,
                          boxShadow: normalizedFreq > 0.3 ? `0 0 10px hsla(${hue}, 80%, 65%, 0.4)` : 'none',
                          filter: normalizedFreq > 0.5 ? 'brightness(1.2)' : 'none'
                        }}
                      />
                    );
                  })}
                  
                  {/* Volume level indicator */}
                  <div 
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-medium text-healui-primary opacity-80"
                  >
                    {Math.round(volumeLevel * 100)}% {!isPaused && '🎙️'}
                  </div>
                  
                  {/* Debug: Show if we're getting audio data */}
                  {!isPaused && (
                    <div className="absolute top-2 right-2 text-xs text-gray-500">
                      {frequencyData.some(f => f > 0.1) ? '📊 Live' : '⚡ Ready'}
                    </div>
                  )}
                </div>
              </div>

              {/* Recording Time with Enhanced Styling */}
              <div className="text-center">
                <span className="text-2xl font-mono font-bold text-gray-800 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  {formatTime(recordingTime)}
                </span>
                <p className="text-xs text-gray-500 mt-2">
                  {isPaused ? 'Recording paused' : 'Capturing audio...'}
                </p>
              </div>
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