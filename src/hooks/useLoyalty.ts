import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserLoyalty {
  id: string;
  user_id: string;
  total_bookings: number;
  loyalty_tier: string;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
}

export const useLoyalty = () => {
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLoyalty = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoyalty(null);
        return;
      }

      const { data, error } = await supabase
        .from('user_loyalty')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setLoyalty(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const initializeLoyalty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_loyalty')
        .insert({
          user_id: user.id,
          total_bookings: 0,
          loyalty_tier: 'bronze',
          discount_percentage: 0
        })
        .select()
        .single();

      if (error) throw error;

      setLoyalty(data);
    } catch (err) {
      console.error('Error initializing loyalty:', err);
    }
  };

  useEffect(() => {
    fetchLoyalty();
  }, []);

  return { 
    loyalty, 
    loading, 
    error, 
    refetch: fetchLoyalty,
    initializeLoyalty
  };
};