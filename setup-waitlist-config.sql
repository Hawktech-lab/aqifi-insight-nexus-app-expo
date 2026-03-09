-- Setup Waitlist Configuration for Viral Loops Widget
-- Run this in your Supabase SQL Editor after creating your Viral Loops campaign
--
-- This script:
-- 1. Enables the waitlist feature (sets waitlist_enabled to 'true')
-- 2. Updates the campaign ID with your actual Viral Loops campaign ID (UCID)
-- 3. Updates the landing page URL for sharing referrals
-- 4. Optionally clears the API key (not needed for widget-only mode)
--
-- IMPORTANT: Replace placeholders with your actual values

-- Step 1: Enable waitlist feature
UPDATE app_configuration 
SET config_value = 'true', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';

-- Step 2: Update campaign ID (UCID) - REPLACE 'YOUR_CAMPAIGN_ID_HERE' with your actual campaign ID
UPDATE app_configuration 
SET config_value = 'YOUR_CAMPAIGN_ID_HERE', updated_at = NOW()
WHERE config_key = 'viralloops_campaign_id';

-- Step 3: Update landing page URL - REPLACE 'YOUR_LANDING_PAGE_URL_HERE' with your Viral Loops landing page URL
-- Example: 'https://pages.viral-loops.com/acua-waitlist-2cpq46nz'
UPDATE app_configuration 
SET config_value = 'YOUR_LANDING_PAGE_URL_HERE', updated_at = NOW()
WHERE config_key = 'viralloops_landing_page_url';

-- If the config doesn't exist, insert it:
INSERT INTO app_configuration (config_key, config_value, created_at, updated_at)
SELECT 'viralloops_landing_page_url', 'YOUR_LANDING_PAGE_URL_HERE', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM app_configuration WHERE config_key = 'viralloops_landing_page_url'
);

-- Step 4 (Optional): Clear API key since widget doesn't need it
-- Uncomment the following line if you want to remove the API key:
-- UPDATE app_configuration 
-- SET config_value = '', updated_at = NOW()
-- WHERE config_key = 'viralloops_api_key';

-- Verify the configuration
SELECT 
  config_key,
  config_value,
  updated_at
FROM app_configuration
WHERE config_key IN ('waitlist_enabled', 'viralloops_campaign_id', 'viralloops_landing_page_url', 'viralloops_api_key')
ORDER BY config_key;

-- Expected results:
-- waitlist_enabled: 'true'
-- viralloops_campaign_id: 'YOUR_CAMPAIGN_ID_HERE' (your actual campaign ID)
-- viralloops_landing_page_url: 'YOUR_LANDING_PAGE_URL_HERE' (your Viral Loops landing page URL)
-- viralloops_api_key: (can be empty or dummy value for widget-only mode)

