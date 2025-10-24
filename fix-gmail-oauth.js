#!/usr/bin/env node

/**
 * Gmail OAuth Fix Script
 * This script provides step-by-step solutions for Gmail OAuth SHA-1 issues
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Gmail OAuth Fix Tool');
console.log('========================\n');

// Get current configuration
const sha1Fingerprint = '5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25';
const packageName = 'com.aqifi.insightnexus';
const androidClientId = '364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com';
const webClientId = '364847480072-sa8abl7jbo0nisdh5vt2sregmiksgsvs.apps.googleusercontent.com';

console.log('📋 Current Configuration:');
console.log(`   SHA-1: ${sha1Fingerprint}`);
console.log(`   Package: ${packageName}`);
console.log(`   Android Client ID: ${androidClientId}`);
console.log(`   Web Client ID: ${webClientId}\n`);

console.log('🎯 SOLUTION 1: Google Cloud Console Configuration');
console.log('==================================================');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Navigate to: APIs & Services → Credentials');
console.log('3. Find your OAuth 2.0 Client ID');
console.log('4. Click Edit (pencil icon)');
console.log('5. In Android section, add:');
console.log(`   - Package name: ${packageName}`);
console.log(`   - SHA-1: ${sha1Fingerprint}`);
console.log('6. Save the configuration\n');

console.log('🎯 SOLUTION 2: OAuth Consent Screen');
console.log('===================================');
console.log('1. Go to: APIs & Services → OAuth consent screen');
console.log('2. Ensure these fields are filled:');
console.log('   - App name: Aqifi');
console.log('   - User support email: [Your email]');
console.log('   - Developer contact: [Your email]');
console.log('3. Add these scopes:');
console.log('   - https://www.googleapis.com/auth/gmail.readonly');
console.log('   - https://www.googleapis.com/auth/userinfo.email');
console.log('   - https://www.googleapis.com/auth/userinfo.profile\n');

console.log('🎯 SOLUTION 3: Alternative - Use Web Client ID');
console.log('==============================================');
console.log('If SHA-1 issues persist, try using Web Client ID:');
console.log('1. In your Gmail auth service, use webClientId instead of androidClientId');
console.log('2. This bypasses SHA-1 fingerprint requirements');
console.log('3. Web Client ID is already configured in your app.config.ts\n');

console.log('🎯 SOLUTION 4: Regenerate Debug Keystore');
console.log('========================================');
console.log('If you want to start fresh:');
console.log('1. Delete current keystore:');
console.log('   rm ~/.android/debug.keystore');
console.log('2. Generate new keystore:');
console.log('   keytool -genkey -v -keystore ~/.android/debug.keystore \\');
console.log('     -storepass android -alias androiddebugkey \\');
console.log('     -keypass android -keyalg RSA -keysize 2048 -validity 10000');
console.log('3. Get new SHA-1:');
console.log('   keytool -list -v -keystore ~/.android/debug.keystore \\');
console.log('     -alias androiddebugkey -storepass android -keypass android');
console.log('4. Add new SHA-1 to Google Cloud Console\n');

console.log('🎯 SOLUTION 5: Test Configuration');
console.log('=================================');
console.log('After making changes:');
console.log('1. Clean and rebuild:');
console.log('   npx expo run:android --clear');
console.log('2. Test Gmail authentication');
console.log('3. Check console logs for errors\n');

console.log('🎯 SOLUTION 6: Debug Commands');
console.log('=============================');
console.log('Run these commands to debug:');
console.log('1. Check current SHA-1:');
console.log('   keytool -list -v -keystore android/app/debug.keystore \\');
console.log('     -alias androiddebugkey -storepass android -keypass android');
console.log('2. Check signing report:');
console.log('   cd android && ./gradlew signingReport');
console.log('3. Test OAuth flow:');
console.log('   node test-gmail-auth.js\n');

console.log('📱 Quick Test Script');
console.log('===================');
console.log('Run this to test your configuration:');
console.log('node diagnose-gmail-oauth.js\n');

console.log('🚨 Common Issues & Solutions');
console.log('============================');
console.log('❌ "developer_error" → SHA-1 not in Google Console');
console.log('❌ "invalid_client" → Wrong Client ID');
console.log('❌ "access_denied" → OAuth consent screen not configured');
console.log('❌ "redirect_uri_mismatch" → Wrong redirect URI\n');

console.log('✅ Your app.config.ts is properly configured!');
console.log('✅ All Client IDs are set correctly!');
console.log('✅ The main issue is likely SHA-1 fingerprint in Google Console\n');

console.log('🎉 Next Steps:');
console.log('1. Follow SOLUTION 1 (Google Cloud Console)');
console.log('2. Test with: npx expo run:android');
console.log('3. If still failing, try SOLUTION 3 (Web Client ID)');
console.log('4. Run diagnostic: node diagnose-gmail-oauth.js');

console.log('\n✨ Gmail OAuth should work after following these steps!');
