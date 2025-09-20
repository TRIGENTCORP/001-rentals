-- Create RPC functions for safe inventory management and rental creation

-- Function to safely update inventory with proper error handling
CREATE OR REPLACE FUNCTION public.safe_update_inventory(
  p_station_id uuid,
  p_power_bank_type_id uuid,
  p_quantity_change integer
)
RETURNS json AS $$
DECLARE
  current_inventory record;
  new_available_units integer;
  result json;
BEGIN
  -- Get current inventory
  SELECT available_units, total_units
  INTO current_inventory
  FROM public.station_inventory
  WHERE station_id = p_station_id 
    AND power_bank_type_id = p_power_bank_type_id;
  
  -- If no inventory record exists, create one
  IF current_inventory IS NULL THEN
    INSERT INTO public.station_inventory (
      station_id,
      power_bank_type_id,
      total_units,
      available_units,
      reserved_units
    ) VALUES (
      p_station_id,
      p_power_bank_type_id,
      CASE WHEN p_quantity_change > 0 THEN p_quantity_change ELSE 1 END,
      CASE WHEN p_quantity_change > 0 THEN p_quantity_change ELSE 0 END,
      0
    );
    
    result := json_build_object(
      'success', true,
      'message', 'Inventory record created',
      'new_available_units', CASE WHEN p_quantity_change > 0 THEN p_quantity_change ELSE 0 END
    );
  ELSE
    -- Calculate new available units
    new_available_units := current_inventory.available_units + p_quantity_change;
    
    -- Prevent negative available units
    IF new_available_units < 0 THEN
      result := json_build_object(
        'success', false,
        'error', 'Insufficient inventory: cannot reduce below 0',
        'current_available', current_inventory.available_units,
        'requested_change', p_quantity_change
      );
      RETURN result;
    END IF;
    
    -- Update inventory
    UPDATE public.station_inventory
    SET available_units = new_available_units,
        updated_at = now()
    WHERE station_id = p_station_id 
      AND power_bank_type_id = p_power_bank_type_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Inventory updated successfully',
      'old_available_units', current_inventory.available_units,
      'new_available_units', new_available_units,
      'change', p_quantity_change
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create rental and transaction atomically
CREATE OR REPLACE FUNCTION public.create_rental_with_transaction(
  p_user_id uuid,
  p_station_id uuid,
  p_power_bank_type_id uuid,
  p_booking_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_total_amount numeric,
  p_payment_reference text
)
RETURNS json AS $$
DECLARE
  new_rental_id uuid;
  new_transaction_id uuid;
  result json;
BEGIN
  -- Check if rental already exists for this booking
  IF EXISTS (
    SELECT 1 FROM public.rentals 
    WHERE booking_id = p_booking_id
  ) THEN
    result := json_build_object(
      'success', false,
      'error', 'Rental already exists for this booking',
      'booking_id', p_booking_id
    );
    RETURN result;
  END IF;
  
  -- Create rental
  INSERT INTO public.rentals (
    user_id,
    station_id,
    power_bank_type_id,
    booking_id,
    start_time,
    end_time,
    status,
    total_amount
  ) VALUES (
    p_user_id,
    p_station_id,
    p_power_bank_type_id,
    p_booking_id,
    p_start_time,
    p_end_time,
    'active',
    p_total_amount
  ) RETURNING id INTO new_rental_id;
  
  -- Create transaction
  INSERT INTO public.transactions (
    rental_id,
    amount,
    payment_reference,
    status,
    transaction_type
  ) VALUES (
    new_rental_id,
    p_total_amount,
    p_payment_reference,
    'completed',
    'rental_payment'
  ) RETURNING id INTO new_transaction_id;
  
  result := json_build_object(
    'success', true,
    'message', 'Rental and transaction created successfully',
    'rental_id', new_rental_id,
    'transaction_id', new_transaction_id
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.safe_update_inventory(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_rental_with_transaction(uuid, uuid, uuid, uuid, timestamptz, timestamptz, numeric, text) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.safe_update_inventory(uuid, uuid, integer) IS 'Safely updates station inventory with proper error handling and prevents negative inventory';
COMMENT ON FUNCTION public.create_rental_with_transaction(uuid, uuid, uuid, uuid, timestamptz, timestamptz, numeric, text) IS 'Creates rental and transaction atomically to ensure data consistency';


