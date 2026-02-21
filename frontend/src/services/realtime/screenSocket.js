import { io } from 'socket.io-client';

// Singleton Socket.io client for proctoring / screen sharing
// Make sure BACKEND_URL matches your backend origin.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const screenSocket = io(BACKEND_URL, {
  withCredentials: true,
  autoConnect: false,
});

export default screenSocket;












