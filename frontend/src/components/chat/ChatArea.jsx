import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import { messageService, conversationService, userService } from '../../services/api.js';
import { formatTimeAgo } from '../../utils/timeAgo.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';
import {
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Lock,
  Trash2,
  AlertTriangle,
  Check,
  CheckCheck,
} from 'lucide-react';

export default function ChatArea({
  activeConversation,
  onBack,
  onOpenProfile,
  onOpenFriends,
}) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { isUserOnline, incomingMessage, typingUsers, sendSocketMessage, sendTypingStatus } =
    useSocket();
  const { startCall } = useCall();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'clear' | 'delete' | null
  const [isDeleting, setIsDeleting] = useState(false);
  const [otherUserPresence, setOtherUserPresence] = useState(null);
  const messagesEndRef = useRef(null);

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return { username: 'Chat', avatar: '' };
    return conv.participants.find((p) => p._id !== user?._id) || conv.participants[0] || {};
  };

  const otherUser = getOtherParticipant(activeConversation);

  // Determine whether the other user is online and compute last seen
  const online = Boolean(
    isUserOnline(otherUser._id) ||
    otherUserPresence?.isOnline ||
    otherUser.isOnline ||
    (otherUserPresence?.lastSeen && (Date.now() - new Date(otherUserPresence.lastSeen).getTime()) < 65000) ||
    (otherUser.lastSeen && (Date.now() - new Date(otherUser.lastSeen).getTime()) < 65000)
  );

  const lastSeenTime = otherUserPresence?.lastSeen || otherUser.lastSeen;

  const isTyping =
    activeConversation &&
    typingUsers[activeConversation._id] &&
    Object.keys(typingUsers[activeConversation._id]).length > 0;

  // Poll other user presence periodically (every 4s) so status updates dynamically
  useEffect(() => {
    if (!otherUser?._id) return;
    let isMounted = true;

    const checkPresence = async () => {
      try {
        const res = await userService.getUserPresence(otherUser._id);
        if (isMounted && res.data) {
          setOtherUserPresence(res.data);
        }
      } catch (err) {}
    };

    checkPresence();
    const presenceInterval = setInterval(checkPresence, 4000);
    return () => {
      isMounted = false;
      clearInterval(presenceInterval);
    };
  }, [otherUser?._id]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await messageService.getMessages(activeConversation._id);
        setMessages(res.data || []);
        // Mark messages as read
        messageService.markAsRead(activeConversation._id).catch(() => {});
      } catch (err) {
        console.warn('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [activeConversation?._id]);

  // Append real-time incoming messages
  useEffect(() => {
    if (
      incomingMessage &&
      activeConversation &&
      incomingMessage.conversation === activeConversation._id
    ) {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m._id === incomingMessage._id)) return prev;
        return [...prev, incomingMessage];
      });
      messageService.markAsRead(activeConversation._id).catch(() => {});
    }
  }, [incomingMessage, activeConversation?._id]);

  // Smart polling fallback (every 2.5s) to guarantee real-time sync across clients
  useEffect(() => {
    if (!activeConversation?._id) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await messageService.getMessages(activeConversation._id);
        const fetched = res.data || [];
        setMessages((prev) => {
          if (
            fetched.length !== prev.length ||
            (fetched.length > 0 && fetched[fetched.length - 1]?._id !== prev[prev.length - 1]?._id)
          ) {
            return fetched;
          }
          return prev;
        });
      } catch (err) {
        // silently ignore polling errors
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [activeConversation?._id]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.warn('Failed to delete message:', err);
    }
  };

  const handleClearChat = async () => {
    if (!activeConversation) return;
    try {
      setIsDeleting(true);
      await messageService.clearChat(activeConversation._id);
      setMessages([]);
      setConfirmAction(null);
      setShowMenu(false);
    } catch (err) {
      console.warn('Failed to clear chat:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    try {
      setIsDeleting(true);
      await conversationService.deleteConversation(activeConversation._id);
      setConfirmAction(null);
      setShowMenu(false);
      if (onBack) onBack();
    } catch (err) {
      console.warn('Failed to delete conversation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendMessage = async ({ content, type = 'text', file = {} }) => {
    if (!activeConversation) return;

    try {
      const res = await messageService.sendMessage({
        conversationId: activeConversation._id,
        content,
        type,
        file,
      });

      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch (err) {
      console.warn('REST save error:', err);
    }
  };

  const handleTyping = (isCurrentlyTyping) => {
    if (activeConversation) {
      sendTypingStatus(activeConversation._id, isCurrentlyTyping);
    }
  };

  if (!activeConversation) {
    return (
      <main
        className={`flex-1 flex flex-col items-center justify-center p-6 text-center select-none ${
          isDark ? 'bg-[#000000] text-zinc-400' : 'bg-slate-50 text-slate-600'
        }`}
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4 border border-emerald-500/30 shadow-lg">
          <MessageSquare className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-xl font-black mb-2 text-white">Select a Chat or Start One</h2>
        <p className="text-xs max-w-sm opacity-70 mb-6">
          Connect with friends, send voice notes, images, GIFs, and make audio and video calls in OLED Black & Cloud White.
        </p>
        <button
          onClick={onOpenFriends}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95"
        >
          <ShieldCheck className="w-4 h-4" />
          Find & Connect Friends
        </button>
      </main>
    );
  }

  return (
    <main
      className={`flex-1 flex flex-col h-full overflow-hidden transition-colors ${
        isDark ? 'bg-[#000000]' : 'bg-[#fdfefe]'
      }`}
    >
      {/* Chat Header */}
      <header
        className={`h-16 px-4 flex items-center justify-between border-b shrink-0 z-10 transition-colors ${
          isDark
            ? 'bg-[#050508] border-[#1a1a24] text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl hover:bg-zinc-500/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative">
            <img
              src={
                otherUser.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser.username}`
              }
              alt={otherUser.username}
              className="w-10 h-10 rounded-2xl object-cover border border-inherit"
            />
            {online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-black" />
            )}
          </div>

          <div>
            <h2 className="text-sm font-extrabold flex items-center gap-1.5">
              {otherUser.username}
            </h2>
            <p className="text-[11px] opacity-70">
              {isTyping ? (
                <span className="text-emerald-400 font-bold animate-pulse">typing...</span>
              ) : online ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              ) : lastSeenTime ? (
                <span className="text-zinc-400">Last seen {formatTimeAgo(lastSeenTime)}</span>
              ) : (
                <span className="text-zinc-500">Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Call & More Actions */}
        <div className="flex items-center gap-1.5 relative">
          {/* Audio Call */}
          <button
            onClick={() =>
              startCall({
                targetUserId: otherUser._id,
                targetUsername: otherUser.username,
                targetAvatar: otherUser.avatar,
                type: 'audio',
              })
            }
            className={`p-2.5 rounded-xl border transition-all duration-150 ${
              isDark
                ? 'bg-[#101015] border-[#22222b] hover:bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-100 border-slate-200 hover:bg-emerald-100 text-emerald-600'
            }`}
            title="Start Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={() =>
              startCall({
                targetUserId: otherUser._id,
                targetUsername: otherUser.username,
                targetAvatar: otherUser.avatar,
                type: 'video',
              })
            }
            className={`p-2.5 rounded-xl border transition-all duration-150 ${
              isDark
                ? 'bg-[#101015] border-[#22222b] hover:bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-100 border-slate-200 hover:bg-blue-100 text-blue-600'
            }`}
            title="Start Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2.5 rounded-xl border transition-all duration-150 ${
                isDark
                  ? 'bg-[#101015] border-[#22222b] hover:bg-zinc-800 text-zinc-300'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
              }`}
              title="Chat Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 ${
                    isDark
                      ? 'bg-[#0f0f15] border-zinc-800 text-zinc-200 shadow-black'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setConfirmAction('clear');
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                      isDark ? 'hover:bg-zinc-800/70' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clear Messages</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setConfirmAction('delete');
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors text-rose-500 ${
                      isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Conversation</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-1 ${
          isDark
            ? 'bg-[#000000] bg-[radial-gradient(#111116_1px,transparent_1px)] [background-size:16px_16px]'
            : 'bg-[#fafbfe] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]'
        }`}
      >
        {/* End-to-end encryption notice */}
        <div className="flex justify-center my-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
              isDark
                ? 'bg-[#0b0b0f] border-zinc-800 text-zinc-400'
                : 'bg-white border-slate-200 text-slate-500 shadow-2xs'
            }`}
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Messages and calls are private and real-time</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-xs opacity-50">
            Loading chat messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-xs opacity-50">
            <span>No messages here yet.</span>
            <span className="mt-1">Say hello to {otherUser.username}! 👋</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id?.toString() === user?._id?.toString();
            return (
              <MessageBubble
                key={msg._id || Math.random()}
                message={msg}
                isMe={isMe}
                otherUsername={otherUser.username}
                onDeleteMessage={handleDeleteMessage}
                onCallBack={(callType) => {
                  startCall({
                    targetUserId: otherUser._id,
                    targetUsername: otherUser.username,
                    targetAvatar: otherUser.avatar,
                    type: callType || 'video',
                  });
                }}
              />
            );
          })
        )}

        {/* Latest Outgoing Message Seen Status Banner */}
        {messages.length > 0 && (() => {
          const lastMsg = messages[messages.length - 1];
          const lastMsgIsMe = lastMsg.sender?._id?.toString() === user?._id?.toString();
          if (!lastMsgIsMe) return null;

          const isSeen = Boolean(
            lastMsg.seenAt ||
            (Array.isArray(lastMsg.seenBy) && lastMsg.seenBy.length > 0) ||
            (Array.isArray(lastMsg.readBy) && lastMsg.readBy.some((id) => (id._id || id).toString() !== user?._id?.toString())) ||
            (Array.isArray(lastMsg.readBy) && lastMsg.readBy.length > 0)
          );

          const seenTimestamp = lastMsg.seenAt || (lastMsg.seenBy && lastMsg.seenBy[0]?.seenAt) || (isSeen ? lastMsg.updatedAt : null);

          return (
            <div className="flex items-center justify-end px-3 py-1 text-[11px] font-medium">
              {isSeen ? (
                <span className="flex items-center gap-1.5 text-cyan-400 dark:text-cyan-300">
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    Seen by {otherUser.username || 'recipient'} {seenTimestamp ? `• ${formatTimeAgo(seenTimestamp)}` : ''}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 opacity-60">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Delivered • {formatTimeAgo(lastMsg.createdAt)}</span>
                </span>
              )}
            </div>
          );
        })()}

        {/* Live Typing Indicator Bubble */}
        {isTyping && (
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 w-24">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <MessageInput
        conversationId={activeConversation._id}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />

      {/* Confirmation Modal for Clear / Delete */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl border ${
              isDark ? 'bg-[#0d0d13] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold mb-1.5">
              {confirmAction === 'clear' ? 'Clear Chat History?' : 'Delete Entire Conversation?'}
            </h3>

            <p className="text-xs opacity-70 leading-relaxed mb-6">
              {confirmAction === 'clear'
                ? 'All messages in this chat will be deleted. This action cannot be undone.'
                : 'This chat and all sent media/messages will be permanently removed.'}
            </p>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isDeleting}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={confirmAction === 'clear' ? handleClearChat : handleDeleteConversation}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-md shadow-rose-600/30 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : confirmAction === 'clear' ? 'Clear' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
