import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import { friendService, userService, conversationService } from '../../services/api.js';
import {
  X,
  Users,
  UserPlus,
  Search,
  Check,
  UserX,
  Clock,
  MessageSquare,
  Phone,
  Video,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function FriendsModal({ isOpen, onClose, onSelectConversation }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { startCall } = useCall();

  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'requests' | 'friends'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadFriendsAndRequests();
    }
  }, [isOpen]);

  const loadFriendsAndRequests = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getRequests(),
      ]);
      setFriends(friendsRes.data || []);
      setRequests(requestsRes.data || { incoming: [], outgoing: [] });
    } catch (err) {
      console.warn('Failed to load friends/requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await userService.searchUsers(searchQuery.trim());
      setSearchResults(res.data || []);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (recipientId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [recipientId]: true }));
      await friendService.sendRequest(recipientId);
      await loadFriendsAndRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send friend request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [recipientId]: false }));
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [requestId]: true }));
      await friendService.acceptRequest(requestId);
      await loadFriendsAndRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [requestId]: true }));
      await friendService.rejectRequest(requestId);
      await loadFriendsAndRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [requestId]: true }));
      await friendService.cancelRequest(requestId);
      await loadFriendsAndRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleStartChatWithFriend = async (friendId) => {
    try {
      const res = await conversationService.createOrGet(friendId);
      if (onSelectConversation) {
        onSelectConversation(res.data);
      }
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start conversation');
    }
  };

  if (!isOpen) return null;

  const isFriend = (uId) => friends.some((f) => f._id === uId);
  const isPendingSent = (uId) =>
    requests.outgoing.some((r) => r.recipient?._id === uId && r.status === 'pending');
  const isPendingReceived = (uId) =>
    requests.incoming.some((r) => r.sender?._id === uId && r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-xl h-[560px] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#09090c] border-[#22222a] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Friends & Connections</h2>
              <p className="text-xs opacity-60">Send requests, accept friends & start calling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1.5 border-b border-inherit">
          <button
            onClick={() => setActiveTab('find')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'find'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'bg-slate-200 text-blue-600'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Find Users
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`relative flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'requests'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'bg-slate-200 text-blue-600'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Requests
            {requests.incoming.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center justify-center">
                {requests.incoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'friends'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'bg-slate-200 text-blue-600'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            My Friends ({friends.length})
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: FIND USERS */}
          {activeTab === 'find' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 opacity-40" />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark
                        ? 'bg-[#121217] border-[#22222b] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Search Results */}
              <div className="space-y-2.5 mt-3">
                {searchResults.length === 0 && !searching && (
                  <div className="text-center py-10 opacity-50 text-xs">
                    Type a username or email to search for people to connect with.
                  </div>
                )}

                {searchResults.map((targetUser) => {
                  const alreadyFriend = isFriend(targetUser._id);
                  const sent = isPendingSent(targetUser._id);
                  const received = isPendingReceived(targetUser._id);
                  const online = isUserOnline(targetUser._id);

                  return (
                    <div
                      key={targetUser._id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-[#121217] border-[#1e1e26] hover:border-emerald-500/40'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={
                              targetUser.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.username}`
                            }
                            alt={targetUser.username}
                            className="w-11 h-11 rounded-xl object-cover border border-inherit"
                          />
                          {online && (
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-black" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold flex items-center gap-2">
                            {targetUser.username}
                            {online && (
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                Online
                              </span>
                            )}
                          </p>
                          <p className="text-xs opacity-60">{targetUser.email}</p>
                        </div>
                      </div>

                      <div>
                        {alreadyFriend ? (
                          <button
                            onClick={() => handleStartChatWithFriend(targetUser._id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </button>
                        ) : sent ? (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Request Sent
                          </span>
                        ) : received ? (
                          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
                            Incoming Request
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(targetUser._id)}
                            disabled={actionLoading[targetUser._id]}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 shadow-xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            {actionLoading[targetUser._id] ? 'Sending...' : 'Add Friend'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PENDING REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Incoming Requests */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider opacity-70 mb-2.5 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  Incoming Requests ({requests.incoming.length})
                </h3>
                {requests.incoming.length === 0 ? (
                  <p className="text-xs opacity-50 py-3">No incoming friend requests</p>
                ) : (
                  <div className="space-y-2">
                    {requests.incoming.map((req) => (
                      <div
                        key={req._id}
                        className={`flex items-center justify-between p-3 rounded-2xl border ${
                          isDark ? 'bg-[#121217] border-[#1e1e26]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              req.sender?.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${req.sender?.username}`
                            }
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold">{req.sender?.username}</p>
                            <p className="text-[11px] opacity-60">
                              {req.sender?.bio || req.sender?.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptRequest(req._id)}
                            disabled={actionLoading[req._id]}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req._id)}
                            disabled={actionLoading[req._id]}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider opacity-70 mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Sent Requests ({requests.outgoing.length})
                </h3>
                {requests.outgoing.length === 0 ? (
                  <p className="text-xs opacity-50 py-3">No pending sent requests</p>
                ) : (
                  <div className="space-y-2">
                    {requests.outgoing.map((req) => (
                      <div
                        key={req._id}
                        className={`flex items-center justify-between p-3 rounded-2xl border ${
                          isDark ? 'bg-[#121217] border-[#1e1e26]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              req.recipient?.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${req.recipient?.username}`
                            }
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold">{req.recipient?.username}</p>
                            <p className="text-[11px] opacity-60">Pending approval</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelRequest(req._id)}
                          disabled={actionLoading[req._id]}
                          className="px-3 py-1.5 rounded-xl border border-zinc-700 hover:border-zinc-500 text-xs font-semibold opacity-80 hover:opacity-100 transition-all"
                        >
                          Cancel Request
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MY FRIENDS */}
          {activeTab === 'friends' && (
            <div className="space-y-2.5">
              {friends.length === 0 ? (
                <div className="text-center py-12 opacity-50 text-xs">
                  No friends added yet. Go to "Find Users" to connect with friends!
                </div>
              ) : (
                friends.map((friend) => {
                  const online = isUserOnline(friend._id);
                  return (
                    <div
                      key={friend._id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isDark
                          ? 'bg-[#121217] border-[#1e1e26] hover:border-[#2f2f3c]'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={
                              friend.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`
                            }
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover"
                          />
                          {online && (
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-black" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold flex items-center gap-2">
                            {friend.username}
                            {online && (
                              <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                                online
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] opacity-60 line-clamp-1">{friend.bio}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartChatWithFriend(friend._id)}
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          title="Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            startCall({
                              targetUserId: friend._id,
                              targetUsername: friend.username,
                              targetAvatar: friend.avatar,
                              type: 'audio',
                            });
                          }}
                          className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                          title="Audio Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            startCall({
                              targetUserId: friend._id,
                              targetUsername: friend.username,
                              targetAvatar: friend.avatar,
                              type: 'video',
                            });
                          }}
                          className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                          title="Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
