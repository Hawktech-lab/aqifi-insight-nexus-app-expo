# Waitlist Widget Setup Guide

## Summary

The waitlist feature has been updated to work with **Viral Loops widget-only mode**. This means you only need the **Campaign ID (UCID)** - no API key is required.

## Changes Made

### 1. ✅ ViralloopsService Updated
- **API key is now optional** - only campaign ID is required for widget usage
- Widget initialization works with just campaign ID
- API methods (createParticipant, trackReferral, etc.) will skip gracefully if API key is not configured
- Added `hasApiKey()` method to check if API integration is available

### 2. ✅ WaitlistService Updated
- API sync methods (`syncWithViralloops`, `syncReferralWithViralloops`) now check for API key
- If API key is not configured, sync is skipped (widget handles everything)
- No errors thrown when API key is missing

### 3. ✅ Widget Implementation Verified
- `ViralloopsWidget.tsx` correctly uses only campaign ID (UCID)
- Widget HTML uses `ucid` attribute which is the campaign ID
- No API key needed for widget functionality

## Database Setup

### Step 1: Enable Waitlist Feature

Run this SQL in Supabase SQL Editor:

```sql
UPDATE app_configuration 
SET config_value = 'true', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';
```

### Step 2: Update Campaign ID

After creating your Viral Loops campaign, update the campaign ID:

```sql
UPDATE app_configuration 
SET config_value = 'YOUR_CAMPAIGN_ID_HERE', updated_at = NOW()
WHERE config_key = 'viralloops_campaign_id';
```

**Replace `YOUR_CAMPAIGN_ID_HERE` with your actual Viral Loops campaign ID (UCID).**

### Step 3: Verify Configuration

```sql
SELECT 
  config_key,
  config_value,
  updated_at
FROM app_configuration
WHERE config_key IN ('waitlist_enabled', 'viralloops_campaign_id', 'viralloops_api_key')
ORDER BY config_key;
```

Expected results:
- `waitlist_enabled`: `'true'`
- `viralloops_campaign_id`: `'YOUR_CAMPAIGN_ID'` (your actual campaign ID)
- `viralloops_api_key`: Can be empty or dummy value (not needed for widget)

## Quick Setup Script

A ready-to-use SQL script is available: `setup-waitlist-config.sql`

1. Open the file
2. Replace `'YOUR_CAMPAIGN_ID_HERE'` with your actual campaign ID
3. Run it in Supabase SQL Editor

## How It Works

### Widget-Only Mode (No API Key)

1. **Widget handles participant creation** - When users interact with the widget, Viral Loops creates participants automatically
2. **Widget handles referral tracking** - Referrals are tracked through the widget
3. **No API sync needed** - The app doesn't need to sync with Viral Loops API
4. **Database tracks points** - Points are still tracked in your database for leaderboard

### With API Key (Optional)

If you configure an API key later:
- App will sync participants with Viral Loops API
- App will sync referrals with Viral Loops API
- Full bidirectional sync available

## Testing Checklist

- [ ] Run `setup-waitlist-config.sql` (after updating campaign ID)
- [ ] Verify `waitlist_enabled` is set to `'true'`
- [ ] Verify `viralloops_campaign_id` has your actual campaign ID
- [ ] Test signup flow - referral code input should appear
- [ ] Test KYC completion - should join waitlist
- [ ] Test widget display - should load with campaign ID
- [ ] Verify no errors in console about missing API key

## Notes

- **Campaign ID (UCID) is required** - This is the unique campaign identifier from Viral Loops
- **API key is optional** - Only needed if you want API integration, not for widget
- **Widget works independently** - The widget handles all Viral Loops interactions
- **Database still tracks everything** - Points, referrals, leaderboard all work as before

## Troubleshooting

### Widget not loading?
- Check that `viralloops_campaign_id` is set correctly
- Verify campaign ID matches your Viral Loops dashboard
- Check browser console for errors

### API sync errors?
- If you see API sync errors, it means API key is not configured
- This is **normal** for widget-only mode
- The app will continue working - widget handles everything

### Waitlist not joining after KYC?
- Check that `waitlist_enabled` is set to `'true'`
- Check app logs for any errors
- Verify database migration was run (`database-waitlist-migration.sql`)

## Files Modified

1. `src/services/ViralloopsService.ts` - Made API key optional
2. `src/services/WaitlistService.ts` - Skip API sync when API key not available
3. `setup-waitlist-config.sql` - SQL script for configuration

## Next Steps

1. Create your Viral Loops campaign
2. Get your campaign ID (UCID) from Viral Loops dashboard
3. Run `setup-waitlist-config.sql` with your campaign ID
4. Test the waitlist feature
5. Deploy!

