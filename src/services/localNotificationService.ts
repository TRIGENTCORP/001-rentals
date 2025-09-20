import { validateAndSanitizeInput, isValidUUID } from '@/utils/validation';

export interface NotificationData {
  id: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'rental_completed' | 'rental_overdue' | 'return_confirmed' | 'promotional_update';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

class LocalNotificationService {
  private static instance: LocalNotificationService;
  private listeners: Set<(notification: NotificationData) => void> = new Set();
  private adminStorageKey = 'admin_notifications';
  private userStorageKey = 'user_notifications';

  private constructor() {}

  static getInstance(): LocalNotificationService {
    if (!LocalNotificationService.instance) {
      LocalNotificationService.instance = new LocalNotificationService();
    }
    return LocalNotificationService.instance;
  }

  /**
   * Create admin notification
   */
  async createAdminNotification(notification: {
    type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'rental_completed' | 'rental_overdue' | 'promotional_update';
    title: string;
    message: string;
    data: any;
  }): Promise<void> {
    try {
      // Validate input data
      const titleValidation = validateAndSanitizeInput(notification.title, 'text');
      const messageValidation = validateAndSanitizeInput(notification.message, 'text');
      
      if (!titleValidation.isValid || !messageValidation.isValid) {
        throw new Error('Invalid notification data');
      }

      const newNotification: NotificationData = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type,
        title: titleValidation.sanitized,
        message: messageValidation.sanitized,
        data: notification.data,
        read: false,
        created_at: new Date().toISOString(),
        user_id: 'admin_user' // Default admin user for local storage
      };

      // Get existing notifications
      const existingNotifications = this.getNotifications();
      
      // Add new notification to the beginning
      const updatedNotifications = [newNotification, ...existingNotifications];
      
      // Keep only the last 50 notifications
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      // Save to localStorage
      localStorage.setItem(this.adminStorageKey, JSON.stringify(limitedNotifications));

      // Broadcast to listeners immediately
      this.broadcastNotification(newNotification);

      // Also trigger browser notification if permission is granted
      this.showBrowserNotification(newNotification);

      return Promise.resolve();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create user notification
   */
  async createUserNotification(notification: {
    type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'rental_completed' | 'rental_overdue' | 'return_confirmed' | 'promotional_update';
    title: string;
    message: string;
    data: any;
    user_id: string;
  }): Promise<void> {
    try {

      const newNotification: NotificationData = {
        id: `user_notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: false,
        created_at: new Date().toISOString(),
        user_id: notification.user_id
      };

      // Get existing user notifications
      const existingNotifications = this.getUserNotifications();
      
      // Add new notification to the beginning
      const updatedNotifications = [newNotification, ...existingNotifications];
      
      // Keep only the last 50 notifications
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      // Save to localStorage
      localStorage.setItem(this.userStorageKey, JSON.stringify(limitedNotifications));

      // Broadcast to listeners immediately
      this.broadcastNotification(newNotification);

      // Also trigger browser notification if permission is granted
      this.showBrowserNotification(newNotification);

      return Promise.resolve();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get notifications from localStorage
   */
  getNotifications(): NotificationData[] {
    try {
      const adminStored = localStorage.getItem(this.adminStorageKey);
      const userStored = localStorage.getItem(this.userStorageKey);
      
      const adminNotifications = adminStored ? JSON.parse(adminStored) : [];
      const userNotifications = userStored ? JSON.parse(userStored) : [];
      
      return [...adminNotifications, ...userNotifications];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get admin notifications from localStorage
   */
  getAdminNotifications(): NotificationData[] {
    try {
      const stored = localStorage.getItem(this.adminStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get user notifications from localStorage
   */
  getUserNotifications(): NotificationData[] {
    try {
      const stored = localStorage.getItem(this.userStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const adminNotifications = this.getAdminNotifications();
      const userNotifications = this.getUserNotifications();
      
      const updatedAdminNotifications = adminNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      
      const updatedUserNotifications = userNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      
      localStorage.setItem(this.adminStorageKey, JSON.stringify(updatedAdminNotifications));
      localStorage.setItem(this.userStorageKey, JSON.stringify(updatedUserNotifications));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const adminNotifications = this.getAdminNotifications();
      const userNotifications = this.getUserNotifications();
      
      const updatedAdminNotifications = adminNotifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      const updatedUserNotifications = userNotifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      localStorage.setItem(this.adminStorageKey, JSON.stringify(updatedAdminNotifications));
      localStorage.setItem(this.userStorageKey, JSON.stringify(updatedUserNotifications));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notification: NotificationData) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Broadcast notification to all listeners
   */
  private broadcastNotification(notification: NotificationData): void {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
      }
    });
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: NotificationData): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false
      });
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get permission status
   */
  getPermissionStatus(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }
}

// Export singleton instance
export const localNotificationService = LocalNotificationService.getInstance();

// Convenience functions
export const notifyBookingCreated = async (bookingData: any): Promise<void> => {
  const customerName = bookingData.user?.full_name || bookingData.user?.email || 'Unknown Customer';
  const stationName = bookingData.station?.name || 'Unknown Station';
  const powerBankName = bookingData.power_bank_type?.name || 'Unknown Power Bank';
  const amount = bookingData.total_amount || 0;
  const paymentMethod = bookingData.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Card Payment';

  await localNotificationService.createAdminNotification({
    type: 'booking_created',
    title: '🔔 New Booking Alert',
    message: `New booking ${bookingData.order_id} created by ${customerName} for ${powerBankName} at ${stationName}. Amount: ₦${amount} (${paymentMethod})`,
    data: {
      ...bookingData,
      notification_details: {
        customer_name: customerName,
        station_name: stationName,
        power_bank_name: powerBankName,
        amount: amount,
        payment_method: paymentMethod,
        urgency: 'high',
        action_required: 'confirm_payment'
      }
    }
  });
};

export const notifyBookingConfirmed = async (bookingData: any): Promise<void> => {
  const customerName = bookingData.user?.full_name || bookingData.user?.email || 'Unknown Customer';
  const returnTime = bookingData.end_time ? new Date(bookingData.end_time).toLocaleString() : 'Not set';

  await localNotificationService.createAdminNotification({
    type: 'booking_confirmed',
    title: '✅ Booking Confirmed',
    message: `Booking ${bookingData.order_id} confirmed for ${customerName}. Return time: ${returnTime}`,
    data: {
      ...bookingData,
      notification_details: {
        customer_name: customerName,
        return_time: returnTime,
        urgency: 'medium',
        action_required: 'none'
      }
    }
  });
};

export const notifyReturnConfirmed = async (rentalData: any): Promise<void> => {
  const customerName = rentalData.profiles?.full_name || rentalData.profiles?.email || 'Unknown Customer';
  const stationName = rentalData.station?.name || 'Unknown Station';
  const powerBankName = rentalData.power_bank_type?.name || 'Unknown Power Bank';
  const returnTime = new Date().toLocaleString();
  const customerId = rentalData.user_id;

  // Send admin notification
  await localNotificationService.createAdminNotification({
    type: 'rental_completed',
    title: '🎉 Return Confirmed',
    message: `Return confirmed for ${customerName} at ${stationName}. Power bank: ${powerBankName}. Return time: ${returnTime}`,
    data: {
      ...rentalData,
      notification_details: {
        customer_name: customerName,
        station_name: stationName,
        power_bank_name: powerBankName,
        return_time: returnTime,
        urgency: 'low',
        action_required: 'none',
        notification_type: 'return_confirmation'
      }
    }
  });

  // Send user notification
  if (customerId) {
    await localNotificationService.createUserNotification({
      type: 'return_confirmed',
      title: '✅ Return Confirmed',
      message: `Your power bank return has been confirmed at ${stationName}. Thank you for using our service!`,
      data: {
        ...rentalData,
        notification_details: {
          station_name: stationName,
          power_bank_name: powerBankName,
          return_time: returnTime,
          urgency: 'low',
          action_required: 'none',
          notification_type: 'return_confirmation'
        }
      },
      user_id: customerId
    });
  }
};

export const notifyPromotionalUpdate = async (promoData: {
  title: string;
  message: string;
  discount_percentage?: number;
  start_date?: string;
  end_date?: string;
}): Promise<void> => {

  // Send admin notification
  await localNotificationService.createAdminNotification({
    type: 'promotional_update',
    title: '📢 Promotional Update Created',
    message: `New promotional update "${promoData.title}" has been created and sent to all customers.`,
    data: {
      ...promoData,
      notification_details: {
        promo_title: promoData.title,
        promo_message: promoData.message,
        discount_percentage: promoData.discount_percentage,
        start_date: promoData.start_date,
        end_date: promoData.end_date,
        urgency: 'medium',
        action_required: 'none',
        notification_type: 'promotional_update_created'
      }
    }
  });

  // Send promotional notification to all customers
  // Note: In a real app, you'd fetch all customer IDs from the database
  // For now, we'll create a notification that can be picked up by any logged-in user
  const promoMessage = promoData.discount_percentage 
    ? `${promoData.message} Get ${promoData.discount_percentage}% off!`
    : promoData.message;

  const promoTitle = promoData.discount_percentage 
    ? `🎉 ${promoData.title} - ${promoData.discount_percentage}% OFF!`
    : `📢 ${promoData.title}`;

  // Create a special notification for all users (using a special user_id)
  await localNotificationService.createUserNotification({
    type: 'promotional_update',
    title: promoTitle,
    message: promoMessage,
    data: {
      ...promoData,
      notification_details: {
        promo_title: promoData.title,
        promo_message: promoData.message,
        discount_percentage: promoData.discount_percentage,
        start_date: promoData.start_date,
        end_date: promoData.end_date,
        urgency: 'medium',
        action_required: 'none',
        notification_type: 'promotional_update'
      }
    },
    user_id: 'all_users' // Special identifier for notifications sent to all users
  });

};
