import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/v1/enterprise/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async (filters: any = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/v1/enterprise/notifications`, {
        params: filters,
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/v1/enterprise/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/v1/enterprise/notifications/mark-all-read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const acknowledge = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/v1/enterprise/notifications/${id}/acknowledge`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, acknowledgedAt: new Date() } : n)));
    } catch (error) {
      console.error('Acknowledge error:', error);
    }
  };

  const snooze = async (id: string, days: number = 3) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/v1/enterprise/notifications/${id}/snooze`,
        { days },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Remove from list temporarily
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Snooze error:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 1 minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    acknowledge,
    snooze,
  };
}
