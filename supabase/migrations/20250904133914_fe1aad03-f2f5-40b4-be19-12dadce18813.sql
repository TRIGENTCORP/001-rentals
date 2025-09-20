-- Create power bank types table with different categories and pricing
CREATE TABLE public.power_bank_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Mini', 'Standard', 'Pro', 'Max')),
  capacity_mah INTEGER NOT NULL,
  price_per_hour NUMERIC(10,2) NOT NULL,
  price_per_day NUMERIC(10,2) NOT NULL,
  target_devices TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.power_bank_types ENABLE ROW LEVEL SECURITY;

-- Anyone can view power bank types
CREATE POLICY "Anyone can view power bank types" 
ON public.power_bank_types 
FOR SELECT 
USING (true);

-- Only admins can manage power bank types
CREATE POLICY "Admins can manage power bank types" 
ON public.power_bank_types 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Insert the power bank categories from PRD
INSERT INTO public.power_bank_types (name, category, capacity_mah, price_per_hour, price_per_day, target_devices) VALUES
('Mini Power Bank', 'Mini', 5000, 2.00, 15.00, 'Phones'),
('Standard Power Bank', 'Standard', 10000, 3.00, 20.00, 'Phones, Small tablets'),
('Pro Power Bank', 'Pro', 20000, 5.00, 35.00, 'Tablets, Laptops'),
('Max Power Bank', 'Max', 30000, 8.00, 50.00, 'Multiple devices, Laptops');

-- Update stations table to support multiple power bank types
CREATE TABLE public.station_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  power_bank_type_id UUID NOT NULL REFERENCES public.power_bank_types(id) ON DELETE CASCADE,
  total_units INTEGER NOT NULL DEFAULT 0,
  available_units INTEGER NOT NULL DEFAULT 0,
  reserved_units INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (station_id, power_bank_type_id)
);

-- Enable RLS on station_inventory
ALTER TABLE public.station_inventory ENABLE ROW LEVEL SECURITY;

-- Anyone can view station inventory
CREATE POLICY "Anyone can view station inventory" 
ON public.station_inventory 
FOR SELECT 
USING (true);

-- Only admins can manage station inventory
CREATE POLICY "Admins can manage station inventory" 
ON public.station_inventory 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Create reservations table for 5-minute holds during payment
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  power_bank_type_id UUID NOT NULL REFERENCES public.power_bank_types(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Users can view their own reservations
CREATE POLICY "Users can view their own reservations" 
ON public.reservations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own reservations
CREATE POLICY "Users can create their own reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reservations
CREATE POLICY "Users can update their own reservations" 
ON public.reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can view all reservations
CREATE POLICY "Admins can view all reservations" 
ON public.reservations 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Update rentals table to reference power bank type
ALTER TABLE public.rentals ADD COLUMN power_bank_type_id UUID REFERENCES public.power_bank_types(id);
ALTER TABLE public.rentals ADD COLUMN rental_duration_hours INTEGER DEFAULT 1;
ALTER TABLE public.rentals ADD COLUMN rental_type TEXT DEFAULT 'hourly' CHECK (rental_type IN ('hourly', 'daily'));
ALTER TABLE public.rentals ADD COLUMN base_price NUMERIC(10,2);
ALTER TABLE public.rentals ADD COLUMN surcharges NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.rentals ADD COLUMN discounts NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.rentals ADD COLUMN security_deposit NUMERIC(10,2) DEFAULT 25.00;
ALTER TABLE public.rentals ADD COLUMN is_advance_booking BOOLEAN DEFAULT false;

-- Create function to automatically expire reservations
CREATE OR REPLACE FUNCTION public.expire_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reservations 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at < now();
END;
$$;

-- Create function to update station inventory when reservation is made/released
CREATE OR REPLACE FUNCTION public.update_station_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Reserve a unit
    UPDATE public.station_inventory
    SET reserved_units = reserved_units + 1,
        available_units = available_units - 1
    WHERE station_id = NEW.station_id 
      AND power_bank_type_id = NEW.power_bank_type_id;
      
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status IN ('expired', 'completed') THEN
    -- Release a unit
    UPDATE public.station_inventory
    SET reserved_units = reserved_units - 1,
        available_units = available_units + 1
    WHERE station_id = NEW.station_id 
      AND power_bank_type_id = NEW.power_bank_type_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for inventory updates
CREATE TRIGGER update_inventory_on_reservation
  AFTER INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_station_inventory();

-- Add updated_at triggers
CREATE TRIGGER update_power_bank_types_updated_at
  BEFORE UPDATE ON public.power_bank_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_station_inventory_updated_at
  BEFORE UPDATE ON public.station_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Populate initial inventory for existing stations
INSERT INTO public.station_inventory (station_id, power_bank_type_id, total_units, available_units)
SELECT 
  s.id as station_id,
  pbt.id as power_bank_type_id,
  -- Distribute total power banks across types (roughly equal distribution)
  CASE 
    WHEN pbt.category = 'Mini' THEN s.total_power_banks / 4
    WHEN pbt.category = 'Standard' THEN s.total_power_banks / 4
    WHEN pbt.category = 'Pro' THEN s.total_power_banks / 4
    ELSE s.total_power_banks - (s.total_power_banks / 4 * 3)
  END as total_units,
  CASE 
    WHEN pbt.category = 'Mini' THEN s.total_power_banks / 4
    WHEN pbt.category = 'Standard' THEN s.total_power_banks / 4
    WHEN pbt.category = 'Pro' THEN s.total_power_banks / 4
    ELSE s.total_power_banks - (s.total_power_banks / 4 * 3)
  END as available_units
FROM public.stations s
CROSS JOIN public.power_bank_types pbt;

-- Enable realtime for inventory updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.station_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.power_bank_types;