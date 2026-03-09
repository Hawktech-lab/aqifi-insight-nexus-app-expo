# Referral-Based Access Control Implementation

## Overview

This implementation adds referral-based access control to the app. Users must refer a configurable number of people (default: 3) before they can access the main dashboard.

## Flow

1. **User signs up** → Creates account
2. **User signs in** → Authenticates
3. **Identity verification (zk)** → Completes KYC verification using zkMe
4. **Waitlist screen shows** → User joins waitlist and can start referring people
5. **Referral threshold check** → User needs to refer N people (configurable, default 3) to access dashboard
6. **Dashboard access** → Once threshold is met, user can access the landing dashboard

## Changes Made

### 1. WaitlistService Updates (`src/services/WaitlistService.ts`)

Added new methods:
- `getCompletedReferralCount(userId)`: Returns count of completed referrals (status: 'completed', 'kyc_completed', 'active')
- `getReferralThreshold()`: Gets threshold from database config (default: 3)
- `hasAccess(userId)`: Checks if user has access (referral count >= threshold)
- `getAccessStatus(userId)`: Returns detailed access status with counts and remaining referrals

### 2. DashboardScreen Updates (`src/screens/DashboardScreen.tsx`)

- Added access check on mount
- Shows loading state while checking access
- Redirects to Waitlist screen if access not granted
- Shows access restriction message with referral progress
- Only shows dashboard content if user has access

### 3. WaitlistDashboard Updates (`src/components/WaitlistDashboard.tsx`)

- Shows access status banner at the top
- Displays referral progress with progress bar
- Shows remaining referrals needed for access
- Uses configurable threshold instead of hardcoded "3"
- Shows "Go to Dashboard" button when access is granted
- Progress bar visualizes referral progress

### 4. Database Configuration

Created migration: `supabase/migrations/20250120000003-add-referral-threshold-config.sql`

Adds `waitlist_referral_threshold` config key to `app_configuration` table:
- Default value: `3`
- Can be changed in database to adjust threshold
- Category: `waitlist`

## Configuration

The referral threshold is stored in the `app_configuration` table:

```sql
config_key: 'waitlist_referral_threshold'
config_value: '3' (or any number)
```

To change the threshold, update the `config_value` in the database:

```sql
UPDATE app_configuration 
SET config_value = '5' 
WHERE config_key = 'waitlist_referral_threshold';
```

## User Experience

### Waitlist Dashboard
- Shows current referral count vs threshold
- Progress bar showing completion percentage
- Clear message about remaining referrals needed
- Access status banner (warning when locked, success when unlocked)

### Dashboard Screen
- Access check happens automatically
- If access not granted:
  - Shows "Access Restricted" message
  - Displays current progress (X / Y referrals)
  - Shows remaining referrals needed
  - Provides button to go to Waitlist
  - Auto-redirects to Waitlist after 1.5 seconds

### Navigation Flow
- After KYC completion → Navigate to Waitlist
- From Waitlist → Can see progress and share referral code
- When accessing Dashboard → Access check happens
- If no access → Redirect to Waitlist
- If access granted → Show Dashboard

## Referral Status

A referral is considered "completed" when its status is one of:
- `completed`
- `kyc_completed`
- `active`

Only completed referrals count toward the threshold.

## Testing

1. **Test access check**: Create a user, complete KYC, check that dashboard redirects to waitlist
2. **Test referral counting**: Add referrals with different statuses, verify only completed ones count
3. **Test threshold**: Change threshold in database, verify access changes accordingly
4. **Test progress display**: Verify progress bar and messages update correctly
5. **Test access granted**: Once threshold met, verify dashboard becomes accessible

## Future Enhancements

- Add admin panel to manage threshold
- Add analytics for referral conversion rates
- Add notifications when user reaches threshold
- Add milestone rewards (e.g., bonus points at certain referral counts)
