-- Add role field to profiles table for admin functionality
-- Run this in your Supabase SQL Editor

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Set an existing user as admin (replace 'your-email@example.com' with actual admin email)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- Example: Set a user as admin by their email
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE user_id IN (
--   SELECT id FROM auth.users 
--   WHERE email = 'admin@aqifi.com'
-- );
