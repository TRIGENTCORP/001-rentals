-- Enable pgcrypto for bcrypt verification using crypt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a SECURITY DEFINER function to verify admin password without exposing the hash
CREATE OR REPLACE FUNCTION public.verify_admin_password(p_email text, p_password text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text
) AS $$
  SELECT id, email, full_name, role
  FROM public.admin_users
  WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Allow calling this function from the client/edge function roles
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO anon, authenticated;