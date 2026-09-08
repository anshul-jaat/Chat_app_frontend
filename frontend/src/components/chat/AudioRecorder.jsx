import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Send, Mic, Square } from 'lucide-react';

export default function AudioRecorder({ onSendAudio, onCancel }) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startRecording();

    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        if (onSendAudio && audioChunksRef.current.length > 0) {
          onSendAudio(audioFile, recordingTime);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Could not access microphone.');
      if (onCancel) onCancel();
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleDiscard = () => {
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    if (onCancel) onCancel();
  };

  const handleStopAndSend = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-rose-950/20 border border-rose-500/40 rounded-2xl animate-in fade-in">
      {/* Left: Pulse Indicator and Duration */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
          <div className="w-3 h-3 bg-rose-500 rounded-full absolute" />
        </div>
        <span className="text-xs font-mono font-bold text-rose-400">
          {formatTime(recordingTime)}
        </span>

        {/* Live animated waveforms */}
        <div className="flex items-center gap-0.5 h-5 ml-2">
          {[12, 20, 15, 24, 10, 18, 22, 14, 26, 16].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-rose-400/80 rounded-full waveform-bar"
              style={{ animationDelay: `${i * 0.1}s`, height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {/* Right Controls: Discard and Send */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDiscard}
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Discard"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleStopAndSend}
          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-transform active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </div>
    </div>
  );
}
