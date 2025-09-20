-- Create admin users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admins can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update admin users" 
ON public.admin_users 
FOR UPDATE 
USING (true);

-- Add promo updates table
CREATE TABLE public.promo_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  discount_percentage NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for promo_updates
ALTER TABLE public.promo_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for promo_updates
CREATE POLICY "Anyone can view active promos" 
ON public.promo_updates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage promos" 
ON public.promo_updates 
FOR ALL 
USING (true);

-- Update triggers for timestamps
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_updates_updated_at
BEFORE UPDATE ON public.promo_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default admin user (password: admin123)
INSERT INTO public.admin_users (email, password_hash, full_name, role)
VALUES ('admin@powerbank.com', '$2a$10$CwTycUXWue0Thq9StjUM0eyhx7Z6Pvj1gOGxGxMQ1LCJHnMh5HQe6', 'System Administrator', 'admin');