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
  FileText
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

// Create Agora client
const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// Main video call component using base Agora SDK
function VideoCallContent() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAppSelector(state => state.user);
  
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
  
  // Agora tracks and client state
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

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

  // Format time
  const formatTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${timeString}`;
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
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Video className="h-6 w-6 text-healui-physio" />
            <div>
              <h1 className="text-xl font-bold text-text-dark">Video Consultation</h1>
              <p className="text-sm text-text-light">
                {visit?.patient?.full_name} • {formatTime(visit?.scheduled_date.toString() || '', visit?.scheduled_time || '')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-text-light">
              <Clock className="h-4 w-4 mr-1" />
              <span>{visit?.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center text-sm text-text-light">
              <Users className="h-4 w-4 mr-1" />
              <span>2 participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 p-6">
          {!isInCall ? (
            /* Pre-call Screen */
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-healui-physio rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-16 w-16 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to join?</h2>
                <p className="text-gray-300 mb-8">
                  Video consultation with {visit?.patient?.full_name}
                </p>
                <button
                  onClick={joinCall}
                  disabled={videoState.isConnecting}
                  className="btn-primary px-8 py-4 text-lg disabled:opacity-50"
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
            <div className="h-full relative">
              {/* Remote Video (Main) */}
              <div className="w-full h-full bg-gray-800 rounded-lg relative overflow-hidden">
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
                      <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-12 w-12" />
                      </div>
                      <p className="text-lg font-medium">{visit?.patient?.full_name}</p>
                      <p className="text-sm text-gray-400">Waiting for patient to join...</p>
                    </div>
                  </div>
                )}

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                  {localVideoTrack ? (
                    <div className="w-full h-full relative">
                      <div 
                        id="local-video"
                        className="w-full h-full"
                        ref={(ref) => {
                          if (ref && localVideoTrack) {
                            localVideoTrack.play(ref);
                          }
                        }}
                      />
                      {!videoState.isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                          <VideoOff className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      {!videoState.isAudioEnabled && (
                        <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
                          <MicOff className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white text-center">
                        <User className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-xs">You</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Controls */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition-colors ${
                      videoState.isAudioEnabled
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {videoState.isAudioEnabled ? (
                      <Mic className="h-5 w-5" />
                    ) : (
                      <MicOff className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      videoState.isVideoEnabled
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {videoState.isVideoEnabled ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <VideoOff className="h-5 w-5" />
                    )}
                  </button>

                  <button
                    onClick={leaveCall}
                    className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patient Info Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-healui-physio rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">
                  {visit?.patient?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h3 className="font-bold text-lg text-text-dark">{visit?.patient?.full_name}</h3>
              <p className="text-sm text-text-light">{visit?.patient?.patient_code}</p>
            </div>

            {/* Visit Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-text-dark mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Visit Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light">Type:</span>
                  <span className="text-text-dark font-medium">{visit?.visit_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">Status:</span>
                  <span className="text-text-dark font-medium">{visit?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">Duration:</span>
                  <span className="text-text-dark font-medium">{visit?.duration_minutes} minutes</span>
                </div>
              </div>
              {visit?.chief_complaint && (
                <div className="mt-3">
                  <p className="text-text-light text-sm mb-1">Chief Complaint:</p>
                  <p className="text-text-dark text-sm">{visit.chief_complaint}</p>
                </div>
              )}
            </div>

            {/* Patient Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-text-dark mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Patient Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light">Phone:</span>
                  <span className="text-text-dark">{visit?.patient?.phone}</span>
                </div>
                {visit?.patient?.email && (
                  <div className="flex justify-between">
                    <span className="text-text-light">Email:</span>
                    <span className="text-text-dark">{visit.patient.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-light">Gender:</span>
                  <span className="text-text-dark">{visit?.patient?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light">DOB:</span>
                  <span className="text-text-dark">
                    {visit?.patient?.date_of_birth ? new Date(visit.patient.date_of_birth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Patient Link */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-text-dark mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Patient Access
              </h4>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-sm text-text-light mb-2">Share this link with your patient:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/patient-call/${visit?.id}`}
                      readOnly
                      className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/patient-call/${visit?.id}`);
                        alert('Link copied to clipboard!');
                      }}
                      className="btn-primary text-xs px-3 py-2"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-light">
                  Send this link to your patient via SMS, email, or phone. They can join the call without any login.
                </p>
              </div>
            </div>

            {/* Quick Notes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-text-dark mb-3 flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Quick Notes
              </h4>
              <textarea
                placeholder="Add consultation notes..."
                className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-healui-physio/20 focus:border-healui-physio"
              />
              <button className="mt-2 btn-primary text-sm px-4 py-2 w-full">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the main component directly
export default VideoCallContent;