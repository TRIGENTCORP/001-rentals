-- First, create missing profile entries for users who have rentals but no profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT DISTINCT 
  r.user_id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
  'customer'::user_role
FROM public.rentals r
LEFT JOIN auth.users au ON r.user_id = au.id
WHERE r.user_id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Also create missing profiles for reservations
INSERT INTO public.profiles (id, email, full_name, role)
SELECT DISTINCT 
  res.user_id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
  'customer'::user_role
FROM public.reservations res
LEFT JOIN auth.users au ON res.user_id = au.id
WHERE res.user_id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Create missing profiles for user_loyalty
INSERT INTO public.profiles (id, email, full_name, role)
SELECT DISTINCT 
  ul.user_id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
  'customer'::user_role
FROM public.user_loyalty ul
LEFT JOIN auth.users au ON ul.user_id = au.id
WHERE ul.user_id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;