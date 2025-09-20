import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StationInventory {
  id: string;
  station_id: string;
  power_bank_type_id: string;
  total_units: number;
  available_units: number;
  reserved_units: number;
  power_bank_type: {
    id: string;
    name: string;
    category: string;
    capacity_mah: number;
    price_per_hour: number;
    price_per_day: number;
    target_devices: string;
  };
}

export interface StationWithInventory {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  inventory: StationInventory[];
  total_available: number;
  low_stock_alert: boolean;
}

export const useStationInventory = () => {
  const [stations, setStations] = useState<StationWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStationInventory = async () => {
    try {
      setLoading(true);
      
      // Fetch stations with their actual inventory from station_inventory table
      const { data: stationsData, error: stationsError } = await supabase
        .from('stations')
        .select(`
          *,
          station_inventory (
            id,
            station_id,
            power_bank_type_id,
            total_units,
            available_units,
            reserved_units,
            power_bank_type:power_bank_types (
              id,
              name,
              category,
              capacity_mah,
              price_per_hour,
              price_per_day,
              target_devices
            )
          )
        `);

      if (stationsError) throw stationsError;

      const stationsWithInventory: StationWithInventory[] = (stationsData || []).map(station => {
        const inventory: StationInventory[] = (station.station_inventory || []).map((inv: any) => ({
          id: inv.id,
          station_id: inv.station_id,
          power_bank_type_id: inv.power_bank_type_id,
          total_units: inv.total_units,
          available_units: inv.available_units,
          reserved_units: inv.reserved_units,
          power_bank_type: inv.power_bank_type
        }));

        const total_available = inventory.reduce((sum: number, inv: any) => sum + inv.available_units, 0);
        const low_stock_alert = inventory.some((inv: any) => inv.available_units < 3);
        
        return {
          id: station.id,
          name: station.name,
          address: station.address,
          latitude: station.latitude,
          longitude: station.longitude,
          distance: Math.floor(Math.random() * 10) + 1, // Mock distance for now
          inventory,
          total_available,
          low_stock_alert
        };
      });

      setStations(stationsWithInventory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch station inventory');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for inventory updates
  useEffect(() => {
    fetchStationInventory();

    const channel = supabase
      .channel('station-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'station_inventory'
        },
        () => {
          fetchStationInventory();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rentals'
        },
        () => {
          fetchStationInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stations, loading, error, refetch: fetchStationInventory };
};