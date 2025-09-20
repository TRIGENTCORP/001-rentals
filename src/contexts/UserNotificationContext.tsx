import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { localNotificationService, NotificationData } from '@/services/localNotificationService';
import { useAuth } from '@/hooks/useAuth';

interface UserNotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationData, 'id' | 'created_at' | 'user_id'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const UserNotificationContext = createContext<UserNotificationContextType | undefined>(undefined);

interface UserNotificationProviderProps {
  children: ReactNode;
  userId?: string;
}

export const UserNotificationProvider: React.FC<UserNotificationProviderProps> = ({ 
  children, 
  userId 
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Use the provided userId or fall back to the authenticated user's ID
  const currentUserId = userId || user?.id || 'anonymous_user';

  // Load notifications on mount
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications = localNotificationService.getNotifications();
      
      const userNotifications = allNotifications
        .filter(notification => 
          notification.user_id === currentUserId || 
          notification.user_id === 'all_users'
        );
      
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    };

    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = localNotificationService.subscribe((notification) => {
      if (notification.user_id === currentUserId || notification.user_id === 'all_users') {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    return unsubscribe;
  }, [currentUserId]);

  const addNotification = async (notificationData: Omit<NotificationData, 'id' | 'created_at' | 'user_id'>) => {
    try {
      await localNotificationService.createUserNotification({
        ...notificationData,
        user_id: currentUserId
      });
    } catch (error) {
      console.error('Failed to add user notification:', error);
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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await localNotificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value: UserNotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <UserNotificationContext.Provider value={value}>
      {children}
    </UserNotificationContext.Provider>
  );
};

export const useUserNotifications = (): UserNotificationContextType => {
  const context = useContext(UserNotificationContext);
  if (context === undefined) {
    throw new Error('useUserNotifications must be used within a UserNotificationProvider');
  }
  return context;
};

// Export the context for debugging
export { UserNotificationContext };
