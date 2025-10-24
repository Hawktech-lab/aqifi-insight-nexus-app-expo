import RealGmailAuthService from '../services/RealGmailAuthService';

/**
 * Test utility for Gmail authentication
 */
export class GmailAuthTest {
  private static gmailService = RealGmailAuthService.getInstance();

  /**
   * Run comprehensive Gmail authentication tests
   */
  public static async runTests(): Promise<{
    success: boolean;
    results: string[];
    error?: string;
  }> {
    const results: string[] = [];
    
    try {
      results.push('🧪 Starting Gmail Authentication Tests...');
      
      // Test 1: Configuration Test
      results.push('\n📋 Test 1: Configuration Test');
      const configTest = await this.gmailService.testConfiguration();
      results.push(`Configuration Test: ${configTest.success ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (!configTest.success) {
        results.push(`❌ Configuration test failed: ${configTest.error}`);
        return { success: false, results, error: configTest.error };
      }
      results.push('✅ Configuration test passed');

      // Test 2: OAuth Configuration Check
      results.push('\n🔐 Test 2: OAuth Configuration Check');
      const oauthCheck = await this.gmailService.checkOAuthConfiguration();
      results.push(`OAuth Check: ${oauthCheck.success ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (!oauthCheck.success) {
        results.push(`❌ OAuth configuration check failed`);
        results.push(`Issues: ${oauthCheck.issues.join(', ')}`);
        results.push(`Recommendations: ${oauthCheck.recommendations.join(', ')}`);
        return { success: false, results, error: oauthCheck.issues.join(', ') };
      }
      results.push('✅ OAuth configuration check passed');

      // Test 3: Debug Info
      results.push('\n🐛 Test 3: Debug Information');
      const debugInfo = await this.gmailService.getDebugInfo();
      results.push(`Debug Info: ${debugInfo.error ? '❌ Error' : '✅ Available'}`);
      if (debugInfo.error) {
        results.push(`Error: ${debugInfo.error}`);
      }

      // Test 4: Sign-in Status Check
      results.push('\n👤 Test 4: Sign-in Status Check');
      const isSignedIn = await this.gmailService.isSignedIn();
      results.push(`Sign-in Status: ${isSignedIn ? '✅ Signed In' : '❌ Not Signed In'}`);

      // Test 5: Current User Check
      results.push('\n👤 Test 5: Current User Check');
      const currentUser = await this.gmailService.getCurrentUser();
      results.push(`Current User: ${currentUser ? '✅ Available' : '❌ Not Available'}`);
      if (currentUser) {
        results.push(`User Email: ${currentUser.email}`);
        results.push(`User Name: ${currentUser.name}`);
      }

      results.push('\n🎉 All Gmail Authentication Tests Completed!');
      
      return { success: true, results };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Gmail Authentication Test Error: ${errorMsg}`);
      return { success: false, results, error: errorMsg };
    }
  }

  /**
   * Test Gmail sign-in flow
   */
  public static async testSignIn(): Promise<{
    success: boolean;
    result: string;
    error?: string;
  }> {
    const results: string[] = [];
    
    try {
      results.push('🔐 Testing Gmail Sign-In Flow...');
      
      const result = await this.gmailService.signInWithGmail();
      results.push(`Sign-In Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (result.success) {
        results.push('✅ Gmail sign-in successful!');
        results.push(`User: ${result.user?.email || 'Unknown'}`);
        results.push(`Name: ${result.user?.name || 'Unknown'}`);
        results.push(`Access Token: ${result.accessToken ? 'Present' : 'Missing'}`);
        return { success: true, result: results.join('\n') };
      } else {
        results.push(`❌ Gmail sign-in failed: ${result.error}`);
        return { success: false, result: results.join('\n'), error: result.error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Gmail sign-in test error: ${errorMsg}`);
      return { success: false, result: results.join('\n'), error: errorMsg };
    }
  }

  /**
   * Test Gmail API access
   */
  public static async testGmailApi(): Promise<void> {
    console.log('📧 Testing Gmail API Access...');
    
    try {
      const messages = await this.gmailService.getMessages();
      console.log('Gmail Messages:', messages);
      console.log('✅ Gmail API access successful!');
    } catch (error) {
      console.error('❌ Gmail API test error:', error);
    }
  }
}

export default GmailAuthTest;
