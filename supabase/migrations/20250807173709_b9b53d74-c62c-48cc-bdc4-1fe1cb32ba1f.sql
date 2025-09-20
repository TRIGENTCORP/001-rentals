-- Fix function search path mutable warnings by setting security definer and search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_available_power_banks(station_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_power_banks INTEGER;
    active_rentals INTEGER;
BEGIN
    -- Get total power banks for the station
    SELECT stations.total_power_banks INTO total_power_banks
    FROM public.stations
    WHERE stations.id = station_id;
    
    -- Get count of active rentals for the station
    SELECT COUNT(*) INTO active_rentals
    FROM public.rentals
    WHERE rentals.station_id = station_id
    AND rentals.status = 'active';
    
    -- Return available power banks
    RETURN COALESCE(total_power_banks, 0) - COALESCE(active_rentals, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';