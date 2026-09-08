import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  Sun,
  Moon,
  Users,
  User,
  LogOut,
  Sparkles,
  CircleDot,
  Bell,
  MessageSquare,
} from 'lucide-react';

export default function Navbar({ onOpenFriends, onOpenProfile, pendingRequestsCount = 0 }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { friendRequestNotification, clearFriendNotification } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header
      className={`h-16 px-4 md:px-6 flex items-center justify-between border-b transition-colors duration-200 z-30 select-none ${
        isDark
          ? 'bg-black border-[#1f1f26] text-white'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-md shadow-emerald-500/20">
          <MessageSquare className="w-5 h-5 text-black" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
            NexusChat
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}
            >
              Realtime
            </span>
          </h1>
          <p
            className={`text-xs hidden sm:block ${
              isDark ? 'text-zinc-500' : 'text-slate-500'
            }`}
          >
            Calls • Stories • OLED & Cloud
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Friends & Friend Requests Button */}
        <button
          onClick={() => {
            clearFriendNotification();
            onOpenFriends();
          }}
          className={`relative p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 ${
            isDark
              ? 'bg-[#0f0f13] border-[#22222a] hover:bg-[#181820] text-zinc-200'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
          }`}
          title="Friends & Requests"
        >
          <Users className="w-4 h-4" />
          <span className="text-xs font-semibold hidden sm:inline">Friends</span>
          {(pendingRequestsCount > 0 || friendRequestNotification) && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black animate-pulse">
              {pendingRequestsCount || 1}
            </span>
          )}
        </button>

        {/* OLED Black / Cloud White Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all duration-200 ${
            isDark
              ? 'bg-[#0c0c0f] border-[#22222a] text-zinc-300 hover:bg-[#181820] hover:text-white'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title={isDark ? 'Switch to Cloud White' : 'Switch to OLED Black'}
        >
          {isDark ? (
            <>
              <Moon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 hidden sm:inline">OLED</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-blue-600 hidden sm:inline">Cloud</span>
            </>
          )}
        </button>

        {/* User Profile & Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-[#0e0e12] border-[#22222a] hover:bg-[#16161d]'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="relative">
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'user'}`
                  }
                  alt={user.username}
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-black" />
              </div>
              <span className="text-xs font-semibold max-w-24 truncate hidden md:inline">
                {user.username}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-52 rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                    isDark
                      ? 'bg-[#0e0e12] border-[#22222a] text-zinc-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="px-3 py-2 border-b border-inherit mb-1">
                    <p className="text-xs font-bold truncate">{user.username}</p>
                    <p className="text-[11px] opacity-70 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenProfile();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                      isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    Edit Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenFriends();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                      isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-500" />
                    Friends & Connections
                  </button>

                  <div className="border-t border-inherit my-1" />

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
