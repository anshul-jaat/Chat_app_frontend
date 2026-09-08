import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import StoryTray from '../stories/StoryTray.jsx';
import { Search, Plus, MessageSquare, Check, CheckCheck, Trash2 } from 'lucide-react';

export default function ChatSidebar({
  conversations = [],
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
  storiesGrouped = [],
  onOpenCreateStory,
  onOpenStoryViewer,
  onOpenFriends,
}) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { isUserOnline } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [convToDelete, setConvToDelete] = useState(null);

  // Get other participant in a 1-on-1 chat
  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return { username: 'Chat', avatar: '' };
    return conv.participants.find((p) => p._id !== user?._id) || conv.participants[0] || {};
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    return other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      className={`w-full md:w-80 lg:w-96 flex flex-col h-full border-r transition-colors select-none ${
        isDark ? 'bg-[#000000] border-[#181820]' : 'bg-slate-50/70 border-slate-200'
      }`}
    >
      {/* 24h Status / Story Tray */}
      <StoryTray
        storiesGrouped={storiesGrouped}
        onOpenCreateStory={onOpenCreateStory}
        onOpenStoryViewer={onOpenStoryViewer}
      />

      {/* Search and New Chat Row */}
      <div className="p-3 border-b border-inherit flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-40" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-hidden transition-all ${
              isDark
                ? 'bg-[#0f0f14] border-[#1f1f26] text-white placeholder:text-zinc-500 focus:border-emerald-500/50'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
            }`}
          />
        </div>

        <button
          onClick={onOpenFriends}
          className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-xs transition-transform active:scale-95 shrink-0"
          title="Start New Chat"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <MessageSquare className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs opacity-60 font-semibold">No chats found</p>
            <button
              onClick={onOpenFriends}
              className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
            >
              Find Friends to Chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isSelected = activeConversation?._id === conv._id;
            const online = isUserOnline(other._id);
            const lastMsg = conv.lastMessage;

            let lastMsgText = 'No messages yet';
            if (lastMsg) {
              if (lastMsg.type === 'image') lastMsgText = '📷 Photo';
              else if (lastMsg.type === 'audio') lastMsgText = '🎤 Voice note';
              else if (lastMsg.type === 'gif') lastMsgText = '✨ GIF';
              else if (lastMsg.type === 'file') lastMsgText = `📄 ${lastMsg.file?.name || 'File'}`;
              else lastMsgText = lastMsg.content || 'Text message';
            }

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? isDark
                      ? 'bg-[#121217] border border-emerald-500/30 shadow-xs'
                      : 'bg-white border border-blue-200 shadow-xs'
                    : isDark
                    ? 'hover:bg-[#0c0c10] border border-transparent'
                    : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      other.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${other.username}`
                    }
                    alt={other.username}
                    className="w-12 h-12 rounded-2xl object-cover border border-inherit"
                  />
                  {online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-black" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-extrabold truncate">{other.username}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] opacity-60">
                        {formatMessageTime(conv.updatedAt || lastMsg?.createdAt)}
                      </span>
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConvToDelete(conv);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400"
                          title="Delete Conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] opacity-70 truncate max-w-[180px]">
                      {lastMsgText}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Delete Conversation */}
      {convToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl border ${
              isDark ? 'bg-[#0d0d13] border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/30">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold mb-1.5">Delete Conversation?</h3>
            <p className="text-xs opacity-70 leading-relaxed mb-6">
              Delete chat with <span className="font-bold text-emerald-400">{getOtherParticipant(convToDelete).username}</span>? All messages will be permanently deleted.
            </p>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => setConvToDelete(null)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                  isDark
                    ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  const id = convToDelete._id;
                  setConvToDelete(null);
                  if (onDeleteConversation) await onDeleteConversation(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-md shadow-rose-600/30 transition-transform active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
