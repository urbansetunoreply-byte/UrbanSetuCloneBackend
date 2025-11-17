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
  const animationFrameRef = useRef(null);
  const lastSecondRef = useRef(null);
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

  // Attach remote stream to video/audio elements when stream or call type changes
  useEffect(() => {
    if (!remoteStream || !activeCall) {
      // Clean up when stream or call ends
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      return;
    }

    console.log('[Call] Remote stream received:', {
      stream: remoteStream,
      tracks: remoteStream.getTracks(),
      videoTracks: remoteStream.getVideoTracks(),
      audioTracks: remoteStream.getAudioTracks(),
      callType: activeCall.callType
    });

    // For video calls - attach to video element (video element handles both video and audio)
    if (activeCall.callType === 'video' && remoteVideoRef.current) {
      console.log('[Call] Attaching remote video stream to video element');
      // Clear previous stream
      if (remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.muted = false; // Ensure audio is not muted
      // Ensure video plays
      const playVideo = async () => {
        try {
          await remoteVideoRef.current.play();
          console.log('[Call] Remote video playing successfully');
        } catch (err) {
          console.error('Error playing remote video:', err);
          // Retry after a short delay
          setTimeout(() => {
            remoteVideoRef.current?.play().catch(e => {
              console.error('Retry failed:', e);
            });
          }, 500);
        }
      };
      playVideo();
    }

    // For audio calls - attach to audio element
    if (activeCall.callType === 'audio' && remoteAudioRef.current) {
      console.log('[Call] Attaching remote audio stream to audio element');
      // Clear previous stream
      if (remoteAudioRef.current.srcObject) {
        remoteAudioRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false; // Ensure audio is not muted
      // Ensure audio plays automatically
      const playAudio = async () => {
        try {
          await remoteAudioRef.current.play();
          console.log('[Call] Remote audio playing successfully');
        } catch (err) {
          console.error('Error playing remote audio:', err);
          // Retry after a short delay
          setTimeout(() => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(e => {
                console.error('Retry failed:', e);
              });
            }
          }, 500);
        }
      };
      playAudio();
    }

    // Cleanup function
    return () => {
      if (!activeCall && remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [remoteStream, activeCall]);

  // Start call timer with server-synchronized start time
  // CRITICAL: This function MUST be called with server's startTime to ensure both sides are synchronized
  const startCallTimer = useCallback((synchronizedStartTime) => {
    if (!synchronizedStartTime) {
      console.error('[Call Timer] ERROR: Cannot start timer without server startTime!');
      return;
    }

    // Stop any existing timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Use the exact server start time as the reference point
    // Both sides will use this same timestamp, ensuring perfect synchronization
    const serverStartTimestamp = synchronizedStartTime.getTime();
    callStartTimeRef.current = serverStartTimestamp;
    lastSecondRef.current = null;
    
    // Calculate initial elapsed time to display immediately (accounts for network latency)
    // This ensures the timer shows the correct duration even if there was a delay
    // between server accepting the call and frontend receiving the event
    const currentTimestamp = Date.now();
    const elapsedMilliseconds = currentTimestamp - serverStartTimestamp;
    const initialDuration = Math.max(0, Math.floor(elapsedMilliseconds / 1000));
    
    // Set initial duration immediately to account for network latency
    // This ensures both sides show the same time even if they received the event at different times
    setCallDuration(initialDuration);
    lastSecondRef.current = initialDuration;
    
    console.log('[Call Timer] Started with synchronized server time:', {
      serverStartTime: new Date(serverStartTimestamp).toISOString(),
      serverTimestamp: serverStartTimestamp,
      currentTime: new Date(currentTimestamp).toISOString(),
      currentTimestamp: currentTimestamp,
      elapsedMs: elapsedMilliseconds,
      initialDurationSeconds: initialDuration
    });
    
    // Use requestAnimationFrame for smooth, precise updates
    // Calculate duration from server timestamp each frame, ensuring no drift
    const updateTimer = () => {
      if (!callStartTimeRef.current) {
        return;
      }
      
      // Always calculate from server's startTime - this ensures perfect synchronization
      // Even if intervals drift, both sides calculate from the same reference point
      const now = Date.now();
      // Use Math.max(0, ...) to prevent negative durations due to clock skew
      // If server time is slightly ahead of client time, ensure duration starts at 0
      const duration = Math.max(0, Math.floor((now - callStartTimeRef.current) / 1000));
      
      // Only update state when the second changes to avoid unnecessary re-renders
      if (duration !== lastSecondRef.current) {
        lastSecondRef.current = duration;
        setCallDuration(duration);
      }
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };
    
    // Start the animation frame loop immediately for instant updates
    // This ensures the timer starts ticking right away, not waiting for the first frame
    animationFrameRef.current = requestAnimationFrame(updateTimer);
    
    // Also use interval as backup for reliability, but start immediately with a small delay
    // This ensures the timer ticks immediately rather than waiting up to 1000ms
    const immediateUpdate = () => {
      if (callStartTimeRef.current) {
        const now = Date.now();
        const duration = Math.max(0, Math.floor((now - callStartTimeRef.current) / 1000));
        if (duration !== lastSecondRef.current) {
          lastSecondRef.current = duration;
          setCallDuration(duration);
        }
      }
    };
    
    // Trigger immediate update to ensure timer starts ticking right away
    immediateUpdate();
    
    // Then set up interval for regular updates (every 1000ms)
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        // Always calculate from server's startTime, not local time
        // This double-check ensures accuracy even if animation frame is delayed
        // Use Math.max(0, ...) to prevent negative durations due to clock skew
        const duration = Math.max(0, Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        if (duration !== lastSecondRef.current) {
          lastSecondRef.current = duration;
          setCallDuration(duration);
        }
      }
    }, 1000);
  }, []);

  // Listen for incoming calls and WebRTC events
  useEffect(() => {
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
    };
    
    const handleCallAccepted = (data) => {
      // Server provides the exact timestamp when call was accepted on the server
      // Both caller and receiver receive this same timestamp, ensuring perfect synchronization
      // startTime is sent as milliseconds (number) from server, convert to Date object
      const synchronizedStartTime = data.startTime ? new Date(data.startTime) : null;
      
      if (!synchronizedStartTime || !data.startTime) {
        console.error('[Call] CRITICAL: No synchronized startTime received from server! Cannot start timer.');
        toast.error('Call timer synchronization error. Please refresh.');
        return;
      }
      
      // For receiver (incoming call) - state already set in acceptCall, but timer MUST start with server time
      if (incomingCall && incomingCall.callId === data.callId) {
        // Always start/restart timer with server's synchronized time
        // This ensures timer starts at the exact same moment as on server, accounting for network latency
        if (callState !== 'active') {
          setCallState('active');
        }
        // CRITICAL: Only start timer with server's startTime - never use local time
        startCallTimer(synchronizedStartTime);
        console.log('[Call] Receiver: Call accepted, timer synchronized with server time:', {
          serverStartTime: synchronizedStartTime.toISOString(),
          serverTimestamp: data.startTime
        });
      } 
      // For caller (outgoing call)
      else if (activeCall && activeCall.callId === data.callId) {
        setCallState('active');
        // CRITICAL: Only start timer with server's startTime - never use local time
        startCallTimer(synchronizedStartTime);
        console.log('[Call] Caller: Call accepted, timer synchronized with server time:', {
          serverStartTime: synchronizedStartTime.toISOString(),
          serverTimestamp: data.startTime
        });
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
  }, [handleWebRTCOffer, handleWebRTCAnswer, handleICECandidate, handleRemoteStatusUpdate, startCallTimer]);

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
            console.log('[Call] Received remote stream (caller side)', remoteStream);
            console.log('[Call] Remote stream tracks:', remoteStream.getTracks());
            setRemoteStream(remoteStream);
            // Stream attachment will be handled by useEffect when remoteStream state updates
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
        console.log('[Call] Received remote stream (receiver side)', remoteStream);
        console.log('[Call] Remote stream tracks:', remoteStream.getTracks());
        setRemoteStream(remoteStream);
        // Stream attachment will be handled by useEffect when remoteStream state updates
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
    
    // Stop all timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    callStartTimeRef.current = null;
    lastSecondRef.current = null;
    
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
      // When muted, track.enabled should be false (disabled)
      // When unmuted, track.enabled should be true (enabled)
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState; // Opposite: muted = disabled, unmuted = enabled
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
