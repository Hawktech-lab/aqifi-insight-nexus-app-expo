# Waitlist Integration Guide

## Summary

All waitlist components and services have been created. This guide shows how to integrate them into the existing app flow.

## Files Created

✅ **Database:**
- `database-waitlist-migration.sql` - Run this in Supabase SQL editor

✅ **Services:**
- `src/services/ViralloopsService.ts` - Viralloops API integration
- `src/services/WaitlistService.ts` - Waitlist business logic

✅ **Components:**
- `src/components/ViralloopsWidget.tsx` - Viralloops widget (WebView)
- `src/components/WaitlistDashboard.tsx` - User dashboard
- `src/components/Leaderboard.tsx` - Leaderboard display

## Integration Steps

### Step 1: Add Referral Code to Signup Form (Conditional)

**File:** `src/pages/Auth.tsx`

Add referral code input field in the signup form (only shown when waitlist is enabled):

```typescript
// Add imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWaitlistEnabled } from '../hooks/useWaitlistEnabled';

// Add state for referral code
const [referralCode, setReferralCode] = useState<string>('');
const { enabled: waitlistEnabled } = useWaitlistEnabled();

// In signup form, add after password field (conditionally):
{waitlistEnabled && (
  <View className="space-y-2">
    <Text className="text-sm font-medium text-gray-700">Referral Code (Optional)</Text>
    <TextInput
      className="border border-gray-300 rounded-md p-2 text-base"
      placeholder="Enter referral code"
      value={referralCode}
      onChangeText={setReferralCode}
      autoCapitalize="characters"
    />
    <Text className="text-xs text-gray-500">
      Have a referral code? Enter it here to help your friend earn points!
    </Text>
  </View>
)}

// In handleSignUp function, after successful signup:
if (!authError) {
  if (waitlistEnabled && referralCode.trim()) {
    await AsyncStorage.setItem('pending_referral_code', referralCode.trim().toUpperCase());
  }
  setSuccess('Check your email for the confirmation link!');
}
```

### Step 2: Join Waitlist After KYC Completion

**File:** `src/App.tsx`

Add waitlist join after KYC completion (with feature flag check):

```typescript
// Add import at top
import WaitlistService from './services/WaitlistService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In handleKycComplete function, after successful KYC update:
if (apiResult?.success !== false) {
  // Backend successfully updated status to 'verified'
  queryClient.invalidateQueries(['profile', user.id]);
  
  // Join waitlist with referral code (only if enabled)
  try {
    const waitlistService = WaitlistService.getInstance();
    const enabled = await waitlistService.isEnabled();
    
    if (enabled) {
      const storedReferralCode = await AsyncStorage.getItem('pending_referral_code');
      
      const waitlistUser = await waitlistService.joinWaitlist(
        user.id,
        storedReferralCode || undefined
      );
      
      // Clear stored referral code
      if (storedReferralCode) {
        await AsyncStorage.removeItem('pending_referral_code');
      }
      
      if (waitlistUser) {
        Alert.alert(
          'Success', 
          'KYC verification completed! You\'ve been added to the waitlist.'
        );
      } else {
        Alert.alert('Success', 'KYC verification completed successfully!');
      }
    } else {
      Alert.alert('Success', 'KYC verification completed successfully!');
    }
  } catch (waitlistError) {
    console.error('Error joining waitlist:', waitlistError);
    // Don't fail the KYC completion if waitlist join fails
    Alert.alert('Success', 'KYC verification completed successfully!');
  }
}
```

### Step 3: Add Navigation Routes (Conditional)

**File:** `src/App.tsx` (in navigation setup)

Add routes for WaitlistDashboard and Leaderboard (conditionally based on feature flag):

```typescript
// Import components and hook
import { WaitlistDashboard } from './components/WaitlistDashboard';
import { Leaderboard } from './components/Leaderboard';
import { useWaitlistEnabled } from './hooks/useWaitlistEnabled';

// In your component:
const { enabled: waitlistEnabled } = useWaitlistEnabled();

// In your Stack Navigator or Tab Navigator, add conditionally:
{waitlistEnabled && (
  <>
    <Stack.Screen 
      name="WaitlistDashboard" 
      component={WaitlistDashboard}
      options={{ title: 'Waitlist' }}
    />
    <Stack.Screen 
      name="Leaderboard" 
      component={Leaderboard}
      options={{ title: 'Leaderboard' }}
    />
  </>
)}

// Or add to Tab Navigator conditionally:
{waitlistEnabled && (
  <Tab.Screen
    name="Waitlist"
    component={WaitlistDashboard}
    options={{
      tabBarIcon: ({ color, size }) => (
        <Icon name="list-outline" size={size} color={color} />
      ),
    }}
  />
)}
```

### Step 4: Add Waitlist Link to Dashboard/Menu

**File:** `src/pages/Dashboard.tsx` or wherever you have navigation

Add button/link to navigate to waitlist:

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

<TouchableOpacity
  onPress={() => navigation.navigate('WaitlistDashboard' as never)}
  style={styles.waitlistButton}
>
  <Icon name="list-outline" size={24} color="#3b82f6" />
  <Text>View Waitlist</Text>
</TouchableOpacity>
```

### Step 5: Update Viralloops Credentials

**In Supabase SQL Editor:**

```sql
-- Update with your real Viralloops credentials
UPDATE app_configuration 
SET config_value = 'your_real_api_key_here'
WHERE config_key = 'viralloops_api_key';

UPDATE app_configuration 
SET config_value = 'your_real_campaign_id_here'
WHERE config_key = 'viralloops_campaign_id';
```

## Testing Flow

1. **Signup with Referral Code:**
   - User signs up with referral code
   - Code stored in AsyncStorage

2. **Complete KYC:**
   - User completes ZkMe KYC verification
   - After KYC success, user joins waitlist
   - Referral code applied if provided
   - 20 points awarded for KYC

3. **View Waitlist Dashboard:**
   - User sees their position
   - Referral code displayed
   - Progress on tasks shown

4. **Refer Friends:**
   - User shares referral code
   - Friends sign up with code
   - Points awarded (5 per referral)

5. **Social Sharing:**
   - User shares on social media
   - Share submitted for verification
   - Points awarded after verification (1 per share)

6. **View Leaderboard:**
   - User sees top 100
   - Their rank highlighted
   - Points breakdown shown

## Database Setup

1. Run `database-waitlist-migration.sql` in Supabase SQL Editor
2. Verify tables created:
   - `waitlist_users`
   - `referrals`
   - `social_shares`
   - `points_transactions`
   - `leaderboard_cache`

3. Verify functions created:
   - `generate_referral_code()`
   - `award_points()`
   - `update_waitlist_positions()`
   - `update_leaderboard_cache()`

## Points System

- **KYC Completion**: 20 points (automatic after KYC)
- **Referral**: 5 points per friend (unlimited)
- **Social Share**: 1 point per verified share

## Feature Flag Control

### Enable/Disable Waitlist

**To Enable:**
```sql
UPDATE app_configuration 
SET config_value = 'true', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';
```

**To Disable:**
```sql
UPDATE app_configuration 
SET config_value = 'false', updated_at = NOW()
WHERE config_key = 'waitlist_enabled';
```

**Check Status:**
```sql
SELECT config_value FROM app_configuration 
WHERE config_key = 'waitlist_enabled';
```

### When Disabled:
- ✅ App continues to work normally
- ✅ KYC still works
- ✅ All other features work
- ❌ Waitlist join skipped after KYC
- ❌ Waitlist dashboard shows "Feature Disabled"
- ❌ Leaderboard shows "Unavailable"
- ❌ Referral code input hidden in signup

See `WAITLIST_FEATURE_FLAG.md` for complete details.

## Next Steps After Integration

1. Test the complete flow
2. Update Viralloops credentials with real values
3. Set up social share verification (admin panel or automated)
4. Monitor leaderboard and points system
5. Adjust points values if needed
6. Test feature flag toggle (enable/disable)

## Notes

- Referral code is optional during signup
- Waitlist join happens automatically after KYC (only if enabled)
- Points are awarded automatically (only if enabled)
- Leaderboard updates automatically via triggers (only if enabled)
- Viralloops sync happens in background (non-blocking)
- **Feature can be toggled on/off via database - no code changes needed**

