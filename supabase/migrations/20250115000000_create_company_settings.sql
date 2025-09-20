-- Create company settings table for admin-configurable account details
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage company settings
CREATE POLICY "Admins can manage company settings" 
ON public.company_settings 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Anyone can view public settings
CREATE POLICY "Anyone can view public company settings" 
ON public.company_settings 
FOR SELECT 
USING (is_public = true);

-- Add updated_at trigger
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default company settings
INSERT INTO public.company_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('company_name', 'PowerBank Rental Ltd', 'text', 'Company name displayed to customers', true),
('company_email', 'info@powerbankrental.com', 'text', 'Company contact email', true),
('company_phone', '+234-XXX-XXXX-XXX', 'text', 'Company contact phone number', true),
('company_address', 'Lagos, Nigeria', 'text', 'Company physical address', true),
('bank_account_name', 'PowerBank Rental Ltd', 'text', 'Bank account name for transfers', false),
('bank_account_number', '1234567890', 'text', 'Bank account number for transfers', false),
('bank_name', 'Access Bank', 'text', 'Bank name for transfers', false),
('bank_code', '044', 'text', 'Bank code for transfers', false),
('payment_instructions', 'Please use the Order ID as payment reference when making bank transfers.', 'text', 'Instructions shown to customers for bank transfers', true),
('default_rental_duration_hours', '24', 'number', 'Default rental duration in hours', false),
('late_return_fee_per_hour', '100', 'number', 'Late return fee per hour in Naira', false),
('max_rental_duration_days', '7', 'number', 'Maximum rental duration in days', false),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode to disable bookings', false),
('maintenance_message', 'We are currently performing maintenance. Please try again later.', 'text', 'Message shown during maintenance mode', true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_key ON public.company_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_company_settings_public ON public.company_settings(is_public);

-- Enable realtime for settings updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_settings;
