import { useState, useRef, useEffect, useCallback } from 'react';
import { socket, reconnectSocket } from '../utils/socket';
import SimplePeer from 'simple-peer';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-toastify';
import { getAuthToken } from '../utils/auth';

// STUN servers for WebRTC
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

export const useCall = () => {
  const [callState, setCallState] = useState(null); // null, 'initiating', 'ringing', 'active', 'ended'
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteIsMuted, setRemoteIsMuted] = useState(false); // Remote mute status
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true); // Remote video status
  const [callDuration, setCallDuration] = useState(0);
  const [activeCall, setActiveCall] = useState(null); // { callId, appointmentId, receiverId, callType }
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null); // For audio calls
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const pendingOfferRef = useRef(null); // Store offer if received before peer is created

  // Handle WebRTC offer
  const handleWebRTCOffer = useCallback(({ callId, offer }) => {
    // If peer doesn't exist yet (receiver), store the offer
    if (!peerRef.current) {
      // Only store if it matches incoming call
      if (incomingCall?.callId === callId || activeCall?.callId === callId) {
        pendingOfferRef.current = { callId, offer };
      }
      return;
    }
    
    if (activeCall?.callId !== callId) return;
    
    try {
      peerRef.current.signal(offer);
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  }, [activeCall, incomingCall]);

  // Handle WebRTC answer
  const handleWebRTCAnswer = useCallback(({ callId, answer }) => {
    if (!peerRef.current || activeCall?.callId !== callId) return;
    
    try {
      peerRef.current.signal(answer);
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  }, [activeCall]);

  // Handle ICE candidate
  const handleICECandidate = useCallback(({ callId, candidate }) => {
    if (!peerRef.current || activeCall?.callId !== callId) return;
    
    try {
      if (candidate) {
        peerRef.current.signal(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, [activeCall]);

  // Handle remote mute/video status updates
  const handleRemoteStatusUpdate = useCallback(({ callId, isMuted: remoteMuted, isVideoEnabled: remoteVideo }) => {
    if (activeCall?.callId === callId) {
      setRemoteIsMuted(remoteMuted);
      setRemoteVideoEnabled(remoteVideo);
    }
  }, [activeCall]);

  // Start call timer with optional synchronized start time
  const startCallTimer = useCallback((synchronizedStartTime = null) => {
    // Stop any existing timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    // Use synchronized start time if provided, otherwise use current time
    if (synchronizedStartTime) {
      // Calculate elapsed time since server start time to account for network latency
      const serverStartTimestamp = synchronizedStartTime.getTime();
      const currentTimestamp = Date.now();
      const elapsedSeconds = Math.floor((currentTimestamp - serverStartTimestamp) / 1000);
      
      // Set the start time to (current time - elapsed seconds) to sync with server
      // This ensures both sides show the same time accounting for network delay
      callStartTimeRef.current = currentTimestamp - (elapsedSeconds * 1000);
      
      // Set initial duration immediately
      setCallDuration(Math.max(0, elapsedSeconds));
    } else {
      callStartTimeRef.current = Date.now();
      setCallDuration(0);
    }
    
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  }, []);

  // Listen for incoming calls and WebRTC events
  useEffect(() => {
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
    };
    
    const handleCallAccepted = (data) => {
      // Use synchronized start time from server if provided
      const synchronizedStartTime = data.startTime ? new Date(data.startTime) : new Date();
      
      // For receiver (incoming call) - state already set in acceptCall
      if (incomingCall && incomingCall.callId === data.callId) {
        if (callState !== 'active') {
          setCallState('active');
          startCallTimer(synchronizedStartTime);
        }
      } 
      // For caller (outgoing call)
      else if (activeCall && activeCall.callId === data.callId) {
        setCallState('active');
        startCallTimer(synchronizedStartTime);
        console.log('[Call] Call accepted, connection should be established');
      }
    };
    
    const handleCallRejected = (data) => {
      if (activeCall && activeCall.callId === data.callId) {
        endCall();
        toast.info('Call was rejected');
      }
    };

    const handleCallEnded = (data) => {
      if ((activeCall && activeCall.callId === data.callId) || 
          (incomingCall && incomingCall.callId === data.callId)) {
        endCall();
      }
    };

    const handleCallMissed = (data) => {
      if (activeCall && activeCall.callId === data.callId) {
        endCall();
        toast.info('Call was missed');
      }
    };

    const handleCallCancelled = (data) => {
      // When caller cancels, receiver should close incoming call modal
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
        // Don't call endCall here to avoid double cleanup, just clear incoming call state
        setCallState(null);
        setActiveCall(null);
        toast.info('Call was cancelled');
      }
      // When caller cancels, caller should close ringing screen
      if (activeCall && activeCall.callId === data.callId && 
          (callState === 'ringing' || callState === 'initiating')) {
        // endCall was already called, just ensure state is cleared
        setCallState(null);
        setActiveCall(null);
        toast.info('Call cancelled');
      }
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-missed', handleCallMissed);
    socket.on('call-cancelled', handleCallCancelled);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('ice-candidate', handleICECandidate);
    socket.on('remote-status-update', handleRemoteStatusUpdate);
    socket.on('call-error', (error) => {
      console.error('Call error:', error);
      toast.error(error.message || 'Call error occurred');
      endCall();
    });

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-missed', handleCallMissed);
      socket.off('call-cancelled', handleCallCancelled);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('ice-candidate', handleICECandidate);
      socket.off('remote-status-update', handleRemoteStatusUpdate);
      socket.off('call-error');
    };
  }, [incomingCall, activeCall, callState, handleWebRTCOffer, handleWebRTCAnswer, handleICECandidate, handleRemoteStatusUpdate, startCallTimer]);

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !currentCameraId) {
        setCurrentCameraId(videoDevices[0].deviceId);
      }
      return videoDevices;
    } catch (error) {
      console.error('Error enumerating cameras:', error);
      return [];
    }
  }, [currentCameraId]);

  // Switch camera
  const switchCamera = useCallback(async (deviceId) => {
    if (!localStream || !activeCall || activeCall.callType !== 'video') {
      return;
    }

    try {
      // Get new stream with selected camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { deviceId: { exact: deviceId } }
      });

      // Replace video track in peer connection
      const videoTrack = newStream.getVideoTracks()[0];
      const sender = peerRef.current?._pc?.getSenders()?.find(s => 
        s.track && s.track.kind === 'video'
      );

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      // Update local stream
      const oldVideoTrack = localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }
      localStream.removeTrack(oldVideoTrack);
      localStream.addTrack(videoTrack);

      // Update video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      setCurrentCameraId(deviceId);
      toast.success('Camera switched');
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Failed to switch camera');
    }
  }, [localStream, activeCall]);

  // Initialize call
  const initiateCall = async (appointmentId, receiverId, callType) => {
    try {
      // Check if socket is connected
      if (!socket || !socket.connected) {
        const token = getAuthToken();
        if (!token) {
          toast.error('Please sign in to make calls.');
          return;
        }
        
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const currentTime = Date.now() / 1000;
            if (payload.exp && payload.exp < currentTime) {
              toast.error('Your session has expired. Please sign in again.');
              localStorage.removeItem('accessToken');
              document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=None; Secure';
              window.location.href = '/sign-in?error=session_expired';
              return;
            }
          }
        } catch (e) {
          console.warn('Token validation failed:', e);
        }
        
        reconnectSocket();
        toast.info('Reconnecting to server...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!socket || !socket.connected) {
          toast.error('Failed to connect to server. Please refresh the page or sign in again.');
          return;
        }
      }

      setCallState('initiating');
      
      // Enumerate cameras for video calls
      if (callType === 'video') {
        await enumerateCameras();
      }
      
      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video' ? (currentCameraId ? { deviceId: { exact: currentCameraId } } : true) : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Wait for call ID from server before creating peer connection
      const handleCallInitiated = ({ callId, status }) => {
        if (status === 'ringing') {
          setActiveCall({ callId, appointmentId, receiverId, callType });
          setCallState('ringing');
          
          // Create peer connection AFTER we have the callId
          const peer = new SimplePeer({
            initiator: true,
            trickle: true,
            stream: stream,
            config: {
              iceServers: STUN_SERVERS
            }
          });
          
          peer.on('signal', (data) => {
            if (data.type === 'offer') {
              socket.emit('webrtc-offer', {
                callId: callId,
                offer: data
              });
            } else if (data.type === 'candidate') {
              socket.emit('ice-candidate', {
                callId: callId,
                candidate: data
              });
            }
          });
          
          peer.on('stream', (remoteStream) => {
            console.log('[Call] Received remote stream', remoteStream);
            setRemoteStream(remoteStream);
            
            // Attach to video element for video calls
            if (callType === 'video' && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              // Ensure video plays
              setTimeout(() => {
                remoteVideoRef.current?.play().catch(err => {
                  console.error('Error playing remote video:', err);
                });
              }, 100);
            }
            
            // Attach to audio element for audio calls
            if (callType === 'audio' && remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              // Ensure audio plays - use setTimeout to ensure element is ready
              setTimeout(() => {
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.play().catch(err => {
                    console.error('Error playing remote audio:', err);
                    // Try again after a short delay
                    setTimeout(() => {
                      remoteAudioRef.current?.play().catch(e => {
                        console.error('Retry failed:', e);
                      });
                    }, 500);
                  });
                }
              }, 100);
            }
          });

          peer.on('connect', () => {
            console.log('[Call] Peer connection established');
          });

          peer.on('error', (err) => {
            console.error('Peer connection error:', err);
            toast.error('Connection error occurred');
            endCall();
          });
          
          peerRef.current = peer;
          socket.off('call-initiated', handleCallInitiated);
        }
      };

      socket.once('call-initiated', handleCallInitiated);
      
      // Emit call initiation
      socket.emit('call-initiate', {
        appointmentId,
        receiverId,
        callType
      });
      
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallState(null);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Microphone/camera permission denied. Please allow access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No microphone/camera found. Please connect a device.');
      } else {
        toast.error('Failed to access microphone/camera. Please check permissions.');
      }
      throw error;
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;
    
    try {
      // Enumerate cameras for video calls
      if (incomingCall.callType === 'video') {
        await enumerateCameras();
      }
      
      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video' ? (currentCameraId ? { deviceId: { exact: currentCameraId } } : true) : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection as receiver (non-initiator)
      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream: stream,
        config: {
          iceServers: STUN_SERVERS
        }
      });
      
      peer.on('signal', (data) => {
        if (data.type === 'answer') {
          socket.emit('webrtc-answer', {
            callId: incomingCall.callId,
            answer: data
          });
        } else if (data.type === 'candidate') {
          socket.emit('ice-candidate', {
            callId: incomingCall.callId,
            candidate: data
          });
        }
      });
      
      peer.on('stream', (remoteStream) => {
        console.log('[Call] Received remote stream', remoteStream);
        setRemoteStream(remoteStream);
        
        // Attach to video element for video calls
        if (incomingCall.callType === 'video' && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          // Ensure video plays
          setTimeout(() => {
            remoteVideoRef.current?.play().catch(err => {
              console.error('Error playing remote video:', err);
            });
          }, 100);
        }
        
        // Attach to audio element for audio calls
        if (incomingCall.callType === 'audio' && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          // Ensure audio plays - use setTimeout to ensure element is ready
          setTimeout(() => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(err => {
                console.error('Error playing remote audio:', err);
                // Try again after a short delay
                setTimeout(() => {
                  remoteAudioRef.current?.play().catch(e => {
                    console.error('Retry failed:', e);
                  });
                }, 500);
              });
            }
          }, 100);
        }
      });

      peer.on('connect', () => {
        console.log('[Call] Peer connection established');
      });

      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast.error('Connection error occurred');
        endCall();
      });
      
      peerRef.current = peer;
      
      // If we have a pending offer, signal it now
      if (pendingOfferRef.current && pendingOfferRef.current.callId === incomingCall.callId) {
        peer.signal(pendingOfferRef.current.offer);
        pendingOfferRef.current = null;
      }
      
      setActiveCall({
        callId: incomingCall.callId,
        appointmentId: incomingCall.appointmentId,
        receiverId: incomingCall.callerId,
        callType: incomingCall.callType
      });
      
      // Emit call accept AFTER peer is created
      socket.emit('call-accept', { callId: incomingCall.callId });
      
      setCallState('active');
      setIncomingCall(null);
      // Timer will be started by handleCallAccepted with synchronized time from server
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to access microphone/camera. Please check permissions.');
      rejectCall();
    }
  };

  // Reject call
  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('call-reject', { callId: incomingCall.callId });
      setIncomingCall(null);
    }
    endCall();
  };

  // End call
  const endCall = async () => {
    // Cancel call first if still initiating/ringing (before clearing state)
    if (activeCall?.callId && (callState === 'initiating' || callState === 'ringing')) {
      socket.emit('call-cancel', { callId: activeCall.callId });
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Stop remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    // Clear remote audio/video refs
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    
    // Destroy peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Stop timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    // Notify backend if call was active (not just ringing)
    if (activeCall?.callId && callState === 'active') {
      try {
        await fetch(`${API_BASE_URL}/api/calls/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ callId: activeCall.callId })
        });
      } catch (error) {
        console.error('Error ending call on server:', error);
      }
    }
    
    // Clear all call state
    setCallState(null);
    setCallDuration(0);
    callStartTimeRef.current = null;
    setActiveCall(null);
    setIncomingCall(null); // Clear incoming call if present (for receiver side)
    pendingOfferRef.current = null;
    setRemoteIsMuted(false);
    setRemoteVideoEnabled(true);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const newMutedState = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = newMutedState;
      });
      setIsMuted(newMutedState);
      
      // Notify remote peer
      if (activeCall?.callId) {
        socket.emit('call-status-update', {
          callId: activeCall.callId,
          isMuted: newMutedState,
          isVideoEnabled: isVideoEnabled
        });
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const newVideoState = !isVideoEnabled;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = newVideoState;
      });
      setIsVideoEnabled(newVideoState);
      
      // Notify remote peer
      if (activeCall?.callId) {
        socket.emit('call-status-update', {
          callId: activeCall.callId,
          isMuted: isMuted,
          isVideoEnabled: newVideoState
        });
      }
    }
  };

  return {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    remoteIsMuted,
    remoteVideoEnabled,
    callDuration,
    activeCall,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    availableCameras,
    currentCameraId,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    enumerateCameras
  };
};

export default useCall;
