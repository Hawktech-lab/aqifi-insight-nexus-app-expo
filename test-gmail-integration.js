#!/usr/bin/env node

/**
 * Gmail Integration Test Script
 * This script tests the Gmail OAuth and email collection functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Gmail Integration Test');
console.log('=========================\n');

// Test 1: Check SHA-1 fingerprint
console.log('1. 📋 Checking SHA-1 Fingerprint...');
try {
  const sha1Output = execSync('keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android', { encoding: 'utf8' });
  const sha1Match = sha1Output.match(/SHA1:\s*([A-F0-9:]+)/);
  if (sha1Match) {
    const currentSha1 = sha1Match[1];
    const expectedSha1 = '5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25';
    
    if (currentSha1 === expectedSha1) {
      console.log(`   ✅ SHA-1 matches: ${currentSha1}`);
    } else {
      console.log(`   ⚠️  SHA-1 mismatch:`);
      console.log(`      Current: ${currentSha1}`);
      console.log(`      Expected: ${expectedSha1}`);
      console.log(`   💡 Update Google Cloud Console with current SHA-1`);
    }
  } else {
    console.log('   ❌ Could not extract SHA-1 fingerprint');
  }
} catch (error) {
  console.log('   ❌ Error reading keystore:', error.message);
  console.log('   💡 Make sure you have Java installed and keystore exists');
}

// Test 2: Check app configuration
console.log('\n2. ⚙️  Checking App Configuration...');
try {
  const configPath = 'app.config.ts';
  const config = fs.readFileSync(configPath, 'utf8');
  
  const checks = [
    { name: 'Package Name', pattern: /package:\s*['"]([^'"]+)['"]/, expected: 'com.aqifi.insightnexus' },
    { name: 'Android Client ID', pattern: /androidClientId:\s*['"]([^'"]+)['"]/, expected: '364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com' },
    { name: 'Web Client ID', pattern: /webClientId:\s*['"]([^'"]+)['"]/, expected: '364847480072-sa8abl7jbo0nisdh5vt2sregmiksgsvs.apps.googleusercontent.com' },
    { name: 'Gmail API Key', pattern: /gmailApiKey:\s*['"]([^'"]+)['"]/, expected: 'AIzaSyA0mIQdqC2HFih2zRhR9NI8VK6RLD3TV-A' }
  ];
  
  checks.forEach(check => {
    const match = config.match(check.pattern);
    if (match) {
      if (match[1] === check.expected) {
        console.log(`   ✅ ${check.name}: ${match[1]}`);
      } else {
        console.log(`   ⚠️  ${check.name} mismatch:`);
        console.log(`      Current: ${match[1]}`);
        console.log(`      Expected: ${check.expected}`);
      }
    } else {
      console.log(`   ❌ ${check.name} not found`);
    }
  });
} catch (error) {
  console.log('   ❌ Error reading app.config.ts:', error.message);
}

// Test 3: Check dependencies
console.log('\n3. 📦 Checking Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    '@react-native-google-signin/google-signin',
    '@react-native-async-storage/async-storage',
    '@supabase/supabase-js'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`   ❌ ${dep} not found in dependencies`);
    }
  });
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// Test 4: Check source files
console.log('\n4. 📁 Checking Source Files...');
const sourceFiles = [
  'src/services/RealGmailAuthService.ts',
  'src/services/EmailMetadataService.ts',
  'src/hooks/useGmailAuth.ts',
  'src/hooks/useEmailMetadata.ts',
  'src/pages/Activity.tsx'
];

sourceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} not found`);
  }
});

// Test 5: Recommendations
console.log('\n5. 💡 Recommendations:');
console.log('   📋 To fix Gmail OAuth issues:');
console.log('   1. Update Google Cloud Console with correct SHA-1 fingerprint');
console.log('   2. Ensure OAuth consent screen is configured with required scopes');
console.log('   3. Test authentication in the app');
console.log('   4. Check console logs for detailed error messages');

console.log('\n   📋 To fix email collection issues:');
console.log('   1. Ensure user is signed in with Gmail');
console.log('   2. Check Supabase connection and permissions');
console.log('   3. Verify email_metadata table exists in database');
console.log('   4. Test with debug mode enabled');

console.log('\n6. 🧪 Test Commands:');
console.log('   📱 To test the app:');
console.log('   1. npx expo run:android');
console.log('   2. Navigate to Activity screen');
console.log('   3. Try Gmail authentication');
console.log('   4. Test email collection');

console.log('\n7. 🔧 Debug Commands:');
console.log('   📱 To debug issues:');
console.log('   1. Check console logs in Metro bundler');
console.log('   2. Use React Native debugger');
console.log('   3. Check Supabase logs');
console.log('   4. Test with simplified authentication flow');

console.log('\n✨ Integration test complete!');
console.log('Follow the recommendations above to fix any issues.');
