-- Create bookings table for user rental orders
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  power_bank_type_id UUID NOT NULL REFERENCES public.power_bank_types(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings" 
ON public.bookings 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;

-- Add updated_at trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for order_id lookups
CREATE INDEX IF NOT EXISTS idx_bookings_order_id ON public.bookings(order_id);

-- Create index for user bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Create index for status filtering

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
