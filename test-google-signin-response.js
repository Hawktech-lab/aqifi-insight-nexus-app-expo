#!/usr/bin/env node

/**
 * Test Google Sign-In Response Structure
 * This script helps debug the structure of Google Sign-In responses
 */

console.log('🔍 Google Sign-In Response Structure Test');
console.log('=========================================\n');

// Mock response structures to help understand the issue
console.log('📋 Expected Google Sign-In Response Structures:');
console.log('');

console.log('Structure 1 (Common):');
console.log(JSON.stringify({
  user: {
    id: "123456789",
    email: "user@gmail.com",
    name: "John Doe",
    photo: "https://lh3.googleusercontent.com/..."
  },
  idToken: "eyJhbGciOiJSUzI1NiIs...",
  serverAuthCode: "4/0AX4XfWh..."
}, null, 2));

console.log('\nStructure 2 (Alternative):');
console.log(JSON.stringify({
  id: "123456789",
  email: "user@gmail.com", 
  name: "John Doe",
  photo: "https://lh3.googleusercontent.com/...",
  idToken: "eyJhbGciOiJSUzI1NiIs...",
  serverAuthCode: "4/0AX4XfWh..."
}, null, 2));

console.log('\nStructure 3 (With userId):');
console.log(JSON.stringify({
  user: {
    userId: "123456789",
    email: "user@gmail.com",
    name: "John Doe", 
    photo: "https://lh3.googleusercontent.com/..."
  },
  idToken: "eyJhbGciOiJSUzI1NiIs...",
  serverAuthCode: "4/0AX4XfWh..."
}, null, 2));

console.log('\n🎯 The Fix Applied:');
console.log('==================');
console.log('The code now handles all these structures by:');
console.log('1. Using: const user = userInfo.user || userInfo');
console.log('2. Using: user?.id || user?.userId || user?.sub || "unknown"');
console.log('3. Adding console.log to see actual response structure');
console.log('4. Using optional chaining (?.) to prevent errors');

console.log('\n🔧 Debug Steps:');
console.log('===============');
console.log('1. Run your app and try Gmail sign-in');
console.log('2. Check console logs for:');
console.log('   - "Google Sign-In userInfo:"');
console.log('   - "getCurrentUser userInfo:"');
console.log('3. Look at the actual structure returned');
console.log('4. The fix should handle most common structures');

console.log('\n✅ The error "cannot read property id of undefined" should now be fixed!');
console.log('The code now safely handles different response structures from Google Sign-In.');
