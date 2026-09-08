import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { storyService, uploadService } from '../../services/api.js';
import {
  X,
  Type,
  Image as ImageIcon,
  Send,
  Sparkles,
  Palette,
  Clock,
  UploadCloud,
} from 'lucide-react';

const BACKGROUND_PRESETS = [
  '#000000', // OLED Black
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', // Emerald to Cyan
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo to Purple
  'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)', // Rose to Amber
  'linear-gradient(135deg, #09090b 0%, #1c1917 100%)', // Charcoal Black
  'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)', // Ocean Blue
];

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated }) {
  const { isDark } = useTheme();

  const [mode, setMode] = useState('text'); // 'text' | 'media'
  const [textContent, setTextContent] = useState('');
  const [bgColor, setBgColor] = useState(BACKGROUND_PRESETS[0]);
  const [fontSize, setFontSize] = useState('text-xl');

  // Media status
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      if (mode === 'text') {
        if (!textContent.trim()) {
          setError('Please type some text for your status');
          setLoading(false);
          return;
        }
        await storyService.createStory({
          type: 'text',
          caption: textContent,
          backgroundColor: bgColor,
          textColor: '#FFFFFF',
        });
      } else {
        if (!selectedFile) {
          setError('Please select an image or video to post');
          setLoading(false);
          return;
        }

        // Upload media file
        const uploadRes = await uploadService.uploadFile(selectedFile);
        const fileUrl = uploadRes.data.url;
        const isVideo = selectedFile.type.startsWith('video');

        await storyService.createStory({
          type: isVideo ? 'video' : 'image',
          mediaUrl: fileUrl,
          caption: caption.trim(),
          backgroundColor: '#000000',
        });
      }

      if (onStoryCreated) onStoryCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to post story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#09090d] border-[#22222b] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold">New 24h Status</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-500/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex p-2 gap-1.5 border-b border-inherit">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'text'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'bg-slate-200 text-blue-600'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Text Status
          </button>
          <button
            onClick={() => setMode('media')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'media'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'bg-slate-200 text-blue-600'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Photo / Video
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'text' ? (
            <>
              {/* Preview Card */}
              <div
                className="w-full h-52 rounded-2xl p-4 flex items-center justify-center text-center shadow-inner relative overflow-hidden transition-all duration-300"
                style={{ background: bgColor }}
              >
                <p
                  className={`font-bold text-white break-words max-w-full px-2 ${fontSize}`}
                >
                  {textContent || 'What is on your mind?'}
                </p>
              </div>

              {/* Text Input */}
              <div>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  maxLength={180}
                  rows={2}
                  placeholder="Type your status message..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border resize-none focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                    isDark
                      ? 'bg-[#121217] border-[#22222b] text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <div className="flex justify-between items-center text-[11px] opacity-60 mt-1">
                  <span>{textContent.length} / 180 characters</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFontSize('text-base')}
                      className={`px-1.5 py-0.5 rounded border text-[10px] ${
                        fontSize === 'text-base' ? 'border-emerald-400 text-emerald-400' : ''
                      }`}
                    >
                      S
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('text-xl')}
                      className={`px-1.5 py-0.5 rounded border text-[10px] ${
                        fontSize === 'text-xl' ? 'border-emerald-400 text-emerald-400' : ''
                      }`}
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('text-2xl')}
                      className={`px-1.5 py-0.5 rounded border text-[10px] ${
                        fontSize === 'text-2xl' ? 'border-emerald-400 text-emerald-400' : ''
                      }`}
                    >
                      L
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold mb-2 opacity-70 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Background Color
                </label>
                <div className="flex gap-2.5">
                  {BACKGROUND_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBgColor(preset)}
                      className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${
                        bgColor === preset ? 'ring-2 ring-emerald-400 scale-110' : ''
                      }`}
                      style={{ background: preset }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Media File Picker & Preview */}
              <div>
                {previewUrl ? (
                  <div className="relative w-full h-52 rounded-2xl overflow-hidden border border-inherit bg-black">
                    {selectedFile?.type.startsWith('video') ? (
                      <video src={previewUrl} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-44 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center">
                    <UploadCloud className="w-9 h-9 text-emerald-400 mb-2" />
                    <span className="text-xs font-bold">Click to select photo or video</span>
                    <span className="text-[11px] opacity-60 mt-1">Supports JPG, PNG, GIF, MP4</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Caption */}
              <div>
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                    isDark
                      ? 'bg-[#121217] border-[#22222b] text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-1.5 text-[11px] opacity-60">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stories automatically expire and disappear after 24 hours</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Posting Status...' : 'Post Status'}
          </button>
        </form>
      </div>
    </div>
  );
}
