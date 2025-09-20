-- Fix critical security vulnerability in admin_users table RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can create admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Edge functions can read admin users" ON public.admin_users;

-- Create secure policies that only allow authenticated admin users
CREATE POLICY "Only admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Only admins can create admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

CREATE POLICY "Only admins can update admin users" 
ON public.admin_users 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Note: DELETE policy intentionally omitted for safety
-- Edge functions should use service role key for admin operations if needed