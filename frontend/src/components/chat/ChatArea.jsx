import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import { messageService } from '../../services/api.js';
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
  const messagesEndRef = useRef(null);

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return { username: 'Chat', avatar: '' };
    return conv.participants.find((p) => p._id !== user?._id) || conv.participants[0] || {};
  };

  const otherUser = getOtherParticipant(activeConversation);
  const online = isUserOnline(otherUser._id);
  const isTyping =
    activeConversation &&
    typingUsers[activeConversation._id] &&
    Object.keys(typingUsers[activeConversation._id]).length > 0;

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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
                <span className="text-emerald-400 font-medium">Online</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>

        {/* Call Actions */}
        <div className="flex items-center gap-1.5">
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
    </main>
  );
}
