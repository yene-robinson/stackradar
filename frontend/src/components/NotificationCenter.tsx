/**
 * StackRadar Notification Center
 * 
 * Dropdown panel for viewing and managing notifications
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  formatNotificationTime, 
  getNotificationIcon,
  Notification,
} from '@/services/notificationService';

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    preferences,
    markRead,
    markAllRead,
    remove,
    clearAll,
    updatePreferences,
  } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    markRead(notification.id);
    if (notification.action?.url) {
      if (notification.action.url.startsWith('http')) {
        window.open(notification.action.url, '_blank');
      } else {
        window.location.href = notification.action.url;
      }
    }
    if (notification.action?.callback) {
      notification.action.callback();
    }
  };

  return (
    <div className={cn('relative', className)} ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-medium text-foreground">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    showSettings 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-b border-border"
                >
                  <div className="p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notifications Enabled</span>
                      <button
                        onClick={() => updatePreferences({ enabled: !preferences.enabled })}
                        className={cn(
                          'w-10 h-5 rounded-full transition-colors relative',
                          preferences.enabled ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                            preferences.enabled ? 'left-5' : 'left-0.5'
                          )}
                        />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={preferences.transactionAlerts}
                          onChange={(e) => updatePreferences({ transactionAlerts: e.target.checked })}
                          className="rounded border-border"
                        />
                        Transaction alerts
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={preferences.priceAlerts}
                          onChange={(e) => updatePreferences({ priceAlerts: e.target.checked })}
                          className="rounded border-border"
                        />
                        Price alerts ({preferences.priceThreshold}% change)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={preferences.yieldAlerts}
                          onChange={(e) => updatePreferences({ yieldAlerts: e.target.checked })}
                          className="rounded border-border"
                        />
                        Yield opportunity alerts
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={preferences.portfolioAlerts}
                          onChange={(e) => updatePreferences({ portfolioAlerts: e.target.checked })}
                          className="rounded border-border"
                        />
                        Portfolio value alerts
                      </label>
                    </div>

                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-xs text-destructive hover:underline"
                      >
                        Clear all notifications
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group',
                        !notification.read && 'bg-primary/5'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Icon */}
                      <span className="text-lg mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            'text-sm font-medium',
                            !notification.read && 'text-foreground'
                          )}>
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatNotificationTime(notification.timestamp)}
                          </span>
                          {notification.action && (
                            <span className="text-[10px] text-primary font-medium">
                              {notification.action.label} →
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(notification.id);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
