import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TransactionData {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  rental_id: string;
  rental?: {
    user_id: string;
    station?: {
      name: string;
    };
  };
}

export interface MonthlyEarnings {
  month: string;
  earnings: number;
  transactions: number;
}

export const useAdminData = () => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          rental:rentals!transactions_rental_id_fkey(
            user_id,
            station:stations(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback: fetch transactions without joins
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setTransactions((fallbackData as TransactionData[]) || []);
      } else {
        setTransactions((data as TransactionData[]) || []);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    }
  };

  const fetchMonthlyEarnings = async () => {
    try {
      // Get earnings by month for the last 12 months
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Group by month
      const monthlyMap = new Map<string, { earnings: number; transactions: number }>();
      
      data?.forEach(transaction => {
        const month = new Date(transaction.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        const current = monthlyMap.get(month) || { earnings: 0, transactions: 0 };
        monthlyMap.set(month, {
          earnings: current.earnings + Number(transaction.amount),
          transactions: current.transactions + 1
        });
      });

      const monthlyEarnings = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        earnings: data.earnings,
        transactions: data.transactions
      }));

      setMonthlyData(monthlyEarnings);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch monthly data",
        variant: "destructive",
      });
    }
  };

  const updateStationPowerBanks = async (stationId: string, totalPowerBanks: number) => {
    try {
      const { error } = await supabase
        .from('stations')
        .update({ total_power_banks: totalPowerBanks })
        .eq('id', stationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Station power banks updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update station",
        variant: "destructive",
      });
    }
  };

  const createPromoUpdate = async (promo: {
    title: string;
    message: string;
    discount_percentage?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('promo_updates')
        .insert(promo);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo update created successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create promo update",
        variant: "destructive",
      });
    }
  };

  const addStation = async (stationData: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    total_power_banks: number;
    price_per_hour: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .insert(stationData)
        .select()
        .single();

      if (error) {
        console.error('Add station error:', error);
        throw new Error(`Failed to add station: ${error.message}`);
      }
      return data;
    } catch (err) {
      console.error('Add station error:', err);
      throw err;
    }
  };

  const updateStation = async (id: string, updates: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    total_power_banks?: number;
    price_per_hour?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('stations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw err;
    }
  };

  const deleteStation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete station error:', error);
        throw new Error(`Failed to delete station: ${error.message}`);
      }
    } catch (err) {
      console.error('Delete station error:', err);
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchMonthlyEarnings()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    transactions,
    monthlyData,
    loading,
    updateStationPowerBanks,
    createPromoUpdate,
    addStation,
    updateStation,
    deleteStation,
    refetchData: () => {
      fetchTransactions();
      fetchMonthlyEarnings();
    }
  };
};