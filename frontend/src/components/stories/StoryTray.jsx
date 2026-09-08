import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Plus } from 'lucide-react';

export default function StoryTray({
  storiesGrouped = [],
  onOpenCreateStory,
  onOpenStoryViewer,
}) {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Find current user's own stories if any
  const myStoriesGroup = storiesGrouped.find(
    (g) => g.user?._id?.toString() === user?._id?.toString()
  );
  const friendStories = storiesGrouped.filter(
    (g) => g.user?._id?.toString() !== user?._id?.toString()
  );

  return (
    <div
      className={`px-3 py-3 border-b overflow-x-auto select-none no-scrollbar flex items-center gap-3.5 ${
        isDark ? 'border-[#1a1a22]' : 'border-slate-200'
      }`}
    >
      {/* My Story / Add Status */}
      <div className="flex flex-col items-center shrink-0 cursor-pointer group">
        <div className="relative" onClick={() => {
          if (myStoriesGroup && myStoriesGroup.stories.length > 0) {
            onOpenStoryViewer(myStoriesGroup);
          } else {
            onOpenCreateStory();
          }
        }}>
          <div
            className={`p-[2px] rounded-full transition-transform group-hover:scale-105 ${
              myStoriesGroup && myStoriesGroup.stories.length > 0
                ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500'
                : 'border-2 border-dashed border-zinc-600'
            }`}
          >
            <img
              src={
                user?.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'me'}`
              }
              alt="My Status"
              className="w-12 h-12 rounded-full object-cover p-[2px] bg-black"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreateStory();
            }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center border-2 border-black hover:bg-emerald-400 shadow-md transition-transform active:scale-90"
            title="Add new status"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
          </button>
        </div>
        <span className="text-[11px] font-semibold mt-1.5 opacity-80 max-w-16 truncate">
          {myStoriesGroup && myStoriesGroup.stories.length > 0 ? 'My Status' : 'Add Status'}
        </span>
      </div>

      {/* Friends Stories */}
      {friendStories.map((group) => {
        const u = group.user;
        const hasUnviewed = group.hasUnviewed;

        return (
          <div
            key={u._id}
            onClick={() => onOpenStoryViewer(group)}
            className="flex flex-col items-center shrink-0 cursor-pointer group"
          >
            <div
              className={`p-[2.5px] rounded-full transition-transform group-hover:scale-105 ${
                hasUnviewed
                  ? 'bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500'
                  : 'bg-zinc-700/60'
              }`}
            >
              <img
                src={
                  u.avatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`
                }
                alt={u.username}
                className="w-12 h-12 rounded-full object-cover p-[2px] bg-black"
              />
            </div>
            <span className="text-[11px] font-semibold mt-1.5 opacity-80 max-w-16 truncate">
              {u.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
