import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, refreshUser } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5001';

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO Server');
      newSocket.emit('join', user.id);
    });

    // Real-time Event Listeners
    newSocket.on('subscription:upgraded', (data) => {
      console.log('🎉 Subscription upgraded event received:', data);
      
      toast.success(data.message || `Đã nâng cấp lên gói ${data.level}!`, {
        duration: 8000,
        icon: '💎',
      });

      // Refresh the user context to get the new level
      refreshUser();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]); // Re-run when user changes (login/logout)

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
