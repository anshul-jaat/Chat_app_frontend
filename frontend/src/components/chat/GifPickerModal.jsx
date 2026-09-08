import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { X, Search, Sparkles } from 'lucide-react';

const CURATED_GIFS = [
  { id: '1', title: 'Thumbs Up', category: 'Reactions', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
  { id: '2', title: 'Party Dance', category: 'Dance', url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif' },
  { id: '3', title: 'Laughing', category: 'Laugh', url: 'https://media.giphy.com/media/ltIFdjNAasOwVvKhvx/giphy.gif' },
  { id: '4', title: 'Love Heart', category: 'Love', url: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif' },
  { id: '5', title: 'Mind Blown', category: 'Wow', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: '6', title: 'Fire Flame', category: 'Fire', url: 'https://media.giphy.com/media/3o72FfM5HJydzafgUE/giphy.gif' },
  { id: '7', title: 'Cool Shades', category: 'Reactions', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif' },
  { id: '8', title: 'Cat Typing', category: 'Cats', url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif' },
  { id: '9', title: 'Celebration Confetti', category: 'Dance', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { id: '10', title: 'Clapping Hands', category: 'Reactions', url: 'https://media.giphy.com/media/nbvFVPiEiJH6Q/giphy.gif' },
  { id: '11', title: 'Shocked', category: 'Wow', url: 'https://media.giphy.com/media/tfUW8mhiFk8NlRezUS/giphy.gif' },
  { id: '12', title: 'Dog Wiggle', category: 'Cats', url: 'https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif' },
];

const CATEGORIES = ['All', 'Reactions', 'Laugh', 'Love', 'Wow', 'Fire', 'Dance', 'Cats'];

export default function GifPickerModal({ isOpen, onClose, onSelectGif }) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  if (!isOpen) return null;

  const filteredGifs = CURATED_GIFS.filter((gif) => {
    const matchesCat = activeCategory === 'All' || gif.category === activeCategory;
    const matchesSearch = !search || gif.title.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-lg h-[500px] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0b0b0e] border-[#22222b] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500 text-black">
              GIF
            </span>
            <h3 className="text-sm font-bold">Choose a GIF</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-500/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-inherit">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 opacity-40" />
            <input
              type="text"
              placeholder="Search GIFs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                isDark
                  ? 'bg-[#14141b] border-[#22222b] text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto mt-2.5 pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                  activeCategory === cat
                    ? isDark
                      ? 'bg-emerald-500 text-black'
                      : 'bg-blue-600 text-white'
                    : isDark
                    ? 'bg-[#14141b] hover:bg-zinc-800 text-zinc-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredGifs.map((gif) => (
            <div
              key={gif.id}
              onClick={() => {
                onSelectGif(gif.url);
                onClose();
              }}
              className="relative group rounded-xl overflow-hidden cursor-pointer h-32 bg-zinc-900 border border-zinc-800 hover:border-emerald-500 transition-all hover:scale-[1.02]"
            >
              <img
                src={gif.url}
                alt={gif.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-[11px] font-bold text-white truncate">{gif.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
