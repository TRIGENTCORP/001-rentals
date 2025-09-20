import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reservation {
  id: string;
  user_id: string;
  station_id: string;
  power_bank_type_id: string;
  expires_at: string;
  status: 'active' | 'expired' | 'completed';
  created_at: string;
  station?: {
    name: string;
    address: string;
  };
  power_bank_type?: {
    name: string;
    category: string;
    capacity_mah: number;
    price_per_hour: number;
    price_per_day: number;
  };
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          station:stations(name, address),
          power_bank_type:power_bank_types(name, category, capacity_mah, price_per_hour, price_per_day)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations((data as Reservation[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async (stationId: string, powerBankTypeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to make a reservation.",
          variant: "destructive",
        });
        return null;
      }

      // Check if there's already an active reservation
      const { data: existingReservation } = await supabase
        .from('reservations')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (existingReservation) {
        toast({
          title: "Active Reservation Found",
          description: "You already have an active reservation. Complete or cancel it first.",
          variant: "destructive",
        });
        return null;
      }

      // Check availability
      const { data: inventory } = await supabase
        .from('station_inventory')
        .select('available_units')
        .eq('station_id', stationId)
        .eq('power_bank_type_id', powerBankTypeId)
        .single();

      if (!inventory || inventory.available_units <= 0) {
        toast({
          title: "Not Available",
          description: "This power bank type is currently out of stock at this station.",
          variant: "destructive",
        });
        return null;
      }

      // Create reservation with 5-minute expiry
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          station_id: stationId,
          power_bank_type_id: powerBankTypeId,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Reservation Created",
        description: "Power bank reserved for 5 minutes. Complete payment to confirm.",
      });

      await fetchReservations();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create reservation';
      setError(message);
      toast({
        title: "Reservation Failed",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const completeReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('id', reservationId);

      if (error) throw error;

      await fetchReservations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete reservation';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'expired' })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Reservation Cancelled",
        description: "Your reservation has been cancelled and the power bank is now available.",
      });

      await fetchReservations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel reservation';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Auto-expire reservations and set up real-time updates
  useEffect(() => {
    fetchReservations();

    // Set up interval to check for expired reservations
    const interval = setInterval(async () => {
      await supabase.rpc('expire_reservations');
      fetchReservations();
    }, 30000); // Check every 30 seconds

    // Set up real-time subscription
    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    reservations, 
    loading, 
    error, 
    refetch: fetchReservations, 
    createReservation, 
    completeReservation,
    cancelReservation
  };
};