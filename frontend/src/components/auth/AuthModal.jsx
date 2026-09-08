import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { authService } from '../../services/api.js';
import {
  MessageSquare,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function AuthModal() {
  const { login, register, loginWithData } = useAuth();
  const { isDark } = useTheme();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        const res = await register({ username, email, password });
        setSuccessMsg(res?.message || 'Registration successful! Please check your email for the 6-digit OTP code.');
        setMode('otp');
      } else if (mode === 'otp') {
        const res = await authService.verifyOtp({ email, otp });
        if (res.data?.token && res.data?.user) {
          loginWithData(res.data.token, res.data.user);
        } else {
          setSuccessMsg('Email verified successfully! You can now sign in.');
          setMode('login');
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'An error occurred. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo credentials for fast testing
  const handleQuickFill = (userType) => {
    setError('');
    if (userType === 'user1') {
      setEmail('alice@test.com');
      setPassword('Password123!');
      setUsername('Alice');
    } else {
      setEmail('bob@test.com');
      setPassword('Password123!');
      setUsername('Bob');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 md:p-8 transition-all relative overflow-hidden ${
          isDark
            ? 'bg-[#09090c] border-[#22222a] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
            <MessageSquare className="w-7 h-7 text-black" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">NexusChat</h2>
          <p className="text-xs opacity-60 mt-1">
            {mode === 'login' && 'Sign in to access your chats, calls & stories'}
            {mode === 'register' && 'Create your real-time chat account'}
            {mode === 'otp' && 'Verify your email address with OTP'}
          </p>
        </div>

        {/* Mode switcher tabs */}
        {mode !== 'otp' && (
          <div
            className={`flex p-1 rounded-2xl mb-5 border ${
              isDark ? 'bg-[#121217] border-[#22222b]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                mode === 'login'
                  ? isDark
                    ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                    : 'bg-white text-blue-600 shadow-xs'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                mode === 'register'
                  ? isDark
                    ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                    : 'bg-white text-blue-600 shadow-xs'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold mb-1 opacity-70">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 opacity-40" />
                <input
                  type="text"
                  required
                  placeholder="e.g. alex_rivers"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                    isDark
                      ? 'bg-[#14141b] border-[#252530] text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {mode !== 'otp' && (
            <>
              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 opacity-40" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark
                        ? 'bg-[#14141b] border-[#252530] text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 opacity-70">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 opacity-40" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark
                        ? 'bg-[#14141b] border-[#252530] text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'otp' && (
            <div>
              <label className="block text-xs font-bold mb-1 opacity-70">6-Digit OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={`w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                  isDark
                    ? 'bg-[#14141b] border-[#252530] text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Please wait...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In to Chat'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'otp' && 'Verify & Continue'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Fill */}
        <div className="mt-5 pt-4 border-t border-inherit text-center">
          <p className="text-[11px] opacity-50 mb-2 font-medium">Quick Demo Testing Accounts</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleQuickFill('user1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Demo: Alice
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('user2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Demo: Bob
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
