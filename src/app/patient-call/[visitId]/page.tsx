'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  User,
  AlertCircle,
  Loader2,
  Heart,
  Calendar,
  Clock
} from 'lucide-react';
import ApiManager from '../../../services/api';

// Agora imports - dynamically imported to avoid SSR issues
// import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface PatientVideoCallState {
  isJoined: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isConnecting: boolean;
  localVideoTrack: any | null;
  localAudioTrack: any | null;
  agoraClient: any | null;
  remoteUsers: any[];
}

interface VisitInfo {
  visitId: string;
  visitType: string;
  visitMode: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  status: string;
  doctor: {
    fullName: string;
  };
  clinic: {
    name: string;
  };
  patient: {
    firstName: string;
  };
}

export default function PatientVideoCallPage() {
  const params = useParams();
  const [videoState, setVideoState] = useState<PatientVideoCallState>({
    isJoined: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isConnecting: false,
    localVideoTrack: null,
    localAudioTrack: null,
    agoraClient: null,
    remoteUsers: []
  });
  const [visitInfo, setVisitInfo] = useState<VisitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoSession, setVideoSession] = useState<any>(null);
  
  // Use refs to avoid stale closures in cleanup
  const videoStateRef = useRef(videoState);
  videoStateRef.current = videoState;

  // Initialize Agora
  useEffect(() => {
    const initializeAgora = async () => {
      try {
        // Dynamically import Agora SDK to avoid SSR issues
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
        
        // Setup event handlers
        client.on('user-published', async (user, mediaType) => {
          console.log('Remote user published:', user.uid, mediaType);
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            setVideoState(prev => {
              const existing = prev.remoteUsers.find(u => u.uid === user.uid);
              if (existing) {
                return { ...prev, remoteUsers: prev.remoteUsers.map(u => u.uid === user.uid ? user : u) };
              }
              return { ...prev, remoteUsers: [...prev.remoteUsers, user] };
            });
          }
          
          if (mediaType === 'audio' && user.audioTrack) {
            // Play remote audio - this is the doctor's audio
            user.audioTrack.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          console.log('Remote user unpublished:', user.uid, mediaType);
          if (mediaType === 'video') {
            setVideoState(prev => ({
              ...prev,
              remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid)
            }));
          }
        });

        client.on('user-left', (user) => {
          console.log('Remote user left:', user.uid);
          setVideoState(prev => ({
            ...prev,
            remoteUsers: prev.remoteUsers.filter(u => u.uid !== user.uid)
          }));
        });
        
        setVideoState(prev => ({ ...prev, agoraClient: client }));
      } catch (error) {
        console.error('Failed to initialize Agora:', error);
        setError('Failed to initialize video calling. Please refresh the page.');
      }
    };

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      initializeAgora();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentState = videoStateRef.current;
      console.log('Patient cleanup: isJoined =', currentState.isJoined);
      if (currentState.isJoined && currentState.agoraClient) {
        // Cleanup tracks
        if (currentState.localVideoTrack) {
          currentState.localVideoTrack.stop();
          currentState.localVideoTrack.close();
        }
        if (currentState.localAudioTrack) {
          currentState.localAudioTrack.stop();
          currentState.localAudioTrack.close();
        }
        // Leave channel
        currentState.agoraClient.leave();
      }
    };
  }, []); // Empty dependency array since we use ref

  useEffect(() => {
    const fetchVisitInfo = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await ApiManager.getPublicVisitInfo(params.visitId as string);
        
        if (response.success && response.data) {
          setVisitInfo(response.data);
        } else {
          setError('Visit not found or not available for online access');
        }
      } catch (err: any) {
        console.error('Failed to fetch visit info:', err);
        setError('Unable to load visit information. Please check the link and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.visitId) {
      fetchVisitInfo();
    }
  }, [params.visitId]);

  const joinCall = async () => {
    if (!visitInfo || !videoState.agoraClient) return;
    
    try {
      console.log('🚀 Starting join call process...');
      console.log('Visit info:', visitInfo);
      console.log('Client state:', videoState.agoraClient.connectionState);
      
      // Check if already connected or connecting
      if (videoState.agoraClient.connectionState === 'CONNECTED' || videoState.agoraClient.connectionState === 'CONNECTING') {
        console.log('Client already connected/connecting, leaving first...');
        await videoState.agoraClient.leave();
      }

      setVideoState(prev => ({ ...prev, isConnecting: true }));
      
      // First, get the video session details from the PUBLIC backend API (for patients)
      console.log('📡 Fetching video session from API...');
      const sessionResponse = await ApiManager.getPublicVideoSession(visitInfo.visitId);
      console.log('📡 Session response:', sessionResponse);
      
      if (!sessionResponse.success || !sessionResponse.data) {
        console.error('❌ Failed to get session:', sessionResponse.message || 'No data');
        throw new Error(`Failed to get video session: ${sessionResponse.message || 'Invalid response'}`);
      }
      
      const session = sessionResponse.data;
      setVideoSession(session);
      console.log('✅ Got session data:', {
        appId: session.appId ? `${session.appId.substring(0, 8)}...` : 'null',
        channel: session.channel,
        token: session.token ? `${session.token.substring(0, 20)}...` : 'null'
      });
      
      let localVideoTrack = null;
      let localAudioTrack = null;
      
      try {
        console.log('🎥 Requesting camera and microphone permissions...');
        
        // First check if permissions are already granted
        try {
          const permissions = await navigator.permissions.query({ name: 'camera' as any });
          console.log('📹 Camera permission state:', permissions.state);
          
          const micPermissions = await navigator.permissions.query({ name: 'microphone' as any });
          console.log('🎤 Microphone permission state:', micPermissions.state);
        } catch (permErr) {
          console.log('⚠️ Could not check permissions:', permErr);
        }
        
        // Create local tracks - THIS WILL REQUEST CAMERA/MIC PERMISSIONS
        console.log('🎬 Creating media tracks...');
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        
        // Create local tracks - simple configuration like doctor page
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        
        localVideoTrack = videoTrack;
        localAudioTrack = audioTrack;
        console.log('✅ Media tracks created successfully');
        
        // Use the session details from the API
        const channel = session.channel;
        const uid = null; // Let Agora assign UID automatically for consistency
        
        console.log('🌐 Joining Agora channel...');
        console.log('Channel details:', { appId: session.appId, channel, uid });
        
        // Join channel using the proper appId and token from the API
        const assignedUid = await videoState.agoraClient.join(
          session.appId, // Use the proper Agora App ID from the API
          channel,
          session.token, // Use the token from the API
          uid
        );
        console.log('✅ Joined channel with UID:', assignedUid);
        
        // Publish local tracks
        console.log('📤 Publishing local tracks...');
        await videoState.agoraClient.publish([localVideoTrack, localAudioTrack]);
        console.log('✅ Published tracks successfully');
        
        setVideoState(prev => ({ 
          ...prev, 
          isJoined: true, 
          isConnecting: false,
          localVideoTrack,
          localAudioTrack
        }));
        
        console.log('🎉 Patient successfully joined video call!');
      } catch (innerErr: any) {
        console.error('❌ Inner error during track creation/joining:', innerErr);
        console.error('Error details:', {
          name: innerErr.name,
          message: innerErr.message,
          code: innerErr.code,
          stack: innerErr.stack
        });
        
        // If anything fails, cleanup the tracks we might have created
        if (localVideoTrack) {
          console.log('🧹 Cleaning up video track');
          localVideoTrack.stop();
          localVideoTrack.close();
        }
        if (localAudioTrack) {
          console.log('🧹 Cleaning up audio track');
          localAudioTrack.stop();
          localAudioTrack.close();
        }
        throw innerErr; // Re-throw to be caught by outer catch
      }
      
    } catch (err: any) {
      console.error('❌ Failed to join call:', err);
      console.error('Full error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
      });
      
      // Provide specific error messages based on the actual error
      let errorMessage = 'Failed to join video call. ';
      
      if (err.name === 'NotAllowedError' || err.code === 'PERMISSION_DENIED') {
        errorMessage += 'Please allow camera and microphone access when prompted.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please check your devices.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is already in use by another application.';
      } else if (err.code === 'INVALID_OPERATION') {
        errorMessage += 'Connection issue. Please try again.';
      } else if (err.message?.includes('network') || err.message?.includes('Network')) {
        errorMessage += 'Network connection problem. Please check your internet.';
      } else if (err.message?.includes('session') || err.message?.includes('Session')) {
        errorMessage += 'Video session issue. Please refresh and try again.';
      } else if (err.message?.includes('token') || err.message?.includes('Token')) {
        errorMessage += 'Authentication issue. Please refresh and try again.';
      } else {
        errorMessage += `Error: ${err.message || 'Unknown error occurred.'}`;
      }
      
      setError(errorMessage);
      setVideoState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const leaveCall = async () => {
    try {
      // First close the tracks
      if (videoState.localVideoTrack) {
        videoState.localVideoTrack.stop();
        videoState.localVideoTrack.close();
      }
      
      if (videoState.localAudioTrack) {
        videoState.localAudioTrack.stop();
        videoState.localAudioTrack.close();
      }
      
      // Then leave the channel
      if (videoState.agoraClient && videoState.isJoined) {
        await videoState.agoraClient.leave();
      }

      setVideoState(prev => ({
        ...prev,
        isJoined: false,
        isVideoEnabled: true,
        isAudioEnabled: true,
        isConnecting: false,
        localVideoTrack: null,
        localAudioTrack: null,
        remoteUsers: []
      }));
    } catch (err) {
      console.error('Error leaving call:', err);
    }
  };

  const toggleVideo = async () => {
    if (!videoState.localVideoTrack) return;
    
    const newVideoState = !videoState.isVideoEnabled;
    await videoState.localVideoTrack.setEnabled(newVideoState);
    setVideoState(prev => ({ ...prev, isVideoEnabled: newVideoState }));
  };

  const toggleAudio = async () => {
    if (!videoState.localAudioTrack) return;
    
    const newAudioState = !videoState.isAudioEnabled;
    await videoState.localAudioTrack.setEnabled(newAudioState);
    setVideoState(prev => ({ ...prev, isAudioEnabled: newAudioState }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium text-gray-700">Loading your appointment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Unable to Join Call</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Video Consultation</h1>
              <p className="text-sm text-gray-600">
                {visitInfo ? (
                  <>
                    Appointment with {visitInfo.doctor.fullName} at {visitInfo.scheduledTime}
                    <br />
                    <span className="text-xs flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(visitInfo.scheduledDate).toLocaleDateString()}
                      <Clock className="h-3 w-3 ml-2 mr-1" />
                      {visitInfo.durationMinutes} minutes
                    </span>
                  </>
                ) : (
                  'Loading appointment details...'
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Welcome</p>
            <p className="text-sm text-gray-600">{visitInfo?.patient.firstName || 'Patient'}</p>
            {visitInfo && (
              <p className="text-xs text-gray-500">{visitInfo.clinic.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {!visitInfo ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Visit Information</h2>
            <p className="text-gray-600">Please wait while we verify your appointment...</p>
          </div>
        ) : !videoState.isJoined ? (
          /* Pre-call Screen */
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready for your consultation?</h2>
            <p className="text-gray-600 mb-2">
              {visitInfo ? (
                <>Your doctor {visitInfo.doctor.fullName} is waiting for you</>
              ) : (
                'Loading doctor information...'
              )}
            </p>
            {visitInfo && (
              <div className="text-sm text-gray-500 mb-4">
                <p className="flex items-center justify-center mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(visitInfo.scheduledDate).toLocaleDateString()} at {visitInfo.scheduledTime}
                </p>
                <p className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Duration: {visitInfo.durationMinutes} minutes
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-8">
              Make sure your camera and microphone are working properly
            </p>
            
            {/* Camera and Mic Preview */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8">
              <div className="w-64 h-48 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Camera and microphone will be activated when you join the call
              </p>
            </div>

            <button
              onClick={joinCall}
              disabled={videoState.isConnecting}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {videoState.isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                  Connecting...
                </>
              ) : (
                <>
                  <Video className="h-5 w-5 mr-2 inline" />
                  Join Video Call
                </>
              )}
            </button>
          </div>
        ) : (
          /* Video Call Interface */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Video Area */}
            <div className="relative h-96 bg-gray-900">
              {/* Remote Video (Doctor) */}
              <div className="w-full h-full">
                {videoState.remoteUsers.length > 0 ? (
                  <div 
                    id={`remote-video-${videoState.remoteUsers[0].uid}`}
                    className="w-full h-full"
                    ref={(ref) => {
                      if (ref && videoState.remoteUsers[0]?.videoTrack) {
                        videoState.remoteUsers[0].videoTrack.play(ref);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-12 w-12" />
                      </div>
                      <p className="text-lg font-medium">{visitInfo?.doctor.fullName || 'Doctor'}</p>
                      <p className="text-sm text-gray-400">Waiting for doctor to join...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local Video (Patient - Picture-in-Picture) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                {videoState.localVideoTrack ? (
                  <div className="w-full h-full relative">
                    <div 
                      id="patient-local-video" 
                      className="w-full h-full"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect for natural self-view
                      ref={(ref) => {
                        if (ref && videoState.localVideoTrack && videoState.isVideoEnabled) {
                          videoState.localVideoTrack.play(ref);
                        }
                      }}
                    />
                    {!videoState.isVideoEnabled && (
                      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <VideoOff className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    {!videoState.isAudioEnabled && (
                      <div className="absolute top-1 left-1 bg-red-500 rounded-full p-1">
                        <MicOff className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white text-center">
                      <User className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs">You</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-colors ${
                    videoState.isAudioEnabled
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {videoState.isAudioEnabled ? (
                    <Mic className="h-6 w-6" />
                  ) : (
                    <MicOff className="h-6 w-6" />
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    videoState.isVideoEnabled
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {videoState.isVideoEnabled ? (
                    <Video className="h-6 w-6" />
                  ) : (
                    <VideoOff className="h-6 w-6" />
                  )}
                </button>

                <button
                  onClick={leaveCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for your video consultation:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make sure you're in a quiet, well-lit area</li>
            <li>• Keep your camera at eye level</li>
            <li>• Have your ID and insurance card ready if needed</li>
            <li>• Prepare any questions you want to ask your doctor</li>
          </ul>
        </div>
      </div>
    </div>
  );
}