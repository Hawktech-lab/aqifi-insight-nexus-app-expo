-- Update the profile status to verified for the demo user since admin approved it
UPDATE profiles 
SET kyc_status = 'verified' 
WHERE user_id = 'b47d8195-d63d-4ff6-9404-667652c227fd';