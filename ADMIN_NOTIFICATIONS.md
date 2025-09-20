# Admin Notification System

## Overview
The admin notification system provides real-time alerts to administrators when power banks are booked, confirmed, or returned. This ensures admins stay informed about all booking activities in real-time.

## Features

### 🔔 Real-time Notifications
- **Instant alerts** when new bookings are created
- **Booking confirmations** when payments are processed
- **Rental completions** when power banks are returned
- **Overdue alerts** for rentals that need attention

### 🎨 Visual Indicators
- **Notification bell** in the admin dashboard header
- **Unread count badge** showing number of pending notifications
- **Color-coded notifications** by type (blue for bookings, green for confirmations, etc.)
- **Animated indicators** for new notifications (pulse and bounce effects)

### 🔊 Audio Alerts
- **Custom notification sound** using Web Audio API
- **Gentle beep tone** that plays for new notifications
- **Non-intrusive** volume level

### 📱 Notification Management
- **Mark as read** individual notifications
- **Mark all as read** functionality
- **Clear all notifications** option
- **Notification history** with timestamps
- **Detailed booking information** in notification cards

## Technical Implementation

### Components

#### 1. AdminNotificationContext (`src/contexts/AdminNotificationContext.tsx`)
- Manages notification state and real-time subscriptions
- Handles Supabase real-time events for bookings and rentals
- Provides notification management functions
- Implements audio notifications using Web Audio API

#### 2. AdminNotificationPanel (`src/components/AdminNotificationPanel.tsx`)
- UI component for displaying notifications
- Dropdown panel with notification list
- Management controls (mark as read, clear all)
- Responsive design with scrollable content

#### 3. Integration with AdminDashboard
- Notification bell in header with unread count
- Real-time subscription setup
- Test notification functionality

### Real-time Subscriptions

The system subscribes to the following Supabase real-time events:

1. **New Bookings** (`bookings` table INSERT)
   - Triggers when a user creates a new booking
   - Fetches related station, power bank, and user details
   - Creates notification with booking information

2. **Booking Confirmations** (`bookings` table UPDATE to 'confirmed')
   - Triggers when admin confirms a booking
   - Creates confirmation notification

3. **Rental Completions** (`rentals` table UPDATE to 'completed')
   - Triggers when a rental is completed
   - Creates completion notification

### Notification Types

```typescript
type NotificationType = 
  | 'booking_created'    // New booking created
  | 'booking_confirmed'  // Booking confirmed by admin
  | 'booking_cancelled'  // Booking cancelled
  | 'rental_completed'   // Rental completed
  | 'rental_overdue';    // Rental overdue
```

## Usage

### For Administrators

1. **View Notifications**: Click the bell icon in the admin dashboard header
2. **Read Notifications**: Click on any notification to mark it as read
3. **Manage Notifications**: Use "Mark all read" or "Clear all" buttons
4. **Test System**: Use the "Test Notification" button to verify the system works

### For Developers

#### Adding New Notification Types

1. Add the new type to the `NotificationType` union in `AdminNotificationContext.tsx`
2. Update the `getNotificationIcon` and `getNotificationColor` functions in `AdminNotificationPanel.tsx`
3. Add the appropriate real-time subscription in the context

#### Customizing Notifications

```typescript
// Add a custom notification
addNotification({
  type: 'custom_type',
  title: 'Custom Title',
  message: 'Custom message',
  data: { customData: 'value' },
  read: false,
});
```

## Database Requirements

The notification system requires the following Supabase tables:
- `bookings` - For booking-related notifications
- `rentals` - For rental-related notifications
- `stations` - For station information in notifications
- `power_bank_types` - For power bank information in notifications
- `profiles` - For user information in notifications

## Browser Compatibility

- **Web Audio API**: Used for notification sounds (modern browsers)
- **Real-time subscriptions**: Requires Supabase real-time support
- **CSS animations**: Uses Tailwind CSS animation classes

## Security Considerations

- Notifications are only visible to authenticated admin users
- Real-time subscriptions are secured by Supabase RLS policies
- No sensitive data is stored in notification state

## Future Enhancements

- **Email notifications** for critical events
- **Push notifications** for mobile devices
- **Notification preferences** for different event types
- **Notification persistence** in database
- **Bulk notification actions**
- **Notification templates** for different event types
