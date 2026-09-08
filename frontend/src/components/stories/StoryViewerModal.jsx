import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { storyService } from '../../services/api.js';
import {
  X,
  Eye,
  Trash2,
  Send,
} from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '😮', '😢'];

export default function StoryViewerModal({
  isOpen,
  onClose,
  storyGroup,
  onReplyToStory,
  onStoryDeleted,
}) {
  const { user } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);
  const [viewersData, setViewersData] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [replyText, setReplyText] = useState('');

  const stories = storyGroup?.stories || [];
  const author = storyGroup?.user;
  const isOwnStory = author?._id?.toString() === user?._id?.toString();
  const currentStory = stories[currentIndex];

  const timerRef = useRef(null);

  // Reset index when story group changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    setShowViewersDrawer(false);
  }, [storyGroup]);

  // Mark story as viewed
  useEffect(() => {
    if (isOpen && currentStory && !isOwnStory) {
      storyService.viewStory(currentStory._id).catch(() => {});
    }
  }, [isOpen, currentIndex, currentStory?._id]);

  // 5-second auto-progression loop
  useEffect(() => {
    if (!isOpen || isPaused || !currentStory || showViewersDrawer) return;

    const interval = 50; // update progress every 50ms
    const totalDuration = 5000; // 5 seconds per story
    const step = (interval / totalDuration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, currentIndex, currentStory, showViewersDrawer]);

  const handleNext = () => {
    setProgress(0);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleReact = async (emoji) => {
    if (!currentStory) return;

    // Trigger local floating animation
    const id = Date.now() + Math.random();
    setFloatingEmojis((prev) => [...prev, { id, emoji, left: Math.random() * 60 + 20 }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1500);

    try {
      await storyService.reactToStory(currentStory._id, emoji);
    } catch (err) {
      console.warn('Failed to send reaction:', err);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    if (onReplyToStory) {
      onReplyToStory({
        recipientId: author._id,
        content: `Replied to status: "${replyText.trim()}"`,
      });
    }
    setReplyText('');
    onClose();
  };

  const handleOpenViewers = async () => {
    if (!currentStory || !isOwnStory) return;
    setIsPaused(true);
    setShowViewersDrawer(true);
    try {
      setLoadingViewers(true);
      const res = await storyService.getViewers(currentStory._id);
      setViewersData(res.data?.viewers || []);
    } catch (err) {
      console.warn('Failed to load viewers:', err);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory || !isOwnStory) return;
    if (confirm('Delete this status?')) {
      try {
        await storyService.deleteStory(currentStory._id);
        if (onStoryDeleted) onStoryDeleted();
        onClose();
      } catch (err) {
        alert('Failed to delete story');
      }
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none animate-in fade-in">
      {/* Story Container */}
      <div
        className="relative w-full max-w-sm h-[85vh] max-h-[750px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-zinc-800/80"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Background Content */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
          {currentStory.type === 'text' ? (
            <div
              className="w-full h-full flex items-center justify-center p-8 text-center"
              style={{ background: currentStory.backgroundColor || '#000000' }}
            >
              <p
                className="text-xl md:text-2xl font-black break-words leading-relaxed text-white drop-shadow-md"
                style={{ color: currentStory.textColor || '#FFFFFF' }}
              >
                {currentStory.caption}
              </p>
            </div>
          ) : currentStory.type === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}

          {/* Optional Caption for Media */}
          {currentStory.caption && currentStory.type !== 'text' && (
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-center text-sm font-semibold">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Floating Emojis Burst */}
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-24 pointer-events-none text-4xl animate-float-reaction z-30"
            style={{ left: `${item.left}%` }}
          >
            {item.emoji}
          </div>
        ))}

        {/* TOP OVERLAY: Progress bars & Author Header */}
        <div className="relative z-20 p-3 pt-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Segmented Progress Bars */}
          <div className="flex gap-1.5 mb-2.5">
            {stories.map((s, idx) => {
              let fillPercent = 0;
              if (idx < currentIndex) fillPercent = 100;
              else if (idx === currentIndex) fillPercent = progress;

              return (
                <div
                  key={s._id || idx}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all ease-linear"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  author?.avatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${author?.username}`
                }
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-white/40"
              />
              <div>
                <p className="text-xs font-black text-white flex items-center gap-1.5">
                  {author?.username}
                  {isOwnStory && (
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                      You
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-zinc-300 opacity-80">
                  {new Date(currentStory.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isOwnStory && (
                <button
                  onClick={handleDeleteStory}
                  className="p-1.5 rounded-full text-zinc-300 hover:text-rose-400 hover:bg-black/50 transition-colors"
                  title="Delete Story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-white hover:bg-black/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* TAP NAVIGATION ZONES (Left / Right) */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {/* BOTTOM OVERLAY: Reactions / Reply / Viewers Drawer */}
        <div className="relative z-20 p-3 pb-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {isOwnStory ? (
            /* Own Story: Views Counter Pill */
            <div className="flex justify-center">
              <button
                onClick={handleOpenViewers}
                className="px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-700 hover:border-emerald-500/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{currentStory.viewsCount || 0} Views</span>
                {currentStory.reactions && currentStory.reactions.length > 0 && (
                  <span className="flex items-center gap-0.5 ml-1">
                    {currentStory.reactions.slice(-3).map((r, i) => (
                      <span key={i} className="text-xs">{r.emoji}</span>
                    ))}
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* Friends Story: Emoji Reactions & Reply Input */
            <div className="space-y-2">
              {/* Quick Emojis Bar */}
              <div className="flex justify-around items-center px-2 py-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="text-2xl hover:scale-125 active:scale-95 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Reply to ${author?.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-full bg-white/20 border border-white/20 text-white placeholder:text-zinc-400 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-400 backdrop-blur-md"
                />
                <button
                  type="submit"
                  className="p-2 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Viewers Drawer for Own Story */}
        {showViewersDrawer && (
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-zinc-950/95 backdrop-blur-xl rounded-t-3xl border-t border-zinc-800 z-40 p-4 flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                Viewed by {viewersData.length} friends
              </h3>
              <button
                onClick={() => {
                  setShowViewersDrawer(false);
                  setIsPaused(false);
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              {loadingViewers ? (
                <div className="text-center py-6 text-xs text-zinc-500">Loading viewers...</div>
              ) : viewersData.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">No views yet</div>
              ) : (
                viewersData.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          v.user?.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${v.user?.username}`
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-white">{v.user?.username}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(v.viewedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
