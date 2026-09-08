import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and optionally trigger event
      console.warn('Session expired or unauthorized');
    }
    return Promise.reject(error);
  }
);

// --- Auth Services ---
export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  sendOtp: (email) => api.post('/api/auth/send-otp', { email }),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  getMe: () => api.get('/api/auth/me'),
};

// --- User Services ---
export const userService = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  changePassword: (passwords) => api.put('/api/users/change-password', passwords),
  searchUsers: (query) => api.get(`/api/users/search?query=${encodeURIComponent(query)}`),
  heartbeat: () => api.post('/api/users/heartbeat'),
  setOffline: () => api.post('/api/users/offline'),
  getUserPresence: (userId) => api.get(`/api/users/presence/${userId}`),
};

// --- Friend Request & Friends Services ---
export const friendService = {
  getFriends: () => api.get('/api/friends'),
  getRequests: () => api.get('/api/friends/requests'),
  sendRequest: (recipientId) => api.post(`/api/friends/request/${recipientId}`),
  acceptRequest: (requestId) => api.put(`/api/friends/accept/${requestId}`),
  rejectRequest: (requestId) => api.put(`/api/friends/reject/${requestId}`),
  cancelRequest: (requestId) => api.delete(`/api/friends/cancel/${requestId}`),
  removeFriend: (friendId) => api.delete(`/api/friends/${friendId}`),
};

// --- Conversation Services ---
export const conversationService = {
  getConversations: () => api.get('/api/conversations'),
  createOrGet: (userId) => api.post('/api/conversations', { userId }),
  getById: (id) => api.get(`/api/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/api/conversations/${id}`),
};

// --- Message Services ---
export const messageService = {
  getMessages: (conversationId, page = 1) =>
    api.get(`/api/messages/${conversationId}?page=${page}`),
  sendMessage: (messageData) => api.post('/api/messages', messageData),
  markAsRead: (conversationId) => api.put(`/api/messages/read/${conversationId}`),
  deleteMessage: (id) => api.delete(`/api/messages/${id}`),
  clearChat: (conversationId) => api.delete(`/api/messages/clear/${conversationId}`),
};

// --- Story / Status Services ---
export const storyService = {
  getStories: () => api.get('/api/stories'),
  createStory: (storyData) => api.post('/api/stories', storyData),
  viewStory: (storyId) => api.post(`/api/stories/${storyId}/view`),
  reactToStory: (storyId, emoji) => api.post(`/api/stories/${storyId}/react`, { emoji }),
  getViewers: (storyId) => api.get(`/api/stories/${storyId}/viewers`),
  deleteStory: (storyId) => api.delete(`/api/stories/${storyId}`),
};

// --- File Upload Service ---
export const uploadService = {
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
};

// --- WebRTC Call Signaling Service ---
export const callService = {
  initiateCall: (data) => api.post('/api/calls/initiate', data),
  getIncomingCall: () => api.get('/api/calls/incoming'),
  answerCall: (data) => api.post('/api/calls/answer', data),
  pollCall: (callId) => api.get(`/api/calls/${callId}/poll`),
  addCandidate: (data) => api.post('/api/calls/candidate', data),
  endCall: (callId) => api.post('/api/calls/end', { callId }),
};

export default api;
