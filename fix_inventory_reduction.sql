-- Create a function to reduce station inventory when a rental is confirmed
-- This function bypasses RLS policies and ensures inventory is properly updated

CREATE OR REPLACE FUNCTION public.reduce_station_inventory(
  p_station_id UUID,
  p_power_bank_type_id UUID
) RETURNS JSON AS $$
DECLARE
  inventory_record RECORD;
  result JSON;
BEGIN
  -- Get the current inventory record
  SELECT id, available_units, total_units
  INTO inventory_record
  FROM public.station_inventory
  WHERE station_id = p_station_id 
    AND power_bank_type_id = p_power_bank_type_id;
  
  -- Check if inventory record exists
  IF NOT FOUND THEN
    -- Create the inventory record if it doesn't exist
    INSERT INTO public.station_inventory (
      station_id, 
      power_bank_type_id, 
      total_units, 
      available_units, 
      reserved_units
    ) VALUES (
      p_station_id, 
      p_power_bank_type_id, 
      1, 
      0, 
      0
    ) RETURNING id, available_units, total_units INTO inventory_record;
    
    result := json_build_object(
      'success', true,
      'action', 'created',
      'message', 'Created new inventory record',
      'available_units', inventory_record.available_units,
      'total_units', inventory_record.total_units
    );
  ELSE
    -- Check if there are available units to reduce
    IF inventory_record.available_units > 0 THEN
      -- Reduce available units by 1
      UPDATE public.station_inventory
      SET available_units = available_units - 1,
          updated_at = now()
      WHERE id = inventory_record.id;
      
      result := json_build_object(
        'success', true,
        'action', 'reduced',
        'message', 'Inventory reduced successfully',
        'available_units', inventory_record.available_units - 1,
        'total_units', inventory_record.total_units
      );
    ELSE
      result := json_build_object(
        'success', false,
        'action', 'failed',
        'message', 'No available units to reduce',
        'available_units', inventory_record.available_units,
        'total_units', inventory_record.total_units
      );
    END IF;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to increase station inventory when a power bank is physically returned to a station
-- NOTE: This should only be called when a customer physically returns a power bank to a station,
-- NOT when an admin confirms a return in the system
CREATE OR REPLACE FUNCTION public.increase_station_inventory(
  p_station_id UUID,
  p_power_bank_type_id UUID
) RETURNS JSON AS $$
DECLARE
  inventory_record RECORD;
  result JSON;
BEGIN
  -- Get the current inventory record
  SELECT id, available_units, total_units
  INTO inventory_record
  FROM public.station_inventory
  WHERE station_id = p_station_id 
    AND power_bank_type_id = p_power_bank_type_id;
  
  -- Check if inventory record exists
  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'action', 'failed',
      'message', 'Inventory record not found'
    );
  ELSE
    -- Increase available units by 1 (but don't exceed total_units)
    UPDATE public.station_inventory
    SET available_units = LEAST(available_units + 1, total_units),
        updated_at = now()
    WHERE id = inventory_record.id;
    
    result := json_build_object(
      'success', true,
      'action', 'increased',
      'message', 'Inventory increased successfully - power bank physically returned to station',
      'available_units', LEAST(inventory_record.available_units + 1, inventory_record.total_units),
      'total_units', inventory_record.total_units
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.reduce_station_inventory(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increase_station_inventory(UUID, UUID) TO authenticated;
