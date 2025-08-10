-- Fix the profile status for the demo user to match the rejected KYC submission
UPDATE profiles 
SET kyc_status = 'rejected' 
WHERE user_id = 'b47d8195-d63d-4ff6-9404-667652c227fd';