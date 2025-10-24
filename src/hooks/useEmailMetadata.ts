import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import EmailMetadataService, { EmailMetadataCollectionResult } from '../services/EmailMetadataService';
import RealGmailAuthService from '../services/RealGmailAuthService';
import { useGmailAuth } from './useGmailAuth';
import { supabase } from '../integrations/supabase/client';

export interface EmailMetadataStats {
  totalEmails: number;
  unreadEmails: number;
  lastCollectionDate: string | null;
  pointsEarned: number;
}

export function useEmailMetadata() {
  const { user } = useAuth();
  const { isSignedIn: gmailSignedIn, user: gmailUser } = useGmailAuth();
  const [isCollecting, setIsCollecting] = useState(false);
  const [stats, setStats] = useState<EmailMetadataStats>({
    totalEmails: 0,
    unreadEmails: 0,
    lastCollectionDate: null,
    pointsEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastCollectionResult, setLastCollectionResult] = useState<EmailMetadataCollectionResult | null>(null);

  const emailService = EmailMetadataService.getInstance();
  const gmailAuthService = RealGmailAuthService.getInstance();

  // Fetch email metadata statistics
  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats({
        totalEmails: 0,
        unreadEmails: 0,
        lastCollectionDate: null,
        pointsEarned: 0
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const emailStats = await emailService.getEmailMetadataStats(user.id);
      setStats(emailStats);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch email metadata statistics');
    } finally {
      setLoading(false);
    }
  }, [user, emailService]);

  // Collect email metadata
  const collectEmailMetadata = useCallback(async (): Promise<EmailMetadataCollectionResult | null> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return null;
    }

    // Check if user has Gmail account
    if (!user.email?.endsWith('@gmail.com')) {
      Alert.alert('Gmail Required', 'Email metadata collection is only available for Gmail users. Please sign in with your Gmail account.');
      return null;
    }

    if (isCollecting) {
      Alert.alert('Info', 'Email collection is already in progress');
      return null;
    }

    // Check Gmail authentication state - use both hook state and service state for reliability
    const serviceSignedIn = await gmailAuthService.isSignedIn();
    const isAuthenticated = gmailSignedIn || serviceSignedIn;
    
    if (!isAuthenticated) {
      Alert.alert(
        'Gmail Authentication Required',
        'To collect email metadata, you need to sign in with your Gmail account. Would you like to sign in now?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Sign In',
            onPress: async () => {
              try {
                // Initialize Gmail auth service first
                await gmailAuthService.initialize();
                
                // Sign in with Gmail
                const authResult = await gmailAuthService.signInWithGmail();
                
                if (authResult.success) {
                  // Wait a moment for state to sync
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Retry email collection after successful authentication
                  const retryResult = await emailService.collectEmailMetadata(user.id, user.email);
                  setLastCollectionResult(retryResult);
                  
                  if (retryResult.success) {
                    await fetchStats();
                    if (retryResult.emailsCollected > 0) {
                      Alert.alert(
                        'Success', 
                        `Collected ${retryResult.emailsCollected} emails and earned ${retryResult.pointsEarned} points!`
                      );
                    } else {
                      Alert.alert('Info', 'No new emails to collect');
                    }
                  } else {
                    Alert.alert('Error', retryResult.error || 'Failed to collect email metadata after authentication');
                  }
                } else {
                  Alert.alert(
                    'Authentication Failed', 
                    `Failed to sign in with Gmail: ${authResult.error || 'Unknown error'}\n\nPlease try again.`
                  );
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to authenticate with Gmail');
              }
            }
          }
        ]
      );
      return null;
    }

    try {
      setIsCollecting(true);
      
      // Try email collection with retry mechanism
      let result = await emailService.collectEmailMetadata(user.id, user.email);
      
      // If we get GMAIL_AUTH_REQUIRED error, wait a moment and try once more
      if (!result.success && result.error === 'GMAIL_AUTH_REQUIRED') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = await emailService.collectEmailMetadata(user.id, user.email);
      }
      
      setLastCollectionResult(result);
      
      if (result.success) {
        // Refresh stats after successful collection
        await fetchStats();
        
        if (result.emailsCollected > 0) {
          Alert.alert(
            'Success', 
            `Collected ${result.emailsCollected} emails and earned ${result.pointsEarned} points!`
          );
        } else {
          Alert.alert('Info', 'No new emails to collect');
        }
      } else {
        // Handle other errors
        Alert.alert('Error', result.error || 'Failed to collect email metadata');
      }
      
      return result;
    } catch (error) {
      const errorResult: EmailMetadataCollectionResult = {
        success: false,
        emailsCollected: 0,
        pointsEarned: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastCollectionResult(errorResult);
      Alert.alert('Error', 'Failed to collect email metadata');
      return errorResult;
    } finally {
      setIsCollecting(false);
    }
  }, [user, isCollecting, emailService, fetchStats]);

  // Reset email metadata collection
  const resetEmailMetadata = useCallback(async () => {
    try {
      await emailService.resetEmailMetadataCollection();
      await fetchStats();
      setLastCollectionResult(null);
      Alert.alert('Success', 'Email metadata collection has been reset');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset email metadata collection');
    }
  }, [emailService, fetchStats]);

  // Clear all email metadata (for debugging)
  const clearEmailMetadata = useCallback(async () => {
    if (!user) return;
    
    try {
      await emailService.clearEmailMetadata(user.id);
      await fetchStats();
      setLastCollectionResult(null);
      Alert.alert('Success', 'All email metadata has been cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear email metadata');
    }
  }, [user, emailService, fetchStats]);

  // Clear data count in data_streams table (for debugging)
  const clearDataStreamCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('data_streams')
        .update({ data_count: 0 })
        .eq('user_id', user.id)
        .eq('stream_type', 'email_metadata');

      if (error) {
        Alert.alert('Error', 'Failed to clear data stream count');
        return;
      }

      Alert.alert('Success', 'Data stream count cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data stream count');
    }
  }, [user]);

  // Debug email collection process
  const debugEmailCollection = useCallback(async () => {
    if (!user) return;
    
    try {
      // Test Google Sign-In first
      const testResult = await gmailAuthService.testGoogleSignIn();
      
      if (!testResult.success) {
        Alert.alert('Google Sign-In Test Failed', testResult.error || 'Unknown error');
        return;
      }
      
      const result = await emailService.debugEmailCollection(user.id, user.email);
      
      if (result.success) {
        const info = result.debugInfo;
        Alert.alert(
          'Debug Results',
          `Google Sign-In Test: ✅\n` +
          `Gmail Auth: ${info.gmailAuth ? '✅' : '❌'}\n` +
          `Emails from API: ${info.emailsFromApi}\n` +
          `Valid Emails: ${info.validEmails}\n` +
          `New Emails: ${info.newEmails}\n` +
          `Database Insertion: ${info.databaseInsertion ? '✅' : '❌'}\n` +
          `Earnings Creation: ${info.earningsCreation ? '✅' : '❌'}\n` +
          (info.error ? `\nError: ${info.error}` : '')
        );
      } else {
        Alert.alert('Debug Failed', result.debugInfo.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Debug Error', 'Failed to run debug');
    }
  }, [user, emailService, gmailAuthService, gmailSignedIn, fetchStats]);

  // Check if email metadata stream is enabled
  const isEmailMetadataEnabled = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('data_streams')
        .select('is_enabled')
        .eq('user_id', user.id)
        .eq('stream_type', 'email_metadata')
        .single();

      if (error) {
        console.error('Error checking email metadata stream status:', error);
        return false;
      }

      return data?.is_enabled || false;
    } catch (error) {
      console.error('Error in isEmailMetadataEnabled:', error);
      return false;
    }
  }, [user]);

  // Get recent email metadata
  const getRecentEmails = useCallback(async (limit: number = 10) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('email_metadata')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent emails:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentEmails:', error);
      return [];
    }
  }, [user]);

  // Get email metadata by date range
  const getEmailsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('email_metadata')
        .select('*')
        .eq('user_id', user.id)
        .gte('email_date', startDate)
        .lte('email_date', endDate)
        .order('email_date', { ascending: false });

      if (error) {
        console.error('Error fetching emails by date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmailsByDateRange:', error);
      return [];
    }
  }, [user]);

  // Get email metadata summary
  const getEmailSummary = useCallback(async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('email_metadata_summary')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching email summary:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getEmailSummary:', error);
      return null;
    }
  }, [user]);

  // Auto-collect email metadata if enabled
  const autoCollectIfEnabled = useCallback(async () => {
    const isEnabled = await isEmailMetadataEnabled();
    if (isEnabled && !isCollecting) {
      console.log('Auto-collecting email metadata...');
      await collectEmailMetadata();
    }
  }, [isEmailMetadataEnabled, isCollecting, collectEmailMetadata]);

  // Trigger immediate collection when stream is enabled
  const triggerCollectionOnEnable = useCallback(async () => {
    const isEnabled = await isEmailMetadataEnabled();
    if (isEnabled && !isCollecting) {
      console.log('Stream enabled, triggering immediate email collection...');
      await collectEmailMetadata();
    }
  }, [isEmailMetadataEnabled, isCollecting, collectEmailMetadata]);

  // Initialize stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Set up periodic collection (every 5 minutes if enabled)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      autoCollectIfEnabled();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, autoCollectIfEnabled]);

  return {
    // State
    isCollecting,
    loading,
    stats,
    lastCollectionResult,
    
    // Actions
    collectEmailMetadata,
    resetEmailMetadata,
    clearEmailMetadata,
    clearDataStreamCount,
    fetchStats,
    triggerCollectionOnEnable,
    debugEmailCollection,
    
    // Utilities
    isEmailMetadataEnabled,
    getRecentEmails,
    getEmailsByDateRange,
    getEmailSummary,
    autoCollectIfEnabled
  };
}
