import React, { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  Camera,
  AlertCircle,
} from 'lucide-react';

export default function CallModal() {
  const {
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
    clearPermissionError,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const { isDark } = useTheme();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Attach local stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Attach remote stream to remote video and audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, callState]);

  if (permissionError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
        <div className="w-full max-w-sm rounded-3xl bg-[#0e0e14] border border-zinc-800 p-6 flex flex-col items-center text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-white mb-2">Media Permission Needed</h3>
          <p className="text-xs text-zinc-300 opacity-80 leading-relaxed mb-6">
            {permissionError}
          </p>
          <button
            onClick={clearPermissionError}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold shadow-md transition-transform active:scale-95"
          >
            Got It
          </button>
        </div>
      </div>
    );
  }

  if (callState === 'idle') return null;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. INCOMING CALL DIALOG
  if (callState === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
        <div className="w-full max-w-sm rounded-3xl bg-[#0b0b0f] border border-zinc-800 p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          {/* Animated pulse halo */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />

          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500/40 p-1 animate-pulse-ring">
              <img
                src={
                  callerInfo?.callerAvatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${callerInfo?.callerName || 'user'}`
                }
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          <h3 className="text-lg font-black text-white mb-1">{callerInfo?.callerName}</h3>
          <p className="text-xs text-emerald-400 font-semibold mb-6 flex items-center gap-1.5">
            {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-6">
            <button
              onClick={rejectCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-90"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {callType === 'video' && (
              <button
                onClick={() => acceptCall(false)}
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition-transform active:scale-90"
                title="Answer Audio Only"
              >
                <Phone className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => acceptCall(true)}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-90"
              title="Accept"
            >
              {callType === 'video' ? (
                <Video className="w-6 h-6 fill-current" />
              ) : (
                <Phone className="w-6 h-6 fill-current" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. OUTGOING CALL SCREEN
  if (callState === 'outgoing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
        <div className="w-full max-w-sm rounded-3xl bg-[#0b0b0f] border border-zinc-800 p-6 flex flex-col items-center text-center shadow-2xl">
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500/40 p-1 animate-pulse-ring">
              <img
                src={
                  remoteUser?.avatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${remoteUser?.username || 'user'}`
                }
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          <h3 className="text-lg font-black text-white mb-1">{remoteUser?.username}</h3>
          <p className="text-xs text-zinc-400 font-medium mb-8 animate-pulse">
            Calling ({callType} call)...
          </p>

          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-90"
            title="Cancel Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // 3. CONNECTED CALL SCREEN
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none animate-in fade-in">
      {/* Dedicated audio element ensuring voice is always audible */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
        {/* Remote Video or Audio Avatar */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#07070a]">
          {callType === 'video' && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 p-1.5 animate-pulse-ring">
                <img
                  src={
                    remoteUser?.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${remoteUser?.username || 'user'}`
                  }
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">{remoteUser?.username}</h3>
                <p className="text-xs text-emerald-400 font-mono mt-1">
                  Connected • {formatDuration(callDuration)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Picture-in-Picture Video */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 z-20 w-32 sm:w-44 h-48 sm:h-60 rounded-2xl overflow-hidden border-2 border-zinc-700 bg-black shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 bg-zinc-900">
                Camera off
              </div>
            )}
          </div>
        )}

        {/* TOP CALL BAR */}
        <div className="relative z-10 p-5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white">
          <div>
            <h2 className="text-base font-extrabold">{remoteUser?.username}</h2>
            <p className="text-xs text-emerald-400 font-mono font-bold">
              {formatDuration(callDuration)}
            </p>
          </div>
        </div>

        {/* BOTTOM CONTROLS BAR */}
        <div className="relative z-10 p-6 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-center gap-4">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera toggle (if video call) */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isVideoOff
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Screen share toggle */}
          {callType === 'video' && (
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isScreenSharing
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Share Screen"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}

          {/* End Call button */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-90"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
