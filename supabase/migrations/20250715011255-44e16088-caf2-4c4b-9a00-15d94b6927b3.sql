-- Remove id_number column and add phone_number column to kyc_submissions table
ALTER TABLE public.kyc_submissions 
DROP COLUMN id_number,
ADD COLUMN phone_number text NOT NULL DEFAULT '';