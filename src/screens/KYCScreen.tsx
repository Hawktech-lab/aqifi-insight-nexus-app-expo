import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../integrations/supabase/client';
import { verifyKycWithZkMeServices, submitZkMeVerification, ZkMeVerificationPayload } from '../services/zkmeApi';
import AppConfigurationService from '../services/AppConfigurationService';
import { kycStyles } from '../styles/kycStyles';

export const KYCScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showKycWidget, setShowKycWidget] = useState(false);
  const [ZkMeComponent, setZkMeComponent] = useState<React.ComponentType<any> | null>(null);
  const [zkMeLoading, setZkMeLoading] = useState(false);

  // Lazy load ZkMe component only when showKycWidget becomes true
  useEffect(() => {
    if (showKycWidget && !ZkMeComponent && !zkMeLoading) {
      setZkMeLoading(true);
      // Add timeout for component loading
      const timeoutId = setTimeout(() => {
        console.error('ZkMe component loading timeout');
        setZkMeLoading(false);
        setShowKycWidget(false);
        navigation.navigate('Dashboard' as never);
      }, 10000); // 10 second timeout

      import('../components/ZkMeWebView')
        .then((module) => {
          clearTimeout(timeoutId);
          // ZkMeWebView is exported as default
          const ZkMeWebView = module.default;
          if (!ZkMeWebView) {
            throw new Error('ZkMe component export is undefined or invalid');
          }
          if (typeof ZkMeWebView !== 'function' && typeof ZkMeWebView !== 'object') {
            throw new Error('ZkMe component is not a valid React component');
          }
          setZkMeComponent(() => ZkMeWebView);
          setZkMeLoading(false);
        })
        .catch((error: any) => {
          clearTimeout(timeoutId);
          console.error('Failed to load ZkMe component:', error);
          setZkMeLoading(false);
          Alert.alert(
            'KYC Verification Error',
            'Failed to load KYC verification component. Redirecting to dashboard...',
            [
              {
                text: 'OK',
                onPress: () => {
                  setShowKycWidget(false);
                  navigation.navigate('Dashboard' as never);
                }
              }
            ]
          );
          setShowKycWidget(false);
          // Navigate to Dashboard on component load error
          navigation.navigate('Dashboard' as never);
        });
    }
  }, [showKycWidget, ZkMeComponent, zkMeLoading, navigation]);

  // Check ZkMe verification status using verifyKycWithZkMeServices from zkMe SDK
  // Reference: https://docs.zk.me/zkme-dochub/verify-with-zkme-protocol/integration-guide/javascript-sdk/zkkyc-compliance-suite
  const checkZkMeVerificationStatus = useCallback(async (): Promise<'verified' | 'pending' | 'error'> => {
    try {
      if (!user || !user.email) {
        console.error('No user or user email found for status check');
        return 'error';
      }

      // Get zkMe configuration (appId/mchNo) from database
      let appId = '';
      try {
        const configService = AppConfigurationService.getInstance();
        const zkmeConfig = await configService.getZkMeConfig();
        appId = zkmeConfig.mchNo;
      } catch (error) {
        console.error('Error fetching ZkMe configuration from database:', error);
        return 'error';
      }

      if (!appId) {
        console.error('zkMe appId (MCH_NO) is not configured in database');
        return 'error';
      }

      // Get current app status from database profile
      const currentAppStatus = profile?.kyc_status || 'pending';

      // Check status from zkMe API using verifyKycWithZkMeServices
      // Use user.id as userAccount (must match what's returned by provider.getUserAccounts)
      // Get programNo from database configuration
      let programNo: string | undefined;
      try {
        const configService = AppConfigurationService.getInstance();
        const programNoValue = await configService.getConfigValue('zkme_program_no');
        programNo = programNoValue || undefined;
      } catch (error) {
        console.warn('Error fetching zkme_program_no from database, proceeding without it:', error);
      }

      const { isGrant } = await verifyKycWithZkMeServices(
        appId,
        user.id,
        programNo ? { programNo } : undefined
      );

      console.log('zkMe verification check result:', { isGrant, currentAppStatus });

      // Flow: If zkMe API returns verified (isGrant = true) but app DB shows pending, update app DB to verified
      if (isGrant && currentAppStatus === 'pending') {
        console.log('ZkMe status is verified but app status is pending. Updating app status...');
        
        // Update profile status to verified
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ kyc_status: 'verified' })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating profile status:', updateError);
          return 'error';
        }

        // Also update the submission if it exists
        const { data: submission } = await supabase
          .from('kyc_submissions')
          .select('id, verified_attributes')
          .eq('user_id', user.id)
          .eq('verification_method', 'zkme')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (submission && Array.isArray(submission.verified_attributes)) {
          // Update verified_attributes to mark as verified
          const updatedAttributes = submission.verified_attributes.map((cred: any) => ({
            ...cred,
            status: 'verified'
          }));

          const { error: submissionUpdateError } = await supabase
            .from('kyc_submissions')
            .update({ verified_attributes: updatedAttributes })
            .eq('id', submission.id);

          if (submissionUpdateError) {
            console.error('Error updating submission:', submissionUpdateError);
          }
        }

        // Invalidate and refetch profile data immediately
        queryClient.invalidateQueries(['profile', user.id]);
        await queryClient.refetchQueries(['profile', user.id]);
        return 'verified';
      }

      // If zkMe says verified and app also says verified, return verified
      if (isGrant && currentAppStatus === 'verified') {
        return 'verified';
      }

      // If zkMe says not verified (isGrant = false), check database as fallback
      // This handles cases where the API might not have the latest status
      const { data: submission } = await supabase
        .from('kyc_submissions')
        .select('verified_attributes, created_at')
        .eq('user_id', user.id)
        .eq('verification_method', 'zkme')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const credentials = submission?.verified_attributes;
      if (Array.isArray(credentials) && credentials.length > 0) {
        const hasVerifiedCredential = credentials.some(
          (cred: any) => cred?.status === 'verified'
        );
        
        // If we have verified credentials in DB, treat as verified regardless of API response
        if (hasVerifiedCredential) {
          if (currentAppStatus === 'pending') {
            // Update profile status to verified
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ kyc_status: 'verified' })
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error updating profile status:', updateError);
              return 'error';
            }

            queryClient.invalidateQueries(['profile', user.id]);
            await queryClient.refetchQueries(['profile', user.id]);
          }
          return 'verified';
        }
      }
      
      // If zkMe says not verified and no verified credentials in DB, return pending
      return 'pending';
    } catch (error) {
      console.error('Error checking ZkMe verification status:', error);
      return 'error';
    }
  }, [user, profile, queryClient]);

  // Navigate to Waitlist screen after KYC verification
  const navigateToWaitlist = useCallback(() => {
    navigation.navigate('Waitlist' as never);
  }, [navigation]);

  // Main KYC flow logic
  useEffect(() => {
    // Add timeout fallback - if profile loading takes too long, navigate to Dashboard
    const timeoutId = setTimeout(() => {
      if (profileLoading) {
        console.warn('Profile loading timeout, navigating to Dashboard');
        navigation.navigate('Dashboard' as never);
      }
    }, 10000); // 10 second timeout

    const handleKycFlow = async () => {
      if (!user) {
        clearTimeout(timeoutId);
        navigation.navigate('Dashboard' as never);
        return;
      }

      if (profileLoading) {
        return; // Wait for profile to load
      }

      clearTimeout(timeoutId);

      try {
        // Step 1: Check database profile.kyc_status
        const dbKycStatus = profile?.kyc_status || 'pending';

        if (dbKycStatus === 'verified') {
          // Already verified, navigate to Waitlist screen
          console.log('User already verified in database, navigating to Waitlist');
          navigateToWaitlist();
          return;
        }

        // Step 2: If pending, check zk KYC status via API
        if (dbKycStatus === 'pending') {
          setCheckingStatus(true);
          try {
            // Add timeout for API check
            const apiStatus = await Promise.race([
              checkZkMeVerificationStatus(),
              new Promise<'error'>((resolve) => 
                setTimeout(() => resolve('error'), 5000) // 5 second timeout
              )
            ]);
            setCheckingStatus(false);

            if (apiStatus === 'verified') {
              // API says verified, database should be updated by checkZkMeVerificationStatus
              // Navigate to Waitlist screen
              navigateToWaitlist();
              return;
            }

            if (apiStatus === 'pending') {
              // Still pending, invoke zk widget
              console.log('KYC status is pending, showing zk widget');
              setShowKycWidget(true);
              return;
            }

            if (apiStatus === 'error') {
              // Error checking status - navigate to Dashboard instead of showing widget
              console.warn('Error checking zk KYC status, navigating to Dashboard');
              setCheckingStatus(false);
              navigation.navigate('Dashboard' as never);
              return;
            }
          } catch (error) {
            // Catch any errors during API check and navigate to Dashboard
            console.error('Error in KYC flow:', error);
            setCheckingStatus(false);
            navigation.navigate('Dashboard' as never);
            return;
          }
        }
      } catch (error) {
        // Catch any unexpected errors and navigate to Dashboard
        console.error('Unexpected error in KYC flow:', error);
        setCheckingStatus(false);
        navigation.navigate('Dashboard' as never);
      }
    };

    handleKycFlow();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, profile, profileLoading, checkZkMeVerificationStatus, navigation, navigateToWaitlist]);

  // KYC completion handler
  const handleKycComplete = useCallback(async (result: any) => {
    try {
      console.log('KYC verification completed:', result);
      
      if (!user) {
        console.error('No user found for KYC update');
        Alert.alert('Error', 'No user found. Please log in and try again.');
        return;
      }

      // Parse the result from ZkMeWebView
      let verificationPayload: ZkMeVerificationPayload | null = null;

      if (result?.verification_id && result?.credentials) {
        verificationPayload = {
          verification_id: result.verification_id,
          credentials: result.credentials
        };
      } else if (result?.verificationId && result?.credentials) {
        verificationPayload = {
          verification_id: result.verificationId,
          credentials: result.credentials
        };
      } else if (result?.type === 'zkme-verification-complete' && result?.result) {
        const nestedResult = result.result;
        if (nestedResult?.verification_id || nestedResult?.verificationId) {
          verificationPayload = {
            verification_id: nestedResult.verification_id || nestedResult.verificationId,
            credentials: nestedResult.credentials || []
          };
        }
      } else if (result?.verification_id) {
        verificationPayload = {
          verification_id: result.verification_id,
          credentials: result.credentials || result.credential || []
        };
      }

      if (!verificationPayload || !verificationPayload.verification_id) {
        console.warn('KYC result missing verification_id, attempting to submit with available data:', result);
        const { error } = await supabase
          .from('profiles')
          .update({ kyc_status: 'verified' })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating KYC status:', error);
          Alert.alert('Error', 'Failed to update KYC status. Please try again.');
          // On error, navigate to Dashboard
          setShowKycWidget(false);
          navigation.navigate('Dashboard' as never);
        } else {
          queryClient.invalidateQueries(['profile', user.id]);
          Alert.alert('Success', 'KYC verification completed successfully!');
          // Navigate to Waitlist screen
          navigateToWaitlist();
        }
        setShowKycWidget(false);
        return;
      }

      // Call the backend API to submit verification and update status to 'verified'
      console.log('Submitting ZkMe verification to backend:', verificationPayload);
      const apiResult = await submitZkMeVerification(user.id, verificationPayload);

      if (apiResult?.success !== false) {
        // Backend successfully updated status to 'verified'
        queryClient.invalidateQueries(['profile', user.id]);
        Alert.alert('Success', 'KYC verification completed successfully!');
        // Navigate to Waitlist screen
        navigateToWaitlist();
      } else {
        console.error('Backend API returned error:', apiResult);
        Alert.alert('Error', apiResult?.error || 'Failed to update KYC status. Please try again.');
        // On error, navigate to Dashboard instead of Waitlist
        setShowKycWidget(false);
        navigation.navigate('Dashboard' as never);
      }
    } catch (error: any) {
      console.error('KYC completion error:', error);
      const errorMessage = error?.message || 'Failed to process KYC verification.';
      Alert.alert('Error', errorMessage);
      // On error, navigate to Dashboard
      setShowKycWidget(false);
      navigation.navigate('Dashboard' as never);
    } finally {
      setShowKycWidget(false);
    }
  }, [user, queryClient, navigation, navigateToWaitlist]);

  const handleKycError = useCallback((error: Error | string) => {
    console.error('KYC widget error:', error);
    const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred during KYC verification.';
    
    // Show alert briefly, then navigate to Dashboard
    Alert.alert(
      'KYC Verification Error',
      errorMessage,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowKycWidget(false);
            // Navigate to Dashboard on any KYC error
            navigation.navigate('Dashboard' as never);
          }
        }
      ]
    );
    setShowKycWidget(false);
  }, [navigation]);

  // Show loading while checking profile
  if (profileLoading || checkingStatus) {
    return (
      <View style={kycStyles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={kycStyles.loadingText}>
          {checkingStatus ? 'Checking KYC status...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Show KYC widget if needed
  if (showKycWidget && ZkMeComponent) {
    return (
      <>
        <View style={kycStyles.container}>
          <Text style={kycStyles.title}>KYC Verification</Text>
          <Text style={kycStyles.subtitle}>Please complete the verification process</Text>
        </View>
        <ZkMeComponent
          visible={showKycWidget}
          onClose={() => {
            setShowKycWidget(false);
            // On close, navigate to Dashboard
            navigation.navigate('Dashboard' as never);
          }}
          onComplete={handleKycComplete}
          onError={handleKycError}
          userId={user?.id}
        />
      </>
    );
  }

  // Show loading while widget component is being loaded
  if (showKycWidget && zkMeLoading) {
    return (
      <View style={kycStyles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={kycStyles.loadingText}>Preparing KYC verification...</Text>
      </View>
    );
  }

  // Default: show loading (shouldn't reach here normally)
  return (
    <View style={kycStyles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={kycStyles.loadingText}>Loading...</Text>
    </View>
  );
};

