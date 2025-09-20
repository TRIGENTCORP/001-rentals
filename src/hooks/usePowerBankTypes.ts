import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PowerBankType {
  id: string;
  name: string;
  category: 'Mini' | 'Standard' | 'Pro' | 'Max';
  capacity_mah: number;
  price_per_hour: number;
  price_per_day: number;
  target_devices: string;
}

export const usePowerBankTypes = () => {
  const [powerBankTypes, setPowerBankTypes] = useState<PowerBankType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPowerBankTypes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('power_bank_types')
        .select('*')
        .order('capacity_mah', { ascending: true });

      if (error) throw error;

      setPowerBankTypes((data as PowerBankType[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch power bank types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPowerBankTypes();
  }, []);

  return { powerBankTypes, loading, error, refetch: fetchPowerBankTypes };
};