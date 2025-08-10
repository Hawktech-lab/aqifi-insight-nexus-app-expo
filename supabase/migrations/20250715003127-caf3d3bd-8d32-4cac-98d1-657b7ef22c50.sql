-- Update demo user's KYC status to pending for testing
UPDATE public.profiles 
SET kyc_status = 'pending'
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'demo@aqifi.com'
);