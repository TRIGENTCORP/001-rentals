import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { localNotificationService, NotificationData } from '@/services/localNotificationService';

interface AdminNotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
};

interface AdminNotificationProviderProps {
  children: ReactNode;
}

export const AdminNotificationProvider: React.FC<AdminNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = localNotificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      // Error in fetchNotifications
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await localNotificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    } catch (error) {
      // Error in markAsRead
    }
  };

  const markAllAsRead = async () => {
    try {
      await localNotificationService.markAllAsRead();
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    } catch (error) {
      // Error in markAllAsRead
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Set up real-time subscription for new notifications
  useEffect(() => {

    // Request notification permission
    localNotificationService.requestPermission();

    // Subscribe to notification updates
    const unsubscribe = localNotificationService.subscribe((newNotification) => {
      setNotifications(prev => {
        // Check if notification already exists to avoid duplicates
        const exists = prev.some(n => n.id === newNotification.id);
        if (exists) {
          return prev;
        }
        return [newNotification, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: AdminNotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    loading
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
};