-- Add RLS policy for admins to view all profiles for reporting
CREATE POLICY "Admins can view all profiles for reporting" ON public.profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);