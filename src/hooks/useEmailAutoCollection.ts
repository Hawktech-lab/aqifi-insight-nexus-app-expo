import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import EmailAutoCollectionService, { AutoCollectionConfig, CollectionSession } from '../services/EmailAutoCollectionService';
import RealGmailAuthService from '../services/RealGmailAuthService';

export interface AutoCollectionStatus {
  isRunning: boolean;
  config: AutoCollectionConfig;
  session: CollectionSession;
  needsReauth: boolean;
}

export function useEmailAutoCollection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutoCollectionStatus>({
    isRunning: false,
    config: {
      enabled: true,
      intervalMinutes: 30,
      maxRetries: 3,
      sessionCheckInterval: 5 * 60 * 1000
    },
    session: {
      lastCollectionTime: 0,
      lastSuccessfulCollection: 0,
      consecutiveFailures: 0,
      sessionExpiryTime: 0,
      isSessionValid: true
    },
    needsReauth: false
  });
  const [loading, setLoading] = useState(true);

  const autoCollectionService = EmailAutoCollectionService.getInstance();
  const gmailAuthService = RealGmailAuthService.getInstance();

  // Check if user is Gmail user
  const isGmailUser = user?.email?.endsWith('@gmail.com') || false;

  // Initialize auto-collection service
  const initializeAutoCollection = useCallback(async () => {
    if (!user || !isGmailUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await autoCollectionService.initialize();
      
      // Get current status
      const serviceStatus = autoCollectionService.getStatus();
      setStatus({
        ...serviceStatus,
        needsReauth: !serviceStatus.session.isSessionValid
      });
      
    } catch (error) {
      console.error('Error initializing auto-collection:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isGmailUser, autoCollectionService]);

  // Start auto-collection
  const startAutoCollection = useCallback(async () => {
    if (!user || !isGmailUser) {
      Alert.alert('Error', 'Auto-collection is only available for Gmail users');
      return;
    }

    try {
      // Check if Gmail is authenticated
      const isSignedIn = await gmailAuthService.isSignedIn();
      if (!isSignedIn) {
        Alert.alert(
          'Gmail Authentication Required',
          'Please sign in to Gmail to enable auto-collection',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: async () => {
                try {
                  await gmailAuthService.initialize();
                  const authResult = await gmailAuthService.signInWithGmail();
                  
                  if (authResult.success) {
                    await autoCollectionService.start();
                    await updateStatus();
                    Alert.alert('Success', 'Auto-collection started successfully');
                  } else {
                    Alert.alert('Authentication Failed', authResult.error || 'Failed to sign in with Gmail');
                  }
                } catch (error) {
                  console.error('Error during Gmail authentication:', error);
                  Alert.alert('Error', 'Failed to authenticate with Gmail');
                }
              }
            }
          ]
        );
        return;
      }

      await autoCollectionService.start(user.id, user.email);
      await updateStatus();
      Alert.alert('Success', 'Auto-collection started successfully');
      
    } catch (error) {
      console.error('Error starting auto-collection:', error);
      Alert.alert('Error', 'Failed to start auto-collection');
    }
  }, [user, isGmailUser, gmailAuthService, autoCollectionService]);

  // Stop auto-collection
  const stopAutoCollection = useCallback(async () => {
    try {
      autoCollectionService.stop();
      await updateStatus();
      Alert.alert('Success', 'Auto-collection stopped');
    } catch (error) {
      console.error('Error stopping auto-collection:', error);
      Alert.alert('Error', 'Failed to stop auto-collection');
    }
  }, [autoCollectionService]);

  // Update configuration
  const updateConfig = useCallback(async (newConfig: Partial<AutoCollectionConfig>) => {
    try {
      await autoCollectionService.saveConfig(newConfig);
      await updateStatus();
      Alert.alert('Success', 'Configuration updated successfully');
    } catch (error) {
      console.error('Error updating config:', error);
      Alert.alert('Error', 'Failed to update configuration');
    }
  }, [autoCollectionService]);

  // Force immediate collection
  const forceCollection = useCallback(async () => {
    if (!user || !isGmailUser) {
      Alert.alert('Error', 'Collection is only available for Gmail users');
      return;
    }

    try {
      await autoCollectionService.forceCollection();
      await updateStatus();
      Alert.alert('Success', 'Email collection completed');
    } catch (error) {
      console.error('Error forcing collection:', error);
      Alert.alert('Error', 'Failed to collect emails');
    }
  }, [user, isGmailUser, autoCollectionService]);

  // Handle re-authentication
  const handleReauth = useCallback(async () => {
    try {
      await gmailAuthService.initialize();
      const authResult = await gmailAuthService.signInWithGmail();
      
      if (authResult.success) {
        await updateStatus();
        Alert.alert('Success', 'Re-authentication successful');
      } else {
        Alert.alert('Authentication Failed', authResult.error || 'Failed to sign in with Gmail');
      }
    } catch (error) {
      console.error('Error during re-authentication:', error);
      Alert.alert('Error', 'Failed to re-authenticate with Gmail');
    }
  }, [gmailAuthService]);

  // Update status from service
  const updateStatus = useCallback(async () => {
    try {
      const serviceStatus = autoCollectionService.getStatus();
      setStatus({
        ...serviceStatus,
        needsReauth: !serviceStatus.session.isSessionValid
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [autoCollectionService]);

  // Check if auto-collection is enabled in database
  const isAutoCollectionEnabled = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // This would check the data_streams table for email_metadata stream
      // For now, we'll assume it's enabled if user is Gmail user
      return isGmailUser;
    } catch (error) {
      console.error('Error checking auto-collection status:', error);
      return false;
    }
  }, [user, isGmailUser]);

  // Initialize on mount
  useEffect(() => {
    initializeAutoCollection();
  }, [initializeAutoCollection]);

  // Auto-start collection when user is Gmail user and signed in
  useEffect(() => {
    const maybeStart = async () => {
      if (!user || !isGmailUser) return;
      try {
        const signedIn = await gmailAuthService.isSignedIn();
        if (signedIn) {
          await autoCollectionService.start(user.id, user.email!);
          await updateStatus();
        }
      } catch (err) {
        // ignore; UI will surface sign-in prompts via startAutoCollection
      }
    };
    maybeStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email, isGmailUser]);

  // Set up periodic status updates
  useEffect(() => {
    if (!user || !isGmailUser) {
      // Clean up service when user signs out or is not Gmail user
      autoCollectionService.cleanup();
      return;
    }

    const interval = setInterval(() => {
      updateStatus();
    }, 30 * 1000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, isGmailUser, updateStatus, autoCollectionService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autoCollectionService.cleanup();
    };
  }, [autoCollectionService]);

  return {
    // State
    status,
    loading,
    isGmailUser,
    
    // Actions
    startAutoCollection,
    stopAutoCollection,
    updateConfig,
    forceCollection,
    handleReauth,
    updateStatus,
    
    // Utilities
    isAutoCollectionEnabled
  };
}
