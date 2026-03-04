/**
 * StackRadar Notification Hook
 * 
 * React hook for managing notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  subscribe,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  savePreferences,
  startPriceMonitoring,
  trackTransaction,
  notifySystem,
  Notification,
  NotificationPreferences,
} from '@/services/notificationService';

// ============================================
// useNotifications HOOK
// ============================================

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(getNotifications());
  const [unreadCount, setUnreadCount] = useState(getUnreadCount());
  const [preferences, setPreferences] = useState<NotificationPreferences>(getPreferences());

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = subscribe((updated) => {
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
    });

    return unsubscribe;
  }, []);

  // Start price monitoring on mount
  useEffect(() => {
    if (preferences.enabled && preferences.priceAlerts) {
      startPriceMonitoring();
    }
  }, [preferences.enabled, preferences.priceAlerts]);

  const markRead = useCallback((id: string) => {
    markAsRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    markAllAsRead();
  }, []);

  const remove = useCallback((id: string) => {
    deleteNotification(id);
  }, []);

  const clearAll = useCallback(() => {
    clearAllNotifications();
  }, []);

  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    savePreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  const track = useCallback((txId: string, type: string) => {
    trackTransaction(txId, type);
  }, []);

  const notify = useCallback((title: string, message: string) => {
    notifySystem(title, message);
  }, []);

  return {
    notifications,
    unreadCount,
    preferences,
    markRead,
    markAllRead,
    remove,
    clearAll,
    updatePreferences,
    trackTransaction: track,
    notify,
    hasUnread: unreadCount > 0,
  };
}

// ============================================
// useNotificationToast HOOK
// ============================================

/**
 * Hook that shows toast notifications for new notifications
 */
export function useNotificationToasts() {
  const { notifications } = useNotifications();
  const [lastSeen, setLastSeen] = useState<number>(Date.now());

  useEffect(() => {
    // Find new notifications since last check
    const newNotifications = notifications.filter(
      n => n.timestamp > lastSeen && !n.read
    );

    // We could show toasts here using sonner
    // For now, just update lastSeen
    if (notifications.length > 0) {
      setLastSeen(Date.now());
    }
  }, [notifications, lastSeen]);
}
