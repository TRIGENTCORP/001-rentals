import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Rental {
  id: string;
  user_id: string;
  station_id: string;
  power_bank_type_id?: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'cancelled';
  total_amount?: number;
  rental_duration_hours?: number;
  rental_type?: 'hourly' | 'daily';
  base_price?: number;
  surcharges?: number;
  discounts?: number;
  security_deposit?: number;
  is_advance_booking?: boolean;
  station?: {
    name: string;
    address: string;
    price_per_hour: number;
  };
  power_bank_type?: {
    name: string;
    category: string;
    capacity_mah: number;
    price_per_hour: number;
    price_per_day: number;
  };
}

export const useRentals = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRentals = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          station:stations(name, address, price_per_hour),
          power_bank_type:power_bank_types(name, category, capacity_mah, price_per_hour, price_per_day)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRentals((data as Rental[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rentals');
    } finally {
      setLoading(false);
    }
  };

  const createRental = async (
    stationId: string, 
    powerBankTypeId: string,
    rentalDurationHours: number = 1,
    rentalType: 'hourly' | 'daily' = 'hourly',
    scheduledStartTime?: Date,
    pricing?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to rent a power bank.",
          variant: "destructive",
        });
        return null;
      }

      // Use provided pricing or calculate it
      let finalPricing = pricing;
      if (!finalPricing) {
        const { data: pricingData, error: pricingError } = await supabase.rpc('calculate_rental_pricing', {
          power_bank_type_id: powerBankTypeId,
          rental_duration_hours: rentalDurationHours,
          rental_type: rentalType,
          scheduled_start_time: scheduledStartTime?.toISOString() || new Date().toISOString(),
          user_id: user.id
        });

        if (pricingError) throw pricingError;
        finalPricing = pricingData;
      }

      const startTime = scheduledStartTime || new Date();
      const cancellationDeadline = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before

      const { data, error } = await supabase
        .from('rentals')
        .insert({
          user_id: user.id,
          station_id: stationId,
          power_bank_type_id: powerBankTypeId,
          rental_duration_hours: rentalDurationHours,
          rental_type: rentalType,
          base_price: finalPricing.base_price,
          surcharges: finalPricing.surcharges,
          peak_hour_surcharge: finalPricing.peak_surcharge,
          weekend_premium: finalPricing.weekend_premium,
          loyalty_discount: finalPricing.loyalty_discount,
          security_deposit: finalPricing.security_deposit,
          total_amount: finalPricing.total_amount,
          scheduled_start_time: scheduledStartTime?.toISOString(),
          cancellation_deadline: cancellationDeadline.toISOString(),
          status: scheduledStartTime ? 'scheduled' : 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: scheduledStartTime ? "Rental Scheduled" : "Rental Started",
        description: scheduledStartTime 
          ? "Your power bank rental has been scheduled."
          : "Your power bank rental has been initiated.",
      });

      await fetchRentals();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create rental';
      setError(message);
      toast({
        title: "Rental Failed",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const cancelRental = async (rentalId: string) => {
    try {
      const { error } = await supabase
        .from('rentals')
        .update({
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('id', rentalId);

      if (error) throw error;

      toast({
        title: "Rental Cancelled",
        description: "Your rental has been cancelled successfully.",
      });

      await fetchRentals();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel rental';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const completeRental = async (rentalId: string) => {
    try {
      const { error } = await supabase
        .from('rentals')
        .update({
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', rentalId);

      if (error) throw error;

      toast({
        title: "Rental Completed",
        description: "Your power bank rental has been completed.",
      });

      await fetchRentals();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete rental';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  return { 
    rentals, 
    loading, 
    error, 
    refetch: fetchRentals, 
    createRental, 
    completeRental,
    cancelRental
  };
};