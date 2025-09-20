-- Add foreign key relationship between rentals and profiles
-- First, ensure rentals.user_id references profiles.id instead of auth.users
ALTER TABLE public.rentals 
DROP CONSTRAINT IF EXISTS rentals_user_id_fkey;

ALTER TABLE public.rentals 
ADD CONSTRAINT rentals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key relationship between transactions and rentals (if not exists)
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_rental_id_fkey;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_rental_id_fkey 
FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;

-- Add foreign key relationship between reservations and profiles
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;

ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key relationship between user_loyalty and profiles
ALTER TABLE public.user_loyalty 
DROP CONSTRAINT IF EXISTS user_loyalty_user_id_fkey;

ALTER TABLE public.user_loyalty 
ADD CONSTRAINT user_loyalty_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key relationships for station_inventory
ALTER TABLE public.station_inventory 
DROP CONSTRAINT IF EXISTS station_inventory_station_id_fkey;

ALTER TABLE public.station_inventory 
ADD CONSTRAINT station_inventory_station_id_fkey 
FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;

ALTER TABLE public.station_inventory 
DROP CONSTRAINT IF EXISTS station_inventory_power_bank_type_id_fkey;

ALTER TABLE public.station_inventory 
ADD CONSTRAINT station_inventory_power_bank_type_id_fkey 
FOREIGN KEY (power_bank_type_id) REFERENCES public.power_bank_types(id) ON DELETE CASCADE;

-- Add foreign key relationships for rentals
ALTER TABLE public.rentals 
DROP CONSTRAINT IF EXISTS rentals_station_id_fkey;

ALTER TABLE public.rentals 
ADD CONSTRAINT rentals_station_id_fkey 
FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;

ALTER TABLE public.rentals 
DROP CONSTRAINT IF EXISTS rentals_power_bank_type_id_fkey;

ALTER TABLE public.rentals 
ADD CONSTRAINT rentals_power_bank_type_id_fkey 
FOREIGN KEY (power_bank_type_id) REFERENCES public.power_bank_types(id) ON DELETE SET NULL;

-- Add foreign key relationships for reservations
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_station_id_fkey;

ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_station_id_fkey 
FOREIGN KEY (station_id) REFERENCES public.stations(id) ON DELETE CASCADE;

ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_power_bank_type_id_fkey;

ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_power_bank_type_id_fkey 
FOREIGN KEY (power_bank_type_id) REFERENCES public.power_bank_types(id) ON DELETE CASCADE;