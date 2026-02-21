import axiosClient from '../axiosClient';

const chatAPI = {
  /**
   * Get or create chat room for a test
   */
  getOrCreateChatRoom: async (testId) => {
    const response = await axiosClient.get(`/v1/chat/room/${testId}`);
    return response?.data || response;
  },

  /**
   * Get chat messages for a room
   */
  getChatMessages: async (roomId, page = 1, limit = 50) => {
    const response = await axiosClient.get(`/v1/chat/room/${roomId}/messages`, {
      params: { page, limit },
    });
    return response?.data || response;
  },

  /**
   * Send a chat message
   */
  sendMessage: async (chatRoomId, message) => {
    const response = await axiosClient.post('/v1/chat/message', {
      chatRoomId,
      message,
    });
    return response?.data || response;
  },

  /**
   * Mark message as read
   */
  markMessageAsRead: async (messageId) => {
    const response = await axiosClient.post(`/v1/chat/message/${messageId}/read`);
    return response?.data || response;
  },

  /**
   * Get students list for teacher chat panel
   */
  getTestStudents: async (testId) => {
    const response = await axiosClient.get(`/v1/chat/test/${testId}/students`);
    return response?.data || response;
  },
};

export default chatAPI;








