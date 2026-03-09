-- Add referral threshold configuration to app_configuration table
-- This controls how many referrals a user needs to access the dashboard
-- Default value is 3, but can be changed in the database

INSERT INTO app_configuration (config_key, config_value, config_category, description, is_active, created_at, updated_at)
VALUES (
  'waitlist_referral_threshold',
  '3',
  'waitlist',
  'Number of completed referrals required for dashboard access',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (config_key) 
DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();
