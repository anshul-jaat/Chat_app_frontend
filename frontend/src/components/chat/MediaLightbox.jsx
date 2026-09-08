import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

export default function MediaLightbox({ isOpen, onClose, mediaUrl, isVideo = false }) {
  if (!isOpen || !mediaUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] p-2 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            title="Open / Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isVideo ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Expanded view"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
