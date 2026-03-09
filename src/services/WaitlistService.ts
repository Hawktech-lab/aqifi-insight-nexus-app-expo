import { supabase } from '../integrations/supabase/client';
import ViralloopsService from './ViralloopsService';
import AppConfigurationService from './AppConfigurationService';
// Import errorLogger - safe to import as it's a singleton instance
import { errorLogger } from '../utils/errorLogger';

export interface WaitlistUser {
  id: string;
  user_id: string;
  referral_code: string;
  referred_by_user_id?: string;
  referred_by_code?: string;
  status: 'pending_kyc' | 'kyc_completed' | 'on_waitlist' | 'invited' | 'active';
  waitlist_position?: number;
  total_points: number;
  kyc_points: number;
  referral_points: number;
  social_points: number;
  kyc_completed_at?: string;
  viralloops_participant_id?: string;
  viralloops_synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id?: string;
  referral_code: string;
  referred_email?: string;
  status: 'pending' | 'completed' | 'kyc_completed' | 'active';
  points_awarded: number;
  points_awarded_at?: string;
  created_at: string;
}

export interface SocialShare {
  id: string;
  user_id: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'other';
  share_url?: string;
  proof_url?: string;
  status: 'pending' | 'verified' | 'rejected';
  points_awarded: number;
  points_awarded_at?: string;
  verified_at?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  rank: number;
  kyc_points: number;
  referral_points: number;
  social_points: number;
  referrals_count: number;
  social_shares_count: number;
}

class WaitlistService {
  private static instance: WaitlistService;
  private readonly POINTS = {
    KYC_COMPLETION: 20,
    REFERRAL: 5,
    SOCIAL_SHARE: 1,
  };
  private isEnabledCache: boolean | null = null;
  private lastEnabledCheck: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): WaitlistService {
    if (!WaitlistService.instance) {
      WaitlistService.instance = new WaitlistService();
    }
    return WaitlistService.instance;
  }

  /**
   * Check if waitlist feature is enabled
   * Waitlist is enabled only if:
   * 1. waitlist_enabled config is set to 'true' in database
   * 2. viralloops_campaign_id is configured in database (required for waitlist functionality)
   */
  public async isEnabled(): Promise<boolean> {
    // This method should NEVER throw - waitlist is optional
    try {
      try {
        errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Method called', { timestamp: new Date().toISOString() });
      } catch (e) {}
      
      // Check cache first
      if (this.isEnabledCache !== null && (Date.now() - this.lastEnabledCheck) < this.CACHE_DURATION) {
        try {
          errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Returning cached value', { cached: this.isEnabledCache });
        } catch (e) {}
        return this.isEnabledCache;
      }

      try {
        errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 1 - Getting AppConfigurationService instance');
      } catch (e) {}
      
      // Get config service - wrap in try-catch
      let configService;
      try {
        configService = AppConfigurationService.getInstance();
        try {
          errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 2 - AppConfigurationService instance obtained');
        } catch (e) {}
      } catch (serviceError) {
        try {
          errorLogger.logError('[WAITLIST SERVICE] isEnabled: Failed to get AppConfigurationService', serviceError, {
            step: 'get AppConfigurationService instance'
          });
        } catch (e) {}
        this.isEnabledCache = false;
        this.lastEnabledCheck = Date.now();
        return false;
      }

      try {
        errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 3 - Getting waitlist_enabled config value');
      } catch (e) {}
      
      // Get waitlist_enabled config value from database
      let enabled;
      try {
        enabled = await configService.getConfigValue('waitlist_enabled');
        try {
          errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 4 - Got waitlist_enabled value', { enabled });
        } catch (e) {}
      } catch (configError) {
        try {
          errorLogger.logError('[WAITLIST SERVICE] isEnabled: Failed to get waitlist_enabled config', configError, {
            step: 'get waitlist_enabled config'
          });
        } catch (e) {}
        this.isEnabledCache = false;
        this.lastEnabledCheck = Date.now();
        return false;
      }

      // Parse the value safely - waitlist must be explicitly set to 'true'
      const waitlistFlagEnabled = enabled?.toLowerCase() === 'true';
      try {
        errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 5 - Parsed waitlist flag', { waitlistFlagEnabled });
      } catch (e) {}
      
      // If waitlist flag is false, waitlist is disabled
      if (!waitlistFlagEnabled) {
        try {
          errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Waitlist flag is disabled, returning false');
        } catch (e) {}
        this.isEnabledCache = false;
        this.lastEnabledCheck = Date.now();
        return false;
      }

      try {
        errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 6 - Getting viralloops_campaign_id config value');
      } catch (e) {}
      
      // If waitlist flag is true, verify campaign ID is also configured
      // Campaign ID is required for waitlist functionality
      let campaignId;
      try {
        campaignId = await configService.getConfigValue('viralloops_campaign_id');
        try {
          errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 7 - Got campaign ID', { hasCampaignId: !!campaignId });
        } catch (e) {}
      } catch (campaignError) {
        try {
          errorLogger.logError('[WAITLIST SERVICE] isEnabled: Failed to get viralloops_campaign_id config', campaignError, {
            step: 'get viralloops_campaign_id config'
          });
        } catch (e) {}
        // If campaign ID cannot be retrieved, disable waitlist
        this.isEnabledCache = false;
        this.lastEnabledCheck = Date.now();
        return false;
      }

      // Waitlist is enabled only if both flag is true AND campaign ID exists
      const isEnabled = waitlistFlagEnabled && !!campaignId && campaignId.trim() !== '';
      
      try {
        errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 8 - Final check', {
          waitlistFlagEnabled,
          hasCampaignId: !!campaignId,
          campaignIdNotEmpty: campaignId?.trim() !== '',
          isEnabled
        });
      } catch (e) {}
      
      if (waitlistFlagEnabled && !isEnabled) {
        try {
          errorLogger.logWarning('[WAITLIST SERVICE] isEnabled: Waitlist flag is enabled but campaign ID is missing', {
            waitlistFlagEnabled,
            hasCampaignId: !!campaignId
          });
        } catch (e) {}
      }
      
      this.isEnabledCache = isEnabled;
      this.lastEnabledCheck = Date.now();
      
      try {
        errorLogger.logInfo('[WAITLIST SERVICE] isEnabled: Step 9 - Returning result', { isEnabled });
      } catch (e) {}
      return isEnabled;
    } catch (error) {
      // Catch-all - should never reach here but be safe
      try {
        errorLogger.logError('[WAITLIST SERVICE] isEnabled: Unexpected error', error, {
          step: 'isEnabled catch-all',
          timestamp: new Date().toISOString()
        });
      } catch (e) {}
      this.isEnabledCache = false;
      this.lastEnabledCheck = Date.now();
      return false;
    }
  }

  /**
   * Clear feature flag cache (useful for testing or immediate updates)
   */
  public clearCache(): void {
    this.isEnabledCache = null;
    this.lastEnabledCheck = 0;
  }

  /**
   * Join waitlist after KYC completion
   */
  public async joinWaitlist(
    userId: string,
    referralCode?: string
  ): Promise<WaitlistUser | null> {
    // Check if waitlist is enabled
    const enabled = await this.isEnabled();
    if (!enabled) {
      console.log('Waitlist feature is disabled. Skipping waitlist join.');
      return null;
    }

    try {
      // Get referral code from user metadata if not provided
      if (!referralCode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.referral_code) {
          referralCode = user.user_metadata.referral_code;
        }
      }

      // Check if user already exists in waitlist
      const { data: existing } = await supabase
        .from('waitlist_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update status if needed
        if (existing.status === 'pending_kyc') {
          // Check if KYC points were already awarded (to prevent duplicate awards)
          const shouldAwardPoints = !existing.kyc_completed_at && existing.kyc_points === 0;
          
          const { data: updated } = await supabase
            .from('waitlist_users')
            .update({
              status: 'on_waitlist',
              kyc_completed_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();

          // Award KYC points only if not already awarded
          if (shouldAwardPoints) {
            await this.awardPoints(userId, this.POINTS.KYC_COMPLETION, 'kyc_completion', 'KYC verification completed');
          }

          // Sync with Viralloops
          await this.syncWithViralloops(userId);

          // If referral code exists and referral not created yet, create it
          if (referralCode && !existing.referred_by_code) {
            await this.processReferralCode(userId, referralCode);
          }

          return updated!;
        }
        // User already on waitlist - return existing user (no duplicate entry)
        return existing;
      }

      // Generate referral code
      const { data: refCodeData } = await supabase.rpc('generate_referral_code', {
        user_id: userId,
      });
      const generatedCode = refCodeData || this.generateSimpleReferralCode(userId);

      // Find referrer if referral code provided
      let referredByUserId: string | null = null;
      let referredByCode: string | null = null;

      if (referralCode) {
        // First try to find in waitlist_users
        const { data: referrer } = await supabase
          .from('waitlist_users')
          .select('user_id, referral_code')
          .eq('referral_code', referralCode.toUpperCase())
          .single();

        if (referrer) {
          referredByUserId = referrer.user_id;
          referredByCode = referrer.referral_code;
        } else {
          // Try to find in profiles table (for users who signed up but haven't joined waitlist yet)
          const { data: profileReferrer } = await supabase
            .from('profiles')
            .select('user_id, referral_code')
            .eq('referral_code', referralCode.toUpperCase())
            .single();

          if (profileReferrer) {
            referredByUserId = profileReferrer.user_id;
            referredByCode = profileReferrer.referral_code;
          }
        }
      }

      // Create waitlist user
      const { data: waitlistUser, error } = await supabase
        .from('waitlist_users')
        .insert({
          user_id: userId,
          referral_code: generatedCode,
          referred_by_user_id: referredByUserId,
          referred_by_code: referredByCode,
          status: 'on_waitlist',
          kyc_completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Award KYC points
      await this.awardPoints(userId, this.POINTS.KYC_COMPLETION, 'kyc_completion', 'KYC verification completed');

      // Create referral record if referred
      if (referredByUserId && referralCode) {
        await this.createReferral(referredByUserId, userId, referralCode);
      }

      // Sync with Viralloops (this will create participant and track referral)
      await this.syncWithViralloops(userId);

      // Update positions
      await this.updateWaitlistPositions();

      return waitlistUser!;
    } catch (error) {
      console.error('Error joining waitlist:', error);
      throw error;
    }
  }

  /**
   * Get waitlist user by user ID
   */
  public async getWaitlistUser(userId: string): Promise<WaitlistUser | null> {
    try {
      const { data, error } = await supabase
        .from('waitlist_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching waitlist user:', error);
      return null;
    }
  }

  /**
   * Process referral code - finds referrer and creates referral relationship
   */
  private async processReferralCode(userId: string, referralCode: string): Promise<void> {
    try {
      // Find referrer in waitlist_users or profiles
      let referrerUserId: string | null = null;
      
      const { data: waitlistReferrer } = await supabase
        .from('waitlist_users')
        .select('user_id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (waitlistReferrer) {
        referrerUserId = waitlistReferrer.user_id;
      } else {
        const { data: profileReferrer } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('referral_code', referralCode.toUpperCase())
          .single();

        if (profileReferrer) {
          referrerUserId = profileReferrer.user_id;
        }
      }

      if (referrerUserId) {
        await this.createReferral(referrerUserId, userId, referralCode);
      }
    } catch (error) {
      console.error('Error processing referral code:', error);
      // Don't throw - allow waitlist join to continue
    }
  }

  /**
   * Create a referral
   */
  public async createReferral(
    referrerUserId: string,
    referredUserId: string,
    referralCode: string
  ): Promise<Referral> {
    try {
      // Check if referral already exists
      const { data: existing } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', referrerUserId)
        .eq('referred_user_id', referredUserId)
        .maybeSingle();

      if (existing) {
        // Update existing referral if needed
        if (existing.status !== 'completed' && existing.status !== 'kyc_completed' && existing.status !== 'active') {
          await supabase
            .from('referrals')
            .update({
              status: 'completed',
              points_awarded: this.POINTS.REFERRAL,
              points_awarded_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        }
        return existing;
      }

      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: referrerUserId,
          referred_user_id: referredUserId,
          referral_code: referralCode.toUpperCase(),
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;

      // Award referral points
      await this.awardPoints(
        referrerUserId,
        this.POINTS.REFERRAL,
        'referral',
        `Referred user ${referredUserId}`,
        data.id
      );

      // Update referral record with points
      await supabase
        .from('referrals')
        .update({
          points_awarded: this.POINTS.REFERRAL,
          points_awarded_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      // Sync with Viralloops API
      await this.syncReferralWithViralloops(referrerUserId, referredUserId);

      // Update positions
      await this.updateWaitlistPositions();

      return data;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  /**
   * Get user referrals
   */
  public async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching referrals:', error);
      return [];
    }
  }

  /**
   * Get completed referral count for a user
   * Completed referrals are those with status 'completed', 'kyc_completed', or 'active'
   */
  public async getCompletedReferralCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id', { count: 'exact' })
        .eq('referrer_user_id', userId)
        .in('status', ['completed', 'kyc_completed', 'active']);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching completed referral count:', error);
      return 0;
    }
  }

  /**
   * Get referral threshold from configuration (default: 3)
   */
  public async getReferralThreshold(): Promise<number> {
    try {
      const configService = AppConfigurationService.getInstance();
      const thresholdStr = await configService.getConfigValue('waitlist_referral_threshold');
      if (thresholdStr) {
        const threshold = parseInt(thresholdStr, 10);
        if (!isNaN(threshold) && threshold > 0) {
          return threshold;
        }
      }
      // Default threshold is 3
      return 3;
    } catch (error) {
      console.error('Error fetching referral threshold, using default:', error);
      return 3;
    }
  }

  /**
   * Check if user has access to the app (has enough referrals)
   */
  public async hasAccess(userId: string): Promise<boolean> {
    try {
      const [referralCount, threshold] = await Promise.all([
        this.getCompletedReferralCount(userId),
        this.getReferralThreshold(),
      ]);
      return referralCount >= threshold;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  /**
   * Get access status with details
   */
  public async getAccessStatus(userId: string): Promise<{
    hasAccess: boolean;
    referralCount: number;
    threshold: number;
    remaining: number;
  }> {
    try {
      const [referralCount, threshold] = await Promise.all([
        this.getCompletedReferralCount(userId),
        this.getReferralThreshold(),
      ]);
      return {
        hasAccess: referralCount >= threshold,
        referralCount,
        threshold,
        remaining: Math.max(0, threshold - referralCount),
      };
    } catch (error) {
      console.error('Error getting access status:', error);
      return {
        hasAccess: false,
        referralCount: 0,
        threshold: 3,
        remaining: 3,
      };
    }
  }

  /**
   * Submit social share for verification
   */
  public async submitSocialShare(
    userId: string,
    platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'other',
    shareUrl?: string,
    proofUrl?: string
  ): Promise<SocialShare> {
    try {
      const { data, error } = await supabase
        .from('social_shares')
        .insert({
          user_id: userId,
          platform,
          share_url: shareUrl,
          proof_url: proofUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting social share:', error);
      throw error;
    }
  }

  /**
   * Verify social share (admin function)
   */
  public async verifySocialShare(shareId: string, verified: boolean): Promise<void> {
    try {
      const updateData: any = {
        status: verified ? 'verified' : 'rejected',
        verified_at: verified ? new Date().toISOString() : null,
      };

      if (verified) {
        // Get the share to award points
        const { data: share } = await supabase
          .from('social_shares')
          .select('user_id')
          .eq('id', shareId)
          .single();

        if (share) {
          await this.awardPoints(
            share.user_id,
            this.POINTS.SOCIAL_SHARE,
            'social_share',
            'Social media share verified',
            shareId
          );

          updateData.points_awarded = this.POINTS.SOCIAL_SHARE;
          updateData.points_awarded_at = new Date().toISOString();
        }
      }

      await supabase
        .from('social_shares')
        .update(updateData)
        .eq('id', shareId);

      // Update positions
      await this.updateWaitlistPositions();
    } catch (error) {
      console.error('Error verifying social share:', error);
      throw error;
    }
  }

  /**
   * Get user social shares
   */
  public async getUserSocialShares(userId: string): Promise<SocialShare[]> {
    try {
      const { data, error } = await supabase
        .from('social_shares')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching social shares:', error);
      return [];
    }
  }

  /**
   * Award points to user
   */
  public async awardPoints(
    userId: string,
    points: number,
    type: 'kyc_completion' | 'referral' | 'social_share' | 'bonus' | 'adjustment',
    description: string,
    referenceId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_points: points,
        p_type: type,
        p_description: description,
        p_reference_id: referenceId || null,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  public async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Try to rebuild cache
      await supabase.rpc('update_leaderboard_cache');
      return [];
    }
  }

  /**
   * Get user's leaderboard rank
   */
  public async getUserRank(userId: string): Promise<number | null> {
    try {
      const { data } = await supabase
        .from('leaderboard_cache')
        .select('rank')
        .eq('user_id', userId)
        .single();

      return data?.rank || null;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  }

  /**
   * Sync user with Viralloops
   * Only syncs if API key is configured. Widget-only mode skips this.
   */
  private async syncWithViralloops(userId: string): Promise<void> {
    try {
      const viralloopsService = ViralloopsService.getInstance();
      const initialized = await viralloopsService.initialize();
      
      // Skip if not initialized (campaign ID not configured)
      if (!initialized) {
        errorLogger.logInfo('Viralloops not configured. Skipping API sync.');
        return;
      }

      // Skip API sync if API key is not configured (widget-only mode)
      if (!viralloopsService.hasApiKey()) {
        errorLogger.logInfo('Viralloops API key not configured. Skipping API sync. Widget will handle participant creation.');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get waitlist user
      const waitlistUser = await this.getWaitlistUser(userId);
      if (!waitlistUser) return;

      // Get auth user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Get referral code from user metadata if available
      let referredByCode = waitlistUser.referred_by_code;
      if (!referredByCode && user.user_metadata?.referral_code) {
        referredByCode = user.user_metadata.referral_code;
      }

      // Create/update participant in Viralloops
      const participant = await viralloopsService.createParticipant({
        email: user.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        referralCode: waitlistUser.referral_code,
        referredByCode: referredByCode,
        metadata: {
          userId,
          totalPoints: waitlistUser.total_points,
        },
      });

      // Update waitlist user with Viralloops participant ID
      await supabase
        .from('waitlist_users')
        .update({
          viralloops_participant_id: participant.id,
          viralloops_synced: true,
        })
        .eq('user_id', userId);

      // If referred by code exists, ensure referral is tracked in Viral Loops
      if (referredByCode) {
        // Find referrer's waitlist user to get their Viral Loops participant ID
        const { data: referrer } = await supabase
          .from('waitlist_users')
          .select('user_id, viralloops_participant_id')
          .eq('referral_code', referredByCode)
          .single();

        if (referrer?.viralloops_participant_id && participant.id) {
          // Track referral in Viral Loops
          try {
            await viralloopsService.trackReferral({
              referrerId: referrer.viralloops_participant_id,
              referredEmail: user.email,
            });
            console.log('Referral tracked in Viral Loops');
          } catch (refError) {
            console.warn('Failed to track referral in Viral Loops:', refError);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing with Viralloops:', error);
      // Don't throw - allow app to continue even if Viralloops sync fails
    }
  }

  /**
   * Sync referral with Viralloops
   * Only syncs if API key is configured. Widget-only mode skips this.
   */
  private async syncReferralWithViralloops(referrerUserId: string, referredUserId: string): Promise<void> {
    try {
      const viralloopsService = ViralloopsService.getInstance();
      const initialized = await viralloopsService.initialize();
      
      // Skip if not initialized (campaign ID not configured)
      if (!initialized) {
        errorLogger.logInfo('Viralloops not configured. Skipping referral API sync.');
        return;
      }

      // Skip API sync if API key is not configured (widget-only mode)
      if (!viralloopsService.hasApiKey()) {
        errorLogger.logInfo('Viralloops API key not configured. Skipping referral API sync. Widget will handle referral tracking.');
        return;
      }

      // Get referred user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Get referrer's Viralloops participant ID
      const waitlistUser = await this.getWaitlistUser(referrerUserId);
      if (!waitlistUser?.viralloops_participant_id) return;

      // Track referral in Viralloops
      await viralloopsService.trackReferral({
        referrerId: waitlistUser.viralloops_participant_id,
        referredEmail: user.email,
      });
    } catch (error) {
      console.error('Error syncing referral with Viralloops:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Update waitlist positions
   */
  private async updateWaitlistPositions(): Promise<void> {
    try {
      await supabase.rpc('update_waitlist_positions');
      await supabase.rpc('update_leaderboard_cache');
    } catch (error) {
      console.error('Error updating waitlist positions:', error);
    }
  }

  /**
   * Generate simple referral code (fallback)
   */
  private generateSimpleReferralCode(userId: string): string {
    const hash = userId.split('-').join('').substring(0, 8).toUpperCase();
    return `REF${hash}`;
  }

  /**
   * Get points configuration
   */
  public getPointsConfig() {
    return { ...this.POINTS };
  }
}

export default WaitlistService;

