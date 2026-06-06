import { useState, useEffect, useCallback, useRef } from "react";
import { getNotifications, markRead, markAllRead, deleteNotification } from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 3000;

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const pollRef = useRef(null);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      clearInterval(pollRef.current);
      return;
    }
    setLoading(true);
    fetch().finally(() => setLoading(false));
    pollRef.current = setInterval(fetch, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [isAuthenticated, fetch]);

  // Re-fetch when tab becomes visible
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") fetch(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetch]);

  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id) => {
    const notif = notifications.find(n => n._id === id);
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (notif && !notif.isRead) setUnreadCount(c => Math.max(0, c - 1));
  };

  return { notifications, unreadCount, loading, handleMarkRead, handleMarkAllRead, handleDelete, refetch: fetch };
}
