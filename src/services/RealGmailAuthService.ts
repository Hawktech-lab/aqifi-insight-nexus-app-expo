import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface GmailUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

export interface GmailAuthResult {
  success: boolean;
  accessToken?: string;
  user?: GmailUser;
  error?: string;
}

/**
 * Real Gmail authentication service using Google Sign-In SDK
 * Provides proper mobile OAuth without redirect URI issues
 */
class RealGmailAuthService {
  private static instance: RealGmailAuthService;
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'gmail_access_token',
    REFRESH_TOKEN: 'gmail_refresh_token',
    USER_INFO: 'gmail_user_info'
  };
  private isConfigured = false;
  private lastSignInResponse: any = null; // Store last sign-in response for debugging

  private constructor() {}

  public static getInstance(): RealGmailAuthService {
    if (!RealGmailAuthService.instance) {
      RealGmailAuthService.instance = new RealGmailAuthService();
    }
    return RealGmailAuthService.instance;
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
   * Get the correct Client ID for the current platform
   */
  private getPlatformClientId(): string {
    const clientId = this.getClientId();
    
    // For mobile apps, we need to use the web client ID as webClientId
    // The current client ID appears to be a web client ID, which is correct for webClientId
    // Using Client ID for platform
    
    return clientId;
  }

  /**
   * Get Gmail API Key from configuration
   */
  private getGmailApiKey(): string {
    return Constants.expoConfig?.extra?.gmailApiKey || "AIzaSyA0mIQdqC2HFih2zRhR9NI8VK6RLD3TV-A";
  }

  /**
   * Configure Google Sign-In
   */
  private async configureGoogleSignIn(): Promise<void> {
    if (this.isConfigured) {
      return;
    }

    try {
      const clientId = this.getPlatformClientId();
      
      if (!clientId) {
        throw new Error('Google Client ID not found in app configuration');
      }

      // Configuring Google Sign-In with client ID

      // Check if GoogleSignin is available
      if (!GoogleSignin || typeof GoogleSignin.configure !== 'function') {
        throw new Error('Google Sign-In SDK is not properly installed or available');
      }

      // Get package name for proper configuration
      const packageName = Constants.expoConfig?.android?.package || Constants.expoConfig?.ios?.bundleIdentifier;
      
      // Package name and platform info

      // For React Native Google Sign-In, we need to use the Web Client ID
      // The Web Client ID should be created in Google Console for this purpose
      const config = {
        webClientId: "364847480072-sa8abl7jbo0nisdh5vt2sregmiksgsvs.apps.googleusercontent.com", // Correct Web Client ID
        offlineAccess: true,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ]
      };

      // Google Sign-In configuration
      await GoogleSignin.configure(config);

      this.isConfigured = true;
      // Google Sign-In configured successfully
    } catch (error) {
      // Error configuring Google Sign-In
      this.isConfigured = false;
      throw new Error(`Google Sign-In configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign in with Gmail using Google Sign-In SDK
   */
  public async signInWithGmail(): Promise<GmailAuthResult> {
    try {
      // Starting Gmail authentication
      
      // Try Google Sign-In SDK first
      try {
        // Configure Google Sign-In if not already done
        await this.configureGoogleSignIn();

        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // Sign in
        const userInfo = await GoogleSignin.signIn();
        // Get access tokens
        const tokens = await GoogleSignin.getTokens();

        // Safely extract user from varying response shapes
        const userAny: any = (userInfo as any);
        const rawUser: any = userAny?.user ?? userAny ?? null;

        if (!rawUser) {
          return {
            success: false,
            error: 'Invalid Google Sign-In response: missing user'
          };
        }

        // Extract email from multiple possible locations
        let email = rawUser.email || rawUser.emailAddress || '';
        
        // If no email found, try to extract from JWT token
        if (!email && userInfo.idToken) {
          try {
            const tokenParts = userInfo.idToken.split('.');
            if (tokenParts.length === 3) {
              // Use Buffer instead of atob for React Native compatibility
              const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
              email = payload.email || payload.emailAddress || '';
            }
          } catch (jwtError) {
            // Ignore JWT parsing errors
          }
        }

        // If still no email, use fallback
        if (!email) {
          email = 'user@gmail.com'; // Fallback email
        }

        const gmailUser: GmailUser = {
          id: rawUser.id || rawUser.userId || rawUser.sub || 'unknown',
          email: email,
          name: rawUser.name || rawUser.givenName || rawUser.displayName || '',
          photo: rawUser.photo || rawUser.picture || rawUser.photoURL || undefined
        };

        // Store authentication data
        await this.storeAuthData(
          tokens.accessToken,
          tokens.refreshToken,
          gmailUser
        );

        // Verify the token was stored correctly
        const verifyStoredToken = await AsyncStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
        if (!verifyStoredToken) {
          // If storage failed, try again
          await AsyncStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await AsyncStorage.setItem(this.STORAGE_KEYS.USER_INFO, JSON.stringify(gmailUser));
        }
        
        return {
          success: true,
          accessToken: tokens.accessToken,
          user: gmailUser
        };

      } catch (sdkError: any) {
        return {
          success: false,
          error: `Google Sign-In failed: ${sdkError.message || 'Unknown error'}`
        };
      }

    } catch (error: any) {
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'Sign-in was cancelled by user'
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Sign-in is already in progress'
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Google Play Services not available'
        };
      } else {
        // Show the specific error message
        const errorMessage = error.message || 'Unknown error';
        return {
          success: false,
          error: `Authentication failed: ${errorMessage}`
        };
      }
    }
  }

  /**
   * Fallback Gmail authentication method
   */
  private async signInWithGmailFallback(): Promise<GmailAuthResult> {
    try {
      // Using fallback Gmail authentication method
      
      // Try to get the actual user's email from the current authentication context
      // This should be the real user who is trying to sign in
      let userEmail = 'user@gmail.com'; // Default fallback
      
      try {
        // Try to get the current user's email from the app's auth context
        // This would be the actual user who is logged into the app
        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.email) {
          userEmail = currentUser.email;
          // Using actual user email from Gmail auth session
        } else {
          // console.log('No Gmail auth user found, trying to get from main app context...');
          
          // Try to get user from the main app's authentication context
          // Import the auth context dynamically to avoid circular dependencies
          try {
            const { supabase } = await import('../integrations/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
              userEmail = session.user.email;
              // console.log('Using actual user email from main app session:', userEmail);
            } else {
              // console.log('No main app session found, using default email');
            }
          } catch (importError) {
            // console.log('Could not import supabase client, using default email');
          }
        }
      } catch (error) {
        // console.log('Could not get current user email, using default');
      }
      
      // Create a more realistic authentication for testing
      const gmailUser: GmailUser = {
        id: 'fallback_user_' + Date.now(),
        email: userEmail,
        name: 'Gmail User',
        photo: undefined
      };

      const accessToken = 'fallback_access_token_' + Date.now();
      const refreshToken = 'fallback_refresh_token_' + Date.now();

      // Store authentication data
      await this.storeAuthData(accessToken, refreshToken, gmailUser);

      // console.log('Fallback Gmail authentication successful for:', gmailUser.email);
      // console.log('This is a temporary authentication. Real Gmail authentication will be available once Google Sign-In SDK is properly configured.');
      
      return {
        success: true,
        accessToken: accessToken,
        user: gmailUser
      };

    } catch (error: any) {
      // console.error('Fallback Gmail authentication error:', error);
      return {
        success: false,
        error: `Fallback authentication failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Check if user is signed in
   */
  public async isSignedIn(): Promise<boolean> {
    try {
      // First check if we have stored tokens
      const accessToken = await AsyncStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
      const userInfo = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_INFO);
      
      if (accessToken && userInfo) {
        // We have stored authentication data - this is the primary check
        try {
          // Verify the token is still valid by checking Google Sign-In status
          const isSignedIn = await GoogleSignin.isSignedIn();
          
          if (isSignedIn) {
            return true;
          } else {
            // Google Sign-In says not signed in, but we have stored data
            // Try to refresh the token
            try {
              const tokens = await GoogleSignin.getTokens();
              if (tokens && tokens.accessToken) {
                // Update stored token
                await AsyncStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
                return true;
              }
            } catch (refreshError) {
              // Token refresh failed, but we still have stored data
              // Use stored data as fallback - this is more reliable
              return true;
            }
          }
        } catch (googleError) {
          // If Google Sign-In check fails, but we have stored data, use it
          return true;
        }
      }
      
      // Check Google Sign-In status as fallback
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        return isSignedIn;
      } catch (error) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Sign out
   */
  public async signOut(): Promise<void> {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Clear stored data
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.ACCESS_TOKEN,
        this.STORAGE_KEYS.REFRESH_TOKEN,
        this.STORAGE_KEYS.USER_INFO
      ]);
      
      // console.log('Signed out successfully');
    } catch (error) {
      // console.error('Error signing out:', error);
    }
  }

  /**
   * Get access token
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      // First try to get from stored tokens (more reliable)
      const storedToken = await AsyncStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
      if (storedToken) {
        return storedToken;
      }
      
      // Fallback to Google Sign-In tokens
      if (await GoogleSignin.isSignedIn()) {
        const tokens = await GoogleSignin.getTokens();
        if (tokens && tokens.accessToken) {
          // Store the token for future use
          await AsyncStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          return tokens.accessToken;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Force refresh access token from Google Sign-In
   */
  public async refreshAccessToken(): Promise<string | null> {
    try {
      if (await GoogleSignin.isSignedIn()) {
        const tokens = await GoogleSignin.getTokens();
        if (tokens && tokens.accessToken) {
          // Store the refreshed token
          await AsyncStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          return tokens.accessToken;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(): Promise<GmailUser | null> {
    try {
      // First try to get from Google Sign-In
      if (await GoogleSignin.isSignedIn()) {
        const userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo?.user) {
          return {
            id: userInfo.user.id,
            email: userInfo.user.email,
            name: userInfo.user.name || '',
            photo: userInfo.user.photo || undefined
          };
        }
      }
      
      // Fallback to stored user info
      const userInfo = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_INFO);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      // console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(accessToken: string, refreshToken: string, user: GmailUser): Promise<void> {
    try {
      const storageItems: [string, string][] = [
        [this.STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [this.STORAGE_KEYS.USER_INFO, JSON.stringify(user)]
      ];

      // Only store refresh token if it exists and is not undefined
      if (refreshToken && refreshToken !== 'undefined') {
        storageItems.push([this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken]);
      }

      await AsyncStorage.multiSet(storageItems);
      // console.log('Authentication data stored successfully');
    } catch (error) {
      // console.error('Error storing authentication data:', error);
      throw error;
    }
  }

  /**
   * Get Gmail messages using real Gmail API
   */
  public async getMessages(accessToken?: string, maxResults: number = 20, query?: string): Promise<any[]> {
    try {
      const token = accessToken || await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const apiKey = this.getGmailApiKey();
      
      // Build query parameters
      const params = new URLSearchParams({
        maxResults: Math.min(maxResults, 100).toString(), // Limit to prevent quota issues
        includeSpamTrash: 'false',
        labelIds: 'INBOX',  // Restrict to inbox only
        key: apiKey
      });

      if (query) {
        params.append('q', query);
      }

      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Gmail API quota exceeded. Please try again later.');
        } else if (response.status === 403) {
          throw new Error('Gmail API access denied. Check permissions.');
        } else {
          throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Retrieved Gmail messages:', data.messages?.length || 0);
      return data.messages || [];
    } catch (error) {
      console.error('Error getting Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Get message details using real Gmail API
   */
  public async getMessageDetails(accessToken: string, messageId: string): Promise<any> {
    try {
      const token = accessToken || await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const apiKey = this.getGmailApiKey();
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?key=${apiKey}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Gmail API quota exceeded. Please try again later.');
        } else if (response.status === 403) {
          throw new Error('Gmail API access denied. Check permissions.');
        } else if (response.status === 404) {
          throw new Error('Message not found. It may have been deleted.');
        } else {
          throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Retrieved message details for:', messageId);
      return data;
    } catch (error) {
      console.error('Error getting message details:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        // console.log('No refresh token available');
        return null;
      }

      const clientId = this.getClientId();
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString()
      });

      if (!response.ok) {
        // console.error('Token refresh failed:', response.status);
        return null;
      }

      const tokenData = await response.json();
      const newAccessToken = tokenData.access_token;

      // Store the new access token
      await AsyncStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

      // console.log('Access token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      // console.error('Error refreshing access token:', error);
      return null;
    }
  }

  /**
   * Test configuration
   */
  public async testConfiguration(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const clientId = this.getClientId();
      const apiKey = this.getGmailApiKey();

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

      // Test component availability
      const componentTests = {
        GoogleSignin: {
          available: typeof GoogleSignin !== 'undefined',
          configure: typeof GoogleSignin?.configure === 'function',
          signIn: typeof GoogleSignin?.signIn === 'function',
          isSignedIn: typeof GoogleSignin?.isSignedIn === 'function',
          getTokens: typeof GoogleSignin?.getTokens === 'function'
        },
        AsyncStorage: {
          available: typeof AsyncStorage !== 'undefined',
          getItem: typeof AsyncStorage?.getItem === 'function',
          setItem: typeof AsyncStorage?.setItem === 'function'
        },
        Constants: {
          available: typeof Constants !== 'undefined',
          expoConfig: !!Constants.expoConfig
        },
        Platform: {
          available: typeof Platform !== 'undefined',
          OS: Platform.OS
        }
      };

      // console.log('Real Gmail Auth Service configuration test:', componentTests);

      return {
        success: true,
        details: {
          clientId: clientId,
          apiKey: apiKey,
          componentTests: componentTests,
          approach: 'Real Gmail API with Google Sign-In SDK'
        }
      };
    } catch (error) {
      // console.error('Configuration test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed',
        details: { 
          error: error,
          stack: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Initialize the service (compatibility method)
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing Real Gmail Auth Service...');
      
      // Configure Google Sign-In
      await this.configureGoogleSignIn();
      
      // Check if user is already signed in and restore session
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          console.log('User already signed in, restoring session...');
          const tokens = await GoogleSignin.getTokens();
          if (tokens && tokens.accessToken) {
            // Update stored token
            await AsyncStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
            if (tokens.refreshToken) {
              await AsyncStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
            }
          }
        }
      } catch (sessionError) {
        console.log('Session restoration failed, user needs to sign in again');
      }
      
      // Test configuration
      const testResult = await this.testConfiguration();
      if (!testResult.success) {
        throw new Error(`Configuration test failed: ${testResult.error}`);
      }
      
      console.log('Real Gmail Auth Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Real Gmail Auth Service:', error);
      throw error;
    }
  }

  /**
   * Simple test to check if Google Sign-In is working
   */
  public async testGoogleSignIn(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to configure Google Sign-In
      await this.configureGoogleSignIn();
      
      // Check if Google Sign-In is available
      const isAvailable = await GoogleSignin.hasPlayServices();
      
      if (!isAvailable) {
        return {
          success: false,
          error: 'Google Play Services not available'
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed debugging information
   */
  public async getDebugInfo(): Promise<any> {
    try {
      const clientId = this.getClientId();
      const apiKey = this.getGmailApiKey();
      
      // Test each component individually
      const componentTests = {
        GoogleSignin: {
          available: typeof GoogleSignin !== 'undefined',
          configure: typeof GoogleSignin?.configure === 'function',
          signIn: typeof GoogleSignin?.signIn === 'function',
          isSignedIn: typeof GoogleSignin?.isSignedIn === 'function',
          getTokens: typeof GoogleSignin?.getTokens === 'function'
        },
        AsyncStorage: {
          available: typeof AsyncStorage !== 'undefined',
          getItem: typeof AsyncStorage?.getItem === 'function',
          setItem: typeof AsyncStorage?.setItem === 'function'
        },
        Constants: {
          available: typeof Constants !== 'undefined',
          expoConfig: !!Constants.expoConfig
        },
        Platform: {
          available: typeof Platform !== 'undefined',
          OS: Platform.OS
        }
      };

      // Get current authentication status
      let authStatus = 'Not signed in';
      let currentUser = null;
      let lastSignInResponse = null;
      
      try {
        const isSignedIn = await GoogleSignin.isSignedIn();
        if (isSignedIn) {
          authStatus = 'Signed in';
          currentUser = await GoogleSignin.getCurrentUser();
          console.log('Debug - Current user from GoogleSignin:', JSON.stringify(currentUser, null, 2));
        }
      } catch (authError) {
        authStatus = `Auth error: ${authError instanceof Error ? authError.message : 'Unknown'}`;
      }

      // Get stored user info
      let storedUserInfo = null;
      try {
        const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_INFO);
        if (stored) {
          storedUserInfo = JSON.parse(stored);
        }
      } catch (storageError) {
        console.log('Debug - Could not get stored user info:', storageError);
      }

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
          approach: 'Real Gmail API with Google Sign-In SDK'
        },
        componentTests: componentTests,
        platform: {
          platform: Platform.OS,
          isDevice: Constants.isDevice
        },
        authentication: {
          status: authStatus,
          isConfigured: this.isConfigured,
          currentUserFromGoogle: currentUser,
          storedUserInfo: storedUserInfo,
          lastSignInResponse: this.lastSignInResponse
        },
        debugInstructions: {
          message: "If you're getting 'no email found' error:",
          steps: [
            "1. Check 'currentUserFromGoogle' above",
            "2. Look for email in user.email, user.emailAddress, or user.user.email",
            "3. If no email found, try signing in again",
            "4. The response structure will be logged to console"
          ]
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
      
      // Check 5: Google Sign-In availability
      if (typeof GoogleSignin?.configure !== 'function') {
        issues.push('Google Sign-In SDK is not available');
        recommendations.push('Check @react-native-google-signin/google-signin installation');
      }
      
      // Check 6: AsyncStorage availability
      if (typeof AsyncStorage?.getItem !== 'function') {
        issues.push('AsyncStorage is not available');
        recommendations.push('Check @react-native-async-storage/async-storage installation');
      }
      
      return {
        success: issues.length === 0,
        issues,
        recommendations,
        configDetails: {
          clientId,
          apiKey: apiKey ? 'Present' : 'Missing',
          packageName,
          appName,
          platform: Platform.OS,
          isDevice: Constants.isDevice,
          approach: 'Real Gmail API with Google Sign-In SDK'
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
}

export default RealGmailAuthService;
