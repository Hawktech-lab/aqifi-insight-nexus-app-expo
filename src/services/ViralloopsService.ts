import AppConfigurationService, { ConfigurationError } from './AppConfigurationService';
import { errorLogger } from '../utils/errorLogger';

export interface ViralloopsParticipant {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  referralCode?: string;
  referredByCode?: string;
  metadata?: Record<string, any>;
}

export interface ViralloopsReferral {
  id?: string;
  referrerId: string;
  referredEmail: string;
  status?: string;
}

export interface ViralloopsAnalytics {
  totalParticipants: number;
  totalReferrals: number;
  conversionRate: number;
  topReferrers: Array<{
    email: string;
    referrals: number;
  }>;
}

class ViralloopsService {
  private static instance: ViralloopsService;
  private apiKey: string | null = null;
  private campaignId: string | null = null;
  private landingPageUrl: string | null = null;
  private apiUrl: string = 'https://app.viral-loops.com/api/v3';

  private constructor() {}

  public static getInstance(): ViralloopsService {
    if (!ViralloopsService.instance) {
      ViralloopsService.instance = new ViralloopsService();
    }
    return ViralloopsService.instance;
  }

  /**
   * Initialize Viralloops configuration from database
   * For widget usage, only campaign ID is required. API key is optional.
   * Returns true if initialized successfully, false if campaign ID is not configured.
   */
  public async initialize(): Promise<boolean> {
    try {
      const configService = AppConfigurationService.getInstance();
      this.apiKey = await configService.getConfigValue('viralloops_api_key');
      this.campaignId = await configService.getConfigValue('viralloops_campaign_id');
      this.landingPageUrl = await configService.getConfigValue('viralloops_landing_page_url');
      const apiUrl = await configService.getConfigValue('viralloops_api_url');
      
      if (apiUrl) {
        this.apiUrl = apiUrl;
      }

      // Campaign ID is required for widget usage, but don't throw error - return false instead
      if (!this.campaignId) {
        errorLogger.logWarning('Viralloops Campaign ID not configured in database. Widget will not be available.');
        return false;
      }
      
      // API key is optional - only needed for API integration, not for widget
      // Widget works with just campaign ID (UCID)
      // Landing page URL is optional - used for sharing referrals
      return true;
    } catch (error) {
      errorLogger.logError('Failed to initialize Viralloops', error);
      return false;
    }
  }

  /**
   * Create a participant in Viralloops
   * Requires API key - will throw error if not configured
   * Uses Viral Loops API v3 endpoint: POST /campaign-participant
   */
  public async createParticipant(participant: ViralloopsParticipant): Promise<ViralloopsParticipant> {
    await this.ensureInitialized();

    try {
      // Try v3 API endpoint first (campaign-participant)
      let response = await fetch(`${this.apiUrl}/campaign-participant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          campaignId: this.campaignId,
          email: participant.email,
          firstName: participant.firstName,
          lastName: participant.lastName,
          referralCode: participant.referralCode,
          referredByCode: participant.referredByCode,
          metadata: participant.metadata || {},
        }),
      });

      // If v3 fails, try v2 endpoint as fallback
      if (!response.ok && response.status === 404) {
        response = await fetch(`${this.apiUrl.replace('/v3', '/v2')}/participants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            campaignId: this.campaignId,
            email: participant.email,
            firstName: participant.firstName,
            lastName: participant.lastName,
            referralCode: participant.referralCode,
            referredByCode: participant.referredByCode,
            metadata: participant.metadata || {},
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Viralloops API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id || data.participantId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        referralCode: data.referralCode || data.referral_code,
        referredByCode: data.referredByCode || data.referred_by_code,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Error creating Viralloops participant:', error);
      throw error;
    }
  }

  /**
   * Get participant by email or ID
   * Requires API key - will throw error if not configured
   */
  public async getParticipant(identifier: string): Promise<ViralloopsParticipant | null> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`${this.apiUrl}/participants/${identifier}?campaignId=${this.campaignId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Viralloops API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        referralCode: data.referralCode,
        referredByCode: data.referredByCode,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('Error fetching Viralloops participant:', error);
      return null;
    }
  }

  /**
   * Track a referral
   * Requires API key - will throw error if not configured
   */
  public async trackReferral(referral: ViralloopsReferral): Promise<ViralloopsReferral> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`${this.apiUrl}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          campaignId: this.campaignId,
          referrerId: referral.referrerId,
          referredEmail: referral.referredEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Viralloops API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        referrerId: data.referrerId,
        referredEmail: data.referredEmail,
        status: data.status,
      };
    } catch (error) {
      console.error('Error tracking Viralloops referral:', error);
      throw error;
    }
  }

  /**
   * Get analytics data
   * Requires API key - will throw error if not configured
   */
  public async getAnalytics(): Promise<ViralloopsAnalytics> {
    await this.ensureInitialized();

    try {
      const response = await fetch(`${this.apiUrl}/campaigns/${this.campaignId}/analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Viralloops API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        totalParticipants: data.totalParticipants || 0,
        totalReferrals: data.totalReferrals || 0,
        conversionRate: data.conversionRate || 0,
        topReferrers: data.topReferrers || [],
      };
    } catch (error) {
      console.error('Error fetching Viralloops analytics:', error);
      // Return default analytics on error
      return {
        totalParticipants: 0,
        totalReferrals: 0,
        conversionRate: 0,
        topReferrers: [],
      };
    }
  }

  /**
   * Get widget script URL
   */
  public getWidgetScriptUrl(): string {
    return 'https://app.viral-loops.com/widgetsV2/core/loader.js';
  }

  /**
   * Get campaign landing page URL for sharing referrals
   * This is the public URL where people can sign up for the waitlist
   * Fetched from database configuration: viralloops_landing_page_url
   */
  public async getCampaignLandingPageUrl(): Promise<string | null> {
    await this.ensureInitializedForWidget();
    // Return the landing page URL from database configuration
    // If not configured, return null (caller should handle fallback)
    return this.landingPageUrl;
  }

  /**
   * Get campaign ID for widget
   * Returns null if not configured (instead of throwing error)
   */
  public async getCampaignId(): Promise<string | null> {
    await this.ensureInitializedForWidget();
    return this.campaignId;
  }

  /**
   * Check if API integration is available (has API key)
   */
  public hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Ensure service is initialized for widget usage (only needs campaign ID)
   */
  private async ensureInitializedForWidget(): Promise<void> {
    if (!this.campaignId) {
      await this.initialize();
    }
  }

  /**
   * Ensure service is initialized for API usage (needs both API key and campaign ID)
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.campaignId) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new ConfigurationError('Viralloops Campaign ID not configured in database');
      }
    }
    if (!this.apiKey) {
      throw new ConfigurationError('Viralloops API key not configured. API integration requires an API key.');
    }
  }
}

export default ViralloopsService;

