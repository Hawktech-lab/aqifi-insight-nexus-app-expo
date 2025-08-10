-- First, drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles for reporting" ON public.profiles;

-- Create a security definer function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create the correct policy using the security definer function
CREATE POLICY "Admins can view all profiles for reporting" ON public.profiles
FOR SELECT 
USING (public.get_current_user_role() = 'admin');