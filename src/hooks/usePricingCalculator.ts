import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PricingBreakdown {
  base_price: number;
  surcharges: number;
  peak_surcharge: number;
  weekend_premium: number;
  discounts: number;
  loyalty_discount: number;
  loyalty_discount_percentage: number;
  security_deposit: number;
  total_amount: number;
}

export const usePricingCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePricing = async (
    powerBankTypeId: string,
    rentalDurationHours: number,
    rentalType: 'hourly' | 'daily',
    scheduledStartTime?: Date
  ): Promise<PricingBreakdown | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('calculate_rental_pricing', {
        power_bank_type_id: powerBankTypeId,
        rental_duration_hours: rentalDurationHours,
        rental_type: rentalType,
        scheduled_start_time: scheduledStartTime?.toISOString() || new Date().toISOString(),
        user_id: user?.id || null
      });

      if (error) throw error;

      if (typeof data === 'object' && data !== null && 'error' in data) {
        throw new Error(String(data.error));
      }

      return data as unknown as PricingBreakdown;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate pricing';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { calculatePricing, loading, error };
};