import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Singleton Socket.io client for chat
// Only create one instance to prevent multiple connections
let chatSocketInstance = null;

const getChatSocket = () => {
  if (!chatSocketInstance) {
    chatSocketInstance = io(`${BACKEND_URL}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false, // Reuse existing connection
      autoConnect: true,
    });

    // Handle connection events
    chatSocketInstance.on('connect', () => {
      console.log('[ChatSocket] Connected');
    });

    chatSocketInstance.on('disconnect', (reason) => {
      console.log('[ChatSocket] Disconnected:', reason);
    });

    chatSocketInstance.on('connect_error', (error) => {
      console.error('[ChatSocket] Connection error:', error);
    });
  }
  
  return chatSocketInstance;
};

const chatSocket = getChatSocket();

export default chatSocket;









