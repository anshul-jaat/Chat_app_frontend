import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import AudioPlayer from './AudioPlayer.jsx';
import MediaLightbox from './MediaLightbox.jsx';
import {
  FileText,
  Download,
  Check,
  CheckCheck,
  PhoneMissed,
  VideoOff,
  Phone,
  Video,
  Trash2,
} from 'lucide-react';

import { formatTimeAgo } from '../../utils/timeAgo.js';

export default function MessageBubble({ message, isMe, onCallBack, onDeleteMessage, otherUsername }) {
  const { isDark } = useTheme();
  const [showLightbox, setShowLightbox] = useState(false);

  const { content, type, file, createdAt, readBy = [], seenAt, seenBy = [], updatedAt } = message;

  // Has the recipient seen/read this message?
  const isRead = Boolean(
    seenAt ||
    (Array.isArray(seenBy) && seenBy.length > 0) ||
    (Array.isArray(readBy) && readBy.some(id => (id._id || id).toString() !== (message.sender?._id || message.sender)?.toString())) ||
    (Array.isArray(readBy) && readBy.length > 0)
  );

  const seenTime = seenAt || (seenBy && seenBy[0]?.seenAt) || (isRead ? updatedAt : null);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} my-1.5 px-2`}>
      <div
        className={`group/bubble relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs transition-all ${
          isMe
            ? isDark
              ? 'bg-emerald-600 text-white rounded-br-xs'
              : 'bg-blue-600 text-white rounded-br-xs'
            : isDark
            ? 'bg-[#15151c] text-zinc-100 border border-[#23232e] rounded-bl-xs'
            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs shadow-sm'
        }`}
      >
        {/* Sender Name if not Me and in group or conversation */}
        {!isMe && message.sender?.username && (
          <p className="text-[11px] font-extrabold text-emerald-400 mb-1">
            {message.sender.username}
          </p>
        )}

        {/* IMAGE TYPE */}
        {type === 'image' && (
          <div className="mb-1 rounded-xl overflow-hidden cursor-pointer group">
            <img
              src={file?.url || content}
              alt="Sent media"
              onClick={() => setShowLightbox(true)}
              className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </div>
        )}

        {/* GIF TYPE */}
        {type === 'gif' && (
          <div className="mb-1 rounded-xl overflow-hidden cursor-pointer">
            <img
              src={file?.url || content}
              alt="GIF"
              onClick={() => setShowLightbox(true)}
              className="max-h-64 w-full object-cover rounded-xl"
              loading="lazy"
            />
          </div>
        )}

        {/* AUDIO TYPE */}
        {type === 'audio' && (
          <AudioPlayer src={file?.url || content} isMe={isMe} />
        )}

        {/* FILE / DOCUMENT TYPE */}
        {type === 'file' && (
          <a
            href={file?.url || content}
            target="_blank"
            rel="noopener noreferrer"
            download={file?.name || 'attachment'}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
              isMe
                ? 'bg-black/20 border-white/20 hover:bg-black/30'
                : isDark
                ? 'bg-[#0f0f14] border-zinc-800 hover:bg-[#181820]'
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-bold truncate">{file?.name || 'Attached Document'}</p>
              <p className="text-[10px] opacity-70">
                {formatFileSize(file?.size) || file?.mimeType || 'Document'}
              </p>
            </div>
            <div className="p-1.5 rounded-lg opacity-80 hover:opacity-100">
              <Download className="w-4 h-4" />
            </div>
          </a>
        )}

        {/* MISSED CALL TYPE */}
        {type === 'missed_call' && (
          <div className="flex items-center gap-3 py-1 min-w-[210px]">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              {content.toLowerCase().includes('video') ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <PhoneMissed className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-bold text-rose-400">{content}</p>
              <p className="text-[10px] opacity-70">Missed call</p>
            </div>
            <button
              type="button"
              onClick={() => onCallBack && onCallBack(content.toLowerCase().includes('video') ? 'video' : 'audio')}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-black text-xs font-extrabold flex items-center gap-1 shadow-xs transition-transform active:scale-95 shrink-0"
              title="Call Back"
            >
              {content.toLowerCase().includes('video') ? (
                <Video className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Phone className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Call</span>
            </button>
          </div>
        )}

        {/* TEXT CONTENT */}
        {content && type !== 'image' && type !== 'gif' && type !== 'audio' && type !== 'file' && type !== 'missed_call' && (
          <p className="text-sm font-normal break-words leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}

        {/* Optional caption if file has text content */}
        {content && (type === 'image' || type === 'file') && (
          <p className="text-xs font-normal mt-1 opacity-90 break-words">{content}</p>
        )}

        {/* Timestamp, Delete Action, and Read Receipts */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
            isMe ? 'text-white/85' : 'opacity-60'
          }`}
        >
          {isMe && onDeleteMessage && (
            <button
              onClick={() => onDeleteMessage(message._id)}
              className="opacity-0 group-hover/bubble:opacity-100 transition-opacity p-0.5 hover:text-rose-200 text-white/70 mr-0.5"
              title="Delete Message"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <span>{formatTime(createdAt)}</span>
          {createdAt && (
            <span className="opacity-75">({formatTimeAgo(createdAt)})</span>
          )}

          {isMe && (
            <div
              className="flex items-center gap-1 ml-0.5"
              title={isRead ? `Seen by ${otherUsername || 'user'} ${formatTimeAgo(seenTime)}` : 'Sent'}
            >
              {isRead ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
                  <span className="text-[10px] text-cyan-200 font-bold tracking-tight">
                    Seen {formatTimeAgo(seenTime)}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 opacity-75 stroke-[2]" />
                  <span className="text-[10px] opacity-75 font-medium">Sent</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      <MediaLightbox
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        mediaUrl={file?.url || content}
      />
    </div>
  );
}
