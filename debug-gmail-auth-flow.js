#!/usr/bin/env node

/**
 * Debug script for Gmail authentication flow
 * This helps identify where the "Gmail auth required" error occurs
 */

console.log('🔍 Gmail Authentication Flow Debug Guide');
console.log('========================================\n');

console.log('📱 **Testing Steps:**');
console.log('1. Run the app: npx expo run:android');
console.log('2. Navigate to Activity screen');
console.log('3. Click "Collect Now" button');
console.log('4. Watch the console logs carefully');
console.log('5. Note the exact sequence of events\n');

console.log('🔍 **What to Look For:**');
console.log('');

console.log('**Step 1: Initial State Check**');
console.log('Look for: "🔍 Checking Gmail sign-in status..."');
console.log('Expected: Should show "❌ No stored authentication data found"');
console.log('');

console.log('**Step 2: OAuth Flow Initiation**');
console.log('Look for: "Starting Gmail authentication flow..."');
console.log('Expected: Should show Google Sign-In configuration');
console.log('');

console.log('**Step 3: User Selection Screen**');
console.log('✅ You mentioned this is working - user sees account selection');
console.log('Expected: User selects account and grants permissions');
console.log('');

console.log('**Step 4: OAuth Completion**');
console.log('Look for: "Real Gmail authentication successful"');
console.log('Look for: "Stored access token: Yes"');
console.log('Look for: "Verification - Access token stored: Yes"');
console.log('Expected: All should show "Yes"');
console.log('');

console.log('**Step 5: UI State Update**');
console.log('Look for: "🎉 Gmail sign-in successful, updating UI state..."');
console.log('Look for: "🔍 Gmail sign-in verification: true"');
console.log('Expected: Verification should be "true"');
console.log('');

console.log('**Step 6: Email Collection Attempt**');
console.log('Look for: "🔍 Checking Gmail sign-in status..." (again)');
console.log('Look for: "📱 Stored access token: Yes"');
console.log('Look for: "✅ Found stored authentication data"');
console.log('Expected: Should find stored data and return true');
console.log('');

console.log('🚨 **Common Issues & Solutions:**');
console.log('');

console.log('**Issue 1: OAuth completes but tokens not stored**');
console.log('Symptoms: "Verification - Access token stored: No"');
console.log('Solution: Check AsyncStorage permissions or storage space');
console.log('');

console.log('**Issue 2: Tokens stored but Google Sign-In status mismatch**');
console.log('Symptoms: "⚠️ Google Sign-In status mismatch"');
console.log('Solution: This is normal - the app should use stored data as fallback');
console.log('');

console.log('**Issue 3: Verification fails after successful OAuth**');
console.log('Symptoms: "⚠️ Authentication state verification failed"');
console.log('Solution: Try clicking "Collect Now" again - the state should be correct');
console.log('');

console.log('**Issue 4: Still getting "Gmail auth required" after OAuth**');
console.log('Symptoms: OAuth works but email collection still fails');
console.log('Solution: Check if the error occurs in EmailMetadataService or useEmailMetadata');
console.log('');

console.log('📋 **Debug Commands:**');
console.log('');

console.log('**To check AsyncStorage contents:**');
console.log('1. Open React Native debugger');
console.log('2. Go to AsyncStorage tab');
console.log('3. Look for keys: gmail_access_token, gmail_user_info');
console.log('');

console.log('**To check Google Sign-In status:**');
console.log('1. Add this to your component:');
console.log('   const checkStatus = async () => {');
console.log('     const gmailAuth = RealGmailAuthService.getInstance();');
console.log('     const isSignedIn = await gmailAuth.isSignedIn();');
console.log('     console.log("Manual check:", isSignedIn);');
console.log('   };');
console.log('');

console.log('**To force re-authentication:**');
console.log('1. Sign out from Gmail in the app');
console.log('2. Clear app data/cache');
console.log('3. Try the flow again');
console.log('');

console.log('🎯 **Expected Flow After Fix:**');
console.log('1. User clicks "Collect Now"');
console.log('2. OAuth screen appears ✅ (You confirmed this works)');
console.log('3. User selects account and grants permissions');
console.log('4. OAuth completes successfully');
console.log('5. Tokens are stored in AsyncStorage');
console.log('6. UI state updates to show "Signed in"');
console.log('7. Email collection proceeds without "Gmail auth required" error');
console.log('');

console.log('✨ **The enhanced debugging will show you exactly where the issue occurs!**');
console.log('Run the app and check the console logs to see which step fails.');
