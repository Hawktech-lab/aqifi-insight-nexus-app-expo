# Waitlist Feature Flag Guide

## Overview

The waitlist feature can be easily enabled/disabled via database configuration. When disabled, all waitlist functionality gracefully degrades without breaking the app.

## Feature Flag Configuration

### Enable/Disable Waitlist

**In Supabase SQL Editor:**

```sql
-- Enable waitlist
UPDATE app_configuration 
SET config_value = 'true', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';

-- Disable waitlist
UPDATE app_configuration 
SET config_value = 'false', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';
```

## Behavior When Disabled

### ✅ What Still Works:
- User authentication
- KYC verification
- All existing app features
- User can still use the app normally

### ❌ What's Disabled:
- Waitlist join after KYC
- Referral code entry during signup (optional, can be hidden)
- Waitlist dashboard (shows "Feature Disabled" message)
- Leaderboard (shows "Feature Unavailable" message)
- Points system
- Referral tracking

## Implementation Details

### 1. Feature Flag Check
- Stored in `app_configuration` table: `waitlist_enabled`
- Cached for 5 minutes for performance
- Checked before any waitlist operation

### 2. Components Handle Disabled State
- `WaitlistDashboard` - Shows disabled message
- `Leaderboard` - Shows unavailable message
- `WaitlistService` - Returns null/empty when disabled
- All waitlist operations check flag first

### 3. Graceful Degradation
- No errors thrown when disabled
- User-friendly messages shown
- App continues to function normally

## Integration Points

### In App.tsx (KYC Completion)

```typescript
// After KYC completion
const waitlistService = WaitlistService.getInstance();
const enabled = await waitlistService.isEnabled();

if (enabled) {
  await waitlistService.joinWaitlist(userId, referralCode);
} else {
  console.log('Waitlist disabled, skipping join');
}
```

### In Navigation

```typescript
// Conditionally show waitlist tab/menu item
const { enabled } = useWaitlistEnabled();

{enabled && (
  <Tab.Screen name="Waitlist" component={WaitlistDashboard} />
)}
```

### In Signup Form

```typescript
// Conditionally show referral code input
const { enabled } = useWaitlistEnabled();

{enabled && (
  <TextInput placeholder="Referral Code (Optional)" />
)}
```

## Testing

### Test Disabled State:
1. Set `waitlist_enabled` to `'false'` in database
2. Complete KYC - should not join waitlist
3. Navigate to waitlist dashboard - should show disabled message
4. Navigate to leaderboard - should show unavailable message
5. App should function normally otherwise

### Test Enabled State:
1. Set `waitlist_enabled` to `'true'` in database
2. Complete KYC - should join waitlist
3. Navigate to waitlist dashboard - should show normal UI
4. Navigate to leaderboard - should show leaderboard

## Cache Management

The feature flag is cached for 5 minutes. To force immediate update:

```typescript
const waitlistService = WaitlistService.getInstance();
waitlistService.clearCache(); // Clear cache
const enabled = await waitlistService.isEnabled(); // Fresh check
```

## Quick Toggle Commands

### Enable Waitlist
```sql
UPDATE app_configuration 
SET config_value = 'true', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';
```

### Disable Waitlist
```sql
UPDATE app_configuration 
SET config_value = 'false', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';
```

### Check Current Status
```sql
SELECT config_value FROM app_configuration 
WHERE config_key = 'waitlist_enabled';
```

## Benefits

✅ **Easy Toggle** - Single database update
✅ **No Code Changes** - Toggle without redeployment
✅ **Graceful Degradation** - App continues working
✅ **User-Friendly** - Clear messages when disabled
✅ **Performance** - Cached for efficiency
✅ **Safe** - No breaking changes when disabled

## Notes

- Feature flag is checked before every waitlist operation
- Cache duration: 5 minutes (configurable)
- Default: Enabled (`'true'`)
- Case-insensitive: `'true'`, `'True'`, `'TRUE'` all work
- Any other value is treated as disabled

