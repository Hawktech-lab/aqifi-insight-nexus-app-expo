import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Diagnostic tool for Google Sign-In issues
 */
export class GoogleSignInDiagnostic {
  
  /**
   * Run comprehensive Google Sign-In diagnostics
   */
  public static async runDiagnostics(): Promise<{
    success: boolean;
    results: string[];
    error?: string;
  }> {
    const results: string[] = [];
    
    try {
      results.push('🔍 Google Sign-In Diagnostic Report');
      results.push('=====================================');
      
      // Check 1: Basic SDK availability
      results.push('\n📱 Test 1: SDK Availability');
      if (typeof GoogleSignin === 'undefined') {
        results.push('❌ GoogleSignin is undefined');
        return { success: false, results, error: 'Google Sign-In SDK not available' };
      }
      results.push('✅ GoogleSignin SDK is available');
      
      // Check 2: Configuration method availability
      results.push('\n⚙️ Test 2: Configuration Method');
      if (typeof GoogleSignin.configure !== 'function') {
        results.push('❌ GoogleSignin.configure is not a function');
        return { success: false, results, error: 'GoogleSignin.configure not available' };
      }
      results.push('✅ GoogleSignin.configure is available');
      
      // Check 3: App configuration
      results.push('\n📋 Test 3: App Configuration');
      const clientId = Constants.expoConfig?.extra?.googleClientId;
      const packageName = Constants.expoConfig?.android?.package || Constants.expoConfig?.ios?.bundleIdentifier;
      const appName = Constants.expoConfig?.name;
      
      results.push(`Client ID: ${clientId ? '✅ Present' : '❌ Missing'}`);
      if (clientId) {
        results.push(`Client ID Type: ${clientId.includes('apps.googleusercontent.com') ? '✅ Valid format' : '❌ Invalid format'}`);
        results.push(`Client ID: ${clientId.substring(0, 20)}...`);
      }
      
      results.push(`Package Name: ${packageName ? '✅ Present' : '❌ Missing'}`);
      if (packageName) {
        results.push(`Package: ${packageName}`);
      }
      
      results.push(`App Name: ${appName ? '✅ Present' : '❌ Missing'}`);
      if (appName) {
        results.push(`App: ${appName}`);
      }
      
      // Check 4: Platform specific checks
      results.push('\n🔧 Test 4: Platform Configuration');
      results.push(`Platform: ${Platform.OS}`);
      results.push(`Is Device: ${Constants.isDevice ? 'Yes' : 'No'}`);
      
      // Check 5: Try configuration
      results.push('\n🔐 Test 5: Configuration Test');
      try {
        if (!clientId) {
          throw new Error('No Client ID available');
        }
        
        await GoogleSignin.configure({
          webClientId: clientId,
          offlineAccess: true,
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ]
        });
        
        results.push('✅ Configuration successful');
        
      } catch (configError: any) {
        results.push('❌ Configuration failed');
        results.push(`Error: ${configError.message || 'Unknown configuration error'}`);
        return { success: false, results, error: configError.message };
      }
      
      // Check 6: Play Services availability (Android only)
      if (Platform.OS === 'android') {
        results.push('\n🎮 Test 6: Google Play Services');
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
          results.push('✅ Google Play Services available');
        } catch (playServicesError: any) {
          results.push('❌ Google Play Services not available');
          results.push(`Error: ${playServicesError.message || 'Unknown Play Services error'}`);
        }
      }
      
      // Check 7: Sign-in status
      results.push('\n👤 Test 7: Current Sign-in Status');
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        results.push(`Currently Signed In: ${isSignedIn ? '✅ Yes' : '❌ No'}`);
        
        if (isSignedIn) {
          const currentUser = await GoogleSignin.getCurrentUser();
          if (currentUser?.user) {
            results.push(`Current User: ${currentUser.user.email}`);
            results.push(`User Name: ${currentUser.user.name || 'Not available'}`);
          } else {
            results.push('❌ Could not get current user info');
          }
        }
      } catch (statusError: any) {
        results.push('❌ Error checking sign-in status');
        results.push(`Error: ${statusError.message || 'Unknown status error'}`);
      }
      
      results.push('\n🎉 Diagnostic Complete!');
      
      return { success: true, results };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Diagnostic Error: ${errorMsg}`);
      return { success: false, results, error: errorMsg };
    }
  }
  
  /**
   * Test actual sign-in process
   */
  public static async testSignInProcess(): Promise<{
    success: boolean;
    results: string[];
    error?: string;
  }> {
    const results: string[] = [];
    
    try {
      results.push('🔐 Testing Google Sign-In Process');
      results.push('==================================');
      
      // Try to sign in
      results.push('\n📱 Attempting Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      
      results.push('✅ Sign-in successful!');
      results.push(`User ID: ${userInfo.user.id}`);
      results.push(`Email: ${userInfo.user.email}`);
      results.push(`Name: ${userInfo.user.name || 'Not available'}`);
      results.push(`Photo: ${userInfo.user.photo ? 'Available' : 'Not available'}`);
      results.push(`ID Token: ${userInfo.idToken ? 'Present' : 'Missing'}`);
      results.push(`Server Auth Code: ${userInfo.serverAuthCode ? 'Present' : 'Missing'}`);
      
      // Try to get tokens
      results.push('\n🎫 Testing Token Retrieval...');
      const tokens = await GoogleSignin.getTokens();
      results.push(`Access Token: ${tokens.accessToken ? 'Present' : 'Missing'}`);
      results.push(`Refresh Token: ${tokens.refreshToken ? 'Present' : 'Missing'}`);
      
      if (tokens.accessToken) {
        results.push(`Access Token Length: ${tokens.accessToken.length} characters`);
      }
      
      results.push('\n🎉 Sign-In Process Test Complete!');
      
      return { success: true, results };
      
    } catch (error: any) {
      results.push('❌ Sign-in process failed');
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        results.push('Error: User cancelled sign-in');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        results.push('Error: Sign-in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        results.push('Error: Google Play Services not available');
      } else {
        results.push(`Error: ${error.message || 'Unknown sign-in error'}`);
      }
      
      return { success: false, results, error: error.message };
    }
  }
}

export default GoogleSignInDiagnostic;
