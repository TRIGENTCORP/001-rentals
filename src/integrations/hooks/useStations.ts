import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  total_power_banks: number;
  price_per_hour: number;
  available_power_banks?: number;
  distance?: number;
  inventory_10000mah?: number;
  inventory_20000mah?: number;
}

export const useStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stations')
        .select(`
          *,
          station_inventory(
            total_units,
            power_bank_type:power_bank_types(capacity_mah)
          )
        `);

      if (error) throw error;

      // Calculate available power banks for each station and organize inventory
      const stationsWithAvailability = await Promise.all(
        data.map(async (station) => {
          const { data: rentals } = await supabase
            .from('rentals')
            .select('id')
            .eq('station_id', station.id)
            .eq('status', 'active');

          const available_power_banks = station.total_power_banks - (rentals?.length || 0);
          
          // Extract inventory by power bank type
          let inventory_10000mah = 0;
          let inventory_20000mah = 0;
          
          if (station.station_inventory) {
            station.station_inventory.forEach((inventory: any) => {
              if (inventory.power_bank_type?.capacity_mah === 10000) {
                inventory_10000mah = inventory.total_units;
              } else if (inventory.power_bank_type?.capacity_mah === 20000) {
                inventory_20000mah = inventory.total_units;
              }
            });
          }
          
          return {
            ...station,
            available_power_banks,
            inventory_10000mah,
            inventory_20000mah,
            distance: Math.floor(Math.random() * 10) + 1 // Mock distance
          };
        })
      );

      setStations(stationsWithAvailability);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  return { stations, loading, error, refetch: fetchStations };
};