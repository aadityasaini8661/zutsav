import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import API from '../api/axios';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const socketRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch { /* non-critical */ }
  }, [user]);

  const fetchNotifications = useCallback(async (page = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/notifications?page=${page}&limit=20`);
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...data.notifications]);
      }
      setUnreadCount(data.unread);
      return data;
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, [user]);

  const markRead = useCallback(async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    const n = notifications.find((x) => x._id === id);
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((x) => x._id !== id));
      if (n && !n.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      await API.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  // Connect Socket.IO when user logs in
  useEffect(() => {
    if (!user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('zutsav_token');
    if (!token) return;

    const apiBase = process.env.REACT_APP_API_URL || 'https://zutsav-production.up.railway.app/api';
    const serverUrl = apiBase.replace('/api', '');

    const socket = io(serverUrl, {
      auth:        { token },
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected');
      fetchUnreadCount();
    });

    socket.on('new_notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
      toast(notification.title, {
        icon: 'ðŸ””',
        duration: 4000,
        style: { fontFamily: 'sans-serif', fontSize: '14px' },
      });
    });

    socket.on('disconnect', () => console.log('[Socket.IO] Disconnected'));
    socket.on('connect_error', (err) => console.warn('[Socket.IO] Error:', err.message));

    socketRef.current = socket;

    // Initial load
    fetchNotifications(1);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      fetchNotifications, fetchUnreadCount,
      markRead, markAllRead,
      deleteNotification, clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

