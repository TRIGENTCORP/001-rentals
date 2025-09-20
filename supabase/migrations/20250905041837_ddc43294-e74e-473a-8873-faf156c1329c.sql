-- Add advance booking and loyalty tracking features
ALTER TABLE public.rentals 
ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS late_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS peak_hour_surcharge NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekend_premium NUMERIC DEFAULT 0;

-- Create user loyalty tracking table
CREATE TABLE IF NOT EXISTS public.user_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bookings INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze',
  discount_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_loyalty
ALTER TABLE public.user_loyalty ENABLE ROW LEVEL SECURITY;

-- Create policies for user_loyalty
CREATE POLICY "Users can view their own loyalty data" 
ON public.user_loyalty 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loyalty data" 
ON public.user_loyalty 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty data" 
ON public.user_loyalty 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty data" 
ON public.user_loyalty 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Add trigger for updating user loyalty after rental completion
CREATE OR REPLACE FUNCTION public.update_user_loyalty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update or insert loyalty data
    INSERT INTO public.user_loyalty (user_id, total_bookings, loyalty_tier, discount_percentage)
    VALUES (NEW.user_id, 1, 'bronze', 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_bookings = user_loyalty.total_bookings + 1,
      loyalty_tier = CASE 
        WHEN user_loyalty.total_bookings + 1 >= 50 THEN 'gold'
        WHEN user_loyalty.total_bookings + 1 >= 20 THEN 'silver'
        ELSE 'bronze'
      END,
      discount_percentage = CASE 
        WHEN user_loyalty.total_bookings + 1 >= 50 THEN 15
        WHEN user_loyalty.total_bookings + 1 >= 20 THEN 10
        WHEN user_loyalty.total_bookings + 1 >= 10 THEN 5
        ELSE 0
      END,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS update_user_loyalty_trigger ON public.rentals;
CREATE TRIGGER update_user_loyalty_trigger
  AFTER UPDATE ON public.rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_loyalty();

-- Add updated_at trigger for user_loyalty
DROP TRIGGER IF EXISTS update_user_loyalty_updated_at ON public.user_loyalty;
CREATE TRIGGER update_user_loyalty_updated_at
  BEFORE UPDATE ON public.user_loyalty
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate rental pricing with all fees and discounts
CREATE OR REPLACE FUNCTION public.calculate_rental_pricing(
  power_bank_type_id UUID,
  rental_duration_hours INTEGER,
  rental_type TEXT,
  scheduled_start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  base_price NUMERIC;
  surcharges NUMERIC := 0;
  discounts NUMERIC := 0;
  security_deposit NUMERIC := 25;
  total_amount NUMERIC;
  loyalty_discount_pct NUMERIC := 0;
  power_bank_pricing RECORD;
  start_hour INTEGER;
  is_weekend BOOLEAN;
  is_peak_hour BOOLEAN;
  peak_surcharge NUMERIC := 0;
  weekend_premium NUMERIC := 0;
  loyalty_discount_amount NUMERIC := 0;
BEGIN
  -- Get power bank pricing
  SELECT price_per_hour, price_per_day INTO power_bank_pricing
  FROM public.power_bank_types
  WHERE id = power_bank_type_id;
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT('error', 'Power bank type not found');
  END IF;
  
  -- Calculate base price
  IF rental_type = 'daily' THEN
    base_price := power_bank_pricing.price_per_day * CEIL(rental_duration_hours::NUMERIC / 24);
  ELSE
    base_price := power_bank_pricing.price_per_hour * rental_duration_hours;
  END IF;
  
  -- Check for peak hours and weekend
  start_hour := EXTRACT(hour FROM scheduled_start_time);
  is_weekend := EXTRACT(dow FROM scheduled_start_time) IN (0, 6);
  is_peak_hour := (start_hour >= 8 AND start_hour <= 10) OR (start_hour >= 17 AND start_hour <= 19);
  
  -- Calculate surcharges
  IF is_peak_hour THEN
    peak_surcharge := base_price * 0.2; -- 20% peak hour surcharge
    surcharges := surcharges + peak_surcharge;
  END IF;
  
  IF is_weekend THEN
    weekend_premium := base_price * 0.15; -- 15% weekend premium
    surcharges := surcharges + weekend_premium;
  END IF;
  
  -- Get user loyalty discount if user_id provided
  IF user_id IS NOT NULL THEN
    SELECT COALESCE(discount_percentage, 0) INTO loyalty_discount_pct
    FROM public.user_loyalty
    WHERE user_loyalty.user_id = calculate_rental_pricing.user_id;
    
    IF loyalty_discount_pct > 0 THEN
      loyalty_discount_amount := (base_price + surcharges) * (loyalty_discount_pct / 100);
      discounts := discounts + loyalty_discount_amount;
    END IF;
  END IF;
  
  total_amount := base_price + surcharges - discounts + security_deposit;
  
  RETURN JSON_BUILD_OBJECT(
    'base_price', base_price,
    'surcharges', surcharges,
    'peak_surcharge', peak_surcharge,
    'weekend_premium', weekend_premium,
    'discounts', discounts,
    'loyalty_discount', loyalty_discount_amount,
    'loyalty_discount_percentage', loyalty_discount_pct,
    'security_deposit', security_deposit,
    'total_amount', total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;