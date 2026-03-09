import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import WaitlistService, { WaitlistUser, Referral, SocialShare } from '../services/WaitlistService';
import { useNavigation } from '@react-navigation/native';
import { useWaitlistEnabled } from '../hooks/useWaitlistEnabled';
// WaitlistErrorScreen import removed - all errors now redirect to Dashboard
import { useProfile } from '../hooks/useProfile';

// Safe errorLogger import - wrap in try-catch to prevent crashes
let errorLogger: any = null;
try {
  const errorLoggerModule = require('../utils/errorLogger');
  errorLogger = errorLoggerModule?.errorLogger || {
    logInfo: () => {},
    logError: () => {},
    logWarning: () => {},
  };
} catch (e) {
  // Fallback logger if import fails
  errorLogger = {
    logInfo: () => {},
    logError: () => {},
    logWarning: () => {},
  };
}

export const WaitlistDashboard: React.FC = () => {
  try {
    errorLogger?.logInfo('[WAITLIST DASHBOARD] Component rendering');
  } catch (e) {
    // Ignore logging errors
  }
  
  // Hooks must be called unconditionally
  const { user } = useAuth();
  const navigation = useNavigation();
  const { enabled: waitlistEnabled = false, loading: enabledLoading = true, error: waitlistError } = useWaitlistEnabled();
  const { profile, isLoading: profileLoading } = useProfile();
  
  try {
    errorLogger?.logInfo('[WAITLIST DASHBOARD] Hooks completed', { 
      hasUser: !!user, 
      enabled: waitlistEnabled, 
      loading: enabledLoading 
    });
  } catch (e) {
    // Ignore logging errors
  }
  const [loading, setLoading] = useState(true);
  const [waitlistUser, setWaitlistUser] = useState<WaitlistUser | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [socialShares, setSocialShares] = useState<SocialShare[]>([]);
  const [pointsConfig, setPointsConfig] = useState({ KYC_COMPLETION: 20, REFERRAL: 5, SOCIAL_SHARE: 1 });
  const [accessStatus, setAccessStatus] = useState<{
    hasAccess: boolean;
    referralCount: number;
    threshold: number;
    remaining: number;
  } | null>(null);
  const isMountedRef = useRef(true);

  // Set mounted flag on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadWaitlistData = useCallback(async () => {
    if (!user?.id) return;
    if (!isMountedRef.current) return; // Don't proceed if unmounted

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      const waitlistService = WaitlistService?.getInstance?.();
      
      if (!waitlistService) {
        throw new Error('WaitlistService not available');
      }

      const [userData, referralsData, sharesData, accessStatusData] = await Promise.all([
        waitlistService.getWaitlistUser(user.id),
        waitlistService.getUserReferrals(user.id),
        waitlistService.getUserSocialShares(user.id),
        waitlistService.getAccessStatus(user.id),
      ]);

      // Check if still mounted before updating state
      if (!isMountedRef.current) return;
      
      setWaitlistUser(userData);
      setReferrals(referralsData);
      setSocialShares(sharesData);
      setAccessStatus(accessStatusData);
      setPointsConfig(waitlistService.getPointsConfig());
    } catch (error) {
      if (!isMountedRef.current) return; // Don't update state if unmounted
      errorLogger?.logError('[WAITLIST DASHBOARD ERROR] Error loading waitlist data', error);
      Alert.alert('Error', 'Failed to load waitlist data');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (waitlistEnabled) {
      loadWaitlistData();
    } else {
      setLoading(false);
    }
  }, [waitlistEnabled, loadWaitlistData]);

  const handleShareReferralCode = async () => {
    if (!waitlistUser?.referral_code) return;

    try {
      // Get the Viral Loops landing page URL from database configuration
      const viralloopsService = (await import('../services/ViralloopsService')).default.getInstance();
      await viralloopsService.initialize();
      const landingPageUrl = await viralloopsService.getCampaignLandingPageUrl();
      
      if (!landingPageUrl) {
        Alert.alert('Error', 'Landing page URL not configured. Please contact support.');
        return;
      }
      
      const message = `Join the waitlist using my referral code: ${waitlistUser.referral_code}\n\nSign up at ${landingPageUrl}`;
      await Share.share({
        message,
        title: 'Join the Waitlist',
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
      Alert.alert('Error', 'Failed to share referral code. Please try again.');
    }
  };

  const handleSocialShare = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram') => {
    if (!waitlistUser?.referral_code) return;

    try {
      const waitlistService = WaitlistService?.getInstance?.();
      
      if (!waitlistService) {
        throw new Error('WaitlistService not available');
      }
      
      // Get the Viral Loops landing page URL from database configuration
      const viralloopsService = (await import('../services/ViralloopsService')).default.getInstance();
      await viralloopsService.initialize();
      const landingPageUrl = await viralloopsService.getCampaignLandingPageUrl();
      
      if (!landingPageUrl) {
        Alert.alert('Error', 'Landing page URL not configured. Please contact support.');
        return;
      }
      
      const shareUrl = `${landingPageUrl}?ref=${waitlistUser.referral_code}`;
      
      // Submit share for verification
      await waitlistService.submitSocialShare(user!.id, platform, shareUrl);
      
      // Reload data
      await loadWaitlistData();
      
      Alert.alert(
        'Share Submitted',
        'Your social share has been submitted for verification. Points will be awarded once verified.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting social share:', error);
      Alert.alert('Error', 'Failed to submit social share');
    }
  };

  const verifiedShares = socialShares.filter(s => s.status === 'verified').length;
  const pendingShares = socialShares.filter(s => s.status === 'pending').length;
  const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'kyc_completed' || r.status === 'active').length;
  const referralThreshold = accessStatus?.threshold || 3;
  const remainingReferrals = accessStatus?.remaining || Math.max(0, referralThreshold - completedReferrals);

  // Helper function to check if KYC is completed
  const isKycCompleted = useCallback((status: string | null | undefined): boolean => {
    return status === 'verified' || status === 'rejected' || status === 'error';
  }, []);
  
  // Check if KYC is completed - waitlist should only be accessible after KYC completion
  const kycStatus = profile?.kyc_status;
  const kycCompleted = isKycCompleted(kycStatus);
  
  // Redirect to Dashboard for any error state - Dashboard is the default fallback
  useEffect(() => {
    if (!enabledLoading && !loading && !profileLoading) {
      // If KYC is not completed, redirect to Dashboard
      if (kycStatus !== undefined && kycStatus !== null && !kycCompleted) {
        (navigation as any).replace('MainTabs', { screen: 'Dashboard' });
        return;
      }
      
      // If waitlist has errors or is disabled, redirect to Dashboard
      if (waitlistError && waitlistError.type) {
        (navigation as any).replace('MainTabs', { screen: 'Dashboard' });
        return;
      }
      
      if (!waitlistEnabled) {
        (navigation as any).replace('MainTabs', { screen: 'Dashboard' });
        return;
      }
    }
  }, [kycStatus, kycCompleted, waitlistEnabled, waitlistError, enabledLoading, loading, profileLoading, navigation]);
  // Note: isKycCompleted is a stable useCallback with no dependencies, no need in deps

  if (enabledLoading || loading || profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading waitlist data...</Text>
      </View>
    );
  }

  if (!waitlistUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Not on waitlist yet. Complete KYC to join.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Waitlist Dashboard</Text>
        {waitlistUser.waitlist_position && (
          <Text style={styles.positionText}>Position: #{waitlistUser.waitlist_position}</Text>
        )}
        <Text style={styles.pointsText}>Total Points: {waitlistUser.total_points}</Text>
        
        {/* Access Status Banner */}
        {accessStatus && (
          <View style={[styles.accessBanner, accessStatus.hasAccess && styles.accessBannerSuccess]}>
            <Icon 
              name={accessStatus.hasAccess ? "checkmark-circle" : "lock-closed"} 
              size={20} 
              color={accessStatus.hasAccess ? "#10b981" : "#f59e0b"} 
            />
            <Text style={[styles.accessBannerText, accessStatus.hasAccess && styles.accessBannerTextSuccess]}>
              {accessStatus.hasAccess 
                ? "✓ You have access to the dashboard!"
                : `Refer ${remainingReferrals} more ${remainingReferrals === 1 ? 'person' : 'people'} to unlock dashboard access`
              }
            </Text>
          </View>
        )}
      </View>

      {/* Referral Code Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="link-outline" size={24} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
        </View>
        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralCode}>{waitlistUser.referral_code}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleShareReferralCode}>
            <Icon name="share-outline" size={20} color="#ffffff" />
            <Text style={styles.copyButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Items */}
      <View style={styles.section}>
        {/* KYC Completion */}
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              {waitlistUser.kyc_completed_at ? (
                <Icon name="checkmark-circle" size={32} color="#10b981" />
              ) : (
                <Icon name="ellipse-outline" size={32} color="#9ca3af" />
              )}
            </View>
            <View style={styles.progressContent}>
              <Text style={styles.progressTitle}>Complete KYC</Text>
              <Text style={styles.progressSubtitle}>
                {waitlistUser.kyc_completed_at ? 'Completed' : 'Pending'} • {pointsConfig.KYC_COMPLETION} pts
              </Text>
            </View>
            {waitlistUser.kyc_completed_at && (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>+{pointsConfig.KYC_COMPLETION}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Refer Friends */}
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <Icon name="people-outline" size={32} color="#3b82f6" />
            </View>
            <View style={styles.progressContent}>
              <Text style={styles.progressTitle}>Refer Friends</Text>
              <Text style={styles.progressSubtitle}>
                {completedReferrals}/{referralThreshold} friends • {pointsConfig.REFERRAL} pts each
              </Text>
              <Text style={styles.progressDetail}>
                You've referred {completedReferrals} friend{completedReferrals !== 1 ? 's' : ''}
                {remainingReferrals > 0 && ` • ${remainingReferrals} more needed for access`}
              </Text>
              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min(100, (completedReferrals / referralThreshold) * 100)}%` }
                  ]} 
                />
              </View>
            </View>
            {completedReferrals > 0 && (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>+{waitlistUser.referral_points}</Text>
              </View>
            )}
          </View>
          {completedReferrals < referralThreshold && (
            <TouchableOpacity style={styles.actionButton} onPress={handleShareReferralCode}>
              <Text style={styles.actionButtonText}>Share Referral Code</Text>
            </TouchableOpacity>
          )}
          {accessStatus?.hasAccess && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.accessButton]} 
              onPress={() => navigation.navigate('Dashboard' as never)}
            >
              <Icon name="arrow-forward" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Social Sharing */}
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <Icon name="share-social-outline" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.progressContent}>
              <Text style={styles.progressTitle}>Share on Social Media</Text>
              <Text style={styles.progressSubtitle}>
                {verifiedShares} verified • {pointsConfig.SOCIAL_SHARE} pt each
              </Text>
              {pendingShares > 0 && (
                <Text style={styles.progressDetail}>
                  {pendingShares} share{pendingShares !== 1 ? 's' : ''} pending verification
                </Text>
              )}
            </View>
            {verifiedShares > 0 && (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>+{waitlistUser.social_points}</Text>
              </View>
            )}
          </View>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, styles.twitterButton]}
              onPress={() => handleSocialShare('twitter')}
            >
              <Icon name="logo-twitter" size={20} color="#ffffff" />
              <Text style={styles.socialButtonText}>Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => handleSocialShare('facebook')}
            >
              <Icon name="logo-facebook" size={20} color="#ffffff" />
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.linkedinButton]}
              onPress={() => handleSocialShare('linkedin')}
            >
              <Icon name="logo-linkedin" size={20} color="#ffffff" />
              <Text style={styles.socialButtonText}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Leaderboard Link */}
      <TouchableOpacity
        style={styles.leaderboardButton}
        onPress={() => navigation.navigate('Leaderboard' as never)}
      >
        <Icon name="trophy-outline" size={24} color="#f59e0b" />
        <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
        <Icon name="chevron-forward" size={20} color="#6b7280" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  positionText: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 16,
    color: '#6b7280',
  },
  accessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  accessBannerSuccess: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  accessBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  accessBannerTextSuccess: {
    color: '#065f46',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
  },
  progressItem: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressIconContainer: {
    marginRight: 12,
  },
  progressContent: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressDetail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  pointsBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  accessButton: {
    backgroundColor: '#10b981',
    marginTop: 8,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  twitterButton: {
    backgroundColor: '#1da1f2',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
  },
  linkedinButton: {
    backgroundColor: '#0077b5',
  },
  socialButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  disabledTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  disabledText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

