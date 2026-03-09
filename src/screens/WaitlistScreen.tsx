import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import WaitlistService from '../services/WaitlistService';
import { waitlistStyles } from '../styles/waitlistStyles';
import { WaitlistSignup } from '../components/WaitlistSignup';

export const WaitlistScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyOnWaitlist, setAlreadyOnWaitlist] = useState(false);

  useEffect(() => {
    const joinWaitlist = async () => {
      if (!user?.id) {
        console.error('No user ID for waitlist join');
        // Navigate to Dashboard even without user ID
        setTimeout(() => {
          navigation.navigate('Dashboard' as never);
        }, 1000);
        return;
      }

      try {
        const waitlistService = WaitlistService.getInstance();
        
        // Check if waitlist is enabled first with timeout
        let isEnabled = false;
        try {
          isEnabled = await Promise.race([
            waitlistService.isEnabled(),
            new Promise<boolean>((resolve) => 
              setTimeout(() => {
                console.warn('Waitlist isEnabled() timeout');
                resolve(false);
              }, 5000) // 5 second timeout
            )
          ]);
        } catch (enableError: any) {
          // If isEnabled() throws an error (wrong API key, wrong campaign ID, etc.), treat as disabled
          console.error('Error checking waitlist enabled status:', enableError);
          const errorMsg = enableError?.message || String(enableError);
          
          // Determine error type
          let displayMessage = 'Waitlist service configuration error';
          if (errorMsg.includes('campaign') || errorMsg.includes('Campaign')) {
            if (errorMsg.includes('expired') || errorMsg.includes('Expired')) {
              displayMessage = 'Waitlist campaign has expired';
            } else if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
              displayMessage = 'Waitlist campaign configuration is invalid';
            } else if (errorMsg.includes('missing') || errorMsg.includes('not configured')) {
              displayMessage = 'Waitlist campaign is not configured';
            }
          } else if (errorMsg.includes('API') || errorMsg.includes('api') || errorMsg.includes('key')) {
            displayMessage = 'Waitlist service configuration error';
          }
          
          setStatus('error');
          setErrorMessage(displayMessage);
          setTimeout(() => {
            navigation.navigate('Dashboard' as never);
          }, 1500);
          return;
        }

        if (!isEnabled) {
          console.log('Waitlist is disabled, skipping join');
          setStatus('error');
          setErrorMessage('Waitlist is not available');
          setTimeout(() => {
            navigation.navigate('Dashboard' as never);
          }, 1500);
          return;
        }

        // Check if user is already on waitlist
        const existingWaitlistUser = await waitlistService.getWaitlistUser(user.id);
        
        if (existingWaitlistUser && existingWaitlistUser.status === 'on_waitlist') {
          // User is already on waitlist - skip joining flow and show widget directly
          console.log('User already on waitlist, showing widget');
          setAlreadyOnWaitlist(true);
          setStatus('success');
          return;
        }

        // User not on waitlist yet - proceed with joining
        console.log('Joining waitlist...');
        setStatus('joining');
        
        // Attempt to join waitlist with timeout
        let joinSuccess = false;
        try {
          const result = await Promise.race([
            waitlistService.joinWaitlist(user.id),
            new Promise<null>((resolve) => 
              setTimeout(() => {
                console.warn('Waitlist join timeout');
                resolve(null);
              }, 10000) // 10 second timeout
            )
          ]);

          if (result) {
            console.log('Successfully joined waitlist');
            setStatus('success');
            joinSuccess = true;
            // Don't auto-navigate on success - let user interact with widget
          } else {
            console.log('Waitlist join returned null or timed out');
            setStatus('error');
            setErrorMessage('Unable to join waitlist at this time');
            // Navigate to Dashboard on error
            setTimeout(() => {
              navigation.navigate('Dashboard' as never);
            }, 1500);
          }
        } catch (joinError: any) {
          // Handle join errors (wrong API key, wrong campaign ID, expired campaign, etc.)
          const errorMessage = joinError?.message || String(joinError) || 'Failed to join waitlist';
          console.error('Error joining waitlist (non-blocking):', errorMessage);
          
          // Check for specific error types
          let displayMessage = 'Unable to join waitlist at this time';
          if (errorMessage.includes('campaign') || errorMessage.includes('Campaign')) {
            if (errorMessage.includes('expired') || errorMessage.includes('Expired')) {
              displayMessage = 'Waitlist campaign has expired';
            } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
              displayMessage = 'Waitlist campaign configuration is invalid';
            } else if (errorMessage.includes('missing') || errorMessage.includes('not configured')) {
              displayMessage = 'Waitlist campaign is not configured';
            }
          } else if (errorMessage.includes('API') || errorMessage.includes('api') || errorMessage.includes('key')) {
            displayMessage = 'Waitlist service configuration error';
          } else if (errorMessage.includes('Viralloops') || errorMessage.includes('viralloops')) {
            displayMessage = 'Waitlist service configuration error';
          }
          
          setStatus('error');
          setErrorMessage(displayMessage);
          // Navigate to Dashboard on error
          setTimeout(() => {
            navigation.navigate('Dashboard' as never);
          }, 1500);
        }
      } catch (error: any) {
        // Handle all other types of errors gracefully
        const errorMessage = error?.message || String(error) || 'Failed to join waitlist';
        console.error('Unexpected error joining waitlist (non-blocking):', errorMessage);
        
        // Check for specific error types
        let displayMessage = 'Unable to join waitlist at this time';
        if (errorMessage.includes('campaign') || errorMessage.includes('Campaign')) {
          if (errorMessage.includes('expired') || errorMessage.includes('Expired')) {
            displayMessage = 'Waitlist campaign has expired';
          } else if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
            displayMessage = 'Waitlist campaign configuration is invalid';
          } else if (errorMessage.includes('missing') || errorMessage.includes('not configured')) {
            displayMessage = 'Waitlist campaign is not configured';
          }
        } else if (errorMessage.includes('API') || errorMessage.includes('api') || errorMessage.includes('key')) {
          displayMessage = 'Waitlist service configuration error';
        }
        
        setStatus('error');
        setErrorMessage(displayMessage);
        // Navigate to Dashboard on error
        setTimeout(() => {
          navigation.navigate('Dashboard' as never);
        }, 1500);
      }
    };

    joinWaitlist();
  }, [user, navigation]);

  return (
    <ScrollView style={waitlistStyles.container} contentContainerStyle={waitlistStyles.scrollContent}>
      <View style={waitlistStyles.content}>
        {status === 'joining' && (
          <>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={waitlistStyles.title}>Joining Waitlist...</Text>
            <Text style={waitlistStyles.message}>
              Please wait while we add you to the waitlist.
            </Text>
          </>
        )}
        
        {status === 'success' && (
          <>
            {alreadyOnWaitlist ? (
              <>
                <View style={waitlistStyles.iconContainer}>
                  <Text style={waitlistStyles.successIcon}>✓</Text>
                </View>
                <Text style={waitlistStyles.title}>Welcome Back!</Text>
                <Text style={waitlistStyles.message}>
                  You're already on the waitlist. Check out the referral program below!
                </Text>
                {/* Show native waitlist signup for additional features */}
                <View style={waitlistStyles.widgetContainer}>
                  <WaitlistSignup
                    showReferralInput={true}
                    onSuccess={() => {
                      console.log('Waitlist signup successful');
                    }}
                    onError={(error) => {
                      console.error('Waitlist signup error:', error);
                    }}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={waitlistStyles.iconContainer}>
                  <Text style={waitlistStyles.successIcon}>✓</Text>
                </View>
                <Text style={waitlistStyles.title}>Successfully Joined!</Text>
                <Text style={waitlistStyles.message}>
                  You've been added to the waitlist. Check out the referral program below!
                </Text>
                
                {/* Native Waitlist Signup Component */}
                <View style={waitlistStyles.widgetContainer}>
                  <WaitlistSignup
                    showReferralInput={true}
                    onSuccess={() => {
                      console.log('Waitlist signup successful');
                    }}
                    onError={(error) => {
                      console.error('Waitlist signup error:', error);
                    }}
                  />
                </View>
              </>
            )}
          </>
        )}
        
        {status === 'error' && (
          <>
            <View style={waitlistStyles.iconContainer}>
              <Text style={waitlistStyles.errorIcon}>!</Text>
            </View>
            <Text style={waitlistStyles.title}>Waitlist Join Failed</Text>
            <Text style={waitlistStyles.message}>
              {errorMessage || 'Unable to join waitlist at this time. Redirecting to dashboard...'}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
};

