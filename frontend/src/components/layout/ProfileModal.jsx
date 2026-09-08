import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { userService, uploadService } from '../../services/api.js';
import { X, Camera, Save, Key, User, Check, AlertCircle } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'password'
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setStatusMessage(null);
      const res = await uploadService.uploadFile(file);
      setAvatar(res.data.url);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to upload avatar image' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await userService.updateProfile({ username, avatar, bio });
      updateUser(res.data.user || { username, avatar, bio });
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      setLoading(true);
      setStatusMessage(null);
      await userService.changePassword({ oldPassword, newPassword });
      setStatusMessage({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0b0b0e] border-[#22222a] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <h2 className="text-base font-extrabold flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Profile Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex p-2 gap-1 border-b border-inherit">
          <button
            onClick={() => {
              setActiveTab('general');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'general'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'bg-slate-200 text-blue-600'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            General Profile
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'password'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'bg-slate-200 text-blue-600'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            Security & Password
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body */}
        {activeTab === 'general' ? (
          <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <img
                  src={
                    avatar ||
                    user.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'user'}`
                  }
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-lg"
                />
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-semibold gap-1">
                  <Camera className="w-5 h-5" />
                  <span>{uploadingAvatar ? 'Uploading...' : 'Change'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <p className="text-[11px] opacity-60">Click avatar to upload photo</p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-[#14141a] border-[#262632] text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                Email (Read-only)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border opacity-60 cursor-not-allowed ${
                  isDark
                    ? 'bg-[#14141a] border-[#262632] text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                About / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Write something about yourself..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border resize-none focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-[#14141a] border-[#262632] text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-[#14141a] border-[#262632] text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-[#14141a] border-[#262632] text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-80">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-[#14141a] border-[#262632] text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              <Key className="w-4 h-4" />
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
