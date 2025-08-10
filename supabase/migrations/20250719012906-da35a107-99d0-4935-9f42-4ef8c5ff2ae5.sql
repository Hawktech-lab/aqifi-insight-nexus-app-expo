-- Fix the inflated points and amounts from activity data
-- The current system is awarding points equal to step count, which is way too much
-- Let's fix this by setting reasonable points (1 point per 1000 steps) and proper amounts

-- First, let's see the damage and then fix it
-- Update activity_data transactions to have reasonable points (steps/1000) and amount (points * 0.001)
UPDATE public.earnings_transactions 
SET 
  points = CASE 
    WHEN transaction_type = 'activity_data' AND description LIKE '%steps%' THEN
      -- Extract step count from description and divide by 1000 for reasonable points
      GREATEST(1, (regexp_replace(description, '.*?(\d+) steps.*', '\1')::integer / 1000))
    ELSE points
  END,
  amount = CASE 
    WHEN transaction_type = 'activity_data' AND description LIKE '%steps%' THEN
      -- Set amount to points * 0.001 for reasonable dollar amounts
      GREATEST(0.001, (regexp_replace(description, '.*?(\d+) steps.*', '\1')::integer / 1000) * 0.001)
    ELSE amount
  END
WHERE transaction_type = 'activity_data';

-- Now update user profiles with the corrected totals
UPDATE public.profiles 
SET total_earnings = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM public.earnings_transactions 
  WHERE user_id = profiles.user_id
);