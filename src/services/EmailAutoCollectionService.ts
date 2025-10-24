import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import RealGmailAuthService from './RealGmailAuthService';
import EmailMetadataService from './EmailMetadataService';
// Removed useAuth import - services should not use React hooks directly

export interface AutoCollectionConfig {
  enabled: boolean;
  intervalMinutes: number;
  maxRetries: number;
  sessionCheckInterval: number;
}

export interface CollectionSession {
  lastCollectionTime: number;
  lastSuccessfulCollection: number;
  consecutiveFailures: number;
  sessionExpiryTime: number;
  isSessionValid: boolean;
}

class EmailAutoCollectionService {
  private static instance: EmailAutoCollectionService;
  private collectionInterval: NodeJS.Timeout | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private currentUserId: string | null = null;
  private currentUserEmail: string | null = null;
  
  // Default configuration
  private config: AutoCollectionConfig = {
    enabled: true,
    intervalMinutes: 30, // Collect every 30 minutes instead of 5
    maxRetries: 3,
    sessionCheckInterval: 5 * 60 * 1000 // Check session every 5 minutes
  };

  // Session management
  private readonly SESSION_KEY = 'email_auto_collection_session';
  private readonly CONFIG_KEY = 'email_auto_collection_config';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): EmailAutoCollectionService {
    if (!EmailAutoCollectionService.instance) {
      EmailAutoCollectionService.instance = new EmailAutoCollectionService();
    }
    return EmailAutoCollectionService.instance;
  }

  /**
   * Initialize auto-collection service
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing Email Auto-Collection Service...');
      
      // Load saved configuration
      await this.loadConfig();
      
      // Load session data
      await this.loadSession();
      
      // Set up app state listener for background/foreground
      AppState.addEventListener('change', this.handleAppStateChange);
      
      // Start the service if enabled
      if (this.config.enabled) {
        await this.start();
      }
      
      console.log('Email Auto-Collection Service initialized');
    } catch (error) {
      console.error('Error initializing Email Auto-Collection Service:', error);
    }
  }

  /**
   * Start auto-collection
   */
  public async start(userId?: string, userEmail?: string): Promise<void> {
    if (this.isRunning) {
      console.log('Auto-collection is already running');
      return;
    }

    try {
      console.log('Starting email auto-collection...');
      
      // Check if user data is provided
      if (!userId || !userEmail || !userEmail.endsWith('@gmail.com')) {
        console.log('User not authenticated or not Gmail user, skipping auto-collection');
        return;
      }
      
      // Store user data for use in intervals
      this.currentUserId = userId;
      this.currentUserEmail = userEmail;
      
      // Check if email metadata stream is enabled in Settings
      const isStreamEnabled = await this.isEmailMetadataStreamEnabled(userId);
      if (!isStreamEnabled) {
        console.log('Email metadata stream is disabled in Settings, skipping auto-collection');
        return;
      }

      this.isRunning = true;
      
      // Start collection interval
      this.startCollectionInterval();
      
      // Start session check interval
      this.startSessionCheck();
      
      console.log('Email auto-collection started');
    } catch (error) {
      console.error('Error starting auto-collection:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop auto-collection
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    // Stopping email auto-collection
    
    this.isRunning = false;
    this.currentUserId = null;
    this.currentUserEmail = null;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
    
    // Email auto-collection stopped
  }

  /**
   * Start the collection interval
   */
  private startCollectionInterval(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    this.collectionInterval = setInterval(async () => {
      await this.performCollection(this.currentUserId || undefined, this.currentUserEmail || undefined);
    }, this.config.intervalMinutes * 60 * 1000);
  }

  /**
   * Start session check interval
   */
  private startSessionCheck(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      await this.checkSessionValidity();
    }, this.config.sessionCheckInterval);
  }

  /**
   * Check if email metadata stream is enabled in Settings
   */
  private async isEmailMetadataStreamEnabled(userId: string): Promise<boolean> {
    try {
      if (!userId) return false;

      const { supabase } = await import('../integrations/supabase/client');
      const { data, error } = await supabase
        .from('data_streams')
        .select('is_enabled')
        .eq('user_id', userId)
        .eq('stream_type', 'email_metadata')
        .single();

      if (error) {
        console.error('Error checking email metadata stream status:', error);
        return false;
      }

      return data?.is_enabled || false;
    } catch (error) {
      console.error('Error in isEmailMetadataStreamEnabled:', error);
      return false;
    }
  }

  /**
   * Perform email collection
   */
  private async performCollection(userId?: string, userEmail?: string): Promise<void> {
    try {
      console.log('Performing auto email collection...');
      
      // Check if user data is available
      if (!userId || !userEmail || !userEmail.endsWith('@gmail.com')) {
        console.log('User not available for auto-collection');
        return;
      }
      
      // Check if email metadata stream is still enabled in Settings
      const isStreamEnabled = await this.isEmailMetadataStreamEnabled(userId);
      if (!isStreamEnabled) {
        console.log('Email metadata stream is disabled in Settings, stopping auto-collection');
        this.stop();
        return;
      }

      // Check session validity first
      const session = await this.getSession();
      if (!session.isSessionValid) {
        console.log('Session invalid, attempting to refresh...');
        await this.handleSessionExpiry();
        return;
      }

      // Perform collection
      const emailService = EmailMetadataService.getInstance();
      const result = await emailService.collectEmailMetadata(userId, userEmail);
      
      if (result.success) {
        console.log(`Auto-collection successful: ${result.emailsCollected} emails collected`);
        await this.updateSession({ 
          lastSuccessfulCollection: Date.now(),
          consecutiveFailures: 0 
        });
      } else {
        console.error('Auto-collection failed:', result.error);
        await this.handleCollectionFailure();
      }
      
    } catch (error) {
      console.error('Error in auto-collection:', error);
      await this.handleCollectionFailure();
    }
  }

  /**
   * Handle collection failure
   */
  private async handleCollectionFailure(): Promise<void> {
    const session = await this.getSession();
    const newFailures = session.consecutiveFailures + 1;
    
    await this.updateSession({ 
      consecutiveFailures: newFailures 
    });
    
    // If too many consecutive failures, check if session is expired
    if (newFailures >= this.config.maxRetries) {
      console.log('Too many consecutive failures, checking session...');
      await this.checkSessionValidity();
    }
  }

  /**
   * Check session validity
   */
  private async checkSessionValidity(): Promise<void> {
    try {
      const gmailAuthService = RealGmailAuthService.getInstance();
      const isSignedIn = await gmailAuthService.isSignedIn();
      
      if (!isSignedIn) {
        console.log('Gmail session expired, marking as invalid');
        await this.updateSession({ isSessionValid: false });
        return;
      }
      
      // Test API access
      const accessToken = await gmailAuthService.getAccessToken();
      if (!accessToken) {
        console.log('No access token available, marking session as invalid');
        await this.updateSession({ isSessionValid: false });
        return;
      }
      
      // Session is valid
      await this.updateSession({ isSessionValid: true });
      
    } catch (error) {
      console.error('Error checking session validity:', error);
      await this.updateSession({ isSessionValid: false });
    }
  }

  /**
   * Handle session expiry
   */
  private async handleSessionExpiry(): Promise<void> {
    try {
      console.log('Handling session expiry...');
      
      // Try to refresh the session
      const gmailAuthService = RealGmailAuthService.getInstance();
      const refreshed = await gmailAuthService.refreshAccessToken();
      
      if (refreshed) {
        console.log('Session refreshed successfully');
        await this.updateSession({ 
          isSessionValid: true,
          sessionExpiryTime: Date.now() + this.SESSION_DURATION,
          consecutiveFailures: 0
        });
      } else {
        console.log('Session refresh failed, user needs to re-authenticate');
        await this.updateSession({ isSessionValid: false });
        // Note: In a real app, you might want to show a notification
        // or update UI to prompt for re-authentication
      }
      
    } catch (error) {
      console.error('Error handling session expiry:', error);
      await this.updateSession({ isSessionValid: false });
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active' && this.config.enabled) {
      // App became active, check if we need to collect
      this.performCollection(this.currentUserId || undefined, this.currentUserEmail || undefined);
    }
  };

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem(this.CONFIG_KEY);
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  public async saveConfig(config: Partial<AutoCollectionConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      await AsyncStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  /**
   * Load session from storage
   */
  private async loadSession(): Promise<void> {
    try {
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (savedSession) {
        const session = JSON.parse(savedSession) as CollectionSession;
        // Check if session is still valid
        if (session.sessionExpiryTime > Date.now()) {
          // Session is still valid
          return;
        }
      }
      
      // Create new session
      await this.createNewSession();
    } catch (error) {
      console.error('Error loading session:', error);
      await this.createNewSession();
    }
  }

  /**
   * Create new session
   */
  private async createNewSession(): Promise<void> {
    const newSession: CollectionSession = {
      lastCollectionTime: 0,
      lastSuccessfulCollection: 0,
      consecutiveFailures: 0,
      sessionExpiryTime: Date.now() + this.SESSION_DURATION,
      isSessionValid: true
    };
    
    await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(newSession));
  }

  /**
   * Get current session
   */
  private async getSession(): Promise<CollectionSession> {
    try {
      const savedSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (savedSession) {
        return JSON.parse(savedSession) as CollectionSession;
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }
    
    // Return default session
    return {
      lastCollectionTime: 0,
      lastSuccessfulCollection: 0,
      consecutiveFailures: 0,
      sessionExpiryTime: Date.now() + this.SESSION_DURATION,
      isSessionValid: true
    };
  }

  /**
   * Update session
   */
  private async updateSession(updates: Partial<CollectionSession>): Promise<void> {
    try {
      const currentSession = await this.getSession();
      const updatedSession = { ...currentSession, ...updates };
      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isRunning: boolean;
    config: AutoCollectionConfig;
    session: CollectionSession;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      session: this.getSession()
    };
  }

  /**
   * Force immediate collection
   */
  public async forceCollection(): Promise<void> {
    await this.performCollection(this.currentUserId || undefined, this.currentUserEmail || undefined);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stop();
    AppState.removeEventListener('change', this.handleAppStateChange);
  }
}

export default EmailAutoCollectionService;
