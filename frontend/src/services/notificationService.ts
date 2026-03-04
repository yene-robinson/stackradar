/**
 * StackRadar Notification Service
 * 
 * Handles notifications for:
 * - Transaction confirmations
 * - Price alerts
 * - Yield opportunity changes
 * - Portfolio value changes
 */

// ============================================
// TYPES
// ============================================

export type NotificationType = 
  | 'transaction' 
  | 'price_alert' 
  | 'yield_alert' 
  | 'portfolio_alert'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: NotificationPriority;
  data?: Record<string, unknown>;
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  transactionAlerts: boolean;
  priceAlerts: boolean;
  yieldAlerts: boolean;
  portfolioAlerts: boolean;
  priceThreshold: number; // % change to trigger alert
  yieldThreshold: number; // APY change to trigger alert
}

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'stackradar_notifications';
const PREFERENCES_KEY = 'stackradar_notification_prefs';

function getStoredNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: Notification[]): void {
  try {
    // Keep only last 50 notifications
    const trimmed = notifications.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

export function getPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  transactionAlerts: true,
  priceAlerts: true,
  yieldAlerts: true,
  portfolioAlerts: true,
  priceThreshold: 5, // 5% price change
  yieldThreshold: 2, // 2% APY change
};

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

let notifications: Notification[] = getStoredNotifications();
let listeners: Array<(notifications: Notification[]) => void> = [];

export function subscribe(listener: (notifications: Notification[]) => void): () => void {
  listeners.push(listener);
  listener(notifications); // Initial call
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function notifyListeners(): void {
  listeners.forEach(l => l(notifications));
}

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function addNotification(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Notification {
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    timestamp: Date.now(),
    read: false,
  };
  
  notifications = [newNotification, ...notifications];
  saveNotifications(notifications);
  notifyListeners();
  
  return newNotification;
}

export function markAsRead(id: string): void {
  notifications = notifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(notifications);
  notifyListeners();
}

export function markAllAsRead(): void {
  notifications = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(notifications);
  notifyListeners();
}

export function deleteNotification(id: string): void {
  notifications = notifications.filter(n => n.id !== id);
  saveNotifications(notifications);
  notifyListeners();
}

export function clearAllNotifications(): void {
  notifications = [];
  saveNotifications(notifications);
  notifyListeners();
}

export function getNotifications(): Notification[] {
  return notifications;
}

export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length;
}

// ============================================
// NOTIFICATION CREATORS
// ============================================

export function notifyTransactionConfirmed(
  txId: string,
  type: string,
  success: boolean
): Notification {
  return addNotification({
    type: 'transaction',
    title: success ? 'Transaction Confirmed' : 'Transaction Failed',
    message: success 
      ? `Your ${type} transaction has been confirmed.`
      : `Your ${type} transaction failed. Please try again.`,
    priority: success ? 'medium' : 'high',
    data: { txId },
    action: {
      label: 'View on Explorer',
      url: `https://explorer.hiro.so/txid/${txId}?chain=testnet`,
    },
  });
}

export function notifyTransactionPending(txId: string, type: string): Notification {
  return addNotification({
    type: 'transaction',
    title: 'Transaction Pending',
    message: `Your ${type} transaction is being processed...`,
    priority: 'low',
    data: { txId },
  });
}

export function notifyPriceAlert(
  token: string,
  currentPrice: number,
  changePercent: number
): Notification {
  const direction = changePercent > 0 ? 'up' : 'down';
  const emoji = changePercent > 0 ? '📈' : '📉';
  
  return addNotification({
    type: 'price_alert',
    title: `${emoji} ${token} Price ${direction === 'up' ? 'Surge' : 'Drop'}`,
    message: `${token} is ${direction} ${Math.abs(changePercent).toFixed(1)}% to $${currentPrice.toFixed(2)}`,
    priority: Math.abs(changePercent) > 10 ? 'high' : 'medium',
    data: { token, currentPrice, changePercent },
  });
}

export function notifyYieldOpportunity(
  protocol: string,
  pool: string,
  apy: number,
  previousApy?: number
): Notification {
  const isNew = previousApy === undefined;
  const change = previousApy ? apy - previousApy : 0;
  
  return addNotification({
    type: 'yield_alert',
    title: isNew ? '🔥 New Yield Opportunity' : '📊 Yield Rate Changed',
    message: isNew
      ? `${protocol} launched ${pool} with ${apy}% APY!`
      : `${protocol} ${pool} APY changed to ${apy}% (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`,
    priority: apy > 15 ? 'high' : 'medium',
    data: { protocol, pool, apy, previousApy },
    action: {
      label: 'View Opportunity',
      url: '/yield',
    },
  });
}

export function notifyPortfolioChange(
  currentValue: number,
  changePercent: number
): Notification {
  const direction = changePercent > 0 ? 'increased' : 'decreased';
  
  return addNotification({
    type: 'portfolio_alert',
    title: `Portfolio ${direction === 'increased' ? 'Gain' : 'Loss'}`,
    message: `Your portfolio has ${direction} by ${Math.abs(changePercent).toFixed(1)}% to $${currentValue.toFixed(2)}`,
    priority: Math.abs(changePercent) > 10 ? 'high' : 'low',
    data: { currentValue, changePercent },
  });
}

export function notifySystem(title: string, message: string): Notification {
  return addNotification({
    type: 'system',
    title,
    message,
    priority: 'low',
  });
}

// ============================================
// PRICE MONITORING
// ============================================

interface PriceState {
  stx: number;
  btc: number;
  lastCheck: number;
}

let priceState: PriceState | null = null;
let priceMonitorInterval: NodeJS.Timeout | null = null;

export async function startPriceMonitoring(): Promise<void> {
  // Don't start if already running
  if (priceMonitorInterval) return;
  
  const prefs = getPreferences();
  if (!prefs.enabled || !prefs.priceAlerts) return;
  
  // Check prices every 5 minutes
  const checkPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) return;
      
      const data = await response.json();
      const currentStx = data.blockstack?.usd || 0;
      const currentBtc = data.bitcoin?.usd || 0;
      
      if (priceState) {
        const stxChange = ((currentStx - priceState.stx) / priceState.stx) * 100;
        const btcChange = ((currentBtc - priceState.btc) / priceState.btc) * 100;
        
        const threshold = prefs.priceThreshold;
        
        if (Math.abs(stxChange) >= threshold) {
          notifyPriceAlert('STX', currentStx, stxChange);
        }
        
        if (Math.abs(btcChange) >= threshold) {
          notifyPriceAlert('BTC', currentBtc, btcChange);
        }
      }
      
      priceState = {
        stx: currentStx,
        btc: currentBtc,
        lastCheck: Date.now(),
      };
    } catch (error) {
      console.error('Error checking prices:', error);
    }
  };
  
  // Initial check
  await checkPrices();
  
  // Set up interval
  priceMonitorInterval = setInterval(checkPrices, 5 * 60 * 1000);
}

export function stopPriceMonitoring(): void {
  if (priceMonitorInterval) {
    clearInterval(priceMonitorInterval);
    priceMonitorInterval = null;
  }
}

// ============================================
// TRANSACTION MONITORING
// ============================================

const pendingTransactions = new Map<string, { type: string; startTime: number }>();

export function trackTransaction(txId: string, type: string): void {
  pendingTransactions.set(txId, { type, startTime: Date.now() });
  notifyTransactionPending(txId, type);
  
  // Poll for confirmation
  pollTransactionStatus(txId);
}

async function pollTransactionStatus(txId: string): Promise<void> {
  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;
  
  const check = async () => {
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/tx/${txId}`
      );
      
      if (!response.ok) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 5000);
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.tx_status === 'success') {
        const pending = pendingTransactions.get(txId);
        if (pending) {
          notifyTransactionConfirmed(txId, pending.type, true);
          pendingTransactions.delete(txId);
        }
      } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        const pending = pendingTransactions.get(txId);
        if (pending) {
          notifyTransactionConfirmed(txId, pending.type, false);
          pendingTransactions.delete(txId);
        }
      } else {
        // Still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 5000);
        }
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(check, 5000);
      }
    }
  };
  
  setTimeout(check, 5000);
}

// ============================================
// FORMAT HELPERS
// ============================================

export function formatNotificationTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'transaction': return '💸';
    case 'price_alert': return '📊';
    case 'yield_alert': return '🌾';
    case 'portfolio_alert': return '📈';
    case 'system': return '🔔';
    default: return '📢';
  }
}
