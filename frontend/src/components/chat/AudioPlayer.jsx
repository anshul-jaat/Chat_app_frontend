import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

export default function AudioPlayer({ src, isMe = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate mock audio waveform bars
  const bars = [14, 22, 18, 28, 12, 24, 30, 16, 20, 26, 15, 24, 18, 10, 25, 20];

  return (
    <div className="flex items-center gap-2.5 min-w-[210px] max-w-[280px] select-none py-1">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
          isMe
            ? 'bg-black text-white hover:bg-zinc-900'
            : 'bg-emerald-500 text-black hover:bg-emerald-400'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Slider */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-0.5 h-6">
          {bars.map((height, idx) => {
            const barProgress = (idx / bars.length) * (duration || 1);
            const isFilled = currentTime >= barProgress;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-colors ${
                  isFilled
                    ? isMe
                      ? 'bg-black'
                      : 'bg-emerald-400'
                    : isMe
                    ? 'bg-black/30'
                    : 'bg-zinc-600/50'
                }`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-transparent cursor-pointer appearance-none opacity-0 absolute"
        />

        <div className="flex justify-between items-center text-[10px] font-mono opacity-80">
          <span>{formatTime(currentTime || duration)}</span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1 rounded text-[9px] font-bold border transition-colors ${
              isMe ? 'border-black/30 text-black' : 'border-zinc-500 text-zinc-300'
            }`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
