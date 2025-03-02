import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false
});

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (!token) return;
      
      // Initialize socket connection
      const socketInstance = io('http://localhost:5000', {
        auth: { token },
        withCredentials: true
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        socketInstance.close();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setConnected(false);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};