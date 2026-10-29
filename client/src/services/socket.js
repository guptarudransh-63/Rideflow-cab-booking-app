import { io } from 'socket.io-client';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    const token = localStorage.getItem('rideflow_token');
    socketInstance = io(window.location.origin, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to server with ID:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection warning:', err.message);
    });
  }
  return socketInstance;
};

export const resetSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
