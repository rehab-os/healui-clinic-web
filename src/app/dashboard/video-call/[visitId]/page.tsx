'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Users,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Heart,
  FileText,
  ChevronRight,
  X,
  Copy,
  Save,
  CheckCircle
} from 'lucide-react';
import ApiManager from '../../../../services/api';
import { useAppSelector } from '../../../../store/hooks';
import type { VisitResponseDto, VisitMode } from '../../../../lib/types';

// Agora Web SDK imports
import AgoraRTC from 'agora-rtc-sdk-ng';

interface VideoCallState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isConnecting: boolean;
  isConnected: boolean;
}

// Main video call component using base Agora SDK
function VideoCallContent() {
  // Create Agora client inside component to avoid shared instances
  const [agoraClient] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const params = useParams();
  const router = useRouter();
  const { userData, currentClinic } = useAppSelector(state => state.user);
  
  // State management
  const [visit, setVisit] = useState<VisitResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoState, setVideoState] = useState<VideoCallState>({
    isVideoEnabled: true,
    isAudioEnabled: true,
    isConnecting: false,
    isConnected: false
  });
  const [channelName, setChannelName] = useState('');
  const [token, setToken] = useState('');
  const [appId, setAppId] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Agora tracks and client state
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  
  // Notes state
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Setup Agora client event handlers
  useEffect(() => {
    console.log('VideoCallPage mounted with visitId:', params.visitId);
    
    // Setup event handlers
    agoraClient.on('user-published', async (user, mediaType) => {
      console.log('User published:', user.uid, mediaType);
      await agoraClient.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid);
          if (existing) {
            return prev.map(u => u.uid === user.uid ? user : u);
          }
          return [...prev, user];
        });
      }
      
      if (mediaType === 'audio') {
        // Play the remote audio track automatically
        user.audioTrack?.play();
      }
    });

    agoraClient.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      }
    });

    agoraClient.on('user-left', (user) => {
      console.log('User left:', user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    return () => {
      console.log('VideoCallPage unmounting');
      leaveCall(false);
    };
  }, []);

  // Fetch visit data and validate access
  useEffect(() => {
    if (params.visitId) {
      fetchVisitData();
    }
  }, [params.visitId]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching visit data for ID:', params.visitId);
      const response = await ApiManager.getVisit(params.visitId as string);
      console.log('Visit API response:', response);
      
      if (!response.success) {
        console.error('Visit API failed:', response.message);
        setError(response.message || 'Failed to load visit details');
        return;
      }

      const visitData = response.data;
      console.log('Visit data:', visitData);
      console.log('Visit mode:', visitData?.visit_mode);
      
      // Validate this is an online visit
      if (!visitData || visitData.visit_mode !== 'ONLINE') {
        console.error('Visit validation failed. Mode:', visitData?.visit_mode);
        setError('This is not an online visit');
        return;
      }

      setVisit(visitData);
      console.log('Visit set successfully');
    } catch (err: any) {
      console.error('Error in fetchVisitData:', err);
      setError(err.message || 'An error occurred while loading the visit');
    } finally {
      setLoading(false);
    }
  };

  // Initialize video session and join call
  const joinCall = async () => {
    if (!visit?.id) return;

    try {
      // Check if already connected or connecting
      if (agoraClient.connectionState === 'CONNECTED' || agoraClient.connectionState === 'CONNECTING') {
        console.log('Client already connected/connecting, leaving first...');
        await agoraClient.leave();
      }

      setVideoState(prev => ({ ...prev, isConnecting: true }));
      
      // First, ensure video session exists (create if needed)
      let videoSession;
      try {
        const getResponse = await ApiManager.getVideoSession(visit.id);
        if (getResponse.success && getResponse.data) {
          videoSession = getResponse.data;
        }
      } catch (getError) {
        console.log('Video session not found, creating new one...');
      }

      // Create video session if it doesn't exist
      if (!videoSession) {
        const createResponse = await ApiManager.createVideoSession(visit.id);
        if (createResponse.success && createResponse.data) {
          videoSession = createResponse.data;
        } else {
          throw new Error('Failed to create video session');
        }
      }

      console.log('🎯 Video session ready:', videoSession);
      console.log('AppId:', videoSession.appId);
      console.log('Channel:', videoSession.channel);
      console.log('Token:', videoSession.token ? `${videoSession.token.substring(0, 30)}...` : 'null');
      
      // Create local tracks
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      
      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);
      
      // Join channel
      console.log('Joining channel...');
      const uid = await agoraClient.join(videoSession.appId, videoSession.channel, videoSession.token || null);
      console.log('✅ Joined channel with UID:', uid);
      
      // Publish tracks
      await agoraClient.publish([videoTrack, audioTrack]);
      console.log('✅ Published tracks');
      
      setVideoState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        isConnected: true 
      }));

    } catch (err: any) {
      console.error('❌ Error joining call:', err);
      setError(err.message || 'Failed to join video call');
      setVideoState(prev => ({ ...prev, isConnecting: false, isConnected: false }));
    }
  };

  // Leave call and cleanup
  const leaveCall = async (shouldRedirect = true) => {
    try {
      console.log('Leaving call, shouldRedirect:', shouldRedirect);
      
      // Stop and close local tracks
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      
      // Leave channel
      if (videoState.isConnected) {
        await agoraClient.leave();
        console.log('✅ Left channel');
      }
      
      // Reset state
      setRemoteUsers([]);
      setVideoState(prev => ({
        ...prev,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isConnecting: false,
        isConnected: false
      }));

      // Only redirect if explicitly requested
      if (shouldRedirect) {
        router.push('/dashboard/appointments');
      }
    } catch (err) {
      console.error('Error leaving call:', err);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrack) {
      const newVideoState = !videoState.isVideoEnabled;
      await localVideoTrack.setEnabled(newVideoState);
      setVideoState(prev => ({ ...prev, isVideoEnabled: newVideoState }));
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (localAudioTrack) {
      const newAudioState = !videoState.isAudioEnabled;
      await localAudioTrack.setEnabled(newAudioState);
      setVideoState(prev => ({ ...prev, isAudioEnabled: newAudioState }));
    }
  };
  
  // Check if we're in a call
  const isInCall = videoState.isConnected;

  // Format time and date functions
  const formatTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${timeString}`;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format duration with type
  const formatVisitInfo = () => {
    const type = visit?.visit_type?.replace('_', ' ') || 'Consultation';
    const duration = `${visit?.duration_minutes || 30} min`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { type, duration, time };
  };

  // Auto-save notes with debounce
  useEffect(() => {
    if (!noteText.trim() || !visit?.id) return;

    const saveTimer = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(saveTimer);
  }, [noteText, visit?.id]);

  // Auto-save function
  const handleAutoSave = async () => {
    if (!noteText.trim() || !visit?.id) return;

    setIsSavingNote(true);
    try {
      const notePayload = {
        visit_id: visit.id,
        note_type: 'PROGRESS' as const,
        note_data: {
          progress_note: noteText.trim()
        },
        additional_notes: `Video consultation progress notes - ${new Date().toLocaleString()}`
      };

      const response = await ApiManager.createNote(notePayload);
      
      if (response.success) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error auto-saving notes:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Manual save notes
  const handleManualSave = async () => {
    if (!noteText.trim() || !visit?.id) return;

    setIsSavingNote(true);
    try {
      const notePayload = {
        visit_id: visit.id,
        note_type: 'PROGRESS' as const,
        note_data: {
          progress_note: noteText.trim()
        },
        additional_notes: `Video consultation progress notes - ${new Date().toLocaleString()}`
      };

      const response = await ApiManager.createNote(notePayload);
      
      if (response.success) {
        setLastSaved(new Date());
        // Don't clear text on manual save, keep the notes
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Copy patient link
  const handleCopyPatientLink = () => {
    const patientLink = `${window.location.origin}/patient-call/${visit?.id}`;
    navigator.clipboard.writeText(patientLink);
    alert('Patient link copied to clipboard!');
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    if (!visit?.patient?.phone || !visit?.id) {
      alert('Patient phone number not available');
      return;
    }

    // Get doctor name from visit data or user data
    const doctorName = visit?.physiotherapist?.full_name || userData?.full_name || 'your doctor';
    const patientLink = `${window.location.origin}/patient-call/${visit.id}`;
    const scheduledTime = visit.scheduled_time;
    const scheduledDate = new Date(visit.scheduled_date).toLocaleDateString();
    
    const message = `Hello ${visit.patient.full_name}, 

Here is your video consultation link with Dr. ${doctorName}:

→ Date: ${scheduledDate}
→ Time: ${scheduledTime}
→ Duration: ${visit.duration_minutes} minutes

→ Meeting Link: ${patientLink}

Please click on the link at your scheduled appointment time. No login required.

Best regards,
${currentClinic?.name || visit?.clinic?.name || 'Your Healthcare Team'}`;

    // Clean phone number (remove non-digits)
    const cleanPhone = visit.patient.phone.replace(/\D/g, '');
    
    // WhatsApp URL with message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-healui-physio" />
          <p className="text-lg font-medium text-text-dark">Loading video call...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-dark mb-2">Unable to Join Call</h1>
          <p className="text-text-light mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/appointments')}
            className="btn-primary px-6 py-3"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <Video className="h-4 w-4 sm:h-5 sm:w-5 text-healui-physio flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <h1 className="text-sm sm:text-lg font-bold text-text-dark truncate">
                  {visit?.patient?.full_name}
                </h1>
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-500">
                  <span>{visit?.patient?.date_of_birth ? `${calculateAge(visit.patient.date_of_birth)}y` : 'N/A'}</span>
                  <span>•</span>
                  <span>{visit?.patient?.gender?.charAt(0) || 'N/A'}</span>
                  <span>•</span>
                  <span className="hidden sm:inline">{formatVisitInfo().type}</span>
                  <span className="sm:hidden">{formatVisitInfo().type.split(' ')[0]}</span>
                  <span>•</span>
                  <span>{formatVisitInfo().duration}</span>
                </div>
              </div>
              <p className="text-xs text-text-light">
                Meeting started at {formatVisitInfo().time}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Copy Patient Link */}
            <button
              onClick={handleCopyPatientLink}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy patient link"
            >
              <Copy className="h-4 w-4" />
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              title="Share via WhatsApp"
            >
              {/* WhatsApp-style icon */}
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.891 3.506z"/>
              </svg>
            </button>

            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Video Area */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6">
          {!isInCall ? (
            /* Pre-call Screen */
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center text-white max-w-sm mx-auto">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-healui-physio rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to join?</h2>
                <p className="text-gray-300 mb-8 text-sm sm:text-base">
                  Video consultation with {visit?.patient?.full_name}
                </p>
                <button
                  onClick={joinCall}
                  disabled={videoState.isConnecting}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-healui-physio hover:bg-healui-primary text-white rounded-lg font-semibold text-base sm:text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {videoState.isConnecting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Video className="h-5 w-5 mr-2" />
                      Join Call
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Video Call Interface */
            <div className="h-full relative flex flex-col">
              {/* Remote Video (Main) */}
              <div className="flex-1 bg-gray-800 rounded-lg relative overflow-hidden">
                {remoteUsers.length > 0 ? (
                  <div 
                    id={`remote-video-${remoteUsers[0].uid}`}
                    className="w-full h-full"
                    ref={(ref) => {
                      if (ref && remoteUsers[0].videoTrack) {
                        remoteUsers[0].videoTrack.play(ref);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-10 w-10 sm:h-12 sm:w-12" />
                      </div>
                      <p className="text-base sm:text-lg font-medium">{visit?.patient?.full_name}</p>
                      <p className="text-xs sm:text-sm text-gray-400">Waiting for patient to join...</p>
                    </div>
                  </div>
                )}

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-28 h-20 sm:w-48 sm:h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                  {localVideoTrack ? (
                    <div className="w-full h-full relative">
                      <div 
                        id="local-video"
                        className="w-full h-full"
                        ref={(ref) => {
                          if (ref && localVideoTrack && videoState.isVideoEnabled) {
                            localVideoTrack.play(ref);
                          }
                        }}
                      />
                      {!videoState.isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                          <VideoOff className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                        </div>
                      )}
                      {!videoState.isAudioEnabled && (
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-red-500 rounded-full p-1">
                          <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white text-center">
                        <User className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1" />
                        <p className="text-xs">You</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Call Controls */}
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-2 sm:space-x-4 bg-black bg-opacity-50 rounded-full px-4 sm:px-6 py-3">
                    <button
                      onClick={toggleAudio}
                      className={`p-2 sm:p-3 rounded-full transition-colors ${
                        videoState.isAudioEnabled
                          ? 'bg-gray-600 hover:bg-gray-500 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {videoState.isAudioEnabled ? (
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>

                    <button
                      onClick={toggleVideo}
                      className={`p-2 sm:p-3 rounded-full transition-colors ${
                        videoState.isVideoEnabled
                          ? 'bg-gray-600 hover:bg-gray-500 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {videoState.isVideoEnabled ? (
                        <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>

                    <button
                      onClick={leaveCall}
                      className="p-2 sm:p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Notes Section - Below Video */}
              <div className="lg:hidden bg-black/20 backdrop-blur-md p-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">Notes</span>
                  <div className="flex items-center space-x-1">
                    {isSavingNote ? (
                      <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                    ) : lastSaved ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <Save className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
                
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add notes during call..."
                  className="w-full h-20 p-2 bg-transparent border border-white/20 rounded text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                
                <div className="text-xs text-white/60 mt-1">
                  {lastSaved ? 
                    `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
                    'Auto-save enabled'
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Simple Notes Sidebar */}
        <div className={`${showSidebar ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:relative top-0 right-0 h-full w-full max-w-sm lg:w-72 bg-black/20 backdrop-blur-md transition-transform duration-300 z-50 lg:z-auto`}>
          <div className="p-4 overflow-y-auto h-full">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b border-white/20">
              <span className="text-white text-base font-medium">Notes</span>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 text-white/70 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simple Notes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">Notes</span>
                {isSavingNote ? (
                  <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                ) : lastSaved ? (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                ) : (
                  <Save className="h-3 w-3 text-gray-400" />
                )}
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes..."
                className="w-full h-48 p-3 bg-transparent border-0 rounded-none resize-none text-sm text-white placeholder:text-white/50 focus:outline-none"
              />

              <div className="text-xs text-white/60">
                {lastSaved ? 
                  `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 
                  'Auto-save enabled'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the main component directly
export default VideoCallContent;