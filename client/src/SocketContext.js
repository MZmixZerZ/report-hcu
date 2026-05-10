// ─────────────────────────────────────────────────────────────────────────────
// SocketContext.js — Socket.IO client context
// Manages a single persistent connection and automatically joins rooms
// based on the authenticated user's id and role.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user, userRole } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Create connection once — with auto-reconnect
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Join rooms whenever auth state changes
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    if (user?.uid) {
      s.emit('join', user.uid);
    }
    if (userRole) {
      s.emit('join_department', `role:${userRole}`);
    }
  }, [user, userRole]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
