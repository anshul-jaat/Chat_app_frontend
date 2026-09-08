import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import AudioRecorder from './AudioRecorder.jsx';
import GifPickerModal from './GifPickerModal.jsx';
import { uploadService } from '../../services/api.js';
import {
  Smile,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Send,
  Mic,
} from 'lucide-react';

const QUICK_EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '❤️', '🎉', '🚀', '👏', '💯', '😎', '🥳', '🙌', '✨', '⚡', '🤩'];

export default function MessageInput({ onSendMessage, onTyping }) {
  const { isDark } = useTheme();

  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);

    // Notify typing status
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleSendText = () => {
    if (!text.trim()) return;
    onSendMessage({
      content: text.trim(),
      type: 'text',
    });
    setText('');
    setShowEmojiPicker(false);
    if (onTyping) onTyping(false);
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectGif = (gifUrl) => {
    onSendMessage({
      content: gifUrl,
      type: 'gif',
      file: { url: gifUrl },
    });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setShowAttachMenu(false);
      setUploadProgress(10);

      const res = await uploadService.uploadFile(file, (percent) => {
        setUploadProgress(percent);
      });

      const uploadedUrl = res.data.url;

      onSendMessage({
        content: file.name,
        type: type === 'image' ? 'image' : 'file',
        file: {
          url: uploadedUrl,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        },
      });
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploadProgress(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleSendVoiceNote = async (audioFile, duration) => {
    try {
      setIsRecording(false);
      setUploadProgress(10);

      const res = await uploadService.uploadFile(audioFile, (percent) => {
        setUploadProgress(percent);
      });

      onSendMessage({
        content: 'Voice message',
        type: 'audio',
        file: {
          url: res.data.url,
          duration,
          mimeType: 'audio/webm',
        },
      });
    } catch (err) {
      alert('Failed to upload voice note');
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <div
      className={`p-3 border-t relative transition-colors ${
        isDark ? 'bg-[#050507] border-[#1b1b22]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          className={`absolute bottom-16 left-3 p-3 rounded-2xl border shadow-2xl z-30 grid grid-cols-8 gap-2 w-72 ${
            isDark ? 'bg-[#0e0e13] border-[#252530]' : 'bg-white border-slate-200'
          }`}
        >
          {QUICK_EMOJIS.map((em, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectEmoji(em)}
              className="text-xl hover:scale-125 transition-transform p-1"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Popover Menu */}
      {showAttachMenu && (
        <div
          className={`absolute bottom-16 left-12 p-2 rounded-2xl border shadow-2xl z-30 flex flex-col gap-1 w-44 ${
            isDark ? 'bg-[#0e0e13] border-[#252530]' : 'bg-white border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark ? 'hover:bg-zinc-800/80 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            Photos & Videos
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark ? 'hover:bg-zinc-800/80 text-zinc-200' : 'hover:bg-slate-100 text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Document / File
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={(e) => handleFileUpload(e, 'image')}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileUpload(e, 'file')}
        className="hidden"
      />

      {/* Main Input Row */}
      <div className="flex items-center gap-2">
        {isRecording ? (
          <AudioRecorder
            onSendAudio={handleSendVoiceNote}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <>
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors ${
                showEmojiPicker
                  ? 'text-emerald-400'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Attachments Button */}
            <button
              type="button"
              onClick={() => setShowAttachMenu((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors ${
                showAttachMenu
                  ? 'text-emerald-400'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Attach media or document"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* GIF Button */}
            <button
              type="button"
              onClick={() => setShowGifPicker(true)}
              className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border transition-colors ${
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:border-emerald-500 hover:text-emerald-400'
                  : 'border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600'
              }`}
              title="Pick a GIF"
            >
              GIF
            </button>

            {/* Textarea Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className={`w-full py-2.5 px-3.5 rounded-2xl text-sm resize-none focus:outline-hidden max-h-28 transition-colors ${
                  isDark
                    ? 'bg-[#121217] text-white placeholder:text-zinc-500 border border-[#1f1f26] focus:border-emerald-500/60'
                    : 'bg-slate-100 text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Mic / Voice Note or Send Button */}
            {text.trim() ? (
              <button
                type="button"
                onClick={handleSendText}
                className="w-10 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 transition-transform active:scale-90"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="w-10 h-10 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25 transition-transform active:scale-90"
                title="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* GIF Picker Modal */}
      <GifPickerModal
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleSelectGif}
      />
    </div>
  );
}
