-- Create RLS policy for edge function to access admin_users table
CREATE POLICY "Edge functions can read admin users"
ON public.admin_users
FOR SELECT
USING (true);

-- Test admin user retrieval
SELECT id, email, role FROM admin_users WHERE email = 'admin@powerbank.com';