import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  type: 'rental_started' | 'rental_completed' | 'payment_processed' | 'booking_created';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'completed' | 'pending';
  amount?: number;
  location?: string;
  station_name?: string;
}

export const useRecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      
      // Fetch recent rentals
      const { data: rentals, error: rentalsError } = await supabase
        .from('rentals')
        .select(`
          id,
          status,
          start_time,
          end_time,
          total_amount,
          created_at,
          station:stations(name, address)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (rentalsError) throw rentalsError;

      // Fetch recent bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          order_id,
          status,
          total_amount,
          created_at,
          station:stations(name, address)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) {
        console.warn('Could not fetch bookings:', bookingsError);
      }

      // Combine and format activities
      const allActivities: ActivityItem[] = [];

      // Process rentals
      if (rentals) {
        rentals.forEach(rental => {
          if (rental.status === 'active') {
            allActivities.push({
              id: `rental-${rental.id}`,
              type: 'rental_started',
              title: 'Started rental',
              description: `Power bank rental at ${rental.station?.name || 'Unknown Station'}`,
              timestamp: rental.start_time || rental.created_at,
              status: 'active',
              amount: rental.total_amount,
              location: rental.station?.address,
              station_name: rental.station?.name
            });
          } else if (rental.status === 'completed') {
            allActivities.push({
              id: `rental-completed-${rental.id}`,
              type: 'rental_completed',
              title: 'Returned power bank',
              description: `Rental completed at ${rental.station?.name || 'Unknown Station'}`,
              timestamp: rental.end_time || rental.created_at,
              status: 'completed',
              amount: rental.total_amount,
              location: rental.station?.address,
              station_name: rental.station?.name
            });
          }
        });
      }

      // Process bookings
      if (bookings) {
        bookings.forEach(booking => {
          allActivities.push({
            id: `booking-${booking.id}`,
            type: 'booking_created',
            title: 'Booking created',
            description: `New booking ${booking.order_id} at ${booking.station?.name || 'Unknown Station'}`,
            timestamp: booking.created_at,
            status: booking.status === 'confirmed' ? 'completed' : 'pending',
            amount: booking.total_amount,
            location: booking.station?.address,
            station_name: booking.station?.name
          });

          if (booking.status === 'confirmed') {
            allActivities.push({
              id: `payment-${booking.id}`,
              type: 'payment_processed',
              title: 'Payment processed',
              description: `Payment received for booking ${booking.order_id}`,
              timestamp: booking.created_at,
              status: 'completed',
              amount: booking.total_amount,
              location: booking.station?.address,
              station_name: booking.station?.name
            });
          }
        });
      }

      // Sort by timestamp and take the most recent 6
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 6);

      setActivities(sortedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      
      // Fallback to empty array
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  return { 
    activities, 
    loading, 
    error, 
    refetch: fetchRecentActivity,
    formatTimeAgo
  };
};
