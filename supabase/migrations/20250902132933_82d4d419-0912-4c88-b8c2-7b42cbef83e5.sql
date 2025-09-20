-- Create the enum type if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE public.user_role AS ENUM ('customer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    ALTER TABLE public.profiles ADD COLUMN role public.user_role DEFAULT 'customer';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Update existing profiles to have customer role if not set
UPDATE public.profiles SET role = 'customer' WHERE role IS NULL;

-- Set admin@powerbank.com to admin role if it exists
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@powerbank.com';

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Update admin policies for other tables
DROP POLICY IF EXISTS "Admins can manage stations" ON public.stations;
CREATE POLICY "Admins can manage stations" 
ON public.stations 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can manage promos" ON public.promo_updates;
CREATE POLICY "Admins can manage promos" 
ON public.promo_updates 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Allow admins to view all transactions and rentals
CREATE POLICY "Admin users can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin users can view all rentals" 
ON public.rentals 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');