import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider, useSocket } from './context/SocketContext.jsx';
import { CallProvider } from './context/CallContext.jsx';
import { conversationService, storyService, friendService } from './services/api.js';

import Navbar from './components/layout/Navbar.jsx';
import ProfileModal from './components/layout/ProfileModal.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import FriendsModal from './components/friends/FriendsModal.jsx';
import ChatSidebar from './components/chat/ChatSidebar.jsx';
import ChatArea from './components/chat/ChatArea.jsx';
import CreateStoryModal from './components/stories/CreateStoryModal.jsx';
import StoryViewerModal from './components/stories/StoryViewerModal.jsx';
import CallModal from './components/calls/CallModal.jsx';

function MainApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const { incomingMessage, storyNotification, clearStoryNotification } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [storiesGrouped, setStoriesGrouped] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Modal open states
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState(null);

  // Load conversations and stories when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setStoriesGrouped([]);
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      const [convRes, storiesRes, requestsRes] = await Promise.all([
        conversationService.getConversations(),
        storyService.getStories(),
        friendService.getRequests(),
      ]);
      setConversations(convRes.data || []);
      setStoriesGrouped(storiesRes.data || []);
      setPendingRequestsCount(requestsRes.data?.incoming?.length || 0);

      // Auto-select first conversation if none selected
      if (convRes.data && convRes.data.length > 0 && !activeConversation) {
        setActiveConversation(convRes.data[0]);
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  };

  // Handle incoming message to update conversation list lastMessage
  useEffect(() => {
    if (incomingMessage) {
      setConversations((prev) => {
        const convIndex = prev.findIndex((c) => c._id === incomingMessage.conversation);
        if (convIndex !== -1) {
          const updated = [...prev];
          updated[convIndex] = {
            ...updated[convIndex],
            lastMessage: incomingMessage,
            updatedAt: incomingMessage.createdAt,
          };
          // Move to top of list
          const [moved] = updated.splice(convIndex, 1);
          return [moved, ...updated];
        }
        return prev;
      });
    }
  }, [incomingMessage]);

  // Handle story notification updates
  useEffect(() => {
    if (storyNotification) {
      storyService.getStories().then((res) => {
        setStoriesGrouped(res.data || []);
      }).catch(() => {});
      clearStoryNotification();
    }
  }, [storyNotification]);

  // When user replies to a story
  const handleReplyToStory = async ({ recipientId, content }) => {
    try {
      const convRes = await conversationService.createOrGet(recipientId);
      setActiveConversation(convRes.data);
      // Send message in conversation
      await conversationService.getById(convRes.data._id);
    } catch (err) {
      console.warn('Reply error:', err);
    }
  };

  if (authLoading) {
    return (
      <div
        className={`h-screen w-screen flex flex-col items-center justify-center transition-colors ${
          isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 animate-pulse flex items-center justify-center mb-3">
          <span className="text-black font-black text-xl">N</span>
        </div>
        <p className="text-xs font-semibold opacity-70">Loading NexusChat...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-black text-zinc-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Navigation */}
      <Navbar
        onOpenFriends={() => setIsFriendsModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main Split Layout: Sidebar + Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Sidebar (Story tray + conversations) */}
        <div
          className={`${
            activeConversation ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 shrink-0 h-full`}
        >
          <ChatSidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={(conv) => setActiveConversation(conv)}
            storiesGrouped={storiesGrouped}
            onOpenCreateStory={() => setIsCreateStoryOpen(true)}
            onOpenStoryViewer={(group) => setSelectedStoryGroup(group)}
            onOpenFriends={() => setIsFriendsModalOpen(true)}
          />
        </div>

        {/* Right: Active Chat Area */}
        <div
          className={`${
            !activeConversation ? 'hidden md:flex' : 'flex'
          } flex-1 h-full`}
        >
          <ChatArea
            activeConversation={activeConversation}
            onBack={() => setActiveConversation(null)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenFriends={() => setIsFriendsModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals & Overlays */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => {
          setIsFriendsModalOpen(false);
          loadInitialData();
        }}
        onSelectConversation={(conv) => {
          setActiveConversation(conv);
          loadInitialData();
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={() => {
          storyService.getStories().then((res) => setStoriesGrouped(res.data || []));
        }}
      />

      <StoryViewerModal
        isOpen={!!selectedStoryGroup}
        onClose={() => setSelectedStoryGroup(null)}
        storyGroup={selectedStoryGroup}
        onReplyToStory={handleReplyToStory}
        onStoryDeleted={() => {
          storyService.getStories().then((res) => setStoriesGrouped(res.data || []));
        }}
      />

      {/* WebRTC Video & Audio Calling Modal */}
      <CallModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
            <MainApp />
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
