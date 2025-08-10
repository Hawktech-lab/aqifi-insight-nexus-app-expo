-- Add 'not_started' to the kyc_status enum
ALTER TYPE public.kyc_status ADD VALUE 'not_started' BEFORE 'pending';

-- Update the default value for kyc_status column
ALTER TABLE public.profiles ALTER COLUMN kyc_status SET DEFAULT 'not_started';

-- Update existing users who have the default 'pending' status but haven't submitted KYC
UPDATE public.profiles 
SET kyc_status = 'not_started' 
WHERE kyc_status = 'pending' 
AND user_id NOT IN (
  SELECT DISTINCT user_id 
  FROM public.kyc_submissions
);