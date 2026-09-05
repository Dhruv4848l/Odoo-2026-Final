import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface RealtimeEvent {
  type: 'ATTENDANCE_UPDATE' | 'TIMEOFF_UPDATE' | 'PAYROLL_UPDATE' | 'EMPLOYEE_UPDATE' | 'NOTIFICATION' | 'CONNECTED';
  action?: string;
  payload?: any;
  notification?: {
    id?: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp?: string;
  };
  timestamp?: string;
}

interface RealtimeContextType {
  notifications: AppNotification[];
  unreadCount: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  subscribe: (eventType: string, callback: (event: RealtimeEvent) => void) => () => void;
}

const STORAGE_KEY = 'peoplepay360_notifications_v2';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_init_1',
    title: 'Payroll Cycle Active',
    message: 'September 2026 enterprise payrun cycle is open for salary validation.',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    read: false,
    actionUrl: '/payroll',
  },
  {
    id: 'notif_init_2',
    title: 'System Compliance Guard',
    message: 'Tax statutory brackets and deduction rules verified under SOC-2 policy.',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    actionUrl: '/payroll/structures',
  },
  {
    id: 'notif_init_3',
    title: 'Time & Attendance Terminal',
    message: 'On-premise punch kiosk and web attendance terminal synchronized.',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
    actionUrl: '/attendance',
  },
];

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const listenersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not persist notifications to localStorage', e);
    }
  }, [notifications]);

  // Connect WebSocket
  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      setConnectionStatus('connecting');

      const hostname = window.location.hostname || 'localhost';
      const wsUrl = window.location.protocol === 'https:'
        ? `wss://${hostname}:3000/ws`
        : `ws://${hostname}:3000/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('⚡ [Realtime] WebSocket connected to backend');
          setConnectionStatus('connected');
        };

        ws.onmessage = (e) => {
          try {
            const data: RealtimeEvent = JSON.parse(e.data);

            // Handle incoming notifications
            if (data.notification) {
              const newNotif: AppNotification = {
                id: data.notification.id || `notif_${Date.now()}`,
                title: data.notification.title,
                message: data.notification.message,
                type: data.notification.type || 'info',
                timestamp: data.notification.timestamp || data.timestamp || new Date().toISOString(),
                read: false,
              };

              setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]); // keep latest 50
            }

            // Dispatch to registered event listeners
            if (data.type) {
              const listeners = listenersRef.current.get(data.type);
              if (listeners) {
                listeners.forEach((callback) => {
                  try {
                    callback(data);
                  } catch (err) {
                    console.error('[Realtime] Callback error:', err);
                  }
                });
              }

              // Also dispatch to global listeners
              const allListeners = listenersRef.current.get('*');
              if (allListeners) {
                allListeners.forEach((callback) => callback(data));
              }

              // Global custom DOM event for other listeners
              window.dispatchEvent(new CustomEvent('peoplepay360:realtime', { detail: data }));
            }
          } catch (err) {
            console.warn('[Realtime] Parse error:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          console.log('[Realtime] WebSocket disconnected. Retrying in 3s...');
          setConnectionStatus('disconnected');
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[Realtime] WebSocket error:', err);
          ws.close();
        };
      } catch (err) {
        console.warn('[Realtime] Connection failed:', err);
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const subscribe = useCallback((eventType: string, callback: (event: RealtimeEvent) => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(callback);

    return () => {
      const set = listenersRef.current.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          listenersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionStatus,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        subscribe,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

/**
 * Hook for pages and components to subscribe to real-time events and auto-refresh without page reload.
 */
export function useRealtimeSubscription(
  eventType: string | string[],
  onEvent: (event: RealtimeEvent) => void
) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const types = Array.isArray(eventType) ? eventType : [eventType];
    const unsubscribes = types.map((type) => subscribe(type, onEvent));

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [eventType, onEvent, subscribe]);
}
