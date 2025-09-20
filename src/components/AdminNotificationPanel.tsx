import React, { useState } from 'react';
import { Bell, X, Check, Trash2, AlertCircle, CheckCircle, Clock, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import CopyButton from '@/components/CopyButton';
import { useAdminNotifications } from '@/contexts/AdminNotificationContext';

const AdminNotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Safely get notification data
  let notifications: any[] = [];
  let unreadCount = 0;
  let markAsRead = () => {};
  let markAllAsRead = () => {};
  let clearNotifications = () => {};

  try {
    const notificationData = useAdminNotifications();
    notifications = notificationData.notifications || [];
    unreadCount = notificationData.unreadCount || 0;
    markAsRead = notificationData.markAsRead || (() => {});
    markAllAsRead = notificationData.markAllAsRead || (() => {});
    clearNotifications = notificationData.clearNotifications || (() => {});
  } catch (error) {
    // Failed to get notification data
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
        return <Battery className="w-4 h-4 text-blue-600" />;
      case 'booking_confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'booking_cancelled':
        return <X className="w-4 h-4 text-red-600" />;
      case 'rental_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rental_overdue':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_created':
        return 'border-blue-200 bg-blue-50';
      case 'booking_confirmed':
        return 'border-green-200 bg-green-50';
      case 'booking_cancelled':
        return 'border-red-200 bg-red-50';
      case 'rental_completed':
        return 'border-green-200 bg-green-50';
      case 'rental_overdue':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative transition-all duration-200 ${
          unreadCount > 0 ? 'animate-pulse' : ''
        }`}
      >
        <Bell className={`w-5 h-5 transition-colors ${
          unreadCount > 0 ? 'text-blue-600' : ''
        }`} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 z-50">
          <Card className="border-0 shadow-lg bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearNotifications}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                    <p className="text-sm">You'll see booking alerts here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-l-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                          notification.read ? 'opacity-60' : ''
                        } ${getNotificationColor(notification.type)}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.created_at).toLocaleTimeString()}
                            </div>
                            
                            {/* Show booking details for booking_created notifications */}
                            {notification.type === 'booking_created' && notification.data?.booking && (
                              <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium">Order ID:</span>
                                    <br />
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono">{notification.data.booking.order_id}</span>
                                      <CopyButton 
                                        text={notification.data.booking.order_id} 
                                        copyMessage="Order ID copied to clipboard!"
                                        size="sm"
                                        variant="ghost"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Amount:</span>
                                    <br />
                                    <span>₦{notification.data.booking.total_amount}</span>
                                  </div>
                                </div>
                                <div className="mt-1">
                                  <span className="font-medium">Station:</span>{' '}
                                  {notification.data.station?.name}
                                </div>
                                <div>
                                  <span className="font-medium">Power Bank:</span>{' '}
                                  {notification.data.powerBank?.name} ({notification.data.powerBank?.capacity_mah}mAh)
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationPanel;
