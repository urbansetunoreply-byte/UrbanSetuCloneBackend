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
  const [callDuration, setCallDuration] = useState(0);
  const [activeCall, setActiveCall] = useState(null); // { callId, appointmentId, receiverId, callType }
  
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Handle WebRTC offer
  const handleWebRTCOffer = useCallback(({ callId, offer }) => {
    if (!peerRef.current || activeCall?.callId !== callId) return;
    
    try {
      peerRef.current.signal(offer);
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  }, [activeCall]);

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
      peerRef.current.signal(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, [activeCall]);

  // Listen for incoming calls and WebRTC events
  useEffect(() => {
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      // Play notification sound if available
      if (typeof window !== 'undefined' && window.Audio) {
        // You can add a notification sound here
      }
    };
    
    const handleCallAccepted = (data) => {
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
        setCallState('active');
        startCallTimer();
      } else if (activeCall && activeCall.callId === data.callId) {
        setCallState('active');
        startCallTimer();
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

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-missed', handleCallMissed);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('ice-candidate', handleICECandidate);
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
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('ice-candidate', handleICECandidate);
      socket.off('call-error');
    };
  }, [incomingCall, activeCall, handleWebRTCOffer, handleWebRTCAnswer, handleICECandidate]);

  // Initialize call
  const initiateCall = async (appointmentId, receiverId, callType) => {
    try {
      // Check if socket is connected
      if (!socket || !socket.connected) {
        // Try to reconnect
        const token = getAuthToken();
        if (!token) {
          toast.error('Please sign in to make calls.');
          return;
        }
        reconnectSocket();
        toast.info('Reconnecting to server...');
        // Wait a bit for reconnection
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!socket || !socket.connected) {
          toast.error('Failed to connect to server. Please refresh the page.');
          return;
        }
      }

      setCallState('initiating');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: STUN_SERVERS
        }
      });
      
      peer.on('signal', (data) => {
        if (activeCall?.callId) {
          socket.emit('webrtc-offer', {
            callId: activeCall.callId,
            offer: data
          });
        }
      });
      
      peer.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast.error('Connection error occurred');
        endCall();
      });
      
      peerRef.current = peer;
      
      // Wait for call ID from server before setting up peer signaling
      const handleCallInitiated = ({ callId, status }) => {
        if (status === 'ringing') {
          setActiveCall({ callId, appointmentId, receiverId, callType });
          setCallState('ringing');
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.callType === 'video'
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      const peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
          iceServers: STUN_SERVERS
        }
      });
      
      peer.on('signal', (data) => {
        socket.emit('webrtc-answer', {
          callId: incomingCall.callId,
          answer: data
        });
      });
      
      peer.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast.error('Connection error occurred');
        endCall();
      });
      
      peerRef.current = peer;
      
      socket.emit('call-accept', { callId: incomingCall.callId });
      
      setActiveCall({
        callId: incomingCall.callId,
        appointmentId: incomingCall.appointmentId,
        receiverId: incomingCall.callerId,
        callType: incomingCall.callType
      });
      setCallState('active');
      setIncomingCall(null);
      startCallTimer();
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
    
    // Notify backend if call was active
    if (activeCall?.callId) {
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

    // Cancel call if still initiating/ringing
    if (activeCall?.callId && (callState === 'initiating' || callState === 'ringing')) {
      socket.emit('call-cancel', { callId: activeCall.callId });
    }
    
    setCallState(null);
    setCallDuration(0);
    callStartTimeRef.current = null;
    setActiveCall(null);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Start call timer
  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  return {
    callState,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    callDuration,
    activeCall,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  };
};

export default useCall;

