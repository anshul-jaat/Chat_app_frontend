import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { initSocket, disconnectSocket, getSocket } from '../services/socket.js';
import { useAuth } from './AuthContext.jsx';
import { sound } from '../utils/sound.js';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // { [conversationId]: { [userId]: username } }
  const [friendRequestNotification, setFriendRequestNotification] = useState(null);
  const [storyNotification, setStoryNotification] = useState(null);

  useEffect(() => {
    if (token && user) {
      const s = initSocket(token);
      setSocket(s);

      s.on('getOnlineUsers', (userIds) => {
        setOnlineUserIds(new Set(userIds));
      });

      s.on('userOnline', ({ userId }) => {
        setOnlineUserIds((prev) => new Set([...prev, userId]));
      });

      s.on('userOffline', ({ userId }) => {
        setOnlineUserIds((prev) => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      });

      s.on('newMessage', (message) => {
        setIncomingMessage(message);
        // Play notification chime if message is from another user
        if (message.sender && message.sender._id !== user._id) {
          sound.playMessageSound();
        }
      });

      s.on('userTyping', ({ userId, username, conversationId, isTyping }) => {
        setTypingUsers((prev) => {
          const convTyping = { ...(prev[conversationId] || {}) };
          if (isTyping) {
            convTyping[userId] = username;
          } else {
            delete convTyping[userId];
          }
          return { ...prev, [conversationId]: convTyping };
        });
      });

      s.on('friendRequestReceived', (request) => {
        setFriendRequestNotification(request);
        sound.playMessageSound();
      });

      s.on('friendRequestAccepted', (data) => {
        setFriendRequestNotification({ type: 'accepted', ...data });
        sound.playMessageSound();
      });

      s.on('newStory', (story) => {
        setStoryNotification({ type: 'new', story });
      });

      s.on('storyReacted', (data) => {
        setStoryNotification({ type: 'reaction', ...data });
      });

      s.on('storyViewed', (data) => {
        setStoryNotification({ type: 'view', ...data });
      });

      return () => {
        disconnectSocket();
        setSocket(null);
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setOnlineUserIds(new Set());
    }
  }, [token, user]);

  const sendSocketMessage = (messageData) => {
    if (socket) {
      socket.emit('sendMessage', messageData);
    }
  };

  const sendTypingStatus = (conversationId, isTyping) => {
    if (socket) {
      socket.emit('typing', { conversationId, isTyping });
    }
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUserIds.has(userId.toString());
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUserIds,
        isUserOnline,
        incomingMessage,
        typingUsers,
        sendSocketMessage,
        sendTypingStatus,
        friendRequestNotification,
        clearFriendNotification: () => setFriendRequestNotification(null),
        storyNotification,
        clearStoryNotification: () => setStoryNotification(null),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
