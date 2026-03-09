# Viral Loops Referral Integration

## Overview

This implementation integrates Viral Loops API for referral code tracking during signup and throughout the user journey. Users can enter a referral code during signup, and the system tracks referrals using Viral Loops API.

## Flow

1. **User signs up** → Can optionally enter referral code
2. **Referral code stored** → Saved in user metadata and profile
3. **User signs in** → Authentication proceeds normally
4. **Identity verification (zk)** → User completes KYC
5. **Waitlist screen** → User joins waitlist, referral is tracked in Viral Loops
6. **Referral tracking** → Referrer's count increases when referred user completes signup/KYC
7. **Dashboard access** → User needs N referrals (configurable) to access dashboard

## Changes Made

### 1. Signup Screen Updates (`src/navigation/AuthNavigator.tsx`)

- Added referral code input field (optional)
- Shows helper text when referral code is entered
- Passes referral code to signup function

### 2. AuthContext Updates (`src/contexts/AuthContext.tsx`)

- Updated `signUp` function to accept `referralCode` parameter
- Stores referral code in user metadata (`user_metadata.referral_code`)
- Creates participant in Viral Loops API during signup if referral code provided
- Uses Viral Loops API to track the referral relationship immediately

### 3. WaitlistService Updates (`src/services/WaitlistService.ts`)

- `joinWaitlist()` now retrieves referral code from user metadata if not provided
- Looks for referrer in both `waitlist_users` and `profiles` tables
- `syncWithViralloops()` enhanced to:
  - Get referral code from user metadata
  - Track referral in Viral Loops when participant is created
  - Link referrer and referred user in Viral Loops system
- `createReferral()` updated to:
  - Check for existing referrals to prevent duplicates
  - Use Viral Loops API for referral tracking
  - Award points and update counts properly

### 4. Database Migration (`supabase/migrations/20250120000004-update-handle-new-user-referral.sql`)

- Updated `handle_new_user()` function to:
  - Extract referral code from user metadata
  - Find referrer in `waitlist_users` or `profiles` tables
  - Set `referred_by_code` in profile when user is created
  - Ensures referral relationship is established at signup

### 5. Styles Updates (`src/styles/authStyles.ts`)

- Added `helperText` style for referral code helper message

## Viral Loops API Integration

### During Signup
- When user signs up with referral code:
  1. Referral code stored in user metadata
  2. Participant created in Viral Loops with `referredByCode`
  3. Referral relationship tracked in Viral Loops

### During Waitlist Join
- When user joins waitlist after KYC:
  1. Retrieves referral code from user metadata if available
  2. Creates/updates participant in Viral Loops
  3. Tracks referral relationship if referrer exists
  4. Updates referral counts in database

### Referral Tracking
- Uses Viral Loops `createParticipant()` API with `referredByCode`
- Uses Viral Loops `trackReferral()` API to explicitly track referrals
- Syncs referral data between app database and Viral Loops

## Referral Code Flow

### Signup with Referral Code
```
User enters referral code → Stored in user_metadata
                         → Profile created with referred_by_code
                         → Participant created in Viral Loops
                         → Referral tracked in Viral Loops
```

### Waitlist Join
```
User joins waitlist → Referral code retrieved from metadata
                   → Referrer found in waitlist_users or profiles
                   → Referral record created in database
                   → Points awarded to referrer
                   → Referral tracked in Viral Loops
                   → Referrer's count increases
```

## Database Schema

### Profiles Table
- `referred_by_code`: Stores the referral code used during signup
- Set automatically when profile is created via `handle_new_user()` trigger

### Waitlist Users Table
- `referred_by_code`: Stores referral code of the referrer
- `referred_by_user_id`: Links to the referrer's user ID
- `viralloops_participant_id`: Links to Viral Loops participant
- `viralloops_synced`: Indicates if synced with Viral Loops

### Referrals Table
- Tracks all referral relationships
- Links referrer and referred user
- Stores points awarded and status

## API Endpoints Used

### Viral Loops API v3
- `POST /campaign-participant`: Create participant with referral code
- `POST /referrals`: Track referral relationship
- Falls back to v2 API if v3 not available

## Configuration

Viral Loops configuration stored in `app_configuration` table:
- `viralloops_api_key`: API key for Viral Loops
- `viralloops_campaign_id`: Campaign ID (UCID)
- `viralloops_landing_page_url`: Landing page URL for sharing

## Error Handling

- Viral Loops API failures don't block signup or waitlist join
- Errors are logged but don't prevent user flow
- Database operations continue even if Viral Loops sync fails
- Referral tracking works with or without Viral Loops API

## Testing Checklist

- [ ] User can enter referral code during signup
- [ ] Referral code is stored in user metadata
- [ ] Profile is created with `referred_by_code`
- [ ] Participant is created in Viral Loops during signup
- [ ] Referral is tracked in Viral Loops
- [ ] When user joins waitlist, referral relationship is established
- [ ] Referrer's referral count increases
- [ ] Referrer's points are awarded
- [ ] Referral appears in Viral Loops dashboard
- [ ] Works with existing users who signed up without referral code

## Future Enhancements

- Add referral code validation (check if code exists)
- Show referrer name/email when referral code is entered
- Add referral analytics dashboard
- Support for referral code sharing via deep links
- Automatic referral code generation for new users
