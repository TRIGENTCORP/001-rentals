import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserNotifications } from '@/contexts/UserNotificationContext';
import { NotificationData } from '@/services/localNotificationService';

const UserNotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useUserNotifications();
  const [isOpen, setIsOpen] = useState(false);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'return_confirmed':
        return '✅';
      case 'booking_confirmed':
        return '🎉';
      case 'rental_completed':
        return '🔋';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'return_confirmed':
        return 'text-green-600';
      case 'booking_confirmed':
        return 'text-blue-600';
      case 'rental_completed':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-6 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification: NotificationData) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-lg ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default UserNotificationBell;
