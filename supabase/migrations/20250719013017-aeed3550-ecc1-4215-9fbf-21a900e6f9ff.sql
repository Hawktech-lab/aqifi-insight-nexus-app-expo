-- Simple fix: scale down the inflated activity_data points and amounts
-- Divide points by 1000 and amounts by 1000 for activity_data transactions

UPDATE public.earnings_transactions 
SET 
  points = CASE 
    WHEN transaction_type = 'activity_data' THEN GREATEST(1, points / 1000)
    ELSE points
  END,
  amount = CASE 
    WHEN transaction_type = 'activity_data' THEN GREATEST(0.001, amount / 1000)
    ELSE amount
  END
WHERE transaction_type = 'activity_data';

-- Update user profiles with corrected totals
UPDATE public.profiles 
SET total_earnings = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM public.earnings_transactions 
  WHERE user_id = profiles.user_id
);