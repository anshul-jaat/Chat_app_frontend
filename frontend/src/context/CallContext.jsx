import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { conversationService, messageService } from '../services/api.js';
import { sound } from '../utils/sound.js';

const CallContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // Call states: 'idle' | 'outgoing' | 'incoming' | 'connected'
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'video' | 'audio'
  const [callerInfo, setCallerInfo] = useState(null); // incoming caller
  const [remoteUser, setRemoteUser] = useState(null); // remote party details
  const [callDuration, setCallDuration] = useState(0);
  const [permissionError, setPermissionError] = useState(null);

  // Media streams & controls
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcRef = useRef(null);
  const durationTimerRef = useRef(null);
  const outgoingTimeoutRef = useRef(null);
  const incomingSignalRef = useRef(null);
  const remoteTargetUserIdRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);

  const callStateRef = useRef(callState);
  const callTypeRef = useRef(callType);

  const processQueuedIceCandidates = async (pc) => {
    if (!pc) return;
    while (iceCandidatesQueueRef.current.length > 0) {
      const candidate = iceCandidatesQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Error processing queued ice candidate:', err);
      }
    }
  };

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);

  // Log missed call into the conversation
  const logMissedCall = async (targetUserId, type) => {
    if (!targetUserId) return;
    try {
      const convRes = await conversationService.createOrGet(targetUserId);
      if (convRes?.data?._id) {
        await messageService.sendMessage({
          conversationId: convRes.data._id,
          content: type === 'video' ? 'Missed Video Call' : 'Missed Audio Call',
          type: 'missed_call',
        });
      }
    } catch (err) {
      console.warn('Failed to log missed call:', err.message);
    }
  };

  // Setup WebRTC PeerConnection
  const createPeerConnection = (toUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    remoteTargetUserIdRef.current = toUserId;

    pc.ontrack = (event) => {
      console.log('📡 Received remote track:', event.track?.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        setRemoteStream((prev) => {
          const stream = prev ? prev : new MediaStream();
          stream.addTrack(event.track);
          return stream;
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', {
          toUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state change:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
        setCallState('connected');
        sound.stopRingtone();
        startDurationTimer();
      } else if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        cleanupCall();
      }
    };

    return pc;
  };

  const startDurationTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Socket signaling listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Incoming call from:', data);
      incomingSignalRef.current = data.signal;
      remoteTargetUserIdRef.current = data.fromUserId;
      setCallerInfo(data);
      setCallType(data.type || 'video');
      setRemoteUser({
        userId: data.fromUserId,
        username: data.callerName,
        avatar: data.callerAvatar,
      });
      setCallState('incoming');
      sound.startRingtone();
    };

    const handleCallAnswered = async (data) => {
      console.log('✅ Call answered by remote peer');
      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
      sound.stopRingtone();
      if (pcRef.current && data.signal) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.signal));
          await processQueuedIceCandidates(pcRef.current);
          setCallState('connected');
          startDurationTimer();
        } catch (err) {
          console.error('Error setting remote description on callAnswered:', err);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      if (!data?.candidate) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding received ice candidate:', err);
        }
      } else {
        iceCandidatesQueueRef.current.push(data.candidate);
      }
    };

    const handleCallRejected = () => {
      console.log('❌ Call rejected by remote peer');
      sound.stopRingtone();
      sound.playEndCallSound();
      if (callStateRef.current === 'outgoing') {
        logMissedCall(remoteTargetUserIdRef.current, callTypeRef.current);
      }
      cleanupCall();
    };

    const handleCallEnded = () => {
      console.log('⏹️ Call ended by remote peer');
      sound.stopRingtone();
      sound.playEndCallSound();
      if (callStateRef.current === 'incoming') {
        logMissedCall(remoteTargetUserIdRef.current, callTypeRef.current);
      }
      cleanupCall();
    };

    socket.on('incomingCall', handleIncomingCall);
    socket.on('callAnswered', handleCallAnswered);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callRejected', handleCallRejected);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callAnswered', handleCallAnswered);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callRejected', handleCallRejected);
      socket.off('callEnded', handleCallEnded);
    };
  }, [socket]);

  // Clean up all call resources
  const cleanupCall = () => {
    sound.stopRingtone();
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setRemoteStream(null);
    setCallState('idle');
    setCallerInfo(null);
    setRemoteUser(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    incomingSignalRef.current = null;
    remoteTargetUserIdRef.current = null;
    iceCandidatesQueueRef.current = [];
  };

  // Initiate outgoing call
  const startCall = async ({ targetUserId, targetUsername, targetAvatar, type = 'video' }) => {
    if (callState !== 'idle') return;
    setPermissionError(null);

    let stream = null;
    let actualType = type;

    try {
      // 1. Request microphone/camera permissions
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true,
        });
      } catch (mediaErr) {
        if (type === 'video') {
          // If webcam unavailable or video permission dismissed, try audio-only fallback
          try {
            console.warn('Video failed, attempting audio fallback...');
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            actualType = 'audio';
          } catch (audioErr) {
            throw mediaErr;
          }
        } else {
          throw mediaErr;
        }
      }

      setLocalStream(stream);
      setCallType(actualType);
      setRemoteUser({ userId: targetUserId, username: targetUsername, avatar: targetAvatar });
      remoteTargetUserIdRef.current = targetUserId;
      setCallState('outgoing');
      sound.startRingtone();

      const pc = createPeerConnection(targetUserId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('callUser', {
        toUserId: targetUserId,
        signal: offer,
        type: actualType,
      });

      // Timeout after 35 seconds of no answer -> auto cancel and log missed call
      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === 'outgoing') {
          console.log('⏰ Call timed out - logging missed call');
          logMissedCall(targetUserId, actualType);
          endCall();
        }
      }, 35000);

    } catch (err) {
      console.warn('Failed to start call:', err.name, err.message);
      cleanupCall();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (err.name === 'NotAllowedError') {
        setPermissionError(
          'Microphone / Camera access was dismissed or blocked. Please click the camera/lock icon in your browser address bar to allow permissions.'
        );
      } else if (err.name === 'NotFoundError') {
        setPermissionError('No microphone or camera device found on your computer.');
      } else {
        setPermissionError('Could not start call. Please verify your device media permissions.');
      }
    }
  };

  // Accept incoming call
  const acceptCall = async (withVideo = true) => {
    if (callState !== 'incoming') return;
    sound.stopRingtone();
    setPermissionError(null);

    let actualType = withVideo && callType === 'video' ? 'video' : 'audio';
    let stream = null;

    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: actualType === 'video',
          audio: true,
        });
      } catch (mediaErr) {
        if (actualType === 'video') {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          actualType = 'audio';
        } else {
          throw mediaErr;
        }
      }

      setLocalStream(stream);
      setCallType(actualType);

      const pc = createPeerConnection(remoteTargetUserIdRef.current);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (incomingSignalRef.current) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingSignalRef.current));
        await processQueuedIceCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answerCall', {
          toUserId: remoteTargetUserIdRef.current,
          signal: answer,
        });

        setCallState('connected');
        startDurationTimer();
      }
    } catch (err) {
      console.warn('Failed to accept call:', err);
      cleanupCall();
      setPermissionError('Could not access microphone or camera to answer call.');
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (remoteTargetUserIdRef.current) {
      logMissedCall(remoteTargetUserIdRef.current, callType);
      if (socket) {
        socket.emit('rejectCall', { toUserId: remoteTargetUserIdRef.current });
      }
    }
    sound.stopRingtone();
    cleanupCall();
  };

  // End active call
  const endCall = () => {
    if (callState === 'outgoing' && remoteTargetUserIdRef.current) {
      logMissedCall(remoteTargetUserIdRef.current, callType);
    }
    if (remoteTargetUserIdRef.current && socket) {
      socket.emit('endCall', { toUserId: remoteTargetUserIdRef.current });
    }
    sound.playEndCallSound();
    cleanupCall();
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          revertToCamera();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    } else {
      revertToCamera();
    }
  };

  const revertToCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (pcRef.current && videoTrack) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }
    }
    setIsScreenSharing(false);
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        callerInfo,
        remoteUser,
        callDuration,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        isScreenSharing,
        permissionError,
        clearPermissionError: () => setPermissionError(null),
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};
