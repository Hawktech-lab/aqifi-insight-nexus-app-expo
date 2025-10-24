#!/usr/bin/env node

/**
 * Gmail OAuth Diagnostic Script
 * This script helps diagnose and fix Gmail OAuth SHA-1 fingerprint issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Gmail OAuth Diagnostic Tool');
console.log('================================\n');

// 1. Check current SHA-1 fingerprint
console.log('1. 📋 Current SHA-1 Fingerprint:');
try {
  const sha1Output = execSync('keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android', { encoding: 'utf8' });
  const sha1Match = sha1Output.match(/SHA1:\s*([A-F0-9:]+)/);
  if (sha1Match) {
    console.log(`   ✅ SHA-1: ${sha1Match[1]}`);
  } else {
    console.log('   ❌ Could not extract SHA-1 fingerprint');
  }
} catch (error) {
  console.log('   ❌ Error reading keystore:', error.message);
}

// 2. Check package name
console.log('\n2. 📦 Package Name:');
try {
  const buildGradlePath = 'android/app/build.gradle';
  const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  const packageMatch = buildGradle.match(/applicationId\s+['"]([^'"]+)['"]/);
  if (packageMatch) {
    console.log(`   ✅ Package: ${packageMatch[1]}`);
  } else {
    console.log('   ❌ Could not find package name in build.gradle');
  }
} catch (error) {
  console.log('   ❌ Error reading build.gradle:', error.message);
}

// 3. Check app.config.ts
console.log('\n3. ⚙️  App Configuration:');
try {
  const configPath = 'app.config.ts';
  const config = fs.readFileSync(configPath, 'utf8');
  
  // Check for Google Client IDs
  const androidClientIdMatch = config.match(/androidClientId:\s*['"]([^'"]+)['"]/);
  const webClientIdMatch = config.match(/webClientId:\s*['"]([^'"]+)['"]/);
  const iosUrlSchemeMatch = config.match(/iosUrlScheme:\s*['"]([^'"]+)['"]/);
  
  if (androidClientIdMatch) {
    console.log(`   ✅ Android Client ID: ${androidClientIdMatch[1]}`);
  } else {
    console.log('   ❌ Android Client ID not found');
  }
  
  if (webClientIdMatch) {
    console.log(`   ✅ Web Client ID: ${webClientIdMatch[1]}`);
  } else {
    console.log('   ❌ Web Client ID not found');
  }
  
  if (iosUrlSchemeMatch) {
    console.log(`   ✅ iOS URL Scheme: ${iosUrlSchemeMatch[1]}`);
  } else {
    console.log('   ❌ iOS URL Scheme not found');
  }
} catch (error) {
  console.log('   ❌ Error reading app.config.ts:', error.message);
}

// 4. Check Google Sign-In plugin configuration
console.log('\n4. 🔌 Google Sign-In Plugin:');
try {
  const configPath = 'app.config.ts';
  const config = fs.readFileSync(configPath, 'utf8');
  
  if (config.includes('@react-native-google-signin/google-signin')) {
    console.log('   ✅ Google Sign-In plugin is configured');
    
    // Check if it's properly configured with parameters
    if (config.includes('androidClientId:') && config.includes('webClientId:')) {
      console.log('   ✅ Plugin has proper configuration parameters');
    } else {
      console.log('   ⚠️  Plugin may need configuration parameters');
    }
  } else {
    console.log('   ❌ Google Sign-In plugin not found');
  }
} catch (error) {
  console.log('   ❌ Error checking plugin configuration:', error.message);
}

// 5. Recommendations
console.log('\n5. 💡 Recommendations:');
console.log('   📋 To fix the "developer error":');
console.log('   1. Go to Google Cloud Console → APIs & Services → Credentials');
console.log('   2. Find your OAuth 2.0 Client ID');
console.log('   3. Edit the Android configuration:');
console.log('      - Package name: com.aqifi.insightnexus');
console.log('      - SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25');
console.log('   4. Ensure OAuth consent screen is configured');
console.log('   5. Add required scopes: gmail.readonly, userinfo.email, userinfo.profile');

console.log('\n6. 🔧 Alternative Solutions:');
console.log('   📱 If SHA-1 issues persist:');
console.log('   1. Try using Web Client ID instead of Android Client ID');
console.log('   2. Regenerate debug keystore:');
console.log('      keytool -genkey -v -keystore ~/.android/debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000');
console.log('   3. Use Expo AuthSession instead of Google Sign-In library');

console.log('\n7. 🧪 Test Commands:');
console.log('   📱 To test the configuration:');
console.log('   1. npx expo run:android');
console.log('   2. Try Gmail authentication in the app');
console.log('   3. Check console logs for specific error messages');

console.log('\n✨ Diagnostic complete! Follow the recommendations above to fix the OAuth issue.');
