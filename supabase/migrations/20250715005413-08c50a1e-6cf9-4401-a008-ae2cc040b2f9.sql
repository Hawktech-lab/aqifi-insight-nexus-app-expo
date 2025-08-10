-- Update KYC status for demo@aqifi.com user to pending
UPDATE public.profiles 
SET kyc_status = 'pending'::kyc_status
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'demo@aqifi.com'
);