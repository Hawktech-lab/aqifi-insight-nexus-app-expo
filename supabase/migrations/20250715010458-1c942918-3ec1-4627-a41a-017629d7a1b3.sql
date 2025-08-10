-- Reset KYC status for demo@aqifi.com user to not_started so they can submit KYC
UPDATE public.profiles 
SET kyc_status = 'not_started'::kyc_status
WHERE user_id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'demo@aqifi.com'
);