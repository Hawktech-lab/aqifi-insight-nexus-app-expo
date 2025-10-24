import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export interface GmailAuthResult {
  success: boolean;
  accessToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    photo?: string;
  };
  error?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: any[];
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

class DirectGmailAuthService {
  private static instance: DirectGmailAuthService;
  private readonly ACCESS_TOKEN_KEY = 'gmail_access_token';
  private readonly REFRESH_TOKEN_KEY = 'gmail_refresh_token';
  private readonly USER_INFO_KEY = 'gmail_user_info';
  private readonly GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';
  private readonly GOOGLE_OAUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly GOOGLE_TOKEN_BASE = 'https://oauth2.googleapis.com/token';

  public static getInstance(): DirectGmailAuthService {
    if (!DirectGmailAuthService.instance) {
      DirectGmailAuthService.instance = new DirectGmailAuthService();
    }
    return DirectGmailAuthService.instance;
  }

  /**
   * Get Google Client ID from configuration
   */
  private getClientId(): string {
    let clientId = Constants.expoConfig?.extra?.googleClientId;
    if (!clientId) {
      clientId = "364847480072-f90sdc7j4jjuc00eg5jm6pres76su3pj.apps.googleusercontent.com";
    }
    return clientId;
  }

  /**
   * Get Gmail API Key from configuration
   */
  private getGmailApiKey(): string {
    return Constants.expoConfig?.extra?.gmailApiKey || "AIzaSyA0mIQdqC2HFih2zRhR9NI8VK6RLD3TV-A";
  }

  /**
   * Get redirect URI for OAuth (mobile apps use different approach)
   */
  private getRedirectUri(): string {
    try {
      // For mobile apps, we can use a custom scheme or postmessage
      // Google recommends using 'postmessage' for mobile apps
      const redirectUri = 'postmessage';
      console.log('Using mobile redirect URI:', redirectUri);
      return redirectUri;
    } catch (error) {
      console.error('Error generating redirect URI:', error);
      // Fallback for mobile
      return 'postmessage';
    }
  }

  /**
   * Sign in with Gmail using direct OAuth flow
   */
  public async signInWithGmail(): Promise<GmailAuthResult> {
    try {
      // Starting direct Gmail OAuth flow
      
      const clientId = this.getClientId();
      const redirectUri = this.getRedirectUri();
      
      // Build OAuth URL manually for better compatibility
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ');
      
      const authUrl = `${this.GOOGLE_OAUTH_BASE}?` + new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',
        prompt: 'consent'
      }).toString();

      // OAuth URL created with clientId and redirectUri

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // OAuth authorization successful, parsing URL
        
        // Parse the authorization code from the URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Authorization code received, exchanging for tokens
          
          // Exchange authorization code for tokens
          const tokenResult = await this.exchangeCodeForTokens(code, redirectUri);
          
          if (tokenResult.success && tokenResult.accessToken) {
            // Get user info
            const userInfo = await this.getUserInfo(tokenResult.accessToken);
            
            if (userInfo) {
              // Store tokens and user info
              await this.storeAuthData(
                tokenResult.accessToken, 
                tokenResult.refreshToken, 
                userInfo
              );
              
              // Gmail sign-in successful
              return {
                success: true,
                accessToken: tokenResult.accessToken,
                user: userInfo
              };
            }
          }
        }
      } else if (result.type === 'cancel') {
        return {
          success: false,
          error: 'Sign-in was cancelled by user'
        };
      }

      return {
        success: false,
        error: 'OAuth flow failed'
      };

    } catch (error: any) {
      console.error('Gmail sign-in error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        error: `Sign-in failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> {
    try {
      const clientId = this.getClientId();
      
      const response = await fetch(this.GOOGLE_TOKEN_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }).toString()
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }

      const tokenData = await response.json();
      
      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      };
    } catch (error) {
      // Error exchanging code for tokens
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed'
      };
    }
  }

  /**
   * Get user information from Google API
   */
  private async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    photo?: string;
  } | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const userData = await response.json();
      
      // Check if it's a Gmail account
      if (!userData.email?.endsWith('@gmail.com')) {
        throw new Error('Please sign in with a Gmail account');
      }

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || '',
        photo: userData.picture
      };
    } catch (error) {
      // Error getting user info
      return null;
    }
  }

  /**
   * Check if user is signed in
   */
  public async isSignedIn(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return false;
      }

      // Verify token is still valid by making a test API call
      const response = await fetch(`${this.GMAIL_API_BASE}/users/me/profile?key=${this.getGmailApiKey()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.ok;
    } catch (error) {
      // Error checking sign-in status
      return false;
    }
  }

  /**
   * Get current access token
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      // Error getting access token
      return null;
    }
  }

  /**
   * Get current user info
   */
  public async getCurrentUser(): Promise<any> {
    try {
      const userInfo = await AsyncStorage.getItem(this.USER_INFO_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      // Error getting current user
      return null;
    }
  }

  /**
   * Sign out from Gmail
   */
  public async signOut(): Promise<void> {
    try {
      await this.clearAuthData();
      // Gmail sign-out successful
    } catch (error) {
      // Error signing out
    }
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(accessToken: string, refreshToken: string | undefined, user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
      await AsyncStorage.setItem(this.USER_INFO_KEY, JSON.stringify(user));
    } catch (error) {
      // Error storing auth data
    }
  }

  /**
   * Clear authentication data
   */
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(this.USER_INFO_KEY);
    } catch (error) {
      // Error clearing auth data
    }
  }

  /**
   * Get Gmail messages using direct API
   */
  public async getMessages(accessToken: string, maxResults: number = 20, query?: string): Promise<GmailMessage[]> {
    try {
      const apiKey = this.getGmailApiKey();
      
      // Build query parameters
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        includeSpamTrash: 'false',
        labelIds: 'INBOX',  // Restrict to inbox only
        key: apiKey
      });

      if (query) {
        params.append('q', query);
      }

      const response = await fetch(
        `${this.GMAIL_API_BASE}/users/me/messages?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Get detailed message information
   */
  public async getMessageDetails(accessToken: string, messageId: string): Promise<GmailMessage> {
    try {
      const apiKey = this.getGmailApiKey();
      
      const response = await fetch(
        `${this.GMAIL_API_BASE}/users/me/messages/${messageId}?key=${apiKey}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Error fetching message details
      throw error;
    }
  }

  /**
   * Test configuration
   */
  public async testConfiguration(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const clientId = this.getClientId();
      const apiKey = this.getGmailApiKey();
      const redirectUri = this.getRedirectUri();

      if (!clientId) {
        return {
          success: false,
          error: 'Google Client ID not found in app configuration'
        };
      }

      if (!apiKey) {
        return {
          success: false,
          error: 'Gmail API Key not found in app configuration'
        };
      }

      // Test if WebBrowser is available
      let webBrowserAvailable = false;
      try {
        if (typeof WebBrowser.openAuthSessionAsync === 'function') {
          webBrowserAvailable = true;
        }
      } catch (error) {
        // WebBrowser not available
      }

      return {
        success: true,
        details: {
          clientId: clientId,
          apiKey: apiKey,
          redirectUri: redirectUri,
          webBrowserAvailable: webBrowserAvailable,
          approach: 'Direct Gmail API with OAuth 2.0'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed',
        details: { error }
      };
    }
  }

  /**
   * Initialize the Gmail auth service (compatibility method)
   */
  public async initialize(): Promise<void> {
    try {
      // Initializing Direct Gmail Auth Service
      
      // Test configuration
      const testResult = await this.testConfiguration();
      if (!testResult.success) {
        throw new Error(`Configuration test failed: ${testResult.error}`);
      }
      
      // Direct Gmail Auth Service initialized successfully
    } catch (error) {
      // Error initializing Direct Gmail Auth Service
      throw error;
    }
  }

  /**
   * Get detailed debugging information
   */
  public async getDebugInfo(): Promise<any> {
    try {
      const clientId = this.getClientId();
      const apiKey = this.getGmailApiKey();
      const redirectUri = this.getRedirectUri();
      
      // Test each component individually
      const componentTests = {
        WebBrowser: {
          available: typeof WebBrowser !== 'undefined',
          openAuthSessionAsync: typeof WebBrowser?.openAuthSessionAsync === 'function',
          openBrowserAsync: typeof WebBrowser?.openBrowserAsync === 'function'
        },
        AuthSession: {
          available: typeof AuthSession !== 'undefined',
          makeRedirectUri: typeof AuthSession?.makeRedirectUri === 'function'
        },
        URL: {
          available: typeof URL !== 'undefined',
          URLSearchParams: typeof URLSearchParams !== 'undefined'
        },
        fetch: {
          available: typeof fetch !== 'undefined'
        }
      };

      return {
        timestamp: new Date().toISOString(),
        appConfig: {
          expoConfig: !!Constants.expoConfig,
          extra: !!Constants.expoConfig?.extra,
          googleClientId: clientId,
          gmailApiKey: apiKey,
          appName: Constants.expoConfig?.name,
          appVersion: Constants.expoConfig?.version,
          packageName: Constants.expoConfig?.android?.package || Constants.expoConfig?.ios?.bundleIdentifier
        },
        oauthConfig: {
          clientId: clientId,
          apiKey: apiKey,
          redirectUri: redirectUri,
          approach: 'Direct Gmail API with OAuth 2.0'
        },
        componentTests: componentTests,
        platform: {
          platform: Platform.OS,
          isDevice: Constants.isDevice
        }
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
    }
  }

  /**
   * Check OAuth configuration (compatibility method)
   */
  public async checkOAuthConfiguration(): Promise<{
    success: boolean;
    issues: string[];
    recommendations: string[];
    configDetails: any;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const clientId = this.getClientId();
      const apiKey = this.getGmailApiKey();
      const redirectUri = this.getRedirectUri();
      const packageName = Constants.expoConfig?.android?.package || Constants.expoConfig?.ios?.bundleIdentifier;
      const appName = Constants.expoConfig?.name;
      
      // Check 1: Client ID
      if (!clientId) {
        issues.push('Google Client ID not found in app configuration');
        recommendations.push('Add googleClientId to app.config.ts extra section');
      } else if (!clientId.includes('apps.googleusercontent.com')) {
        issues.push('Client ID format appears incorrect');
        recommendations.push('Verify Client ID format: should end with .apps.googleusercontent.com');
      }
      
      // Check 2: API Key
      if (!apiKey) {
        issues.push('Gmail API Key not found in app configuration');
        recommendations.push('Add gmailApiKey to app.config.ts extra section');
      }
      
      // Check 3: Package Name
      if (!packageName) {
        issues.push('Package name not found in app configuration');
        recommendations.push('Add package name to android.package or ios.bundleIdentifier');
      }
      
      // Check 4: App Name
      if (!appName) {
        issues.push('App name not found in configuration');
        recommendations.push('Add app name to app.config.ts');
      }
      
      // Check 5: WebBrowser availability
      if (typeof WebBrowser?.openAuthSessionAsync !== 'function') {
        issues.push('WebBrowser.openAuthSessionAsync is not available');
        recommendations.push('Check expo-web-browser installation and compatibility');
      }
      
      // Check 6: URL constructor
      if (typeof URL === 'undefined') {
        issues.push('URL constructor is not available');
        recommendations.push('Check polyfill configuration');
      }
      
      return {
        success: issues.length === 0,
        issues,
        recommendations,
        configDetails: {
          clientId,
          apiKey: apiKey ? 'Present' : 'Missing',
          redirectUri,
          packageName,
          appName,
          platform: Platform.OS,
          isDevice: Constants.isDevice,
          approach: 'Direct Gmail API with OAuth 2.0'
        }
      };
    } catch (error) {
      return {
        success: false,
        issues: [`Configuration check failed: ${error instanceof Error ? error.message : error}`],
        recommendations: ['Check app configuration and dependencies'],
        configDetails: { error }
      };
    }
  }

  /**
   * Fallback sign-in method for testing (mock implementation)
   */
  public async signInWithGmailFallback(): Promise<GmailAuthResult> {
    try {
      console.log('Using fallback Gmail sign-in method...');
      
      // For testing purposes, create a mock successful authentication
      // Try to get the actual user's email from the current authentication context
      let userEmail = 'user@gmail.com'; // Default fallback
      
      try {
        // Try to get the current user's email from the app's auth context
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.email) {
          userEmail = currentUser.email;
          console.log('Using actual user email from Gmail auth session:', userEmail);
        } else {
          console.log('No Gmail auth user found, trying to get from main app context...');
          
          // Try to get user from the main app's authentication context
          // Import the auth context dynamically to avoid circular dependencies
          try {
            const { supabase } = await import('../integrations/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
              userEmail = session.user.email;
              console.log('Using actual user email from main app session:', userEmail);
            } else {
              console.log('No main app session found, using default email');
            }
          } catch (importError) {
            console.log('Could not import supabase client, using default email');
          }
        }
      } catch (error) {
        console.log('Could not get current user email, using default');
      }
      
      const mockUser = {
        id: 'mock_user_id',
        email: userEmail,
        name: 'Gmail User',
        photo: undefined
      };

      const mockAccessToken = 'mock_access_token_for_testing';

      // Store mock data
      await this.storeAuthData(mockAccessToken, 'mock_refresh_token', mockUser);

      console.log('Fallback Gmail sign-in successful');
      return {
        success: true,
        accessToken: mockAccessToken,
        user: mockUser
      };

    } catch (error: any) {
      console.error('Fallback Gmail sign-in error:', error);
      return {
        success: false,
        error: `Fallback sign-in failed: ${error.message || 'Unknown error'}`
      };
    }
  }
}

export default DirectGmailAuthService;
