-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

-- Create enum for roles
CREATE TYPE public.user_role AS ENUM ('customer', 'admin');

-- Update profiles table to use the enum
ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

-- Create admin accounts in auth.users and profiles
-- Insert admin user directly (this will be handled by the trigger)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@powerbank.com' LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        -- Create admin user in auth system
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@powerbank.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Admin User"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        -- Insert admin profile
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (admin_user_id, 'admin@powerbank.com', 'Admin User', 'admin');
    ELSE
        -- Update existing user to admin role
        UPDATE public.profiles SET role = 'admin' WHERE id = admin_user_id;
    END IF;
END $$;

-- Update existing profiles to have customer role if not set
UPDATE public.profiles SET role = 'customer' WHERE role IS NULL;

-- Enable RLS for role-based access
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create policy for admin dashboard access
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
CREATE POLICY "Admin users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'admin' 
  OR auth.uid() = id
);

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